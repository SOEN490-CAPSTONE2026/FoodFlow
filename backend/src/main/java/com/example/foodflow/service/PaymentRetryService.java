package com.example.foodflow.service;
import com.example.foodflow.model.dto.PaymentResponse;
import com.example.foodflow.model.dto.PaymentRetryResponse;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.PaymentRetry;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.PaymentRetryRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentRetryService {
    private final PaymentRetryRepository paymentRetryRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentAuditService paymentAuditService;
    @Transactional(readOnly = true)
    public List<PaymentRetryResponse> getRetriesForPayment(Long paymentId, User user) {
        Payment payment = getOwnedPayment(paymentId, user);
        return paymentRetryRepository.findByPaymentIdOrderByAttemptNumberDesc(payment.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }
    @Transactional
    public PaymentResponse retryPayment(Long paymentId, User user) {
        Payment payment = getOwnedPayment(paymentId, user);
        int nextAttempt = paymentRetryRepository.countByPaymentId(paymentId) + 1;
        PaymentRetry retry = new PaymentRetry();
        retry.setPayment(payment);
        retry.setAttemptNumber(nextAttempt);
        retry.setStatus("PENDING");
        retry = paymentRetryRepository.save(retry);
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(payment.getStripePaymentIntentId());
            PaymentIntent updatedIntent = paymentIntent;
            if ("requires_confirmation".equals(paymentIntent.getStatus())) {
                updatedIntent = paymentIntent.confirm();
            } else if ("requires_action".equals(paymentIntent.getStatus())
                || "processing".equals(paymentIntent.getStatus())
                || "succeeded".equals(paymentIntent.getStatus())) {
                updatedIntent = PaymentIntent.retrieve(payment.getStripePaymentIntentId());
            } else if ("requires_payment_method".equals(paymentIntent.getStatus())) {
                throw new RuntimeException("This payment needs a valid payment method before it can be retried.");
            } else if ("canceled".equals(paymentIntent.getStatus())) {
                throw new RuntimeException("Canceled payments cannot be retried.");
            }
            PaymentStatus mappedStatus = mapStripeStatus(updatedIntent.getStatus());
            payment.setStatus(mappedStatus);
            paymentRepository.save(payment);
            retry.setStatus(mappedStatus == PaymentStatus.FAILED ? "FAILED" : "SUCCEEDED");
            retry.setErrorMessage(null);
            paymentRetryRepository.save(retry);
            paymentAuditService.logPaymentEvent(
                payment.getId(),
                "PAYMENT_RETRY_ATTEMPTED",
                "Payment retry attempt " + nextAttempt + " completed with status " + mappedStatus,
                user.getId(),
                null
            );
            return PaymentResponse.builder()
                .id(payment.getId())
                .organizationId(payment.getOrganization().getId())
                .organizationName(payment.getOrganization().getName())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paymentType(payment.getPaymentType())
                .description(payment.getDescription())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
        } catch (StripeException | RuntimeException e) {
            retry.setStatus("FAILED");
            retry.setErrorMessage(e.getMessage());
            paymentRetryRepository.save(retry);
            paymentAuditService.logPaymentEvent(
                payment.getId(),
                "PAYMENT_RETRY_FAILED",
                "Payment retry attempt " + nextAttempt + " failed: " + e.getMessage(),
                user.getId(),
                null
            );
            if (e instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new RuntimeException("Failed to retry payment: " + e.getMessage());
        }
    }
    private Payment getOwnedPayment(Long paymentId, User user) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        if (!payment.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to payment");
        }
        return payment;
    }
    private PaymentRetryResponse toResponse(PaymentRetry retry) {
        return PaymentRetryResponse.builder()
            .id(retry.getId())
            .paymentId(retry.getPayment().getId())
            .attemptNumber(retry.getAttemptNumber())
            .status(retry.getStatus())
            .errorMessage(retry.getErrorMessage())
            .nextRetryAt(retry.getNextRetryAt())
            .createdAt(retry.getCreatedAt())
            .build();
    }
    private PaymentStatus mapStripeStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "requires_payment_method", "requires_confirmation" -> PaymentStatus.PENDING;
            case "requires_action" -> PaymentStatus.REQUIRES_ACTION;
            case "processing" -> PaymentStatus.PROCESSING;
            case "succeeded" -> PaymentStatus.SUCCEEDED;
            case "canceled" -> PaymentStatus.CANCELED;
            default -> PaymentStatus.FAILED;
        };
    }
}
