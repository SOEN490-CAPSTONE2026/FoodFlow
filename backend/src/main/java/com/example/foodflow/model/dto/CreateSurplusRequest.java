package com.example.foodflow.model.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class CreateSurplusRequest {
    
    @NotBlank(message = "Food name is required")
    private String foodName;
    
    @NotBlank(message = "Food type is required")
    private String foodType;
    
    @NotNull(message = "Expiry date is required")
    @Future(message = "Expiry date must be in the future")
    private LocalDate expiryDate;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Double quantity;
    
    @NotBlank(message = "Unit is required")
    private String unit;
    
    @NotNull(message = "Pickup start time is required")
    @Future(message = "Pickup start time must be in the future")
    private LocalDateTime pickupFrom;
    
    @NotNull(message = "Pickup end time is required")
    private LocalTime pickupTo;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    @NotBlank(message = "Food description is required")
    private String notes;
    
    // Constructors
    public CreateSurplusRequest() {}
    
    // Getters and Setters
    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }
    
    public String getFoodType() { return foodType; }
    public void setFoodType(String foodType) { this.foodType = foodType; }
    
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    
    
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
}
