package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "saved_donations",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_saved_donations_receiver_post",
            columnNames = { "receiver_id", "surplus_post_id" }
        )
    }
)
public class SavedDonation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "surplus_post_id", nullable = false)
    private SurplusPost surplusPost;

    @Column(name = "saved_at", nullable = false, updatable = false)
    private LocalDateTime savedAt;

    protected SavedDonation() {
        
    }

    public SavedDonation(User receiver, SurplusPost surplusPost) {
        this.receiver = receiver;
        this.surplusPost = surplusPost;
        this.savedAt = LocalDateTime.now();
    }


    public Long getId() {
        return id;
    }

    public User getReceiver() {
        return receiver;
    }

    public SurplusPost getSurplusPost() {
        return surplusPost;
    }

    public LocalDateTime getSavedAt() {
        return savedAt;
    }
}
