package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotNull;

public class ClaimRequest {
    
    @NotNull(message = "Surplus post ID is required")
    private Long surplusPostId;
    
    // Constructor
    public ClaimRequest() {}
    
    public ClaimRequest(Long surplusPostId) {
        this.surplusPostId = surplusPostId;
    }
    
    // Getters and Setters
    public Long getSurplusPostId() { return surplusPostId; }
    public void setSurplusPostId(Long surplusPostId) { this.surplusPostId = surplusPostId; }
}
