package com.example.foodflow.controller;
import com.example.foodflow.model.entity.StripeWebhookEvent;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.repository.StripeWebhookEventRepository;
import com.example.foodflow.service.PaymentService;
import com.example.foodflow.service.RefundService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {
    @Value("${stripe.webhook.secret}")
    private String webhookSecret;
    private final PaymentService paymentService;
    private final RefundService refundService;
    private final StripeWebhookEventRepository webhookEventRepository;
    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        log.info("Received Stripe webhook");
        try {
            // Verify webhook signature
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            // Check for duplicate events (idempotency)
            if (webhookEventRepository.existsByStripeEventId(event.getId())) {
                log.info("Duplicate webhook event ignored: {}", event.getId());
                return ResponseEntity.ok("Duplicate event");
            }
            // Save webhook event
            StripeWebhookEvent webhookEvent = new StripeWebhookEvent();
            webhookEvent.setStripeEventId(event.getId());
            webhookEvent.setEventType(event.getType());
            webhookEvent.setPayload(payload);
            webhookEvent.setProcessed(false);
            webhookEventRepository.save(webhookEvent);
            // Process event
            handleEvent(event, webhookEvent);
            // Mark as processed
            webhookEvent.setProcessed(true);
            webhookEvent.setProcessedAt(LocalDateTime.now());
            webhookEventRepository.save(webhookEvent);
            log.info("Successfully processed webhook event: {}", event.getType());
            return ResponseEntity.ok("Success");
        } catch (SignatureVerificationException e) {
            log.error("Invalid webhook signature", e);
            return ResponseEntity.status(400).body("Invalid signature");
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.status(500).body("Error processing webhook");
        }
    }
    private void handleEvent(Event event, StripeWebhookEvent webhookEvent) {
        try {
            switch (event.getType()) {
                case "payment_intent.succeeded":
                    handlePaymentIntentSucceeded(event);
                    break;
                case "payment_intent.payment_failed":
                    handlePaymentIntentFailed(event);
                    break;
                case "payment_intent.canceled":
                    handlePaymentIntentCanceled(event);
                    break;
                case "payment_intent.requires_action":
                    handlePaymentIntentRequiresAction(event);
                    break;
                case "charge.refunded":
                    handleChargeRefunded(event);
                    break;
                case "customer.created":
                    handleCustomerCreated(event);
                    break;
                case "payment_method.attached":
                    handlePaymentMethodAttached(event);
                    break;
                case "payment_method.detached":
                    handlePaymentMethodDetached(event);
                    break;
                default:
                    log.info("Unhandled event type: {}", event.getType());
            }
        } catch (Exception e) {
            webhookEvent.setErrorMessage(e.getMessage());
            log.error("Error handling event: {}", event.getType(), e);
            throw e;
        }
    }
    private void handlePaymentIntentSucceeded(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
            .getObject().orElseThrow(() -> new RuntimeException("Failed to deserialize payment intent"));
        log.info("Payment intent succeeded: {}", paymentIntent.getId());
        paymentService.updatePaymentStatus(paymentIntent.getId(), PaymentStatus.SUCCEEDED);
    }
    private void handlePaymentIntentFailed(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
            .getObject().orElseThrow(() -> new RuntimeException("Failed to deserialize payment intent"));
        log.info("Payment intent failed: {}", paymentIntent.getId());
        paymentService.updatePaymentStatus(paymentIntent.getId(), PaymentStatus.FAILED);
    }
    private void handlePaymentIntentCanceled(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
            .getObject().orElseThrow(() -> new RuntimeException("Failed to deserialize payment intent"));
        log.info("Payment intent canceled: {}", paymentIntent.getId());
        paymentService.updatePaymentStatus(paymentIntent.getId(), PaymentStatus.CANCELED);
    }
    private void handlePaymentIntentRequiresAction(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
            .getObject().orElseThrow(() -> new RuntimeException("Failed to deserialize payment intent"));
        log.info("Payment intent requires action: {}", paymentIntent.getId());
        paymentService.updatePaymentStatus(paymentIntent.getId(), PaymentStatus.REQUIRES_ACTION);
    }
    private void handleChargeRefunded(Event event) {
        com.stripe.model.Charge charge = (com.stripe.model.Charge) event.getDataObjectDeserializer()
            .getObject().orElseThrow(() -> new RuntimeException("Failed to deserialize charge"));
        log.info("Charge refunded: {}", charge.getId());
        // Refund status updates handled via refund webhooks
    }
    private void handleCustomerCreated(Event event) {
        com.stripe.model.Customer customer = (com.stripe.model.Customer) event.getDataObjectDeserializer()
            .getObject().orElseThrow(() -> new RuntimeException("Failed to deserialize customer"));
        log.info("Customer created: {}", customer.getId());
    }
    private void handlePaymentMethodAttached(Event event) {
        com.stripe.model.PaymentMethod paymentMethod = (com.stripe.model.PaymentMethod) event.getDataObjectDeserializer()
            .getObject().orElseThrow(() -> new RuntimeException("Failed to deserialize payment method"));
        log.info("Payment method attached: {}", paymentMethod.getId());
    }
    private void handlePaymentMethodDetached(Event event) {
        com.stripe.model.PaymentMethod paymentMethod = (com.stripe.model.PaymentMethod) event.getDataObjectDeserializer()
            .getObject().orElseThrow(() -> new RuntimeException("Failed to deserialize payment method"));
        log.info("Payment method detached: {}", paymentMethod.getId());
    }
}
