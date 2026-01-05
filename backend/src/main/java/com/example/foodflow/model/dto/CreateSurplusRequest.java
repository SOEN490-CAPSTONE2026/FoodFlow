package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.Location;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import jakarta.validation.Valid;

public class CreateSurplusRequest {

    @NotBlank(message = "{validation.title.required}")
    private String title;

    @NotEmpty(message = "{validation.foodCategories.required}")
    private Set<FoodCategory> foodCategories = new HashSet<>();

    @Valid
    @NotNull(message = "{validation.quantity.required}")
    private Quantity quantity;

    @NotNull(message = "{validation.expiryDate.required}")
    @Future(message = "{validation.expiryDate.future}")
    private LocalDate expiryDate;

    @NotBlank(message = "{validation.description.required}")
    private String description;

    @NotNull(message = "{validation.pickupDate.required}")
    private LocalDate pickupDate;

    @NotNull(message = "{validation.pickupFrom.required}")
    private LocalTime pickupFrom;

    @NotNull(message = "{validation.pickupTo.required}")
    private LocalTime pickupTo;

    @NotNull(message = "{validation.pickupLocation.required}")
    private Location pickupLocation;

    @Valid
    private List<PickupSlotRequest> pickupSlots = new ArrayList<>();

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

    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }

    public LocalTime getPickupFrom() { return pickupFrom; }
    public void setPickupFrom(LocalTime pickupFrom) { this.pickupFrom = pickupFrom; }

    public LocalTime getPickupTo() { return pickupTo; }
    public void setPickupTo(LocalTime pickupTo) { this.pickupTo = pickupTo; }

    public Location getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(Location pickupLocation) { this.pickupLocation = pickupLocation; }

    public PostStatus getStatus() { return status; }
    public void setStatus(PostStatus status) { this.status = status; }

    public List<PickupSlotRequest> getPickupSlots() { return pickupSlots; }
    public void setPickupSlots(List<PickupSlotRequest> pickupSlots) { this.pickupSlots = pickupSlots; }
}
