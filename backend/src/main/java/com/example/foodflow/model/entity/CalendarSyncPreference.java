package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_sync_preferences")
@EntityListeners(AuditingEntityListener.class)
public class CalendarSyncPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "sync_enabled", nullable = false)
    private Boolean syncEnabled = true;

    @Column(name = "sync_pickup_events", nullable = false)
    private Boolean syncPickupEvents = true;

    @Column(name = "sync_delivery_events", nullable = false)
    private Boolean syncDeliveryEvents = true;

    @Column(name = "sync_claim_events", nullable = false)
    private Boolean syncClaimEvents = true;

    @Column(name = "auto_create_reminders", nullable = false)
    private Boolean autoCreateReminders = true;

    @Column(name = "reminder_minutes_before", nullable = false)
    private Integer reminderMinutesBefore = 30;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public CalendarSyncPreference() {}

    public CalendarSyncPreference(User user) {
        this.user = user;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Boolean getSyncEnabled() {
        return syncEnabled;
    }

    public void setSyncEnabled(Boolean syncEnabled) {
        this.syncEnabled = syncEnabled;
    }

    public Boolean getSyncPickupEvents() {
        return syncPickupEvents;
    }

    public void setSyncPickupEvents(Boolean syncPickupEvents) {
        this.syncPickupEvents = syncPickupEvents;
    }

    public Boolean getSyncDeliveryEvents() {
        return syncDeliveryEvents;
    }

    public void setSyncDeliveryEvents(Boolean syncDeliveryEvents) {
        this.syncDeliveryEvents = syncDeliveryEvents;
    }

    public Boolean getSyncClaimEvents() {
        return syncClaimEvents;
    }

    public void setSyncClaimEvents(Boolean syncClaimEvents) {
        this.syncClaimEvents = syncClaimEvents;
    }

    public Boolean getAutoCreateReminders() {
        return autoCreateReminders;
    }

    public void setAutoCreateReminders(Boolean autoCreateReminders) {
        this.autoCreateReminders = autoCreateReminders;
    }

    public Integer getReminderMinutesBefore() {
        return reminderMinutesBefore;
    }

    public void setReminderMinutesBefore(Integer reminderMinutesBefore) {
        this.reminderMinutesBefore = reminderMinutesBefore;
    }

    public LocalDateTime getLastSyncAt() {
        return lastSyncAt;
    }

    public void setLastSyncAt(LocalDateTime lastSyncAt) {
        this.lastSyncAt = lastSyncAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
