package com.example.foodflow.service;

import com.example.foodflow.model.dto.InvoiceResponse;
import com.example.foodflow.model.entity.Invoice;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.InvoiceStatus;
import com.example.foodflow.repository.InvoiceRepository;
import com.example.foodflow.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {
    
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    
    @Transactional
    public InvoiceResponse generateInvoice(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        // Check if invoice already exists
        Invoice existingInvoice = invoiceRepository.findByPaymentId(paymentId).orElse(null);
        if (existingInvoice != null) {
            return toInvoiceResponse(existingInvoice);
        }
        
        Invoice invoice = new Invoice();
        invoice.setPayment(payment);
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setIssuedDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(30));
        invoice.setSubtotalAmount(payment.getAmount());
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setTotalAmount(payment.getAmount());
        
        invoice = invoiceRepository.save(invoice);
        
        log.info("Invoice generated: {} for payment: {}", invoice.getInvoiceNumber(), paymentId);
        
        return toInvoiceResponse(invoice);
    }
    
    public InvoiceResponse getInvoiceByPaymentId(Long paymentId) {
        return invoiceRepository.findByPaymentId(paymentId)
            .map(this::toInvoiceResponse)
            .orElse(null);
    }
    
    public InvoiceResponse getInvoiceById(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new RuntimeException("Invoice not found"));
        return toInvoiceResponse(invoice);
    }

    @Transactional
    public InvoiceResponse generateInvoiceForUser(Long paymentId, User user) {
        getOwnedPayment(paymentId, user);
        return generateInvoice(paymentId);
    }

    public InvoiceResponse getInvoiceByPaymentIdForUser(Long paymentId, User user) {
        getOwnedPayment(paymentId, user);
        InvoiceResponse invoice = getInvoiceByPaymentId(paymentId);
        if (invoice == null) {
            throw new RuntimeException("Invoice not found");
        }
        return invoice;
    }

    public InvoiceResponse getInvoiceByIdForUser(Long invoiceId, User user) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new RuntimeException("Invoice not found"));
        verifyOwnership(invoice.getPayment(), user);
        return toInvoiceResponse(invoice);
    }

    public Page<InvoiceResponse> getInvoicesForUser(User user, Pageable pageable) {
        return invoiceRepository.findByOrganizationId(user.getOrganization().getId(), pageable)
            .map(this::toInvoiceResponse);
    }

    public byte[] downloadInvoice(Long invoiceId, User user) {
        InvoiceResponse invoice = getInvoiceByIdForUser(invoiceId, user);
        String paymentAmount = invoice.getTotalAmount() != null ? invoice.getTotalAmount().toPlainString() : "0.00";
        String content = """
            FoodFlow Invoice
            Invoice Number: %s
            Payment ID: %s
            Issued Date: %s
            Due Date: %s
            Total Amount: %s
            Status: %s
            """
            .formatted(
                invoice.getInvoiceNumber(),
                invoice.getPaymentId(),
                invoice.getIssuedDate(),
                invoice.getDueDate(),
                paymentAmount,
                invoice.getStatus()
            );

        return content.getBytes(StandardCharsets.UTF_8);
    }
    
    private String generateInvoiceNumber() {
        return "INV-" + System.currentTimeMillis();
    }

    private Payment getOwnedPayment(Long paymentId, User user) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        verifyOwnership(payment, user);
        return payment;
    }

    private void verifyOwnership(Payment payment, User user) {
        if (!payment.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to invoice");
        }
    }
    
    private InvoiceResponse toInvoiceResponse(Invoice invoice) {
        return InvoiceResponse.builder()
            .id(invoice.getId())
            .paymentId(invoice.getPayment().getId())
            .invoiceNumber(invoice.getInvoiceNumber())
            .pdfUrl(invoice.getPdfUrl())
            .status(invoice.getStatus())
            .dueDate(invoice.getDueDate())
            .issuedDate(invoice.getIssuedDate())
            .totalAmount(invoice.getTotalAmount())
            .taxAmount(invoice.getTaxAmount())
            .subtotalAmount(invoice.getSubtotalAmount())
            .createdAt(invoice.getCreatedAt())
            .build();
    }
}
