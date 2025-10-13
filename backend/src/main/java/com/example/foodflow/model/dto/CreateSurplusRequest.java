package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.Location;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import jakarta.validation.Valid;

public class CreateSurplusRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotEmpty(message = "At least one food category is required")
    private Set<FoodCategory> foodCategories = new HashSet<>();

    @Valid
    @NotNull(message = "Quantity is required")
    private Quantity quantity;

    @NotNull(message = "Expiry date is required")
    @Future(message = "Expiry date must be in the future")
    private LocalDate expiryDate;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Pickup start time is required")
    @Future(message = "Pickup start time must be in the future")
    private LocalDateTime pickupFrom;

    @NotNull(message = "Pickup end time is required")
    @Future(message = "Pickup end time must be in the future")
    private LocalDateTime pickupTo;

    @NotNull(message = "Pickup location is required")
    private Location pickupLocation;

    private PostStatus status = PostStatus.AVAILABLE; // default value

    // Constructors
    public CreateSurplusRequest() {}

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Set<FoodCategory> getFoodCategories() { return foodCategories; }
    public void setFoodCategories(Set<FoodCategory> foodCategories) { this.foodCategories = foodCategories; }

    public Quantity getQuantity() { return quantity; }
    public void setQuantity(Quantity quantity) { this.quantity = quantity; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getPickupFrom() { return pickupFrom; }
    public void setPickupFrom(LocalDateTime pickupFrom) { this.pickupFrom = pickupFrom; }

    public LocalDateTime getPickupTo() { return pickupTo; }
    public void setPickupTo(LocalDateTime pickupTo) { this.pickupTo = pickupTo; }

    public Location getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(Location pickupLocation) { this.pickupLocation = pickupLocation; }

    public PostStatus getStatus() { return status; }
    public void setStatus(PostStatus status) { this.status = status; }
}
