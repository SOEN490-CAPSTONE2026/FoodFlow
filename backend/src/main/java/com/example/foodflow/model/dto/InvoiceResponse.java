package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private Long paymentId;
    private String invoiceNumber;
    private String pdfUrl;
    private InvoiceStatus status;
    private LocalDate dueDate;
    private LocalDate issuedDate;
    private BigDecimal totalAmount;
    private BigDecimal taxAmount;
    private BigDecimal subtotalAmount;
    private LocalDateTime createdAt;
}
