package com.example.foodflow.model.dto;

public class PendingChangeDTO {

    private String newValue;
    private String status;

    // getters & setters
    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}