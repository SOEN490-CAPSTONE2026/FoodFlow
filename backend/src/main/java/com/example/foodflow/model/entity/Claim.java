package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    
    // Confirmed pickup slot - the specific time the receiver selected
    @Column(name = "confirmed_pickup_date")
    private LocalDate confirmedPickupDate;
    
    @Column(name = "confirmed_pickup_start_time")
    private LocalTime confirmedPickupStartTime;
    
    @Column(name = "confirmed_pickup_end_time")
    private LocalTime confirmedPickupEndTime;
    
    // OTP for pickup confirmation
    @Column(name = "pickup_code", length = 6)
    private String pickupCode;
    
    @Column(name = "pickup_code_generated_at")
    private LocalDateTime pickupCodeGeneratedAt;
    
    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;
    
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
    
    public LocalDate getConfirmedPickupDate() { return confirmedPickupDate; }
    public void setConfirmedPickupDate(LocalDate confirmedPickupDate) { 
        this.confirmedPickupDate = confirmedPickupDate; 
    }
    
    public LocalTime getConfirmedPickupStartTime() { return confirmedPickupStartTime; }
    public void setConfirmedPickupStartTime(LocalTime confirmedPickupStartTime) { 
        this.confirmedPickupStartTime = confirmedPickupStartTime; 
    }
    
    public LocalTime getConfirmedPickupEndTime() { return confirmedPickupEndTime; }
    public void setConfirmedPickupEndTime(LocalTime confirmedPickupEndTime) { 
        this.confirmedPickupEndTime = confirmedPickupEndTime; 
    }
    
    public String getPickupCode() { return pickupCode; }
    public void setPickupCode(String pickupCode) { this.pickupCode = pickupCode; }
    
    public LocalDateTime getPickupCodeGeneratedAt() { return pickupCodeGeneratedAt; }
    public void setPickupCodeGeneratedAt(LocalDateTime pickupCodeGeneratedAt) { 
        this.pickupCodeGeneratedAt = pickupCodeGeneratedAt; 
    }
    
    public LocalDateTime getPickedUpAt() { return pickedUpAt; }
    public void setPickedUpAt(LocalDateTime pickedUpAt) { this.pickedUpAt = pickedUpAt; }
}
