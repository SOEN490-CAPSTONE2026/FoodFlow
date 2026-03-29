package com.example.foodflow.service;

import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.PaymentAuditLog;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.PaymentAuditLogRepository;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentAuditServiceTest {

    @Mock
    private PaymentAuditLogRepository auditLogRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PaymentAuditService paymentAuditService;

    private Payment testPayment;
    private User testUser;
    private PaymentAuditLog testAuditLog;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testPayment = new Payment();
        testPayment.setId(1L);

        testAuditLog = new PaymentAuditLog();
        testAuditLog.setId(1L);
        testAuditLog.setPayment(testPayment);
        testAuditLog.setAction("TEST_ACTION");
        testAuditLog.setActorUser(testUser);
        testAuditLog.setDetails("Test details");
        testAuditLog.setIpAddress("127.0.0.1");
    }

    @Test
    void logPaymentEvent_Success() {
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(auditLogRepository.save(any(PaymentAuditLog.class))).thenReturn(testAuditLog);

        paymentAuditService.logPaymentEvent(1L, "PAYMENT_CREATED", "Payment created", 1L, "127.0.0.1");

        verify(auditLogRepository).save(any(PaymentAuditLog.class));
    }

    @Test
    void logPaymentEvent_NullPaymentId() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(auditLogRepository.save(any(PaymentAuditLog.class))).thenReturn(testAuditLog);

        paymentAuditService.logPaymentEvent(null, "SYSTEM_EVENT", "System event", 1L, "127.0.0.1");

        verify(paymentRepository, never()).findById(any());
        verify(auditLogRepository).save(any(PaymentAuditLog.class));
    }

    @Test
    void logPaymentEvent_NullUserId() {
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(auditLogRepository.save(any(PaymentAuditLog.class))).thenReturn(testAuditLog);

        paymentAuditService.logPaymentEvent(1L, "AUTOMATIC_EVENT", "Automatic event", null, "127.0.0.1");

        verify(userRepository, never()).findById(any());
        verify(auditLogRepository).save(any(PaymentAuditLog.class));
    }

    @Test
    void logPaymentMethodEvent_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(auditLogRepository.save(any(PaymentAuditLog.class))).thenReturn(testAuditLog);

        paymentAuditService.logPaymentMethodEvent(100L, "METHOD_ATTACHED", "Payment method attached", 1L, "127.0.0.1");

        verify(auditLogRepository).save(any(PaymentAuditLog.class));
    }

    @Test
    void logRefundEvent_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(auditLogRepository.save(any(PaymentAuditLog.class))).thenReturn(testAuditLog);

        paymentAuditService.logRefundEvent(200L, "REFUND_CREATED", "Refund created", 1L, "127.0.0.1");

        verify(auditLogRepository).save(any(PaymentAuditLog.class));
    }

    @Test
    void getAuditTrailForPayment_Success() {
        List<PaymentAuditLog> auditLogs = List.of(testAuditLog);
        when(auditLogRepository.findByPaymentIdOrderByCreatedAtDesc(1L)).thenReturn(auditLogs);

        List<PaymentAuditLog> result = paymentAuditService.getAuditTrailForPayment(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAction()).isEqualTo("TEST_ACTION");
        verify(auditLogRepository).findByPaymentIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void getRecentAuditLogs_Success() {
        List<PaymentAuditLog> auditLogs = List.of(testAuditLog);
        when(auditLogRepository.findRecentAuditLogs(any(LocalDateTime.class))).thenReturn(auditLogs);

        List<PaymentAuditLog> result = paymentAuditService.getRecentAuditLogs(7);

        assertThat(result).hasSize(1);
        verify(auditLogRepository).findRecentAuditLogs(any(LocalDateTime.class));
    }
}
