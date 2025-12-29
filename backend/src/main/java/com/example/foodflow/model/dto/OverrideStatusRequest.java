package com.example.foodflow.model.dto;

public class OverrideStatusRequest {
    
    private String newStatus; // PostStatus as string
    private String reason; // Admin reason for override
    
    // Constructors
    public OverrideStatusRequest() {}
    
    public OverrideStatusRequest(String newStatus, String reason) {
        this.newStatus = newStatus;
        this.reason = reason;
    }
    
    // Getters and Setters
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
