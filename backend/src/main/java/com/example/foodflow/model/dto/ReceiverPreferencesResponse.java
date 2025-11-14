package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.ReceiverPreferences;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ReceiverPreferencesResponse {
    
    private Long id;
    private Long userId;
    private List<String> preferredFoodTypes;
    private Integer maxCapacity;
    private Integer minQuantity;
    private Integer maxQuantity;
    private List<String> preferredPickupWindows;
    private Boolean acceptRefrigerated;
    private Boolean acceptFrozen;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor from entity
    public ReceiverPreferencesResponse(ReceiverPreferences preferences) {
        this.id = preferences.getId();
        this.userId = preferences.getUser().getId();
        this.preferredFoodTypes = preferences.getPreferredFoodTypes() != null ? 
            new ArrayList<>(preferences.getPreferredFoodTypes()) : new ArrayList<>();
        this.maxCapacity = preferences.getMaxCapacity();
        this.minQuantity = preferences.getMinQuantity();
        this.maxQuantity = preferences.getMaxQuantity();
        this.preferredPickupWindows = preferences.getPreferredPickupWindows() != null ? 
            new ArrayList<>(preferences.getPreferredPickupWindows()) : new ArrayList<>();
        this.acceptRefrigerated = preferences.getAcceptRefrigerated();
        this.acceptFrozen = preferences.getAcceptFrozen();
        this.createdAt = preferences.getCreatedAt();
        this.updatedAt = preferences.getUpdatedAt();
    }
    
    // Default constructor
    public ReceiverPreferencesResponse() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public List<String> getPreferredFoodTypes() {
        return preferredFoodTypes;
    }
    
    public void setPreferredFoodTypes(List<String> preferredFoodTypes) {
        this.preferredFoodTypes = preferredFoodTypes;
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
        this.preferredPickupWindows = preferredPickupWindows;
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
}
