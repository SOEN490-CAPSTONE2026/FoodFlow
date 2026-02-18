package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.DietaryMatchMode;
import com.example.foodflow.model.types.DietaryTag;
import com.example.foodflow.model.types.FoodType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for filtering surplus posts based on various criteria.
 */
public class SurplusFilterRequest {

    /**
     * Food categories to filter by (CONTAINS_ANY logic)
     */
    private List<String> foodCategories;

    /**
     * Maximum expiry date (posts expiring before this date)
     */
    private LocalDate expiryBefore;

    /**
     * User's location for distance filtering
     */
    private Location userLocation;

    /**
     * Maximum distance from user location in kilometers
     */
    @Min(value = 0, message = "Distance must be non-negative")
    private Double maxDistanceKm;

    /**
     * Minimum expiry date (posts expiring after this date)
     */
    private LocalDate expiryAfter;

    /**
     * Specific status to filter by (default: AVAILABLE)
     */
    private String status;

    /**
     * Food type filter list (matches any).
     */
    private List<FoodType> foodTypes;

    /**
     * Dietary tag filter list.
     */
    private List<DietaryTag> dietaryTags;

    /**
     * Dietary matching mode: ANY or ALL.
     */
    private DietaryMatchMode dietaryMatch = DietaryMatchMode.ANY;

    /**
     * Sort mode: expiry_asc or expiry_desc.
     */
    private String sort;

    // Default constructor
    public SurplusFilterRequest() {
        this.status = "AVAILABLE"; // Default to available posts
    }

    // Constructor with common parameters
    public SurplusFilterRequest(List<String> foodCategories, LocalDate expiryBefore, 
                               Location userLocation, Double maxDistanceKm) {
        this();
        this.foodCategories = foodCategories;
        this.expiryBefore = expiryBefore;
        this.userLocation = userLocation;
        this.maxDistanceKm = maxDistanceKm;
    }

    // Getters and Setters
    public List<String> getFoodCategories() {
        return foodCategories;
    }

    public void setFoodCategories(List<String> foodCategories) {
        this.foodCategories = foodCategories;
    }

    public LocalDate getExpiryBefore() {
        return expiryBefore;
    }

    public void setExpiryBefore(LocalDate expiryBefore) {
        this.expiryBefore = expiryBefore;
    }

    public Location getUserLocation() {
        return userLocation;
    }

    public void setUserLocation(Location userLocation) {
        this.userLocation = userLocation;
    }

    public Double getMaxDistanceKm() {
        return maxDistanceKm;
    }

    public void setMaxDistanceKm(Double maxDistanceKm) {
        this.maxDistanceKm = maxDistanceKm;
    }

    public LocalDate getExpiryAfter() {
        return expiryAfter;
    }

    public void setExpiryAfter(LocalDate expiryAfter) {
        this.expiryAfter = expiryAfter;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<FoodType> getFoodTypes() {
        return foodTypes;
    }

    public void setFoodTypes(List<FoodType> foodTypes) {
        this.foodTypes = foodTypes;
    }

    public List<DietaryTag> getDietaryTags() {
        return dietaryTags;
    }

    public void setDietaryTags(List<DietaryTag> dietaryTags) {
        this.dietaryTags = dietaryTags;
    }

    public DietaryMatchMode getDietaryMatch() {
        return dietaryMatch;
    }

    public void setDietaryMatch(DietaryMatchMode dietaryMatch) {
        this.dietaryMatch = dietaryMatch;
    }

    public String getSort() {
        return sort;
    }

    public void setSort(String sort) {
        this.sort = sort;
    }

    // Utility methods
    public boolean hasFoodCategories() {
        return foodCategories != null && !foodCategories.isEmpty();
    }

    public boolean hasExpiryBefore() {
        return expiryBefore != null;
    }

    public boolean hasExpiryAfter() {
        return expiryAfter != null;
    }

    public boolean hasLocationFilter() {
        return userLocation != null && 
               userLocation.getLatitude() != null && 
               userLocation.getLongitude() != null && 
               maxDistanceKm != null && 
               maxDistanceKm > 0;
    }

    public boolean hasStatus() {
        return status != null && !status.trim().isEmpty();
    }

    public boolean hasFoodTypes() {
        return foodTypes != null && !foodTypes.isEmpty();
    }

    public boolean hasDietaryTags() {
        return dietaryTags != null && !dietaryTags.isEmpty();
    }

    @Override
    public String toString() {
        return "SurplusFilterRequest{" +
                "foodCategories=" + foodCategories +
                ", expiryBefore=" + expiryBefore +
                ", expiryAfter=" + expiryAfter +
                ", userLocation=" + userLocation +
                ", maxDistanceKm=" + maxDistanceKm +
                ", status='" + status + '\'' +
                '}';
    }
}
