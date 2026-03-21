package com.example.foodflow.service;

import com.example.foodflow.model.dto.InvoiceResponse;
import com.example.foodflow.model.entity.Invoice;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.types.InvoiceStatus;
import com.example.foodflow.repository.InvoiceRepository;
import com.example.foodflow.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    
    private String generateInvoiceNumber() {
        return "INV-" + System.currentTimeMillis();
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
