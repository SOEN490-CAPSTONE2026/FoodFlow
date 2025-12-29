package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
public class Conversation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surplus_post_id")
    private SurplusPost surplusPost;

    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;
    
    // Constructors
    public Conversation() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Conversation(User user1, User user2) {
        this();
        // Ensure user1_id < user2_id for consistent ordering
        if (user1.getId() < user2.getId()) {
            this.user1 = user1;
            this.user2 = user2;
        } else {
            this.user1 = user2;
            this.user2 = user1;
        }
    }

        public Conversation(User user1, User user2, SurplusPost surplusPost) {
        this(user1, user2);
        this.surplusPost = surplusPost;
    }
    
    
    // Helper method to get the other participant
    public User getOtherParticipant(Long currentUserId) {
        if (user1.getId().equals(currentUserId)) {
            return user2;
        } else if (user2.getId().equals(currentUserId)) {
            return user1;
        }
        throw new IllegalArgumentException("User is not a participant in this conversation");
    }
    
    // Helper method to check if user is participant
    public boolean isParticipant(Long userId) {
        return user1.getId().equals(userId) || user2.getId().equals(userId);
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser1() {
        return user1;
    }
    
    public void setUser1(User user1) {
        this.user1 = user1;
    }
    
    public User getUser2() {
        return user2;
    }
    
    public void setUser2(User user2) {
        this.user2 = user2;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
     public SurplusPost getSurplusPost() {
        return surplusPost;
    }
    
     public void setSurplusPost(SurplusPost surplusPost) {
        this.surplusPost = surplusPost;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }
    
    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }
}
