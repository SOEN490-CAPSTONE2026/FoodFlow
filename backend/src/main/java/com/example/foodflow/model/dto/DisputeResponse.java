package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.DisputeStatus;
import java.time.LocalDateTime;

/**
 * Response DTO for regular users - does NOT include admin notes
 */
public class DisputeResponse {
    
    private Long id;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private Long reportedId;
    private String reportedName;
    private String reportedEmail;
    private Long donationId;
    private String donationTitle;
    private String description;
    private String imageUrl;
    private DisputeStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getReporterId() {
        return reporterId;
    }
    
    public void setReporterId(Long reporterId) {
        this.reporterId = reporterId;
    }
    
    public String getReporterName() {
        return reporterName;
    }
    
    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }
    
    public String getReporterEmail() {
        return reporterEmail;
    }
    
    public void setReporterEmail(String reporterEmail) {
        this.reporterEmail = reporterEmail;
    }
    
    public Long getReportedId() {
        return reportedId;
    }
    
    public void setReportedId(Long reportedId) {
        this.reportedId = reportedId;
    }
    
    public String getReportedName() {
        return reportedName;
    }
    
    public void setReportedName(String reportedName) {
        this.reportedName = reportedName;
    }
    
    public String getReportedEmail() {
        return reportedEmail;
    }
    
    public void setReportedEmail(String reportedEmail) {
        this.reportedEmail = reportedEmail;
    }
    
    public Long getDonationId() {
        return donationId;
    }
    
    public void setDonationId(Long donationId) {
        this.donationId = donationId;
    }
    
    public String getDonationTitle() {
        return donationTitle;
    }
    
    public void setDonationTitle(String donationTitle) {
        this.donationTitle = donationTitle;
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
    
    public DisputeStatus getStatus() {
        return status;
    }
    
    public void setStatus(DisputeStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
