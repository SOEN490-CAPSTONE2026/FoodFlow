package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateReportRequest {
    
    @NotNull(message = "Reported user ID is required")
    private Long reportedId;
    
    private Long donationId; // Optional
    
    @NotBlank(message = "Description is required")
    private String description;
    
    private String imageUrl; // Optional
    
    // Constructors
    public CreateReportRequest() {}
    
    public CreateReportRequest(Long reportedId, Long donationId, String description, String imageUrl) {
        this.reportedId = reportedId;
        this.donationId = donationId;
        this.description = description;
        this.imageUrl = imageUrl;
    }
    
    // Getters and Setters
    public Long getReportedId() {
        return reportedId;
    }
    
    public void setReportedId(Long reportedId) {
        this.reportedId = reportedId;
    }
    
    public Long getDonationId() {
        return donationId;
    }
    
    public void setDonationId(Long donationId) {
        this.donationId = donationId;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getImageUrl() {
        return imageUrl;
    }
    
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
