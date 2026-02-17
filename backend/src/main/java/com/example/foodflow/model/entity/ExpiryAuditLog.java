package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "expiry_audit_log")
public class ExpiryAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surplus_post_id", nullable = false)
    private SurplusPost surplusPost;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "previous_effective")
    private LocalDateTime previousEffective;

    @Column(name = "new_effective")
    private LocalDateTime newEffective;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public SurplusPost getSurplusPost() {
        return surplusPost;
    }

    public void setSurplusPost(SurplusPost surplusPost) {
        this.surplusPost = surplusPost;
    }

    public Long getActorId() {
        return actorId;
    }

    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public LocalDateTime getPreviousEffective() {
        return previousEffective;
    }

    public void setPreviousEffective(LocalDateTime previousEffective) {
        this.previousEffective = previousEffective;
    }

    public LocalDateTime getNewEffective() {
        return newEffective;
    }

    public void setNewEffective(LocalDateTime newEffective) {
        this.newEffective = newEffective;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
