package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MessageRequest {
    
    @NotNull(message = "Surplus post ID is required")
    private Long surplusPostId;
    
    @NotNull(message = "Receiver ID is required")
    private Long receiverId;
    
    @NotBlank(message = "Message body cannot be empty")
    private String messageBody;
    
    // Constructors
    public MessageRequest() {}
    
    public MessageRequest(Long surplusPostId, Long receiverId, String messageBody) {
        this.surplusPostId = surplusPostId;
        this.receiverId = receiverId;
        this.messageBody = messageBody;
    }
    
    // Getters and Setters
    public Long getSurplusPostId() { return surplusPostId; }
    public void setSurplusPostId(Long surplusPostId) { this.surplusPostId = surplusPostId; }
    
    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
    
    public String getMessageBody() { return messageBody; }
    public void setMessageBody(String messageBody) { this.messageBody = messageBody; }
}
