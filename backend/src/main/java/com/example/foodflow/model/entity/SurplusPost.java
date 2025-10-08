package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "surplus_posts")
public class SurplusPost {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, name = "food_name")
    private String foodName;
    
    @Column(nullable = false, name = "food_type")
    private String foodType;
    
    @Column(nullable = false, name = "expiry_date")
    private LocalDateTime expiryDate;
    
    @Column(nullable = false)
    private Double quantity;
    
    @Column(nullable = false)
    private String unit;
    
    @Column(nullable = false, name = "pickup_from")
    private LocalDateTime pickupFrom;
    
    @Column(nullable = false, name = "pickup_to")
    private LocalTime pickupTo;
    
    @Column(nullable = false)
    private String location;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String notes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public SurplusPost() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }
    
    public String getFoodType() { return foodType; }
    public void setFoodType(String foodType) { this.foodType = foodType; }
    
    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
    
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    
    public LocalDateTime getPickupFrom() { return pickupFrom; }
    public void setPickupFrom(LocalDateTime pickupFrom) { this.pickupFrom = pickupFrom; }
    
    public LocalTime getPickupTo() { return pickupTo; }
    public void setPickupTo(LocalTime pickupTo) { this.pickupTo = pickupTo; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public User getDonor() { return donor; }
    public void setDonor(User donor) { this.donor = donor; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
