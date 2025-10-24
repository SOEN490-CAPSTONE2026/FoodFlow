package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.Claim;
import java.time.LocalDateTime;

public class ClaimResponse {
    
    private Long id;
    private Long surplusPostId;
    private String surplusPostTitle;
    private Long receiverId;
    private String receiverEmail;
    private LocalDateTime claimedAt;
    private String status;
    private SurplusResponse surplusPost;
    
    // Constructor from entity
    public ClaimResponse(Claim claim) {
        this.id = claim.getId();
        this.surplusPostId = claim.getSurplusPost().getId();
        this.surplusPostTitle = claim.getSurplusPost().getTitle();
        this.receiverId = claim.getReceiver().getId();
        this.receiverEmail = claim.getReceiver().getEmail();
        this.claimedAt = claim.getClaimedAt();
        this.status = claim.getStatus().getDisplayName();
        this.surplusPost = new SurplusResponse(claim.getSurplusPost());
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getSurplusPostId() { return surplusPostId; }
    public void setSurplusPostId(Long surplusPostId) { this.surplusPostId = surplusPostId; }
    
    public String getSurplusPostTitle() { return surplusPostTitle; }
    public void setSurplusPostTitle(String surplusPostTitle) { this.surplusPostTitle = surplusPostTitle; }
    
    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
    
    public String getReceiverEmail() { return receiverEmail; }
    public void setReceiverEmail(String receiverEmail) { this.receiverEmail = receiverEmail; }
    
    public LocalDateTime getClaimedAt() { return claimedAt; }
    public void setClaimedAt(LocalDateTime claimedAt) { this.claimedAt = claimedAt; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public SurplusResponse getSurplusPost() { return surplusPost; }
    public void setSurplusPost(SurplusResponse surplusPost) { this.surplusPost = surplusPost; }
}
