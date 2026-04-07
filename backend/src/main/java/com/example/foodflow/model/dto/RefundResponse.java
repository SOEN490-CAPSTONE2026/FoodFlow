package com.example.foodflow.model.dto;
import com.example.foodflow.model.types.RefundStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundResponse {
    private Long id;
    private Long paymentId;
    private String stripeRefundId;
    private BigDecimal amount;
    private String reason;
    private RefundStatus status;
    private LocalDateTime processedAt;
    private String requestedByName;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String adminNotes;
    private LocalDateTime createdAt;
}
