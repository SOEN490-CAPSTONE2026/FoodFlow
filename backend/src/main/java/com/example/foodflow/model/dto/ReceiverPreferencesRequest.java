package com.example.foodflow.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

public class ReceiverPreferencesRequest {
    
    private List<String> preferredFoodTypes = new ArrayList<>();
    
    @NotNull(message = "Maximum capacity is required")
    @Min(value = 1, message = "Maximum capacity must be at least 1")
    private Integer maxCapacity;
    
    @NotNull(message = "Minimum quantity is required")
    @Min(value = 0, message = "Minimum quantity cannot be negative")
    private Integer minQuantity;
    
    @NotNull(message = "Maximum quantity is required")
    @Min(value = 0, message = "Maximum quantity cannot be negative")
    private Integer maxQuantity;
    
    private List<String> preferredPickupWindows = new ArrayList<>();
    
    @NotNull(message = "Accept refrigerated preference is required")
    private Boolean acceptRefrigerated;
    
    @NotNull(message = "Accept frozen preference is required")
    private Boolean acceptFrozen;
    
    // Constructors
    public ReceiverPreferencesRequest() {}
    
    // Getters and Setters
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
    
    // Validation method
    public void validate() {
        if (minQuantity != null && maxQuantity != null && minQuantity > maxQuantity) {
            throw new IllegalArgumentException("Minimum quantity cannot be greater than maximum quantity");
        }
    }
}
