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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id")
    private User donor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private User receiver;

    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    @Column(name = "last_message_preview", columnDefinition = "TEXT")
    private String lastMessagePreview;

    @Column(name = "donation_title")
    private String donationTitle;

    @Column(name = "donation_photo", columnDefinition = "TEXT")
    private String donationPhoto;

    @Column(name = "donation_description", columnDefinition = "TEXT")
    private String donationDescription;

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

    /**
     * Create a donation-anchored conversation thread.
     * Sets user1/user2 for backward compatibility, plus explicit donor/receiver roles
     * and donation snapshot fields.
     */
    public static Conversation createDonationThread(User donor, User receiver, SurplusPost post) {
        Conversation conv = new Conversation(donor, receiver, post);
        conv.donor = donor;
        conv.receiver = receiver;
        conv.status = "ACTIVE";
        // Snapshot donation details so context is preserved even if donation is edited/deleted
        conv.donationTitle = post.getTitle();
        conv.donationDescription = post.getDescription();
        // Store food categories as photo reference (frontend maps categories to images)
        if (post.getFoodCategories() != null && !post.getFoodCategories().isEmpty()) {
            conv.donationPhoto = post.getFoodCategories().iterator().next().name();
        }
        return conv;
    }


    // Helper method to get the other participant
    public User getOtherParticipant(Long currentUserId) {
        // For donation-anchored threads, use donor/receiver roles
        if (isDonationThread()) {
            if (donor != null && donor.getId().equals(currentUserId)) {
                return receiver;
            } else if (receiver != null && receiver.getId().equals(currentUserId)) {
                return donor;
            }
        }
        
        // For legacy conversations, use user1/user2
        if (user1 != null && user1.getId().equals(currentUserId)) {
            return user2;
        } else if (user2 != null && user2.getId().equals(currentUserId)) {
            return user1;
        }
        
        throw new IllegalArgumentException("User is not a participant in this conversation");
    }

    // Helper method to check if user is participant
    public boolean isParticipant(Long userId) {
        // Check donation-anchored thread participants
        if (isDonationThread()) {
            boolean isDonor = donor != null && donor.getId().equals(userId);
            boolean isReceiver = receiver != null && receiver.getId().equals(userId);
            if (isDonor || isReceiver) {
                return true;
            }
        }
        
        // Check legacy conversation participants
        boolean isUser1 = user1 != null && user1.getId().equals(userId);
        boolean isUser2 = user2 != null && user2.getId().equals(userId);
        return isUser1 || isUser2;
    }

    // Helper to check if this is a donation-anchored thread
    public boolean isDonationThread() {
        return surplusPost != null && donor != null && receiver != null;
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

    public User getDonor() {
        return donor;
    }

    public void setDonor(User donor) {
        this.donor = donor;
    }

    public User getReceiver() {
        return receiver;
    }

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLastMessagePreview() {
        return lastMessagePreview;
    }

    public void setLastMessagePreview(String lastMessagePreview) {
        this.lastMessagePreview = lastMessagePreview;
    }

    public String getDonationTitle() {
        return donationTitle;
    }

    public void setDonationTitle(String donationTitle) {
        this.donationTitle = donationTitle;
    }

    public String getDonationPhoto() {
        return donationPhoto;
    }

    public void setDonationPhoto(String donationPhoto) {
        this.donationPhoto = donationPhoto;
    }

    public String getDonationDescription() {
        return donationDescription;
    }

    public void setDonationDescription(String donationDescription) {
        this.donationDescription = donationDescription;
    }
}
