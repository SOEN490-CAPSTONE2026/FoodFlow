package com.example.foodflow.service;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.PaymentAuditLog;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.PaymentAuditLogRepository;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentAuditService {
    private final PaymentAuditLogRepository auditLogRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    @Transactional
    public void logPaymentEvent(Long paymentId, String action, String details, Long actorUserId, String ipAddress) {
        Payment payment = paymentId != null ? paymentRepository.findById(paymentId).orElse(null) : null;
        User actorUser = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        PaymentAuditLog auditLog = new PaymentAuditLog();
        auditLog.setPayment(payment);
        auditLog.setAction(action);
        auditLog.setActorUser(actorUser);
        auditLog.setDetails(details);
        auditLog.setIpAddress(ipAddress);
        auditLogRepository.save(auditLog);
        log.info("Payment audit log created: {} for payment: {}", action, paymentId);
    }
    @Transactional
    public void logPaymentMethodEvent(Long paymentMethodId, String action, String details, Long actorUserId, String ipAddress) {
        User actorUser = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        PaymentAuditLog auditLog = new PaymentAuditLog();
        auditLog.setAction(action);
        auditLog.setActorUser(actorUser);
        auditLog.setDetails(details + " (Payment Method ID: " + paymentMethodId + ")");
        auditLog.setIpAddress(ipAddress);
        auditLogRepository.save(auditLog);
        log.info("Payment method audit log created: {}", action);
    }
    @Transactional
    public void logRefundEvent(Long refundId, String action, String details, Long actorUserId, String ipAddress) {
        User actorUser = actorUserId != null ? userRepository.findById(actorUserId).orElse(null) : null;
        PaymentAuditLog auditLog = new PaymentAuditLog();
        auditLog.setAction(action);
        auditLog.setActorUser(actorUser);
        auditLog.setDetails(details + " (Refund ID: " + refundId + ")");
        auditLog.setIpAddress(ipAddress);
        auditLogRepository.save(auditLog);
        log.info("Refund audit log created: {}", action);
    }
    public List<PaymentAuditLog> getAuditTrailForPayment(Long paymentId) {
        return auditLogRepository.findByPaymentIdOrderByCreatedAtDesc(paymentId);
    }
    public List<PaymentAuditLog> getRecentAuditLogs(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return auditLogRepository.findRecentAuditLogs(startDate);
    }
}
