package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surplus_post_id", nullable = false)
    private SurplusPost surplusPost;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;
    
    @Column(name = "message_body", nullable = false, columnDefinition = "TEXT")
    private String messageBody;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "read_status", nullable = false)
    private Boolean readStatus = false;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public Message() {}
    
    public Message(SurplusPost surplusPost, User sender, User receiver, String messageBody) {
        this.surplusPost = surplusPost;
        this.sender = sender;
        this.receiver = receiver;
        this.messageBody = messageBody;
        this.readStatus = false;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public SurplusPost getSurplusPost() { return surplusPost; }
    public void setSurplusPost(SurplusPost surplusPost) { this.surplusPost = surplusPost; }
    
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    
    public User getReceiver() { return receiver; }
    public void setReceiver(User receiver) { this.receiver = receiver; }
    
    public String getMessageBody() { return messageBody; }
    public void setMessageBody(String messageBody) { this.messageBody = messageBody; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    
    public Boolean getReadStatus() { return readStatus; }
    public void setReadStatus(Boolean readStatus) { this.readStatus = readStatus; }
}
