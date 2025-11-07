package com.example.foodflow.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class StartConversationRequest {
    
    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid email format")
    private String recipientEmail;
    
    // Constructors
    public StartConversationRequest() {}
    
    public StartConversationRequest(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }
    
    // Getters and Setters
    public String getRecipientEmail() {
        return recipientEmail;
    }
    
    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }
}
