package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.Quantity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

public class AdminDonationResponse {
    
    private Long id;
    private String title;
    private Set<FoodCategory> foodCategories;
    private Quantity quantity;
    private Location pickupLocation;
    private LocalDate expiryDate;
    private String description;
    private LocalDate pickupDate;
    private LocalTime pickupFrom;
    private LocalTime pickupTo;
    private PostStatus status;
    private Boolean flagged;
    private String flagReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Donor information
    private Long donorId;
    private String donorName;
    private String donorEmail;
    private String donorOrganization;
    
    // Receiver information (if claimed)
    private Long receiverId;
    private String receiverName;
    private String receiverEmail;
    private String receiverOrganization;
    
    // Claim information
    private Long claimId;
    private LocalDateTime claimedAt;
    private LocalDate confirmedPickupDate;
    private LocalTime confirmedPickupStartTime;
    private LocalTime confirmedPickupEndTime;
    
    // Timeline - always included for admin
    private List<DonationTimelineDTO> timeline;
    
    // Constructors
    public AdminDonationResponse() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public Set<FoodCategory> getFoodCategories() { return foodCategories; }
    public void setFoodCategories(Set<FoodCategory> foodCategories) { this.foodCategories = foodCategories; }
    
    public Quantity getQuantity() { return quantity; }
    public void setQuantity(Quantity quantity) { this.quantity = quantity; }
    
    public Location getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(Location pickupLocation) { this.pickupLocation = pickupLocation; }
    
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }
    
    public LocalTime getPickupFrom() { return pickupFrom; }
    public void setPickupFrom(LocalTime pickupFrom) { this.pickupFrom = pickupFrom; }
    
    public LocalTime getPickupTo() { return pickupTo; }
    public void setPickupTo(LocalTime pickupTo) { this.pickupTo = pickupTo; }
    
    public PostStatus getStatus() { return status; }
    public void setStatus(PostStatus status) { this.status = status; }
    
    public Boolean getFlagged() { return flagged; }
    public void setFlagged(Boolean flagged) { this.flagged = flagged; }
    
    public String getFlagReason() { return flagReason; }
    public void setFlagReason(String flagReason) { this.flagReason = flagReason; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Long getDonorId() { return donorId; }
    public void setDonorId(Long donorId) { this.donorId = donorId; }
    
    public String getDonorName() { return donorName; }
    public void setDonorName(String donorName) { this.donorName = donorName; }
    
    public String getDonorEmail() { return donorEmail; }
    public void setDonorEmail(String donorEmail) { this.donorEmail = donorEmail; }
    
    public String getDonorOrganization() { return donorOrganization; }
    public void setDonorOrganization(String donorOrganization) { this.donorOrganization = donorOrganization; }
    
    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
    
    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }
    
    public String getReceiverEmail() { return receiverEmail; }
    public void setReceiverEmail(String receiverEmail) { this.receiverEmail = receiverEmail; }
    
    public String getReceiverOrganization() { return receiverOrganization; }
    public void setReceiverOrganization(String receiverOrganization) { this.receiverOrganization = receiverOrganization; }
    
    public Long getClaimId() { return claimId; }
    public void setClaimId(Long claimId) { this.claimId = claimId; }
    
    public LocalDateTime getClaimedAt() { return claimedAt; }
    public void setClaimedAt(LocalDateTime claimedAt) { this.claimedAt = claimedAt; }
    
    public LocalDate getConfirmedPickupDate() { return confirmedPickupDate; }
    public void setConfirmedPickupDate(LocalDate confirmedPickupDate) { this.confirmedPickupDate = confirmedPickupDate; }
    
    public LocalTime getConfirmedPickupStartTime() { return confirmedPickupStartTime; }
    public void setConfirmedPickupStartTime(LocalTime confirmedPickupStartTime) { this.confirmedPickupStartTime = confirmedPickupStartTime; }
    
    public LocalTime getConfirmedPickupEndTime() { return confirmedPickupEndTime; }
    public void setConfirmedPickupEndTime(LocalTime confirmedPickupEndTime) { this.confirmedPickupEndTime = confirmedPickupEndTime; }
    
    public List<DonationTimelineDTO> getTimeline() { return timeline; }
    public void setTimeline(List<DonationTimelineDTO> timeline) { this.timeline = timeline; }
}
