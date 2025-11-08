package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ConfirmPickupRequest {
    
    @NotBlank(message = "Pickup code is required")
    @Size(min = 6, max = 6, message = "Pickup code must be exactly 6 digits")
    @Pattern(regexp = "\\d{6}", message = "Pickup code must contain only digits")
    private String pickupCode;
    
    public ConfirmPickupRequest() {}
    
    public ConfirmPickupRequest(String pickupCode) {
        this.pickupCode = pickupCode;
    }
    
    public String getPickupCode() { return pickupCode; }
    public void setPickupCode(String pickupCode) { this.pickupCode = pickupCode; }
}
