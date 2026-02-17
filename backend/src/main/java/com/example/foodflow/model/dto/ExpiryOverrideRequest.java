package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ExpiryOverrideRequest {

    @NotNull(message = "Override expiryDate is required")
    private String expiryDate;

    @NotBlank(message = "Override reason is required")
    private String reason;

    public String getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(String expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
