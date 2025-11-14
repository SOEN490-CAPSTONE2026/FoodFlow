package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "receiver_preferences")
@EntityListeners(AuditingEntityListener.class)
public class ReceiverPreferences {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @ElementCollection
    @CollectionTable(name = "receiver_preferred_food_types", joinColumns = @JoinColumn(name = "preferences_id"))
    @Column(name = "food_type")
    private List<String> preferredFoodTypes = new ArrayList<>();
    
    @Min(value = 1, message = "Maximum capacity must be at least 1")
    @Column(name = "max_capacity", nullable = false)
    private Integer maxCapacity = 50; // Default capacity
    
    @Min(value = 0, message = "Minimum quantity cannot be negative")
    @Column(name = "min_quantity", nullable = false)
    private Integer minQuantity = 0;
    
    @Min(value = 0, message = "Maximum quantity cannot be negative")
    @Column(name = "max_quantity", nullable = false)
    private Integer maxQuantity = 100; // Default max quantity
    
    @ElementCollection
    @CollectionTable(name = "receiver_pickup_windows", joinColumns = @JoinColumn(name = "preferences_id"))
    @Column(name = "pickup_window")
    private List<String> preferredPickupWindows = new ArrayList<>();
    
    @Column(name = "accept_refrigerated", nullable = false)
    private Boolean acceptRefrigerated = true;
    
    @Column(name = "accept_frozen", nullable = false)
    private Boolean acceptFrozen = true;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public ReceiverPreferences() {}
    
    public ReceiverPreferences(User user) {
        this.user = user;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public List<String> getPreferredFoodTypes() {
        return preferredFoodTypes;
    }
    
    public void setPreferredFoodTypes(List<String> preferredFoodTypes) {
        this.preferredFoodTypes = preferredFoodTypes != null ? preferredFoodTypes : new ArrayList<>();
    }
    
    public Integer getMaxCapacity() {
        return maxCapacity;
    }
    
    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }
    
    public Integer getMinQuantity() {
        return minQuantity;
    }
    
    public void setMinQuantity(Integer minQuantity) {
        this.minQuantity = minQuantity;
    }
    
    public Integer getMaxQuantity() {
        return maxQuantity;
    }
    
    public void setMaxQuantity(Integer maxQuantity) {
        this.maxQuantity = maxQuantity;
    }
    
    public List<String> getPreferredPickupWindows() {
        return preferredPickupWindows;
    }
    
    public void setPreferredPickupWindows(List<String> preferredPickupWindows) {
        this.preferredPickupWindows = preferredPickupWindows != null ? preferredPickupWindows : new ArrayList<>();
    }
    
    public Boolean getAcceptRefrigerated() {
        return acceptRefrigerated;
    }
    
    public void setAcceptRefrigerated(Boolean acceptRefrigerated) {
        this.acceptRefrigerated = acceptRefrigerated;
    }
    
    public Boolean getAcceptFrozen() {
        return acceptFrozen;
    }
    
    public void setAcceptFrozen(Boolean acceptFrozen) {
        this.acceptFrozen = acceptFrozen;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Helper method to check if food type is preferred
    public boolean acceptsFoodType(String foodType) {
        return preferredFoodTypes.isEmpty() || preferredFoodTypes.contains(foodType);
    }
    
    // Helper method to check if quantity is within acceptable range
    public boolean acceptsQuantity(Integer quantity) {
        return quantity >= minQuantity && quantity <= maxQuantity;
    }
}
