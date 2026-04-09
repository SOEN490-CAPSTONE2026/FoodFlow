package com.example.foodflow.model.dto;

public class RejectionResponse {
    private boolean success;
    private String message;

    public RejectionResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
}
