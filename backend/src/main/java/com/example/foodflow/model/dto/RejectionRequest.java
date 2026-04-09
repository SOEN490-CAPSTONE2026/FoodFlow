package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;

public class RejectionRequest {

    @NotBlank(message = "Reason is required")
    private String reason;
    private String message;

    public RejectionRequest() {}

    public RejectionRequest(String reason, String message) {
        this.reason = reason;
        this.message = message;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}