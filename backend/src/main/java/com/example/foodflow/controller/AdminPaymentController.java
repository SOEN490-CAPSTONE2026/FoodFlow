package com.example.foodflow.controller;
import com.example.foodflow.model.dto.AdminPaymentSummaryResponse;
import com.example.foodflow.model.dto.AdminPaymentTransactionResponse;
import com.example.foodflow.model.dto.AdminRefundDecisionRequest;
import com.example.foodflow.model.dto.RefundRequest;
import com.example.foodflow.model.dto.RefundResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.AdminPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
public class AdminPaymentController {
    private final AdminPaymentService adminPaymentService;
    @GetMapping
    public ResponseEntity<Page<AdminPaymentTransactionResponse>> getTransactions(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String refundStatus,
        @RequestParam(required = false) String currency,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
            adminPaymentService.getTransactions(status, refundStatus, currency, search, fromDate, toDate, page, size)
        );
    }
    @GetMapping("/summary")
    public ResponseEntity<AdminPaymentSummaryResponse> getSummary(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String refundStatus,
        @RequestParam(required = false) String currency,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(
            adminPaymentService.getSummary(status, refundStatus, currency, search, fromDate, toDate)
        );
    }
    @PostMapping("/refunds/{refundId}/approve")
    public ResponseEntity<RefundResponse> approveRefund(
        @PathVariable Long refundId,
        @Valid @RequestBody(required = false) AdminRefundDecisionRequest request,
        @AuthenticationPrincipal User adminUser
    ) {
        return ResponseEntity.ok(
            adminPaymentService.approveRefund(refundId, adminUser, request != null ? request.getAdminNotes() : null)
        );
    }
    @PostMapping("/refunds/{refundId}/reject")
    public ResponseEntity<RefundResponse> rejectRefund(
        @PathVariable Long refundId,
        @Valid @RequestBody(required = false) AdminRefundDecisionRequest request,
        @AuthenticationPrincipal User adminUser
    ) {
        return ResponseEntity.ok(
            adminPaymentService.rejectRefund(refundId, adminUser, request != null ? request.getAdminNotes() : null)
        );
    }
    @PostMapping("/{paymentId}/refund-requests")
    public ResponseEntity<RefundResponse> createRefundRequest(
        @PathVariable Long paymentId,
        @RequestBody RefundRequest request,
        @AuthenticationPrincipal User adminUser
    ) {
        request.setPaymentId(paymentId);
        return ResponseEntity.ok(adminPaymentService.createRefundRequest(request, adminUser));
    }
}
