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
    private final InvoiceService invoiceService;
    
    @Transactional
    public RefundResponse processRefund(RefundRequest request, User user) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!payment.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to payment");
        }

        if (payment.getStatus() != PaymentStatus.SUCCEEDED && payment.getStatus() != PaymentStatus.REFUNDED) {
            throw new RuntimeException("Refunds can only be requested for completed payments");
        }

        if (request.getAmount().compareTo(getRemainingRefundableAmount(payment, null, true)) > 0) {
            throw new RuntimeException("Refund amount cannot exceed payment amount");
        }

        return createPendingRefundRequest(payment, request.getAmount(), request.getReason(), user, "REFUND_REQUESTED");
    }

    @Transactional
    public RefundResponse createRefundRequestAsAdmin(RefundRequest request, User adminUser) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.SUCCEEDED && payment.getStatus() != PaymentStatus.REFUNDED) {
            throw new RuntimeException("Refunds can only be requested for completed payments");
        }

        if (request.getAmount().compareTo(getRemainingRefundableAmount(payment, null, true)) > 0) {
            throw new RuntimeException("Refund amount cannot exceed payment amount");
        }

        return createPendingRefundRequest(payment, request.getAmount(), request.getReason(), adminUser, "ADMIN_REFUND_REQUEST_CREATED");
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
    public RefundResponse approveRefund(Long refundId, User adminUser, String adminNotes) {
        Refund refund = refundRepository.findById(refundId)
            .orElseThrow(() -> new RuntimeException("Refund not found"));

        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new RuntimeException("Only pending refund requests can be approved");
        }

        Payment payment = refund.getPayment();
        if (refund.getAmount().compareTo(getRemainingRefundableAmount(payment, refundId, false)) > 0) {
            throw new RuntimeException("Refund amount cannot exceed payment amount");
        }

        try {
            long amountInCents = refund.getAmount().multiply(new BigDecimal(100)).longValue();

            RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(payment.getStripePaymentIntentId())
                .setAmount(amountInCents)
                .setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER)
                .build();

            com.stripe.model.Refund stripeRefund = com.stripe.model.Refund.create(params);

            refund.setStripeRefundId(stripeRefund.getId());
            refund.setStatus(mapStripeRefundStatus(stripeRefund.getStatus()));
            refund.setAdminNotes(adminNotes);
            refund.setReviewedBy(adminUser);
            refund.setReviewedAt(LocalDateTime.now());
            if (refund.getStatus() == RefundStatus.SUCCEEDED) {
                refund.setProcessedAt(LocalDateTime.now());
            }
            refund = refundRepository.save(refund);

            syncPaymentStatus(payment);
            invoiceService.syncInvoiceForPayment(payment.getId());

            auditService.logRefundEvent(
                refund.getId(),
                "REFUND_APPROVED",
                "Refund approved for amount: " + refund.getAmount(),
                adminUser.getId(),
                null
            );
            metricsService.incrementRefundProcessed();

            return toRefundResponse(refund);
        } catch (StripeException e) {
            log.error("Stripe error processing refund approval: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process refund: " + e.getUserMessage());
        }
    }

    @Transactional
    public RefundResponse rejectRefund(Long refundId, User adminUser, String adminNotes) {
        Refund refund = refundRepository.findById(refundId)
            .orElseThrow(() -> new RuntimeException("Refund not found"));

        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new RuntimeException("Only pending refund requests can be rejected");
        }

        refund.setStatus(RefundStatus.CANCELED);
        refund.setAdminNotes(adminNotes);
        refund.setReviewedBy(adminUser);
        refund.setReviewedAt(LocalDateTime.now());
        refund = refundRepository.save(refund);

        auditService.logRefundEvent(
            refund.getId(),
            "REFUND_REJECTED",
            "Refund rejected" + (adminNotes != null && !adminNotes.isBlank() ? ": " + adminNotes : ""),
            adminUser.getId(),
            null
        );

        return toRefundResponse(refund);
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
        syncPaymentStatus(refund.getPayment());
        invoiceService.syncInvoiceForPayment(refund.getPayment().getId());
        
        log.info("Refund status updated: {} for {}", status, stripeRefundId);
    }

    private BigDecimal getRemainingRefundableAmount(Payment payment, Long currentRefundId, boolean includePendingRequests) {
        BigDecimal reservedAmount = refundRepository.findByPaymentId(payment.getId()).stream()
            .filter(refund -> currentRefundId == null || !refund.getId().equals(currentRefundId))
            .filter(refund -> {
                if (refund.getStatus() == RefundStatus.PROCESSING || refund.getStatus() == RefundStatus.SUCCEEDED) {
                    return true;
                }
                return includePendingRequests && refund.getStatus() == RefundStatus.PENDING;
            })
            .map(Refund::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return payment.getAmount().subtract(reservedAmount);
    }

    private RefundStatus mapStripeRefundStatus(String stripeStatus) {
        if (stripeStatus == null) {
            return RefundStatus.PROCESSING;
        }
        return switch (stripeStatus) {
            case "succeeded" -> RefundStatus.SUCCEEDED;
            case "failed" -> RefundStatus.FAILED;
            case "canceled" -> RefundStatus.CANCELED;
            default -> RefundStatus.PROCESSING;
        };
    }

    private void syncPaymentStatus(Payment payment) {
        BigDecimal approvedRefundTotal = refundRepository.findByPaymentId(payment.getId()).stream()
            .filter(refund -> refund.getStatus() == RefundStatus.PROCESSING || refund.getStatus() == RefundStatus.SUCCEEDED)
            .map(Refund::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        payment.setStatus(
            approvedRefundTotal.compareTo(payment.getAmount()) >= 0
                ? PaymentStatus.REFUNDED
                : PaymentStatus.SUCCEEDED
        );
        paymentRepository.save(payment);
    }
    
    public RefundResponse toRefundResponse(Refund refund) {
        return RefundResponse.builder()
            .id(refund.getId())
            .paymentId(refund.getPayment().getId())
            .stripeRefundId(refund.getStripeRefundId())
            .amount(refund.getAmount())
            .reason(refund.getReason())
            .status(refund.getStatus())
            .processedAt(refund.getProcessedAt())
            .requestedByName(refund.getRequestedBy() != null ? refund.getRequestedBy().getEmail() : null)
            .reviewedByName(refund.getReviewedBy() != null ? refund.getReviewedBy().getEmail() : null)
            .reviewedAt(refund.getReviewedAt())
            .adminNotes(refund.getAdminNotes())
            .createdAt(refund.getCreatedAt())
            .build();
    }

    private RefundResponse createPendingRefundRequest(
        Payment payment,
        BigDecimal amount,
        String reason,
        User actorUser,
        String auditAction
    ) {
        Refund refund = new Refund();
        refund.setPayment(payment);
        refund.setAmount(amount);
        refund.setReason(reason);
        refund.setStatus(RefundStatus.PENDING);
        refund.setRequestedBy(actorUser);

        refund = refundRepository.save(refund);

        auditService.logRefundEvent(
            refund.getId(),
            auditAction,
            "Refund requested for amount: " + amount,
            actorUser != null ? actorUser.getId() : null,
            null
        );

        log.info("Refund request submitted: {} for payment: {}", refund.getId(), payment.getId());
        return toRefundResponse(refund);
    }
}
