package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "donation_timeline")
public class DonationTimeline {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surplus_post_id", nullable = false)
    private SurplusPost surplusPost;
    
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "actor", nullable = false, length = 50)
    private String actor; // "admin", "donor", "receiver", "system"
    
    @Column(name = "actor_user_id")
    private Long actorUserId;
    
    @Column(name = "old_status", length = 50)
    private String oldStatus;
    
    @Column(name = "new_status", length = 50)
    private String newStatus;
    
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;
    
    @Column(name = "visible_to_users")
    private Boolean visibleToUsers = true; // false for admin-only events
    
    @Column(name = "temperature")
    private Double temperature;
    
    @Column(name = "packaging_condition", length = 100)
    private String packagingCondition;
    
    @Column(name = "pickup_evidence_url")
    private String pickupEvidenceUrl;
    
    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
    
    // Constructors
    public DonationTimeline() {}
    
    public DonationTimeline(SurplusPost surplusPost, String eventType, String actor, Long actorUserId) {
        this.surplusPost = surplusPost;
        this.eventType = eventType;
        this.actor = actor;
        this.actorUserId = actorUserId;
        this.timestamp = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public SurplusPost getSurplusPost() { return surplusPost; }
    public void setSurplusPost(SurplusPost surplusPost) { this.surplusPost = surplusPost; }
    
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    
    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
    
    public String getOldStatus() { return oldStatus; }
    public void setOldStatus(String oldStatus) { this.oldStatus = oldStatus; }
    
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    
    public Boolean getVisibleToUsers() { return visibleToUsers; }
    public void setVisibleToUsers(Boolean visibleToUsers) { this.visibleToUsers = visibleToUsers; }
    
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
    
    public String getPackagingCondition() { return packagingCondition; }
    public void setPackagingCondition(String packagingCondition) { this.packagingCondition = packagingCondition; }
    
    public String getPickupEvidenceUrl() { return pickupEvidenceUrl; }
    public void setPickupEvidenceUrl(String pickupEvidenceUrl) { this.pickupEvidenceUrl = pickupEvidenceUrl; }
}
