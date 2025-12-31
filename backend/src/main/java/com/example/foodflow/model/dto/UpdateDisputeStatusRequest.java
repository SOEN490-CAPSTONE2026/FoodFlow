package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateDisputeStatusRequest {
    
    @NotBlank(message = "Status is required")
    private String status;
    
    private String adminNotes; // Optional admin notes
    
    // Constructors
    public UpdateDisputeStatusRequest() {}
    
    public UpdateDisputeStatusRequest(String status, String adminNotes) {
        this.status = status;
        this.adminNotes = adminNotes;
    }
    
    // Getters and Setters
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getAdminNotes() {
        return adminNotes;
    }
    
    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }
}
