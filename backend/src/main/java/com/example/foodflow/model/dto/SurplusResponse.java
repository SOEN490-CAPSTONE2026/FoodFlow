package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.TemperatureCategory;
import com.example.foodflow.model.types.PackagingType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.example.foodflow.model.entity.SurplusPost;

public class SurplusResponse {

    private Long id;
    private String title;
    private String description;
    private Set<FoodCategory> foodCategories;
    private Quantity quantity;
    private Location pickupLocation;
    private LocalDate fabricationDate;
    private LocalDate expiryDate;

    // Changed fields
    private LocalDate pickupDate;
    private LocalTime pickupFrom;
    private LocalTime pickupTo;

    private PostStatus status;
    private String otpCode;
    private Long donorId;
    private String donorEmail;
    private String donorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PickupSlotResponse> pickupSlots = new ArrayList<>();
    private PickupSlotResponse confirmedPickupSlot;
    private TemperatureCategory temperatureCategory;
    private PackagingType packagingType;

    // Receiver/Claimant information (if claimed)
    private String receiverName;
    private String receiverEmail;
    private String receiverOrganization;

    // Distance from receiver location (computed dynamically, in kilometers)
    private Double distanceKm;

    // Constructors
    public SurplusResponse() {
    }

    public SurplusResponse(Long id, String title, String description, Set<FoodCategory> foodCategories,
            Quantity quantity, Location pickupLocation,
            LocalDate fabricationDate, LocalDate expiryDate, LocalDate pickupDate, LocalTime pickupFrom,
            LocalTime pickupTo,
            PostStatus status, String otpCode, String donorEmail, String donorName,
            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.foodCategories = foodCategories;
        this.quantity = quantity;
        this.pickupLocation = pickupLocation;
        this.fabricationDate = fabricationDate;
        this.expiryDate = expiryDate;
        this.pickupDate = pickupDate;
        this.pickupFrom = pickupFrom;
        this.pickupTo = pickupTo;
        this.status = status;
        this.otpCode = otpCode;
        this.donorEmail = donorEmail;
        this.donorName = donorName;
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
        this.fabricationDate = surplusPost.getFabricationDate();
        this.expiryDate = surplusPost.getExpiryDate();
        this.pickupDate = surplusPost.getPickupDate();
        this.pickupFrom = surplusPost.getPickupFrom();
        this.pickupTo = surplusPost.getPickupTo();
        this.status = surplusPost.getStatus();
        this.otpCode = surplusPost.getOtpCode();
        this.donorId = surplusPost.getDonor().getId();
        this.donorEmail = surplusPost.getDonor().getEmail();
        this.donorName = surplusPost.getDonor().getOrganization() != null
                ? surplusPost.getDonor().getOrganization().getName()
                : null;
        this.createdAt = surplusPost.getCreatedAt();
        this.updatedAt = surplusPost.getUpdatedAt();
        this.temperatureCategory = surplusPost.getTemperatureCategory();
        this.packagingType = surplusPost.getPackagingType();

        // Convert pickup slots
        if (surplusPost.getPickupSlots() != null) {
            this.pickupSlots = surplusPost.getPickupSlots().stream()
                    .map(PickupSlotResponse::fromEntity)
                    .collect(Collectors.toList());
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<FoodCategory> getFoodCategories() {
        return foodCategories;
    }

    public void setFoodCategories(Set<FoodCategory> foodCategories) {
        this.foodCategories = foodCategories;
    }

    public Quantity getQuantity() {
        return quantity;
    }

    public void setQuantity(Quantity quantity) {
        this.quantity = quantity;
    }

    public Location getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(Location pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public LocalDate getFabricationDate() {
        return fabricationDate;
    }

    public void setFabricationDate(LocalDate fabricationDate) {
        this.fabricationDate = fabricationDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public LocalDate getPickupDate() {
        return pickupDate;
    }

    public void setPickupDate(LocalDate pickupDate) {
        this.pickupDate = pickupDate;
    }

    public LocalTime getPickupFrom() {
        return pickupFrom;
    }

    public void setPickupFrom(LocalTime pickupFrom) {
        this.pickupFrom = pickupFrom;
    }

    public LocalTime getPickupTo() {
        return pickupTo;
    }

    public void setPickupTo(LocalTime pickupTo) {
        this.pickupTo = pickupTo;
    }

    public PostStatus getStatus() {
        return status;
    }

    public void setStatus(PostStatus status) {
        this.status = status;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public Long getDonorId() {
        return donorId;
    }

    public void setDonorId(Long donorId) {
        this.donorId = donorId;
    }

    public String getDonorEmail() {
        return donorEmail;
    }

    public void setDonorEmail(String donorEmail) {
        this.donorEmail = donorEmail;
    }

    public String getDonorName() {
        return donorName;
    }

    public void setDonorName(String donorName) {
        this.donorName = donorName;
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

    public List<PickupSlotResponse> getPickupSlots() {
        return pickupSlots;
    }

    public void setPickupSlots(List<PickupSlotResponse> pickupSlots) {
        this.pickupSlots = pickupSlots;
    }

    public PickupSlotResponse getConfirmedPickupSlot() {
        return confirmedPickupSlot;
    }

    public void setConfirmedPickupSlot(PickupSlotResponse confirmedPickupSlot) {
        this.confirmedPickupSlot = confirmedPickupSlot;
    }

    public TemperatureCategory getTemperatureCategory() {
        return temperatureCategory;
    }

    public void setTemperatureCategory(TemperatureCategory temperatureCategory) {
        this.temperatureCategory = temperatureCategory;
    }

    public PackagingType getPackagingType() {
        return packagingType;
    }

    public void setPackagingType(PackagingType packagingType) {
        this.packagingType = packagingType;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getReceiverEmail() {
        return receiverEmail;
    }

    public void setReceiverEmail(String receiverEmail) {
        this.receiverEmail = receiverEmail;
    }

    public String getReceiverOrganization() {
        return receiverOrganization;
    }

    public void setReceiverOrganization(String receiverOrganization) {
        this.receiverOrganization = receiverOrganization;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }
}
