package com.example.foodflow.model.dto;

import java.time.LocalDateTime;

public class SurplusResponse {
    
    private Long id;
    private String type;
    private String quantity;
    private LocalDateTime expiryDate;
    private LocalDateTime pickupTime;
    private String location;
    private String donorEmail;
    private LocalDateTime createdAt;
    
    // Constructors
    public SurplusResponse() {}
    
    public SurplusResponse(Long id, String type, String quantity, LocalDateTime expiryDate,
                          LocalDateTime pickupTime, String location, String donorEmail, 
                          LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.quantity = quantity;
        this.expiryDate = expiryDate;
        this.pickupTime = pickupTime;
        this.location = location;
        this.donorEmail = donorEmail;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getQuantity() { return quantity; }
    public void setQuantity(String quantity) { this.quantity = quantity; }
    
    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
    
    public LocalDateTime getPickupTime() { return pickupTime; }
    public void setPickupTime(LocalDateTime pickupTime) { this.pickupTime = pickupTime; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getDonorEmail() { return donorEmail; }
    public void setDonorEmail(String donorEmail) { this.donorEmail = donorEmail; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
