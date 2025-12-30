
package com.example.foodflow.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for submitting feedback
 */
public class FeedbackRequestDTO {
    
    @NotNull(message = "Claim ID is required")
    private Long claimId;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer rating;
    
    @Size(max = 500, message = "Review text cannot exceed 500 characters")
    private String reviewText;
    
    // Constructors
    public FeedbackRequestDTO() {}
    
    public FeedbackRequestDTO(Long claimId, Integer rating, String reviewText) {
        this.claimId = claimId;
        this.rating = rating;
        this.reviewText = reviewText;
    }
    
    // Getters and Setters
    public Long getClaimId() { return claimId; }
    public void setClaimId(Long claimId) { this.claimId = claimId; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }
}