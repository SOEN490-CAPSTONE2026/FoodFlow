package com.example.foodflow.model.dto;

import java.time.LocalDateTime;

public class DonationTimelineDTO {
    
    private Long id;
    private String eventType;
    private LocalDateTime timestamp;
    private String actor;
    private Long actorUserId;
    private String oldStatus;
    private String newStatus;
    private String details;
    private Boolean visibleToUsers;
    private Double temperature;
    private String packagingCondition;
    private String pickupEvidenceUrl;
    
    // Constructors
    public DonationTimelineDTO() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
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
