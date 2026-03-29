package com.example.foodflow.service;

import com.example.foodflow.model.dto.RefundRequest;
import com.example.foodflow.model.dto.RefundResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.RefundStatus;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.RefundRepository;
import com.stripe.exception.StripeException;
import com.stripe.param.RefundCreateParams;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefundServiceTest {

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentAuditService auditService;

    @Mock
    private BusinessMetricsService metricsService;

    @InjectMocks
    private RefundService refundService;

    private User testUser;
    private Organization testOrganization;
    private Payment testPayment;
    private RefundRequest refundRequest;

    @BeforeEach
    void setUp() {
        // Setup test organization
        testOrganization = new Organization();
        testOrganization.setId(1L);
        testOrganization.setName("Test Organization");

        // Setup test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setOrganization(testOrganization);

        // Setup test payment
        testPayment = new Payment();
        testPayment.setId(1L);
        testPayment.setStripePaymentIntentId("pi_123");
        testPayment.setAmount(new BigDecimal("100.00"));
        testPayment.setOrganization(testOrganization);
        testPayment.setStatus(PaymentStatus.SUCCEEDED);

        // Setup refund request
        refundRequest = new RefundRequest();
        refundRequest.setPaymentId(1L);
        refundRequest.setAmount(new BigDecimal("50.00"));
        refundRequest.setReason("Customer request");
    }

    @Test
    void testProcessRefund_Success() throws StripeException {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        com.stripe.model.Refund stripeRefund = mock(com.stripe.model.Refund.class);
        when(stripeRefund.getId()).thenReturn("re_123");

        com.example.foodflow.model.entity.Refund savedRefund = new com.example.foodflow.model.entity.Refund();
        savedRefund.setId(1L);
        savedRefund.setPayment(testPayment);
        savedRefund.setStripeRefundId("re_123");
        savedRefund.setAmount(new BigDecimal("50.00"));
        savedRefund.setReason("Customer request");
        savedRefund.setStatus(RefundStatus.PROCESSING);
        savedRefund.setRequestedBy(testUser);
        savedRefund.setCreatedAt(LocalDateTime.now());

        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenReturn(savedRefund);

        try (MockedStatic<com.stripe.model.Refund> refundMock = mockStatic(com.stripe.model.Refund.class)) {
            refundMock.when(() -> com.stripe.model.Refund.create(any(RefundCreateParams.class)))
                    .thenReturn(stripeRefund);

            // When
            RefundResponse response = refundService.processRefund(refundRequest, testUser);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getPaymentId()).isEqualTo(1L);
            assertThat(response.getStripeRefundId()).isEqualTo("re_123");
            assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("50.00"));
            assertThat(response.getReason()).isEqualTo("Customer request");
            assertThat(response.getStatus()).isEqualTo(RefundStatus.PROCESSING);

            // Verify interactions
            verify(refundRepository).save(any(com.example.foodflow.model.entity.Refund.class));
            verify(paymentRepository).save(argThat(payment ->
                    payment.getStatus() == PaymentStatus.REFUNDED
            ));
            verify(auditService).logRefundEvent(eq(1L), eq("REFUND_CREATED"),
                    contains("50.00"), eq(1L), isNull());
            verify(metricsService).incrementRefundProcessed();
        }
    }

    @Test
    void testProcessRefund_PaymentNotFound() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> refundService.processRefund(refundRequest, testUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment not found");

        verify(refundRepository, never()).save(any());
        verify(auditService, never()).logRefundEvent(anyLong(), anyString(), anyString(), anyLong(), any());
    }

    @Test
    void testProcessRefund_UnauthorizedAccess() {
        // Given
        Organization differentOrg = new Organization();
        differentOrg.setId(2L);
        differentOrg.setName("Different Organization");

        User unauthorizedUser = new User();
        unauthorizedUser.setId(2L);
        unauthorizedUser.setOrganization(differentOrg);

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        // When/Then
        assertThatThrownBy(() -> refundService.processRefund(refundRequest, unauthorizedUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Unauthorized access to payment");

        verify(refundRepository, never()).save(any());
    }

    @Test
    void testProcessRefund_AmountExceedsPaymentAmount() {
        // Given
        refundRequest.setAmount(new BigDecimal("150.00")); // Exceeds payment amount of 100
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        // When/Then
        assertThatThrownBy(() -> refundService.processRefund(refundRequest, testUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Refund amount cannot exceed payment amount");

        verify(refundRepository, never()).save(any());
    }

    @Test
    void testProcessRefund_StripeException() throws StripeException {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        try (MockedStatic<com.stripe.model.Refund> refundMock = mockStatic(com.stripe.model.Refund.class)) {
            StripeException stripeException = mock(StripeException.class);
            when(stripeException.getUserMessage()).thenReturn("Insufficient funds");
            when(stripeException.getMessage()).thenReturn("Stripe error");

            refundMock.when(() -> com.stripe.model.Refund.create(any(RefundCreateParams.class)))
                    .thenThrow(stripeException);

            // When/Then
            assertThatThrownBy(() -> refundService.processRefund(refundRequest, testUser))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Failed to process refund")
                    .hasMessageContaining("Insufficient funds");

            verify(refundRepository, never()).save(any());
            verify(metricsService, never()).incrementRefundProcessed();
        }
    }

    @Test
    void testProcessRefund_FullRefund() throws StripeException {
        // Given
        refundRequest.setAmount(new BigDecimal("100.00")); // Full refund
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        com.stripe.model.Refund stripeRefund = mock(com.stripe.model.Refund.class);
        when(stripeRefund.getId()).thenReturn("re_full");

        com.example.foodflow.model.entity.Refund savedRefund = new com.example.foodflow.model.entity.Refund();
        savedRefund.setId(2L);
        savedRefund.setPayment(testPayment);
        savedRefund.setStripeRefundId("re_full");
        savedRefund.setAmount(new BigDecimal("100.00"));
        savedRefund.setStatus(RefundStatus.PROCESSING);
        savedRefund.setRequestedBy(testUser);

        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenReturn(savedRefund);

        try (MockedStatic<com.stripe.model.Refund> refundMock = mockStatic(com.stripe.model.Refund.class)) {
            refundMock.when(() -> com.stripe.model.Refund.create(any(RefundCreateParams.class)))
                    .thenReturn(stripeRefund);

            // When
            RefundResponse response = refundService.processRefund(refundRequest, testUser);

            // Then
            assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
            verify(metricsService).incrementRefundProcessed();
        }
    }

    @Test
    void testGetRefundsForPayment_Success() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        com.example.foodflow.model.entity.Refund refund1 = new com.example.foodflow.model.entity.Refund();
        refund1.setId(1L);
        refund1.setPayment(testPayment);
        refund1.setStripeRefundId("re_1");
        refund1.setAmount(new BigDecimal("30.00"));
        refund1.setReason("Reason 1");
        refund1.setStatus(RefundStatus.SUCCEEDED);
        refund1.setRequestedBy(testUser);
        refund1.setCreatedAt(LocalDateTime.now());
        refund1.setProcessedAt(LocalDateTime.now());

        com.example.foodflow.model.entity.Refund refund2 = new com.example.foodflow.model.entity.Refund();
        refund2.setId(2L);
        refund2.setPayment(testPayment);
        refund2.setStripeRefundId("re_2");
        refund2.setAmount(new BigDecimal("20.00"));
        refund2.setReason("Reason 2");
        refund2.setStatus(RefundStatus.PROCESSING);
        refund2.setRequestedBy(testUser);
        refund2.setCreatedAt(LocalDateTime.now());

        when(refundRepository.findByPaymentId(1L)).thenReturn(Arrays.asList(refund1, refund2));

        // When
        List<RefundResponse> responses = refundService.getRefundsForPayment(1L, testUser);

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getId()).isEqualTo(1L);
        assertThat(responses.get(0).getAmount()).isEqualByComparingTo(new BigDecimal("30.00"));
        assertThat(responses.get(0).getStatus()).isEqualTo(RefundStatus.SUCCEEDED);
        assertThat(responses.get(1).getId()).isEqualTo(2L);
        assertThat(responses.get(1).getAmount()).isEqualByComparingTo(new BigDecimal("20.00"));
        assertThat(responses.get(1).getStatus()).isEqualTo(RefundStatus.PROCESSING);

        verify(refundRepository).findByPaymentId(1L);
    }

    @Test
    void testGetRefundsForPayment_PaymentNotFound() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> refundService.getRefundsForPayment(1L, testUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment not found");

        verify(refundRepository, never()).findByPaymentId(anyLong());
    }

    @Test
    void testGetRefundsForPayment_UnauthorizedAccess() {
        // Given
        Organization differentOrg = new Organization();
        differentOrg.setId(2L);

        User unauthorizedUser = new User();
        unauthorizedUser.setId(2L);
        unauthorizedUser.setOrganization(differentOrg);

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        // When/Then
        assertThatThrownBy(() -> refundService.getRefundsForPayment(1L, unauthorizedUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Unauthorized access");

        verify(refundRepository, never()).findByPaymentId(anyLong());
    }

    @Test
    void testGetRefundsForPayment_EmptyList() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(refundRepository.findByPaymentId(1L)).thenReturn(Arrays.asList());

        // When
        List<RefundResponse> responses = refundService.getRefundsForPayment(1L, testUser);

        // Then
        assertThat(responses).isEmpty();
    }

    @Test
    void testUpdateRefundStatus_ToSucceeded() {
        // Given
        com.example.foodflow.model.entity.Refund refund = new com.example.foodflow.model.entity.Refund();
        refund.setId(1L);
        refund.setStripeRefundId("re_123");
        refund.setStatus(RefundStatus.PROCESSING);
        refund.setProcessedAt(null);

        when(refundRepository.findByStripeRefundId("re_123")).thenReturn(Optional.of(refund));
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        refundService.updateRefundStatus("re_123", RefundStatus.SUCCEEDED);

        // Then
        ArgumentCaptor<com.example.foodflow.model.entity.Refund> refundCaptor = ArgumentCaptor.forClass(com.example.foodflow.model.entity.Refund.class);
        verify(refundRepository).save(refundCaptor.capture());

        com.example.foodflow.model.entity.Refund savedRefund = refundCaptor.getValue();
        assertThat(savedRefund.getStatus()).isEqualTo(RefundStatus.SUCCEEDED);
        assertThat(savedRefund.getProcessedAt()).isNotNull();
    }

    @Test
    void testUpdateRefundStatus_ToFailed() {
        // Given
        com.example.foodflow.model.entity.Refund refund = new com.example.foodflow.model.entity.Refund();
        refund.setId(1L);
        refund.setStripeRefundId("re_123");
        refund.setStatus(RefundStatus.PROCESSING);
        refund.setProcessedAt(null);

        when(refundRepository.findByStripeRefundId("re_123")).thenReturn(Optional.of(refund));
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        refundService.updateRefundStatus("re_123", RefundStatus.FAILED);

        // Then
        ArgumentCaptor<com.example.foodflow.model.entity.Refund> refundCaptor = ArgumentCaptor.forClass(com.example.foodflow.model.entity.Refund.class);
        verify(refundRepository).save(refundCaptor.capture());

        com.example.foodflow.model.entity.Refund savedRefund = refundCaptor.getValue();
        assertThat(savedRefund.getStatus()).isEqualTo(RefundStatus.FAILED);
        assertThat(savedRefund.getProcessedAt()).isNull(); // Only set for SUCCEEDED
    }

    @Test
    void testUpdateRefundStatus_RefundNotFound() {
        // Given
        when(refundRepository.findByStripeRefundId("re_nonexistent")).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> refundService.updateRefundStatus("re_nonexistent", RefundStatus.SUCCEEDED))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Refund not found");

        verify(refundRepository, never()).save(any());
    }

    @Test
    void testUpdateRefundStatus_ToCanceled() {
        // Given
        com.example.foodflow.model.entity.Refund refund = new com.example.foodflow.model.entity.Refund();
        refund.setId(1L);
        refund.setStripeRefundId("re_123");
        refund.setStatus(RefundStatus.PROCESSING);

        when(refundRepository.findByStripeRefundId("re_123")).thenReturn(Optional.of(refund));
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        refundService.updateRefundStatus("re_123", RefundStatus.CANCELED);

        // Then
        ArgumentCaptor<com.example.foodflow.model.entity.Refund> refundCaptor = ArgumentCaptor.forClass(com.example.foodflow.model.entity.Refund.class);
        verify(refundRepository).save(refundCaptor.capture());

        com.example.foodflow.model.entity.Refund savedRefund = refundCaptor.getValue();
        assertThat(savedRefund.getStatus()).isEqualTo(RefundStatus.CANCELED);
        assertThat(savedRefund.getProcessedAt()).isNull();
    }

    @Test
    void testProcessRefund_VerifiesStripeParametersCorrectly() throws StripeException {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        com.stripe.model.Refund stripeRefund = mock(com.stripe.model.Refund.class);
        when(stripeRefund.getId()).thenReturn("re_123");

        com.example.foodflow.model.entity.Refund savedRefund = new com.example.foodflow.model.entity.Refund();
        savedRefund.setId(1L);
        savedRefund.setPayment(testPayment);
        savedRefund.setStripeRefundId("re_123");
        savedRefund.setAmount(new BigDecimal("50.00"));
        savedRefund.setStatus(RefundStatus.PROCESSING);
        savedRefund.setRequestedBy(testUser);

        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenReturn(savedRefund);

        try (MockedStatic<com.stripe.model.Refund> refundMock = mockStatic(com.stripe.model.Refund.class)) {
            refundMock.when(() -> com.stripe.model.Refund.create(any(RefundCreateParams.class)))
                    .thenReturn(stripeRefund);

            // When
            refundService.processRefund(refundRequest, testUser);

            // Then - verify Stripe was called with correct parameters (amount in cents: 50.00 * 100 = 5000)
            refundMock.verify(() -> com.stripe.model.Refund.create(any(RefundCreateParams.class)), times(1));
        }
    }

    @Test
    void testRefundResponse_ContainsAllFields() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        LocalDateTime now = LocalDateTime.now();
        com.example.foodflow.model.entity.Refund refund = new com.example.foodflow.model.entity.Refund();
        refund.setId(10L);
        refund.setPayment(testPayment);
        refund.setStripeRefundId("re_detailed");
        refund.setAmount(new BigDecimal("75.50"));
        refund.setReason("Detailed reason");
        refund.setStatus(RefundStatus.SUCCEEDED);
        refund.setRequestedBy(testUser);
        refund.setCreatedAt(now);
        refund.setProcessedAt(now.plusMinutes(5));

        when(refundRepository.findByPaymentId(1L)).thenReturn(Arrays.asList(refund));

        // When
        List<RefundResponse> responses = refundService.getRefundsForPayment(1L, testUser);

        // Then
        assertThat(responses).hasSize(1);
        RefundResponse response = responses.get(0);
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getPaymentId()).isEqualTo(1L);
        assertThat(response.getStripeRefundId()).isEqualTo("re_detailed");
        assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("75.50"));
        assertThat(response.getReason()).isEqualTo("Detailed reason");
        assertThat(response.getStatus()).isEqualTo(RefundStatus.SUCCEEDED);
        assertThat(response.getRequestedByName()).isEqualTo("test@example.com");
        assertThat(response.getCreatedAt()).isEqualTo(now);
        assertThat(response.getProcessedAt()).isEqualTo(now.plusMinutes(5));
    }

    @Test
    void testRefundResponse_WithNullRequestedBy() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        com.example.foodflow.model.entity.Refund refund = new com.example.foodflow.model.entity.Refund();
        refund.setId(1L);
        refund.setPayment(testPayment);
        refund.setStripeRefundId("re_no_user");
        refund.setAmount(new BigDecimal("25.00"));
        refund.setStatus(RefundStatus.PROCESSING);
        refund.setRequestedBy(null); // No user
        refund.setCreatedAt(LocalDateTime.now());

        when(refundRepository.findByPaymentId(1L)).thenReturn(Arrays.asList(refund));

        // When
        List<RefundResponse> responses = refundService.getRefundsForPayment(1L, testUser);

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getRequestedByName()).isNull();
    }
}
