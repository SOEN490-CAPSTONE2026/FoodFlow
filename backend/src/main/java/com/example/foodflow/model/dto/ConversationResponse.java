package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.User;
import java.time.LocalDateTime;

public class ConversationResponse {
    
    private Long id;
    private Long otherUserId;
    private String otherUserName;
    private String otherUserEmail;
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;
    private String lastMessagePreview;
    private long unreadCount;
    
    // Constructors
    public ConversationResponse() {}
    
    public ConversationResponse(Conversation conversation, User currentUser, 
                                String lastMessagePreview, long unreadCount) {
        this.id = conversation.getId();
        this.createdAt = conversation.getCreatedAt();
        this.lastMessageAt = conversation.getLastMessageAt();
        this.lastMessagePreview = lastMessagePreview;
        this.unreadCount = unreadCount;
        
        // Get the other participant
        User otherUser = conversation.getOtherParticipant(currentUser.getId());
        this.otherUserId = otherUser.getId();
        this.otherUserName = otherUser.getOrganization() != null ? 
                              otherUser.getOrganization().getName() : 
                              otherUser.getEmail();
        this.otherUserEmail = otherUser.getEmail();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getOtherUserId() {
        return otherUserId;
    }
    
    public void setOtherUserId(Long otherUserId) {
        this.otherUserId = otherUserId;
    }
    
    public String getOtherUserName() {
        return otherUserName;
    }
    
    public void setOtherUserName(String otherUserName) {
        this.otherUserName = otherUserName;
    }
    
    public String getOtherUserEmail() {
        return otherUserEmail;
    }
    
    public void setOtherUserEmail(String otherUserEmail) {
        this.otherUserEmail = otherUserEmail;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }
    
    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }
    
    public String getLastMessagePreview() {
        return lastMessagePreview;
    }
    
    public void setLastMessagePreview(String lastMessagePreview) {
        this.lastMessagePreview = lastMessagePreview;
    }
    
    public long getUnreadCount() {
        return unreadCount;
    }
    
    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }
}
