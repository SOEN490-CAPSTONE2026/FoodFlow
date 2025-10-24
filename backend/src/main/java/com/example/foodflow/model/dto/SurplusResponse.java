package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PostStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.Set;

import com.example.foodflow.model.entity.SurplusPost;

public class SurplusResponse {

    private Long id;
    private String title;
    private String description;
    private Set<FoodCategory> foodCategories;
    private Quantity quantity;
    private Location pickupLocation;
    private LocalDate expiryDate;

    // Changed fields
    private LocalDate pickupDate;
    private LocalTime pickupFrom;
    private LocalTime pickupTo;

    private PostStatus status;
    private String donorEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public SurplusResponse() {}

    public SurplusResponse(Long id, String title, String description, Set<FoodCategory> foodCategories,
                           Quantity quantity, Location pickupLocation,
                           LocalDate expiryDate, LocalDate pickupDate, LocalTime pickupFrom, LocalTime pickupTo,
                           PostStatus status, String donorEmail,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.foodCategories = foodCategories;
        this.quantity = quantity;
        this.pickupLocation = pickupLocation;
        this.expiryDate = expiryDate;
        this.pickupDate = pickupDate;
        this.pickupFrom = pickupFrom;
        this.pickupTo = pickupTo;
        this.status = status;
        this.donorEmail = donorEmail;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public SurplusResponse(SurplusPost surplusPost) {
        this.id = surplusPost.getId();
        this.title = surplusPost.getTitle();
        this.description = surplusPost.getDescription();
        this.foodCategories = surplusPost.getFoodCategories();
        this.quantity = surplusPost.getQuantity();
        this.pickupLocation = surplusPost.getPickupLocation();
        this.expiryDate = surplusPost.getExpiryDate();
        this.pickupDate = surplusPost.getPickupDate();
        this.pickupFrom = surplusPost.getPickupFrom();
        this.pickupTo = surplusPost.getPickupTo();
        this.status = surplusPost.getStatus();
        this.donorEmail = surplusPost.getDonor().getEmail();
        this.createdAt = surplusPost.getCreatedAt();
        this.updatedAt = surplusPost.getUpdatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }

    public LocalTime getPickupFrom() { return pickupFrom; }
    public void setPickupFrom(LocalTime pickupFrom) { this.pickupFrom = pickupFrom; }

    public LocalTime getPickupTo() { return pickupTo; }
    public void setPickupTo(LocalTime pickupTo) { this.pickupTo = pickupTo; }

    public PostStatus getStatus() { return status; }
    public void setStatus(PostStatus status) { this.status = status; }

    public String getDonorEmail() { return donorEmail; }
    public void setDonorEmail(String donorEmail) { this.donorEmail = donorEmail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
