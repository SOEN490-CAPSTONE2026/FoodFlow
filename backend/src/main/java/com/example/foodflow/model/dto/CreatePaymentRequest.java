package com.example.foodflow.model.dto;
import com.example.foodflow.model.types.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Map;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.50", message = "Minimum payment amount is 0.50")
    private BigDecimal amount;
    @NotNull(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be 3 characters (e.g., USD, CAD, EUR)")
    private String currency;
    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    private String paymentMethodId; // Optional - for saved payment methods
    private Map<String, String> metadata; // Additional data for tracking
}
