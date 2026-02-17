package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.TemperatureCategory;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.DietaryTag;
import com.example.foodflow.model.types.FoodType;
import com.fasterxml.jackson.annotation.JsonAlias;

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

    @JsonAlias("fabricatedAt")
    private LocalDate fabricationDate;
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
    
    // Donor's timezone (e.g., "America/Toronto") - all times in this request are in this timezone
    private String donorTimezone;

    @NotNull(message = "Temperature category is required")
    private TemperatureCategory temperatureCategory;

    @NotNull(message = "Packaging type is required")
    private PackagingType packagingType;

    private FoodType foodType;

    @Size(max = 10, message = "validation.dietaryTags.max")
    private List<DietaryTag> dietaryTags = new ArrayList<>();

    // Constructors
    public CreateSurplusRequest() {}

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Set<FoodCategory> getFoodCategories() { return foodCategories; }
    public void setFoodCategories(Set<FoodCategory> foodCategories) { this.foodCategories = foodCategories; }

    public Quantity getQuantity() { return quantity; }
    public void setQuantity(Quantity quantity) { this.quantity = quantity; }

    public LocalDate getFabricationDate() { return fabricationDate; }
    public void setFabricationDate(LocalDate fabricationDate) { this.fabricationDate = fabricationDate; }

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

    public TemperatureCategory getTemperatureCategory() { return temperatureCategory; }
    public void setTemperatureCategory(TemperatureCategory temperatureCategory) { this.temperatureCategory = temperatureCategory; }

    public PackagingType getPackagingType() { return packagingType; }
    public void setPackagingType(PackagingType packagingType) { this.packagingType = packagingType; }
    
    public String getDonorTimezone() { return donorTimezone; }
    public void setDonorTimezone(String donorTimezone) { this.donorTimezone = donorTimezone; }

    public FoodType getFoodType() { return foodType; }
    public void setFoodType(FoodType foodType) { this.foodType = foodType; }

    public List<DietaryTag> getDietaryTags() { return dietaryTags; }
    public void setDietaryTags(List<DietaryTag> dietaryTags) {
        this.dietaryTags = dietaryTags != null ? dietaryTags : new ArrayList<>();
    }

    @AssertTrue(message = "validation.dietaryTags.unique")
    public boolean isDietaryTagsUnique() {
        if (dietaryTags == null) {
            return true;
        }
        return new HashSet<>(dietaryTags).size() == dietaryTags.size();
    }
}
