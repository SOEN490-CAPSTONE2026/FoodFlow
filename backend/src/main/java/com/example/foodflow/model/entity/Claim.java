package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.example.foodflow.model.types.ClaimStatus;

@Entity
@Table(name = "claims")
public class Claim {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surplus_post_id", nullable = false)
    private SurplusPost surplusPost;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;
    
    @Column(name = "claimed_at", nullable = false, updatable = false)
    private LocalDateTime claimedAt;
    
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ClaimStatus status = ClaimStatus.ACTIVE;
    
    @PrePersist
    protected void onCreate() {
        claimedAt = LocalDateTime.now();
    }
    
    // Constructors
    public Claim() {}
    
    public Claim(SurplusPost surplusPost, User receiver) {
        this.surplusPost = surplusPost;
        this.receiver = receiver;
        this.status = ClaimStatus.ACTIVE;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public SurplusPost getSurplusPost() { return surplusPost; }
    public void setSurplusPost(SurplusPost surplusPost) { this.surplusPost = surplusPost; }
    
    public User getReceiver() { return receiver; }
    public void setReceiver(User receiver) { this.receiver = receiver; }
    
    public LocalDateTime getClaimedAt() { return claimedAt; }
    
    public ClaimStatus getStatus() { return status; }
    public void setStatus(ClaimStatus status) { this.status = status; }
}
