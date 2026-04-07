package com.example.foodflow.model.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPaymentSummaryResponse {
    private long totalTransactions;
    private long successfulTransactions;
    private long refundedTransactions;
    private long pendingRefundRequests;
    private BigDecimal totalVolume;
    private BigDecimal refundedVolume;
    private BigDecimal netVolume;
}
