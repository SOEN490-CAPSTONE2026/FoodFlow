package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachPaymentMethodRequest {
    
    @NotBlank(message = "Payment method ID is required")
    private String paymentMethodId; // From Stripe Elements
    
    private Boolean setAsDefault = false;
}
