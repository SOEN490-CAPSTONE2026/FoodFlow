package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.User;
import java.time.LocalDateTime;

public class ConversationResponse {
    
    private Long id;
    private Long otherUserId;
    private String otherUserName;
    private String otherUserEmail;
    private String otherUserProfilePhoto;
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;
    private String lastMessagePreview;
    private long unreadCount;
    private boolean alreadyExists;

    // Donation-anchored thread fields
    private Long donationId;
    private String donationTitle;
    private String donationPhoto;
    private String donationDescription;
    private String status;
    private Long donorId;
    private Long receiverId;

    // Constructors
    public ConversationResponse() {}

    public ConversationResponse(Conversation conversation, User currentUser,
                                String lastMessagePreview, long unreadCount,
                                boolean conversationAlreadyExists) {
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
        this.otherUserProfilePhoto = otherUser.getProfilePhoto();

        this.alreadyExists = conversationAlreadyExists;

        // Populate donation-anchored fields if present.
        // Prefer live surplus post status so chat header reflects real donation state.
        this.status = conversation.getStatus();
        if (conversation.getSurplusPost() != null) {
            this.donationId = conversation.getSurplusPost().getId();
            if (conversation.getSurplusPost().getStatus() != null) {
                this.status = conversation.getSurplusPost().getStatus().name();
            }
        }
        if (conversation.getDonor() != null) {
            this.donorId = conversation.getDonor().getId();
        }
        if (conversation.getReceiver() != null) {
            this.receiverId = conversation.getReceiver().getId();
        }
        this.donationTitle = conversation.getDonationTitle();
        this.donationPhoto = conversation.getDonationPhoto();
        this.donationDescription = conversation.getDonationDescription();
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

    public String getOtherUserProfilePhoto() {
        return otherUserProfilePhoto;
    }

    public void setOtherUserProfilePhoto(String otherUserProfilePhoto) {
        this.otherUserProfilePhoto = otherUserProfilePhoto;
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

    public boolean getAlreadyExists() {
        return alreadyExists;
    }

    public void setAlreadyExists(boolean conversationAlreadyExists) {
        this.alreadyExists = conversationAlreadyExists;
    }

    public Long getDonationId() {
        return donationId;
    }

    public void setDonationId(Long donationId) {
        this.donationId = donationId;
    }

    public String getDonationTitle() {
        return donationTitle;
    }

    public void setDonationTitle(String donationTitle) {
        this.donationTitle = donationTitle;
    }

    public String getDonationPhoto() {
        return donationPhoto;
    }

    public void setDonationPhoto(String donationPhoto) {
        this.donationPhoto = donationPhoto;
    }

    public String getDonationDescription() {
        return donationDescription;
    }

    public void setDonationDescription(String donationDescription) {
        this.donationDescription = donationDescription;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getDonorId() {
        return donorId;
    }

    public void setDonorId(Long donorId) {
        this.donorId = donorId;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }
}
