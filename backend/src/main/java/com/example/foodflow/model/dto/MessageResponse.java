package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.Message;
import java.time.LocalDateTime;

public class MessageResponse {
    
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String messageBody;
    private LocalDateTime createdAt;
    private Boolean readStatus;
    private String messageType;

    // Constructors
    public MessageResponse() {}

    public MessageResponse(Message message) {
        this.id = message.getId();
        this.conversationId = message.getConversation().getId();
        this.senderId = message.getSender().getId();
        this.senderName = message.getSender().getOrganization() != null ?
                          message.getSender().getOrganization().getName() :
                          message.getSender().getEmail();
        this.messageBody = message.getMessageBody();
        this.createdAt = message.getCreatedAt();
        this.readStatus = message.getReadStatus();
        this.messageType = message.getMessageType() != null ? message.getMessageType() : "USER";
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getConversationId() {
        return conversationId;
    }
    
    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }
    
    public Long getSenderId() {
        return senderId;
    }
    
    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }
    
    public String getSenderName() {
        return senderName;
    }
    
    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }
    
    public String getMessageBody() {
        return messageBody;
    }
    
    public void setMessageBody(String messageBody) {
        this.messageBody = messageBody;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Boolean getReadStatus() {
        return readStatus;
    }
    
    public void setReadStatus(Boolean readStatus) {
        this.readStatus = readStatus;
    }

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }
}
