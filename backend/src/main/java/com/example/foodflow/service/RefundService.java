package com.example.foodflow.service;

import com.example.foodflow.model.dto.RefundRequest;
import com.example.foodflow.model.dto.RefundResponse;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.Refund;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.RefundStatus;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.RefundRepository;
import com.stripe.exception.StripeException;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefundService {
    
    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentAuditService auditService;
    private final BusinessMetricsService metricsService;
    
    @Transactional
    public RefundResponse processRefund(RefundRequest request, User user) {
        // Validate payment
        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        // Verify ownership
        if (!payment.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to payment");
        }
        
        // Validate refund amount
        if (request.getAmount().compareTo(payment.getAmount()) > 0) {
            throw new RuntimeException("Refund amount cannot exceed payment amount");
        }
        
        try {
            // Convert to cents
            long amountInCents = request.getAmount().multiply(new BigDecimal(100)).longValue();
            
            // Create refund in Stripe
            RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(payment.getStripePaymentIntentId())
                .setAmount(amountInCents)
                .setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER)
                .build();
            
            com.stripe.model.Refund stripeRefund = com.stripe.model.Refund.create(params);
            
            // Save to database
            Refund refund = new Refund();
            refund.setPayment(payment);
            refund.setStripeRefundId(stripeRefund.getId());
            refund.setAmount(request.getAmount());
            refund.setReason(request.getReason());
            refund.setStatus(RefundStatus.PROCESSING);
            refund.setRequestedBy(user);
            
            refund = refundRepository.save(refund);
            
            // Update payment status
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            
            // Audit log
            auditService.logRefundEvent(refund.getId(), "REFUND_CREATED",
                "Refund processed for amount: " + request.getAmount(), user.getId(), null);
            
            // Metrics
            metricsService.incrementRefundProcessed();
            
            log.info("Refund processed: {} for payment: {}", refund.getId(), payment.getId());
            
            return toRefundResponse(refund);
            
        } catch (StripeException e) {
            log.error("Stripe error processing refund: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process refund: " + e.getUserMessage());
        }
    }
    
    public List<RefundResponse> getRefundsForPayment(Long paymentId, User user) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        if (!payment.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access");
        }
        
        return refundRepository.findByPaymentId(paymentId).stream()
            .map(this::toRefundResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public void updateRefundStatus(String stripeRefundId, RefundStatus status) {
        Refund refund = refundRepository.findByStripeRefundId(stripeRefundId)
            .orElseThrow(() -> new RuntimeException("Refund not found"));
        
        refund.setStatus(status);
        if (status == RefundStatus.SUCCEEDED) {
            refund.setProcessedAt(LocalDateTime.now());
        }
        refundRepository.save(refund);
        
        log.info("Refund status updated: {} for {}", status, stripeRefundId);
    }
    
    private RefundResponse toRefundResponse(Refund refund) {
        return RefundResponse.builder()
            .id(refund.getId())
            .paymentId(refund.getPayment().getId())
            .stripeRefundId(refund.getStripeRefundId())
            .amount(refund.getAmount())
            .reason(refund.getReason())
            .status(refund.getStatus())
            .processedAt(refund.getProcessedAt())
            .requestedByName(refund.getRequestedBy() != null ? refund.getRequestedBy().getEmail() : null)
            .createdAt(refund.getCreatedAt())
            .build();
    }
}
