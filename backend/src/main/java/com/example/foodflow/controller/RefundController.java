package com.example.foodflow.controller;
import com.example.foodflow.model.dto.RefundRequest;
import com.example.foodflow.model.dto.RefundResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.RefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
@Slf4j
public class RefundController {
    private final RefundService refundService;
    @PostMapping
    public ResponseEntity<RefundResponse> processRefund(
            @Valid @RequestBody RefundRequest request,
            @AuthenticationPrincipal User user) {
        RefundResponse response = refundService.processRefund(request, user);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<List<RefundResponse>> getRefundsForPayment(
            @PathVariable Long paymentId,
            @AuthenticationPrincipal User user) {
        List<RefundResponse> refunds = refundService.getRefundsForPayment(paymentId, user);
        return ResponseEntity.ok(refunds);
    }
}
