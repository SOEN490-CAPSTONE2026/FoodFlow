package com.example.foodflow.model.dto;

import java.time.LocalDateTime;

public class GenerateOTPResponse {
    private Long claimId;
    private String pickupCode;
    private LocalDateTime generatedAt;
    private LocalDateTime expiresAt;
    
    public GenerateOTPResponse() {}
    
    public GenerateOTPResponse(Long claimId, String pickupCode, LocalDateTime generatedAt, LocalDateTime expiresAt) {
        this.claimId = claimId;
        this.pickupCode = pickupCode;
        this.generatedAt = generatedAt;
        this.expiresAt = expiresAt;
    }
    
    // Getters and Setters
    public Long getClaimId() { return claimId; }
    public void setClaimId(Long claimId) { this.claimId = claimId; }
    
    public String getPickupCode() { return pickupCode; }
    public void setPickupCode(String pickupCode) { this.pickupCode = pickupCode; }
    
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
