package com.example.foodflow.controller;
import com.example.foodflow.model.dto.InvoiceResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {
    private final InvoiceService invoiceService;
    @PostMapping("/{paymentId}/invoice")
    public ResponseEntity<InvoiceResponse> generateInvoice(
            @PathVariable Long paymentId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(invoiceService.generateInvoiceForUser(paymentId, user));
    }
    @GetMapping("/{paymentId}/invoice")
    public ResponseEntity<InvoiceResponse> getInvoiceForPayment(
            @PathVariable Long paymentId,
            @AuthenticationPrincipal User user) {
        InvoiceResponse invoice = invoiceService.getInvoiceByPaymentIdForUser(paymentId, user);
        return ResponseEntity.ok(invoice);
    }
    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable Long invoiceId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(invoiceService.getInvoiceByIdForUser(invoiceId, user));
    }
    @GetMapping("/invoices")
    public ResponseEntity<Page<InvoiceResponse>> listInvoices(
            @AuthenticationPrincipal User user,
            Pageable pageable) {
        return ResponseEntity.ok(invoiceService.getInvoicesForUser(user, pageable));
    }
    @GetMapping("/invoices/{invoiceId}/download")
    public ResponseEntity<byte[]> downloadInvoice(
            @PathVariable Long invoiceId,
            @AuthenticationPrincipal User user) {
        InvoiceResponse invoice = invoiceService.getInvoiceByIdForUser(invoiceId, user);
        byte[] content = invoiceService.downloadInvoice(invoiceId, user);
        return ResponseEntity.ok()
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment()
                    .filename((invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "invoice") + ".pdf")
                    .build()
                    .toString()
            )
            .contentType(MediaType.APPLICATION_PDF)
            .body(content);
    }
}
