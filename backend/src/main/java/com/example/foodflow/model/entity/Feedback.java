package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@EntityListeners(AuditingEntityListener.class)
public class Feedback {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    @NotNull
    private Claim claim;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    @NotNull
    private User reviewer; // The person giving the feedback
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", nullable = false) 
    @NotNull
    private User reviewee; // The person being reviewed
    
    @Column(name = "rating", nullable = false)
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    @NotNull
    private Integer rating;
    
    @Column(name = "review_text", columnDefinition = "TEXT")
    @Size(max = 500, message = "Review text cannot exceed 500 characters")
    private String reviewText;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Constructors
    public Feedback() {}
    
    public Feedback(Claim claim, User reviewer, User reviewee, Integer rating, String reviewText) {
        this.claim = claim;
        this.reviewer = reviewer;
        this.reviewee = reviewee;
        this.rating = rating;
        this.reviewText = reviewText;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Claim getClaim() { return claim; }
    public void setClaim(Claim claim) { this.claim = claim; }
    
    public User getReviewer() { return reviewer; }
    public void setReviewer(User reviewer) { this.reviewer = reviewer; }
    
    public User getReviewee() { return reviewee; }
    public void setReviewee(User reviewee) { this.reviewee = reviewee; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    // Helper methods
    public boolean isDonorReviewingReceiver() {
        return reviewer.getId().equals(claim.getSurplusPost().getDonor().getId());
    }
    
    public boolean isReceiverReviewingDonor() {
        return reviewer.getId().equals(claim.getReceiver().getId());
    }
}