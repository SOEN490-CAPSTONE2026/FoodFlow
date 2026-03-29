package com.example.foodflow.service;

import com.example.foodflow.model.dto.PaymentResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.PaymentType;
import com.example.foodflow.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentAuditService paymentAuditService;

    @Mock
    private BusinessMetricsService metricsService;

    @InjectMocks
    private PaymentService paymentService;

    private User testUser;
    private Organization testOrganization;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testOrganization = new Organization();
        testOrganization.setId(1L);
        testOrganization.setName("Test Org");
        testOrganization.setPhone("+1234567890");
        testOrganization.setUser(testUser);
        
        testUser.setOrganization(testOrganization);

        testPayment = new Payment();
        testPayment.setId(1L);
        testPayment.setAmount(BigDecimal.valueOf(25.00));
        testPayment.setCurrency("USD");
        testPayment.setStatus(PaymentStatus.PENDING);
        testPayment.setPaymentType(PaymentType.ONE_TIME);
        testPayment.setOrganization(testOrganization);
        testPayment.setStripePaymentIntentId("pi_test123");
        testPayment.setStripeCustomerId("cus_test123");
    }

    @Test
    void getPaymentHistory_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Payment> paymentPage = new PageImpl<>(List.of(testPayment));
        
        when(paymentRepository.findByOrganizationIdOrderByCreatedAtDesc(1L, pageable))
                .thenReturn(paymentPage);

        Page<PaymentResponse> response = paymentService.getPaymentHistory(testUser, pageable);

        assertThat(response).isNotNull();
        assertThat(response.getTotalElements()).isEqualTo(1);
        assertThat(response.getContent().get(0).getAmount()).isEqualTo(BigDecimal.valueOf(25.00));
        verify(paymentRepository).findByOrganizationIdOrderByCreatedAtDesc(1L, pageable);
    }

    @Test
    void getPaymentDetails_Success() {
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        PaymentResponse response = paymentService.getPaymentDetails(1L, testUser);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getAmount()).isEqualTo(BigDecimal.valueOf(25.00));
        assertThat(response.getCurrency()).isEqualTo("USD");
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void getPaymentDetails_NotFound() {
        when(paymentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentDetails(999L, testUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Payment not found");
    }

    @Test
    void getPaymentDetails_Unauthorized() {
        User otherUser = new User();
        otherUser.setId(2L);
        Organization otherOrg = new Organization();
        otherOrg.setId(2L);
        otherUser.setOrganization(otherOrg);
        
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        assertThatThrownBy(() -> paymentService.getPaymentDetails(1L, otherUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized");
    }

    @Test
    void updatePaymentStatus_Success() {
        when(paymentRepository.findByStripePaymentIntentId("pi_test123"))
                .thenReturn(Optional.of(testPayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(testPayment);

        paymentService.updatePaymentStatus("pi_test123", PaymentStatus.SUCCEEDED);

        verify(paymentRepository).save(any(Payment.class));
        verify(paymentAuditService).logPaymentEvent(eq(1L), eq("STATUS_UPDATED"), anyString(), any(), any());
        verify(metricsService).incrementPaymentSucceeded();
    }

    @Test
    void updatePaymentStatus_Failed() {
        when(paymentRepository.findByStripePaymentIntentId("pi_test123"))
                .thenReturn(Optional.of(testPayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(testPayment);

        paymentService.updatePaymentStatus("pi_test123", PaymentStatus.FAILED);

        verify(paymentRepository).save(any(Payment.class));
        verify(metricsService).incrementPaymentFailed();
    }

    @Test
    void updatePaymentStatus_NotFound() {
        when(paymentRepository.findByStripePaymentIntentId("pi_notfound"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.updatePaymentStatus("pi_notfound", PaymentStatus.SUCCEEDED))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Payment not found");
    }

    @Test
    void getPaymentHistory_EmptyResults() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Payment> emptyPage = new PageImpl<>(List.of());
        
        when(paymentRepository.findByOrganizationIdOrderByCreatedAtDesc(1L, pageable))
                .thenReturn(emptyPage);

        Page<PaymentResponse> response = paymentService.getPaymentHistory(testUser, pageable);

        assertThat(response).isNotNull();
        assertThat(response.getTotalElements()).isEqualTo(0);
        assertThat(response.getContent()).isEmpty();
    }

    @Test
    void getPaymentHistory_MultiplePayments() {
        Payment payment2 = new Payment();
        payment2.setId(2L);
        payment2.setAmount(BigDecimal.valueOf(50.00));
        payment2.setCurrency("USD");
        payment2.setStatus(PaymentStatus.SUCCEEDED);
        payment2.setPaymentType(PaymentType.ONE_TIME);
        payment2.setOrganization(testOrganization);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Payment> paymentPage = new PageImpl<>(List.of(testPayment, payment2));
        
        when(paymentRepository.findByOrganizationIdOrderByCreatedAtDesc(1L, pageable))
                .thenReturn(paymentPage);

        Page<PaymentResponse> response = paymentService.getPaymentHistory(testUser, pageable);

        assertThat(response).isNotNull();
        assertThat(response.getTotalElements()).isEqualTo(2);
    }

    @Test
    void updatePaymentStatus_StatusChange() {
        when(paymentRepository.findByStripePaymentIntentId("pi_test123"))
                .thenReturn(Optional.of(testPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            assertThat(p.getStatus()).isEqualTo(PaymentStatus.PROCESSING);
            return p;
        });

        paymentService.updatePaymentStatus("pi_test123", PaymentStatus.PROCESSING);

        verify(paymentRepository).save(any(Payment.class));
    }
}
