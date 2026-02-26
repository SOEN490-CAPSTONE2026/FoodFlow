package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_integrations")
@EntityListeners(AuditingEntityListener.class)
public class CalendarIntegration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "calendar_provider", nullable = false, length = 50)
    private String calendarProvider; // 'GOOGLE', 'OUTLOOK', etc.

    @Column(name = "is_connected", nullable = false)
    private Boolean isConnected = false;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken; // Encrypted in application layer

    @Column(name = "access_token_expiry")
    private LocalDateTime accessTokenExpiry;

    @Column(name = "google_account_email", length = 255)
    private String googleAccountEmail;

    @Column(name = "primary_calendar_name", length = 255)
    private String primaryCalendarName;

    @Column(name = "calendar_time_zone", length = 100)
    private String calendarTimeZone;

    @Column(name = "granted_scopes", columnDefinition = "TEXT")
    private String grantedScopes;

    @Column(name = "last_successful_sync")
    private LocalDateTime lastSuccessfulSync;

    @Column(name = "last_failed_refresh")
    private LocalDateTime lastFailedRefresh;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public CalendarIntegration() {}

    public CalendarIntegration(User user, String calendarProvider) {
        this.user = user;
        this.calendarProvider = calendarProvider;
        this.isConnected = false;
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

    public String getCalendarProvider() {
        return calendarProvider;
    }

    public void setCalendarProvider(String calendarProvider) {
        this.calendarProvider = calendarProvider;
    }

    public Boolean getIsConnected() {
        return isConnected;
    }

    public void setIsConnected(Boolean isConnected) {
        this.isConnected = isConnected;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public LocalDateTime getAccessTokenExpiry() {
        return accessTokenExpiry;
    }

    public void setAccessTokenExpiry(LocalDateTime accessTokenExpiry) {
        this.accessTokenExpiry = accessTokenExpiry;
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

    public String getGoogleAccountEmail() {
        return googleAccountEmail;
    }

    public void setGoogleAccountEmail(String googleAccountEmail) {
        this.googleAccountEmail = googleAccountEmail;
    }

    public String getPrimaryCalendarName() {
        return primaryCalendarName;
    }

    public void setPrimaryCalendarName(String primaryCalendarName) {
        this.primaryCalendarName = primaryCalendarName;
    }

    public String getCalendarTimeZone() {
        return calendarTimeZone;
    }

    public void setCalendarTimeZone(String calendarTimeZone) {
        this.calendarTimeZone = calendarTimeZone;
    }

    public String getGrantedScopes() {
        return grantedScopes;
    }

    public void setGrantedScopes(String grantedScopes) {
        this.grantedScopes = grantedScopes;
    }

    public LocalDateTime getLastSuccessfulSync() {
        return lastSuccessfulSync;
    }

    public void setLastSuccessfulSync(LocalDateTime lastSuccessfulSync) {
        this.lastSuccessfulSync = lastSuccessfulSync;
    }

    public LocalDateTime getLastFailedRefresh() {
        return lastFailedRefresh;
    }

    public void setLastFailedRefresh(LocalDateTime lastFailedRefresh) {
        this.lastFailedRefresh = lastFailedRefresh;
    }
}
