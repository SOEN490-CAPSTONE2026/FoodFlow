package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CompleteSurplusRequest {

    @NotBlank(message = "{validation.otpCode.required}")
    @Pattern(regexp = "^[0-9]{6}$", message = "{validation.otpCode.pattern}")
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
