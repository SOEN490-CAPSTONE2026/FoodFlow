package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.TemperatureCategory;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.DietaryTag;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
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
    private LocalDate userProvidedExpiryDate;
    private LocalDate suggestedExpiryDate;
    private Boolean eligibleAtSubmission;
    private List<String> warningsAtSubmission = new ArrayList<>();
    private LocalDateTime expiryDateActual;
    private LocalDateTime expiryDatePredicted;
    private LocalDateTime expiryDateEffective;
    private Double predictionConfidence;
    private String predictionVersion;
    private Boolean expiryOverridden;
    private Boolean expiringSoon;
    private Boolean expired;
    private Double impactCo2eKg;
    private Double impactWaterL;
    private String impactFactorVersion;
    private LocalDateTime impactComputedAt;

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
    private FoodType foodType;
    private List<DietaryTag> dietaryTags = new ArrayList<>();

    // Receiver/Claimant information (if claimed)
    private String receiverName;
    private String receiverEmail;
    private String receiverOrganization;

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
        this.userProvidedExpiryDate = surplusPost.getUserProvidedExpiryDate();
        this.suggestedExpiryDate = surplusPost.getSuggestedExpiryDate();
        this.eligibleAtSubmission = surplusPost.getEligibleAtSubmission();
        this.expiryDateActual = surplusPost.getExpiryDate() != null
                ? surplusPost.getExpiryDate().atTime(23, 59, 59)
                : null;
        this.expiryDatePredicted = surplusPost.getExpiryDatePredicted();
        this.expiryDateEffective = surplusPost.getExpiryDateEffective();
        this.predictionConfidence = surplusPost.getExpiryPredictionConfidence();
        this.predictionVersion = surplusPost.getExpiryPredictionVersion();
        this.expiryOverridden = surplusPost.getExpiryOverridden();
        this.impactCo2eKg = surplusPost.getImpactCo2eKg();
        this.impactWaterL = surplusPost.getImpactWaterL();
        this.impactFactorVersion = surplusPost.getImpactFactorVersion();
        this.impactComputedAt = surplusPost.getImpactComputedAt();
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
        this.foodType = surplusPost.getFoodType();
        if (surplusPost.getDietaryTags() != null) {
            this.dietaryTags = Arrays.stream(surplusPost.getDietaryTags())
                    .filter(tag -> tag != null && !tag.isBlank())
                    .map(tag -> {
                        try {
                            return DietaryTag.valueOf(tag);
                        } catch (IllegalArgumentException ex) {
                            return null;
                        }
                    })
                    .filter(tag -> tag != null)
                    .collect(Collectors.toList());
        }

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

    public LocalDateTime getExpiryDateActual() {
        return expiryDateActual;
    }

    public void setExpiryDateActual(LocalDateTime expiryDateActual) {
        this.expiryDateActual = expiryDateActual;
    }

    public LocalDate getUserProvidedExpiryDate() {
        return userProvidedExpiryDate;
    }

    public void setUserProvidedExpiryDate(LocalDate userProvidedExpiryDate) {
        this.userProvidedExpiryDate = userProvidedExpiryDate;
    }

    public LocalDate getSuggestedExpiryDate() {
        return suggestedExpiryDate;
    }

    public void setSuggestedExpiryDate(LocalDate suggestedExpiryDate) {
        this.suggestedExpiryDate = suggestedExpiryDate;
    }

    public Boolean getEligibleAtSubmission() {
        return eligibleAtSubmission;
    }

    public void setEligibleAtSubmission(Boolean eligibleAtSubmission) {
        this.eligibleAtSubmission = eligibleAtSubmission;
    }

    public List<String> getWarningsAtSubmission() {
        return warningsAtSubmission;
    }

    public void setWarningsAtSubmission(List<String> warningsAtSubmission) {
        this.warningsAtSubmission = warningsAtSubmission != null ? warningsAtSubmission : new ArrayList<>();
    }

    public LocalDateTime getExpiryDatePredicted() {
        return expiryDatePredicted;
    }

    public void setExpiryDatePredicted(LocalDateTime expiryDatePredicted) {
        this.expiryDatePredicted = expiryDatePredicted;
    }

    public LocalDateTime getExpiryDateEffective() {
        return expiryDateEffective;
    }

    public void setExpiryDateEffective(LocalDateTime expiryDateEffective) {
        this.expiryDateEffective = expiryDateEffective;
    }

    public Double getPredictionConfidence() {
        return predictionConfidence;
    }

    public void setPredictionConfidence(Double predictionConfidence) {
        this.predictionConfidence = predictionConfidence;
    }

    public String getPredictionVersion() {
        return predictionVersion;
    }

    public void setPredictionVersion(String predictionVersion) {
        this.predictionVersion = predictionVersion;
    }

    public Boolean getExpiryOverridden() {
        return expiryOverridden;
    }

    public void setExpiryOverridden(Boolean expiryOverridden) {
        this.expiryOverridden = expiryOverridden;
    }

    public Boolean getExpiringSoon() {
        return expiringSoon;
    }

    public void setExpiringSoon(Boolean expiringSoon) {
        this.expiringSoon = expiringSoon;
    }

    public Boolean getExpired() {
        return expired;
    }

    public void setExpired(Boolean expired) {
        this.expired = expired;
    }

    public Double getImpactCo2eKg() {
        return impactCo2eKg;
    }

    public void setImpactCo2eKg(Double impactCo2eKg) {
        this.impactCo2eKg = impactCo2eKg;
    }

    public Double getImpactWaterL() {
        return impactWaterL;
    }

    public void setImpactWaterL(Double impactWaterL) {
        this.impactWaterL = impactWaterL;
    }

    public String getImpactFactorVersion() {
        return impactFactorVersion;
    }

    public void setImpactFactorVersion(String impactFactorVersion) {
        this.impactFactorVersion = impactFactorVersion;
    }

    public LocalDateTime getImpactComputedAt() {
        return impactComputedAt;
    }

    public void setImpactComputedAt(LocalDateTime impactComputedAt) {
        this.impactComputedAt = impactComputedAt;
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

    public FoodType getFoodType() {
        return foodType;
    }

    public void setFoodType(FoodType foodType) {
        this.foodType = foodType;
    }

    public List<DietaryTag> getDietaryTags() {
        return dietaryTags;
    }

    public void setDietaryTags(List<DietaryTag> dietaryTags) {
        this.dietaryTags = dietaryTags;
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
}
