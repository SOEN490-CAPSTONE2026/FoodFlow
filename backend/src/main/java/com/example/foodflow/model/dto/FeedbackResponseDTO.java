package com.example.foodflow.model.dto;

import java.time.LocalDateTime;

/**
 * DTO for feedback responses
 */
public class FeedbackResponseDTO {
    
    private Long id;
    private Long claimId;
    private Long reviewerId;
    private String reviewerName;
    private Long revieweeId;
    private String revieweeName;
    private Integer rating;
    private String reviewText;
    private LocalDateTime createdAt;
    
    // Constructors
    public FeedbackResponseDTO() {}
    
    public FeedbackResponseDTO(Long id, Long claimId, Long reviewerId, String reviewerName,
                               Long revieweeId, String revieweeName, Integer rating, 
                               String reviewText, LocalDateTime createdAt) {
        this.id = id;
        this.claimId = claimId;
        this.reviewerId = reviewerId;
        this.reviewerName = reviewerName;
        this.revieweeId = revieweeId;
        this.revieweeName = revieweeName;
        this.rating = rating;
        this.reviewText = reviewText;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getClaimId() { return claimId; }
    public void setClaimId(Long claimId) { this.claimId = claimId; }
    
    public Long getReviewerId() { return reviewerId; }
    public void setReviewerId(Long reviewerId) { this.reviewerId = reviewerId; }
    
    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
    
    public Long getRevieweeId() { return revieweeId; }
    public void setRevieweeId(Long revieweeId) { this.revieweeId = revieweeId; }
    
    public String getRevieweeName() { return revieweeName; }
    public void setRevieweeName(String revieweeName) { this.revieweeName = revieweeName; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}