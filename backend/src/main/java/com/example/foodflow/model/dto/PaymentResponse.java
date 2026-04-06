package com.example.foodflow.model.dto;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.PaymentType;
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
public class PaymentResponse {
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
}
