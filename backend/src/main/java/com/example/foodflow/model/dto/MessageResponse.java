package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.Message;
import java.time.LocalDateTime;

public class MessageResponse {
    
    private Long id;
    private Long surplusPostId;
    private Long senderId;
    private String senderEmail;
    private Long receiverId;
    private String receiverEmail;
    private String messageBody;
    private LocalDateTime createdAt;
    private Boolean readStatus;
    
    // Constructor from entity
    public MessageResponse(Message message) {
        this.id = message.getId();
        this.surplusPostId = message.getSurplusPost().getId();
        this.senderId = message.getSender().getId();
        this.senderEmail = message.getSender().getEmail();
        this.receiverId = message.getReceiver().getId();
        this.receiverEmail = message.getReceiver().getEmail();
        this.messageBody = message.getMessageBody();
        this.createdAt = message.getCreatedAt();
        this.readStatus = message.getReadStatus();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getSurplusPostId() { return surplusPostId; }
    public void setSurplusPostId(Long surplusPostId) { this.surplusPostId = surplusPostId; }
    
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    
    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }
    
    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
    
    public String getReceiverEmail() { return receiverEmail; }
    public void setReceiverEmail(String receiverEmail) { this.receiverEmail = receiverEmail; }
    
    public String getMessageBody() { return messageBody; }
    public void setMessageBody(String messageBody) { this.messageBody = messageBody; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Boolean getReadStatus() { return readStatus; }
    public void setReadStatus(Boolean readStatus) { this.readStatus = readStatus; }
}
