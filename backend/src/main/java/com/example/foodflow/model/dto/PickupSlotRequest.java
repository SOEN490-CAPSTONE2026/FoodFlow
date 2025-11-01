package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class PickupSlotRequest {
    
    @NotNull(message = "Pickup date is required")
    private LocalDate pickupDate;
    
    @NotNull(message = "Start time is required")
    private LocalTime startTime;
    
    @NotNull(message = "End time is required")
    private LocalTime endTime;
    
    private String notes;
    
    // Constructors
    public PickupSlotRequest() {}
    
    public PickupSlotRequest(LocalDate pickupDate, LocalTime startTime, LocalTime endTime, String notes) {
        this.pickupDate = pickupDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.notes = notes;
    }
    
    // Getters and Setters
    public LocalDate getPickupDate() {
        return pickupDate;
    }
    
    public void setPickupDate(LocalDate pickupDate) {
        this.pickupDate = pickupDate;
    }
    
    public LocalTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    @Override
    public String toString() {
        return "PickupSlotRequest{" +
                "pickupDate=" + pickupDate +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", notes='" + notes + '\'' +
                '}';
    }
}
