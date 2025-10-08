package com.example.foodflow.model.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

public class SurplusResponse {
    
    private Long id;
    private String foodName;
    private String foodType;
    private Double quantity;
    private String unit;
    private LocalDateTime expiryDate;
    private LocalDateTime pickupFrom;
    private LocalTime pickupTo;
    private String location;
    private String notes;
    private String donorEmail;
    private LocalDateTime createdAt;
    
    // Constructors
    public SurplusResponse() {}
    
    public SurplusResponse(Long id, String foodName, String foodType, Double quantity, 
                          String unit, LocalDateTime expiryDate, LocalDateTime pickupFrom,
                          LocalTime pickupTo, String location, String notes,
                          String donorEmail, LocalDateTime createdAt) {
        this.id = id;
        this.foodName = foodName;
        this.foodType = foodType;
        this.quantity = quantity;
        this.unit = unit;
        this.expiryDate = expiryDate;
        this.pickupFrom = pickupFrom;
        this.pickupTo = pickupTo;
        this.location = location;
        this.notes = notes;
        this.donorEmail = donorEmail;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }
    
    public String getFoodType() { return foodType; }
    public void setFoodType(String foodType) { this.foodType = foodType; }
    
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    
    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
    
    public LocalDateTime getPickupFrom() { return pickupFrom; }
    public void setPickupFrom(LocalDateTime pickupFrom) { this.pickupFrom = pickupFrom; }
    
    public LocalTime getPickupTo() { return pickupTo; }
    public void setPickupTo(LocalTime pickupTo) { this.pickupTo = pickupTo; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public String getDonorEmail() { return donorEmail; }
    public void setDonorEmail(String donorEmail) { this.donorEmail = donorEmail; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
