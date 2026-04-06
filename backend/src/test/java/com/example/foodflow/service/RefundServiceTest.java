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
import com.stripe.exception.StripeException;
import com.stripe.param.RefundCreateParams;
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
    @Mock
    private InvoiceService invoiceService;
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
    void testProcessRefund_Success() {
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of());
        com.stripe.model.Refund stripeRefund = mock(com.stripe.model.Refund.class);
        com.example.foodflow.model.entity.Refund savedRefund = new com.example.foodflow.model.entity.Refund();
        savedRefund.setId(1L);
        savedRefund.setPayment(testPayment);
        savedRefund.setAmount(new BigDecimal("50.00"));
        savedRefund.setReason("Customer request");
        savedRefund.setStatus(RefundStatus.PENDING);
        savedRefund.setRequestedBy(testUser);
        savedRefund.setCreatedAt(LocalDateTime.now());
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenReturn(savedRefund);
        RefundResponse response = refundService.processRefund(refundRequest, testUser);
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getPaymentId()).isEqualTo(1L);
        assertThat(response.getStripeRefundId()).isNull();
        assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(response.getReason()).isEqualTo("Customer request");
        assertThat(response.getStatus()).isEqualTo(RefundStatus.PENDING);
        verify(refundRepository).save(any(com.example.foodflow.model.entity.Refund.class));
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(auditService).logRefundEvent(eq(1L), eq("REFUND_REQUESTED"),
                contains("50.00"), eq(1L), isNull());
        verify(metricsService, never()).incrementRefundProcessed();
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
        refundRequest.setAmount(new BigDecimal("150.00"));
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of());
        assertThatThrownBy(() -> refundService.processRefund(refundRequest, testUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Refund amount cannot exceed payment amount");
        verify(refundRepository, never()).save(any());
    }
    @Test
    void testProcessRefund_FullRefundRequestIsPending() {
        refundRequest.setAmount(new BigDecimal("100.00"));
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of());
        com.example.foodflow.model.entity.Refund savedRefund = new com.example.foodflow.model.entity.Refund();
        savedRefund.setId(2L);
        savedRefund.setPayment(testPayment);
        savedRefund.setAmount(new BigDecimal("100.00"));
        savedRefund.setStatus(RefundStatus.PENDING);
        savedRefund.setRequestedBy(testUser);
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenReturn(savedRefund);
        RefundResponse response = refundService.processRefund(refundRequest, testUser);
        assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.getStatus()).isEqualTo(RefundStatus.PENDING);
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
        com.example.foodflow.model.entity.Refund refund = new com.example.foodflow.model.entity.Refund();
        refund.setId(1L);
        refund.setStripeRefundId("re_123");
        refund.setAmount(new BigDecimal("20.00"));
        refund.setStatus(RefundStatus.PROCESSING);
        refund.setProcessedAt(null);
        refund.setPayment(testPayment);
        when(refundRepository.findByStripeRefundId("re_123")).thenReturn(Optional.of(refund));
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of(refund));
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenAnswer(invocation -> invocation.getArgument(0));
        refundService.updateRefundStatus("re_123", RefundStatus.SUCCEEDED);
        ArgumentCaptor<com.example.foodflow.model.entity.Refund> refundCaptor = ArgumentCaptor.forClass(com.example.foodflow.model.entity.Refund.class);
        verify(refundRepository).save(refundCaptor.capture());
        verify(paymentRepository).save(any(Payment.class));
        verify(invoiceService).syncInvoiceForPayment(1L);
        com.example.foodflow.model.entity.Refund savedRefund = refundCaptor.getValue();
        assertThat(savedRefund.getStatus()).isEqualTo(RefundStatus.SUCCEEDED);
        assertThat(savedRefund.getProcessedAt()).isNotNull();
    }
    @Test
    void testUpdateRefundStatus_ToFailed() {
        com.example.foodflow.model.entity.Refund refund = new com.example.foodflow.model.entity.Refund();
        refund.setId(1L);
        refund.setStripeRefundId("re_123");
        refund.setAmount(new BigDecimal("20.00"));
        refund.setStatus(RefundStatus.PROCESSING);
        refund.setProcessedAt(null);
        refund.setPayment(testPayment);
        when(refundRepository.findByStripeRefundId("re_123")).thenReturn(Optional.of(refund));
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of(refund));
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenAnswer(invocation -> invocation.getArgument(0));
        refundService.updateRefundStatus("re_123", RefundStatus.FAILED);
        ArgumentCaptor<com.example.foodflow.model.entity.Refund> refundCaptor = ArgumentCaptor.forClass(com.example.foodflow.model.entity.Refund.class);
        verify(refundRepository).save(refundCaptor.capture());
        verify(paymentRepository).save(any(Payment.class));
        verify(invoiceService).syncInvoiceForPayment(1L);
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
        com.example.foodflow.model.entity.Refund refund = new com.example.foodflow.model.entity.Refund();
        refund.setId(1L);
        refund.setStripeRefundId("re_123");
        refund.setAmount(new BigDecimal("20.00"));
        refund.setStatus(RefundStatus.PROCESSING);
        refund.setPayment(testPayment);
        when(refundRepository.findByStripeRefundId("re_123")).thenReturn(Optional.of(refund));
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of(refund));
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class))).thenAnswer(invocation -> invocation.getArgument(0));
        refundService.updateRefundStatus("re_123", RefundStatus.CANCELED);
        ArgumentCaptor<com.example.foodflow.model.entity.Refund> refundCaptor = ArgumentCaptor.forClass(com.example.foodflow.model.entity.Refund.class);
        verify(refundRepository).save(refundCaptor.capture());
        verify(paymentRepository).save(any(Payment.class));
        verify(invoiceService).syncInvoiceForPayment(1L);
        com.example.foodflow.model.entity.Refund savedRefund = refundCaptor.getValue();
        assertThat(savedRefund.getStatus()).isEqualTo(RefundStatus.CANCELED);
        assertThat(savedRefund.getProcessedAt()).isNull();
    }
    @Test
    void testApproveRefund_Success() throws StripeException {
        User adminUser = new User();
        adminUser.setId(99L);
        adminUser.setEmail("admin@example.com");
        com.example.foodflow.model.entity.Refund pendingRefund = new com.example.foodflow.model.entity.Refund();
        pendingRefund.setId(1L);
        pendingRefund.setPayment(testPayment);
        pendingRefund.setAmount(new BigDecimal("50.00"));
        pendingRefund.setStatus(RefundStatus.PENDING);
        pendingRefund.setRequestedBy(testUser);
        when(refundRepository.findById(1L)).thenReturn(Optional.of(pendingRefund));
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of(pendingRefund));
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        com.stripe.model.Refund stripeRefund = mock(com.stripe.model.Refund.class);
        when(stripeRefund.getId()).thenReturn("re_approved");
        when(stripeRefund.getStatus()).thenReturn("succeeded");
        try (MockedStatic<com.stripe.model.Refund> refundMock = mockStatic(com.stripe.model.Refund.class)) {
            refundMock.when(() -> com.stripe.model.Refund.create(any(RefundCreateParams.class)))
                .thenReturn(stripeRefund);
            RefundResponse response = refundService.approveRefund(1L, adminUser, "Approved after review");
            assertThat(response.getStatus()).isEqualTo(RefundStatus.SUCCEEDED);
            assertThat(response.getStripeRefundId()).isEqualTo("re_approved");
            assertThat(response.getReviewedByName()).isEqualTo("admin@example.com");
            assertThat(response.getAdminNotes()).isEqualTo("Approved after review");
            verify(paymentRepository).save(argThat(payment -> payment.getStatus() == PaymentStatus.SUCCEEDED));
            verify(invoiceService).syncInvoiceForPayment(1L);
            verify(metricsService).incrementRefundProcessed();
        }
    }
    @Test
    void testRejectRefund_Success() {
        User adminUser = new User();
        adminUser.setId(99L);
        adminUser.setEmail("admin@example.com");
        com.example.foodflow.model.entity.Refund pendingRefund = new com.example.foodflow.model.entity.Refund();
        pendingRefund.setId(1L);
        pendingRefund.setPayment(testPayment);
        pendingRefund.setAmount(new BigDecimal("25.00"));
        pendingRefund.setStatus(RefundStatus.PENDING);
        when(refundRepository.findById(1L)).thenReturn(Optional.of(pendingRefund));
        when(refundRepository.save(any(com.example.foodflow.model.entity.Refund.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        RefundResponse response = refundService.rejectRefund(1L, adminUser, "Missing evidence");
        assertThat(response.getStatus()).isEqualTo(RefundStatus.CANCELED);
        assertThat(response.getReviewedByName()).isEqualTo("admin@example.com");
        assertThat(response.getAdminNotes()).isEqualTo("Missing evidence");
        verify(metricsService, never()).incrementRefundProcessed();
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
        refund.setReviewedBy(testUser);
        refund.setReviewedAt(now.plusMinutes(1));
        refund.setAdminNotes("Approved");
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
        assertThat(response.getReviewedByName()).isEqualTo("test@example.com");
        assertThat(response.getReviewedAt()).isEqualTo(now.plusMinutes(1));
        assertThat(response.getAdminNotes()).isEqualTo("Approved");
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
