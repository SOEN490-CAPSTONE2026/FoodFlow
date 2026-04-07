package com.example.foodflow.model.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRetryResponse {
    private Long id;
    private Long paymentId;
    private Integer attemptNumber;
    private String status;
    private String errorMessage;
    private LocalDateTime nextRetryAt;
    private LocalDateTime createdAt;
}
