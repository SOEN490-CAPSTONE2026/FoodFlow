package com.example.foodflow.controller;
import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.PaymentMethodService;
import com.example.foodflow.service.PaymentRetryService;
import com.example.foodflow.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {
    private final PaymentService paymentService;
    private final PaymentMethodService paymentMethodService;
    private final PaymentRetryService paymentRetryService;
    @PostMapping("/create-intent")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal User user) {
        PaymentIntentResponse response = paymentService.createPaymentIntent(request, user);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/{id}/confirm")
    public ResponseEntity<PaymentResponse> confirmPayment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        PaymentResponse response = paymentService.confirmPayment(id, user);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/{id}/cancel")
    public ResponseEntity<PaymentResponse> cancelPayment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        PaymentResponse response = paymentService.cancelPayment(id, user);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/history")
    public ResponseEntity<Page<PaymentResponse>> getPaymentHistory(
            @AuthenticationPrincipal User user,
            Pageable pageable) {
        Page<PaymentResponse> history = paymentService.getPaymentHistory(user, pageable);
        return ResponseEntity.ok(history);
    }
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        PaymentResponse response = paymentService.getPaymentDetails(id, user);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/{id}/retry")
    public ResponseEntity<PaymentResponse> retryPayment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        PaymentResponse response = paymentRetryService.retryPayment(id, user);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/{id}/retries")
    public ResponseEntity<List<PaymentRetryResponse>> getPaymentRetries(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        List<PaymentRetryResponse> retries = paymentRetryService.getRetriesForPayment(id, user);
        return ResponseEntity.ok(retries);
    }
    @GetMapping("/currencies")
    public ResponseEntity<List<String>> getSupportedCurrencies() {
        return ResponseEntity.ok(List.of("USD", "CAD", "EUR", "GBP"));
    }
    // Payment Methods endpoints
    @PostMapping("/methods/setup-intent")
    public ResponseEntity<SetupIntentResponse> createMethodSetupIntent(
            @AuthenticationPrincipal User user) {
        SetupIntentResponse response = paymentMethodService.createSetupIntent(user);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/methods")
    public ResponseEntity<PaymentMethodResponse> attachPaymentMethod(
            @Valid @RequestBody AttachPaymentMethodRequest request,
            @AuthenticationPrincipal User user) {
        PaymentMethodResponse response = paymentMethodService.attachPaymentMethod(request, user);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/methods")
    public ResponseEntity<List<PaymentMethodResponse>> listPaymentMethods(
            @AuthenticationPrincipal User user) {
        List<PaymentMethodResponse> methods = paymentMethodService.listPaymentMethods(user);
        return ResponseEntity.ok(methods);
    }
    @DeleteMapping("/methods/{id}")
    public ResponseEntity<Void> detachPaymentMethod(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        paymentMethodService.detachPaymentMethod(id, user);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/methods/{id}/default")
    public ResponseEntity<PaymentMethodResponse> setDefaultPaymentMethod(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        PaymentMethodResponse response = paymentMethodService.setDefaultPaymentMethod(id, user);
        return ResponseEntity.ok(response);
    }
}
