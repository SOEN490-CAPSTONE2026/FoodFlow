package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "created_at", nullable = false)
    private Timestamp createdAt;

    @Column(name = "expires_at", nullable = false)
    private Timestamp expiresAt;

    @Column(name = "used_at")
    private Timestamp usedAt;

    // Default constructor
    public PasswordResetToken() {
        this.createdAt = Timestamp.from(Instant.now());
    }

    // Constructor with user, token, and expiry minutes
    public PasswordResetToken(User user, String token, int expiryMinutes) {
        this();
        this.user = user;
        this.token = token;
        this.expiresAt = Timestamp.from(Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES));
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

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Timestamp expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Timestamp getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(Timestamp usedAt) {
        this.usedAt = usedAt;
    }

    // Helper method to check if token is expired
    public boolean isExpired() {
        return expiresAt.before(Timestamp.from(Instant.now()));
    }

    // Helper method to check if token has been used
    public boolean isUsed() {
        return usedAt != null;
    }
}

