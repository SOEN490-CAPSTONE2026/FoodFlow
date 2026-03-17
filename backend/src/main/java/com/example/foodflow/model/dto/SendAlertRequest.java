package com.example.foodflow.model.dto;

public class SendAlertRequest {
    private String message;
    private String alertType;

    public SendAlertRequest() {}

    public SendAlertRequest(String message) {
        this.message = message;
    }

    public SendAlertRequest(String message, String alertType) {
        this.message = message;
        this.alertType = alertType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }
}
