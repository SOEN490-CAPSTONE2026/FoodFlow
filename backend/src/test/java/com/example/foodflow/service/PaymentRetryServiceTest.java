package com.example.foodflow.service;
import com.example.foodflow.model.dto.PaymentResponse;
import com.example.foodflow.model.dto.PaymentRetryResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.PaymentRetry;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.PaymentType;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.PaymentRetryRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class PaymentRetryServiceTest {
    @Mock
    private PaymentRetryRepository paymentRetryRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaymentAuditService paymentAuditService;
    @InjectMocks
    private PaymentRetryService paymentRetryService;
    private User user;
    private Payment payment;
    @BeforeEach
    void setUp() {
        Organization organization = new Organization();
        organization.setId(1L);
        organization.setName("Test Org");
        user = new User();
        user.setId(2L);
        user.setOrganization(organization);
        payment = new Payment();
        payment.setId(5L);
        payment.setOrganization(organization);
        payment.setAmount(new BigDecimal("25.00"));
        payment.setCurrency("USD");
        payment.setPaymentType(PaymentType.ONE_TIME);
        payment.setStatus(PaymentStatus.FAILED);
        payment.setStripePaymentIntentId("pi_test");
    }
    @Test
    void getRetriesForPayment_Success() {
        PaymentRetry retry = new PaymentRetry();
        retry.setId(1L);
        retry.setPayment(payment);
        retry.setAttemptNumber(2);
        retry.setStatus("FAILED");
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));
        when(paymentRetryRepository.findByPaymentIdOrderByAttemptNumberDesc(5L))
            .thenReturn(List.of(retry));
        List<PaymentRetryResponse> responses = paymentRetryService.getRetriesForPayment(5L, user);
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getAttemptNumber()).isEqualTo(2);
    }
    @Test
    void getRetriesForPayment_Unauthorized() {
        Organization otherOrg = new Organization();
        otherOrg.setId(99L);
        payment.setOrganization(otherOrg);
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));
        assertThatThrownBy(() -> paymentRetryService.getRetriesForPayment(5L, user))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Unauthorized");
    }
    @Test
    void retryPayment_SuccessWithConfirmation() throws StripeException {
        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        PaymentIntent confirmedIntent = mock(PaymentIntent.class);
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));
        when(paymentRetryRepository.countByPaymentId(5L)).thenReturn(0);
        when(paymentRetryRepository.save(any(PaymentRetry.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentIntent.getStatus()).thenReturn("requires_confirmation");
        when(confirmedIntent.getStatus()).thenReturn("succeeded");
        try (MockedStatic<PaymentIntent> paymentIntentMock = mockStatic(PaymentIntent.class)) {
            paymentIntentMock.when(() -> PaymentIntent.retrieve("pi_test")).thenReturn(paymentIntent);
            when(paymentIntent.confirm()).thenReturn(confirmedIntent);
            PaymentResponse response = paymentRetryService.retryPayment(5L, user);
            assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
            verify(paymentAuditService).logPaymentEvent(eq(5L), eq("PAYMENT_RETRY_ATTEMPTED"), contains("SUCCEEDED"), eq(2L), isNull());
        }
    }
    @Test
    void retryPayment_RequiresPaymentMethodFails() throws StripeException {
        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));
        when(paymentRetryRepository.countByPaymentId(5L)).thenReturn(0);
        when(paymentRetryRepository.save(any(PaymentRetry.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentIntent.getStatus()).thenReturn("requires_payment_method");
        try (MockedStatic<PaymentIntent> paymentIntentMock = mockStatic(PaymentIntent.class)) {
            paymentIntentMock.when(() -> PaymentIntent.retrieve("pi_test")).thenReturn(paymentIntent);
            assertThatThrownBy(() -> paymentRetryService.retryPayment(5L, user))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("needs a valid payment method");
        }
    }
}
