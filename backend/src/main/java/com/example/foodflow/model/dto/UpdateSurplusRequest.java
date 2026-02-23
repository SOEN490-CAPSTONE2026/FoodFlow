package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.Quantity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public class UpdateSurplusRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotNull
    private Set<FoodCategory> foodCategories;

    @NotNull
    private Quantity quantity;

    @NotNull
    private Location pickupLocation;

    @NotNull
    private LocalDate expiryDate;

    private List<PickupSlotRequest> pickupSlots;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Set<FoodCategory> getFoodCategories() { return foodCategories; }
    public void setFoodCategories(Set<FoodCategory> foodCategories) { this.foodCategories = foodCategories; }

    public Quantity getQuantity() { return quantity; }
    public void setQuantity(Quantity quantity) { this.quantity = quantity; }

    public Location getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(Location pickupLocation) { this.pickupLocation = pickupLocation; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public List<PickupSlotRequest> getPickupSlots() { return pickupSlots; }
    public void setPickupSlots(List<PickupSlotRequest> pickupSlots) { this.pickupSlots = pickupSlots; }
}
