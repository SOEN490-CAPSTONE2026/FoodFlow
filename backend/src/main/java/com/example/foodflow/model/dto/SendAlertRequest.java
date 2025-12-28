package com.example.foodflow.model.dto;

public class SendAlertRequest {
    private String message;

    public SendAlertRequest() {}

    public SendAlertRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
