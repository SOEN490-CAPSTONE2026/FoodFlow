package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.Location;
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