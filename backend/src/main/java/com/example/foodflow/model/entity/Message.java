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
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
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
    
    public Message(Conversation conversation, User sender, String messageBody) {
        this.conversation = conversation;
        this.sender = sender;
        this.messageBody = messageBody;
        this.readStatus = false;
    }
    
    // Getters and Setters
    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }
    
    public Conversation getConversation() { 
        return conversation; 
    }
    
    public void setConversation(Conversation conversation) { 
        this.conversation = conversation; 
    }
    
    public User getSender() { 
        return sender; 
    }
    
    public void setSender(User sender) { 
        this.sender = sender; 
    }
    
    public String getMessageBody() { 
        return messageBody; 
    }
    
    public void setMessageBody(String messageBody) { 
        this.messageBody = messageBody; 
    }
    
    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    
    public Boolean getReadStatus() { 
        return readStatus; 
    }
    
    public void setReadStatus(Boolean readStatus) { 
        this.readStatus = readStatus; 
    }
}
