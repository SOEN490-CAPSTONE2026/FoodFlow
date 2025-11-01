package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.PickupSlot;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class PickupSlotResponse {
    
    private Long id;
    private LocalDate pickupDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String notes;
    private Integer slotOrder;
    private LocalDateTime createdAt;
    
    // Constructors
    public PickupSlotResponse() {}
    
    public PickupSlotResponse(Long id, LocalDate pickupDate, LocalTime startTime, 
                              LocalTime endTime, String notes, Integer slotOrder, 
                              LocalDateTime createdAt) {
        this.id = id;
        this.pickupDate = pickupDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.notes = notes;
        this.slotOrder = slotOrder;
        this.createdAt = createdAt;
    }
    
    // Static factory method to convert entity to DTO
    public static PickupSlotResponse fromEntity(PickupSlot slot) {
        return new PickupSlotResponse(
            slot.getId(),
            slot.getPickupDate(),
            slot.getStartTime(),
            slot.getEndTime(),
            slot.getNotes(),
            slot.getSlotOrder(),
            slot.getCreatedAt()
        );
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
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
    
    public Integer getSlotOrder() {
        return slotOrder;
    }
    
    public void setSlotOrder(Integer slotOrder) {
        this.slotOrder = slotOrder;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    @Override
    public String toString() {
        return "PickupSlotResponse{" +
                "id=" + id +
                ", pickupDate=" + pickupDate +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", slotOrder=" + slotOrder +
                '}';
    }
}
