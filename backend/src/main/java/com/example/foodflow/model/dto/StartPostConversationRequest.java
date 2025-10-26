package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for starting a conversation related to a specific post
 */
public class StartPostConversationRequest {
    
    @NotNull(message = "Other user ID is required")
    private Long otherUserId;
    
    // Constructors
    public StartPostConversationRequest() {}
    
    public StartPostConversationRequest(Long otherUserId) {
        this.otherUserId = otherUserId;
    }
    
    // Getters and Setters
    public Long getOtherUserId() {
        return otherUserId;
    }
    
    public void setOtherUserId(Long otherUserId) {
        this.otherUserId = otherUserId;
    }
}
