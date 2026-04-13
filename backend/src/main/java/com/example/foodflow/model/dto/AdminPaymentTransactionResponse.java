package com.example.foodflow.model.dto;
import com.example.foodflow.model.types.InvoiceStatus;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.PaymentType;
import com.example.foodflow.model.types.RefundStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPaymentTransactionResponse {
    private Long id;
    private Long organizationId;
    private String organizationName;
    private String stripePaymentIntentId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private PaymentType paymentType;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private BigDecimal refundedAmount;
    private BigDecimal netAmount;
    private long pendingRefundCount;
    private RefundStatus latestRefundStatus;
    private Long invoiceId;
    private String invoiceNumber;
    private InvoiceStatus invoiceStatus;
    private BigDecimal invoiceTotalAmount;
    private List<RefundResponse> refunds;
}
