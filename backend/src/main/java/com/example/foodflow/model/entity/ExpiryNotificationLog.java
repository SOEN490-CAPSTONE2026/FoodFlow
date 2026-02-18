package com.example.foodflow.model.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "expiry_notification_log")
public class ExpiryNotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surplus_post_id", nullable = false)
    private SurplusPost surplusPost;

    @Column(name = "threshold_hours", nullable = false)
    private Integer thresholdHours;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "channel", nullable = false, length = 20)
    private String channel;

    @Column(name = "dedupe_key", nullable = false, unique = true, length = 255)
    private String dedupeKey;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
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

    public Integer getThresholdHours() {
        return thresholdHours;
    }

    public void setThresholdHours(Integer thresholdHours) {
        this.thresholdHours = thresholdHours;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getDedupeKey() {
        return dedupeKey;
    }

    public void setDedupeKey(String dedupeKey) {
        this.dedupeKey = dedupeKey;
    }
}
