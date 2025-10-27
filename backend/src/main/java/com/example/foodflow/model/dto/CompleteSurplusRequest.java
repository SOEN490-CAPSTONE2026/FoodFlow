package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CompleteSurplusRequest {

    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP code must be exactly 6 digits")
    private String otpCode;

    // Constructors
    public CompleteSurplusRequest() {}

    public CompleteSurplusRequest(String otpCode) {
        this.otpCode = otpCode;
    }

    // Getters and Setters
    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }
}
