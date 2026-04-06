package com.example.foodflow.service;
import com.example.foodflow.model.dto.CreatePaymentRequest;
import com.example.foodflow.model.dto.PaymentIntentResponse;
import com.example.foodflow.model.dto.PaymentResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.repository.PaymentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.Map;
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final PaymentAuditService paymentAuditService;
    private final BusinessMetricsService metricsService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Transactional
    public PaymentIntentResponse createPaymentIntent(CreatePaymentRequest request, User user) {
        try {
            Organization organization = user.getOrganization();
            // Get or create Stripe customer
            String customerId = getOrCreateStripeCustomer(organization, user);
            // Convert amount to cents (Stripe requires amount in smallest currency unit)
            long amountInCents = request.getAmount().multiply(new java.math.BigDecimal(100)).longValue();
            // Build payment intent params
            PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency(request.getCurrency().toLowerCase())
                .setCustomer(customerId)
                .setDescription(request.getDescription());
            // Add payment method if provided
            if (request.getPaymentMethodId() != null) {
                paramsBuilder.setPaymentMethod(request.getPaymentMethodId());
                paramsBuilder.setConfirm(true); // Auto-confirm if payment method provided
            }
            // Add metadata
            Map<String, String> metadata = new HashMap<>();
            metadata.put("organizationId", organization.getId().toString());
            metadata.put("organizationName", organization.getName());
            metadata.put("userId", user.getId().toString());
            if (request.getMetadata() != null) {
                metadata.putAll(request.getMetadata());
            }
            paramsBuilder.putAllMetadata(metadata);
            // Create payment intent in Stripe
            PaymentIntent paymentIntent = PaymentIntent.create(paramsBuilder.build());
            // Save to database
            Payment payment = new Payment();
            payment.setOrganization(organization);
            payment.setStripePaymentIntentId(paymentIntent.getId());
            payment.setStripeCustomerId(customerId);
            payment.setAmount(request.getAmount());
            payment.setCurrency(request.getCurrency());
            payment.setStatus(mapStripeStatus(paymentIntent.getStatus()));
            payment.setPaymentType(request.getPaymentType());
            payment.setDescription(request.getDescription());
            payment.setMetadata(serializeMetadata(metadata));
            payment = paymentRepository.save(payment);
            // Audit log
            paymentAuditService.logPaymentEvent(payment.getId(), "PAYMENT_INTENT_CREATED", 
                "Payment intent created for amount: " + request.getAmount() + " " + request.getCurrency(), 
                user.getId(), null);
            // Metrics
            metricsService.incrementPaymentCreated();
            log.info("Payment intent created: {} for organization: {}", paymentIntent.getId(), organization.getId());
            return PaymentIntentResponse.builder()
                .clientSecret(paymentIntent.getClientSecret())
                .paymentIntentId(paymentIntent.getId())
                .paymentId(payment.getId())
                .status(paymentIntent.getStatus())
                .message("Payment intent created successfully")
                .build();
        } catch (StripeException e) {
            log.error("Stripe error creating payment intent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create payment intent: " + e.getUserMessage());
        }
    }
    @Transactional
    public PaymentResponse confirmPayment(Long paymentId, User user) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        // Verify user owns this payment
        if (!payment.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to payment");
        }
        try {
            // Confirm payment intent in Stripe
            PaymentIntent paymentIntent = PaymentIntent.retrieve(payment.getStripePaymentIntentId());
            if ("requires_confirmation".equals(paymentIntent.getStatus())) {
                paymentIntent = paymentIntent.confirm();
            }
            // Update payment status
            payment.setStatus(mapStripeStatus(paymentIntent.getStatus()));
            payment = paymentRepository.save(payment);
            // Audit log
            paymentAuditService.logPaymentEvent(paymentId, "PAYMENT_CONFIRMED", 
                "Payment confirmed", user.getId(), null);
            log.info("Payment confirmed: {}", paymentId);
            return toPaymentResponse(payment);
        } catch (StripeException e) {
            log.error("Stripe error confirming payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to confirm payment: " + e.getUserMessage());
        }
    }
    @Transactional
    public PaymentResponse cancelPayment(Long paymentId, User user) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        // Verify user owns this payment
        if (!payment.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to payment");
        }
        try {
            // Cancel payment intent in Stripe
            PaymentIntent paymentIntent = PaymentIntent.retrieve(payment.getStripePaymentIntentId());
            paymentIntent = paymentIntent.cancel();
            // Update payment status
            payment.setStatus(PaymentStatus.CANCELED);
            payment = paymentRepository.save(payment);
            // Audit log
            paymentAuditService.logPaymentEvent(paymentId, "PAYMENT_CANCELED", 
                "Payment canceled by user", user.getId(), null);
            log.info("Payment canceled: {}", paymentId);
            return toPaymentResponse(payment);
        } catch (StripeException e) {
            log.error("Stripe error canceling payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to cancel payment: " + e.getUserMessage());
        }
    }
    public Page<PaymentResponse> getPaymentHistory(User user, Pageable pageable) {
        Long organizationId = user.getOrganization().getId();
        Page<Payment> payments = paymentRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId, pageable);
        return payments.map(this::toPaymentResponse);
    }
    public PaymentResponse getPaymentDetails(Long paymentId, User user) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        // Verify user owns this payment
        if (!payment.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to payment");
        }
        return toPaymentResponse(payment);
    }
    public String getOrCreateStripeCustomerId(User user) throws StripeException {
        return getOrCreateStripeCustomer(user.getOrganization(), user);
    }
    @Transactional
    public void updatePaymentStatus(String stripePaymentIntentId, PaymentStatus status) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(stripePaymentIntentId)
            .orElseThrow(() -> new RuntimeException("Payment not found for intent: " + stripePaymentIntentId));
        PaymentStatus oldStatus = payment.getStatus();
        payment.setStatus(status);
        paymentRepository.save(payment);
        // Audit log
        paymentAuditService.logPaymentEvent(payment.getId(), "STATUS_UPDATED", 
            "Status changed from " + oldStatus + " to " + status, null, null);
        // Metrics
        if (status == PaymentStatus.SUCCEEDED) {
            metricsService.incrementPaymentSucceeded();
        } else if (status == PaymentStatus.FAILED) {
            metricsService.incrementPaymentFailed();
        }
        log.info("Payment status updated: {} -> {} for intent: {}", oldStatus, status, stripePaymentIntentId);
    }
    private String getOrCreateStripeCustomer(Organization organization, User user) throws StripeException {
        // Check if organization already has a Stripe customer
        Payment lastPayment = paymentRepository.findByOrganizationIdOrderByCreatedAtDesc(organization.getId())
            .stream()
            .findFirst()
            .orElse(null);
        if (lastPayment != null && lastPayment.getStripeCustomerId() != null) {
            return lastPayment.getStripeCustomerId();
        }
        // Create new customer
        CustomerCreateParams params = CustomerCreateParams.builder()
            .setEmail(user.getEmail())
            .setName(organization.getName())
            .setPhone(organization.getPhone())
            .putMetadata("organizationId", organization.getId().toString())
            .putMetadata("userId", user.getId().toString())
            .build();
        Customer customer = Customer.create(params);
        log.info("Created Stripe customer: {} for organization: {}", customer.getId(), organization.getId());
        return customer.getId();
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
    private PaymentResponse toPaymentResponse(Payment payment) {
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
    }
    private String serializeMetadata(Map<String, String> metadata) {
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.error("Error serializing metadata", e);
            return "{}";
        }
    }
}
