package com.example.foodflow.model.dto;

import java.time.LocalDateTime;

public class ConfirmPickupResponse {
    private Long claimId;
    private Long surplusPostId;
    private String message;
    private LocalDateTime pickedUpAt;
    
    public ConfirmPickupResponse() {}
    
    public ConfirmPickupResponse(Long claimId, Long surplusPostId, String message, LocalDateTime pickedUpAt) {
        this.claimId = claimId;
        this.surplusPostId = surplusPostId;
        this.message = message;
        this.pickedUpAt = pickedUpAt;
    }
    
    // Getters and Setters
    public Long getClaimId() { return claimId; }
    public void setClaimId(Long claimId) { this.claimId = claimId; }
    
    public Long getSurplusPostId() { return surplusPostId; }
    public void setSurplusPostId(Long surplusPostId) { this.surplusPostId = surplusPostId; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public LocalDateTime getPickedUpAt() { return pickedUpAt; }
    public void setPickedUpAt(LocalDateTime pickedUpAt) { this.pickedUpAt = pickedUpAt; }
}
