package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MessageRequest {
    
    @NotNull(message = "Conversation ID is required")
    private Long conversationId;
    
    @NotBlank(message = "Message body cannot be empty")
    private String messageBody;
    
    // Constructors
    public MessageRequest() {}
    
    public MessageRequest(Long conversationId, String messageBody) {
        this.conversationId = conversationId;
        this.messageBody = messageBody;
    }
    
    // Getters and Setters
    public Long getConversationId() { 
        return conversationId; 
    }
    
    public void setConversationId(Long conversationId) { 
        this.conversationId = conversationId; 
    }
    
    public String getMessageBody() { 
        return messageBody; 
    }
    
    public void setMessageBody(String messageBody) { 
        this.messageBody = messageBody; 
    }
}
