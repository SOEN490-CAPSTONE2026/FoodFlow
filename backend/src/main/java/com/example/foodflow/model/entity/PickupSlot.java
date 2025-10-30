package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Objects;

@Entity
@Table(name = "pickup_slots")
public class PickupSlot {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surplus_post_id", nullable = false)
    private SurplusPost surplusPost;
    
    @Column(name = "pickup_date", nullable = false)
    private LocalDate pickupDate;
    
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "slot_order", nullable = false)
    private Integer slotOrder;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public PickupSlot() {}
    
    public PickupSlot(SurplusPost surplusPost, LocalDate pickupDate, LocalTime startTime, 
                      LocalTime endTime, String notes, Integer slotOrder) {
        this.surplusPost = surplusPost;
        this.pickupDate = pickupDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.notes = notes;
        this.slotOrder = slotOrder;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public SurplusPost getSurplusPost() {
        return surplusPost;
    }
    
    public void setSurplusPost(SurplusPost surplusPost) {
        this.surplusPost = surplusPost;
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
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PickupSlot)) return false;
        PickupSlot that = (PickupSlot) o;
        return Objects.equals(id, that.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "PickupSlot{" +
                "id=" + id +
                ", pickupDate=" + pickupDate +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", slotOrder=" + slotOrder +
                '}';
    }
}
