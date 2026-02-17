package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.TemperatureCategory;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.FoodType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "surplus_posts")
public class SurplusPost {
    
@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @ElementCollection(targetClass = FoodCategory.class)
    @Enumerated(EnumType.STRING)
    @CollectionTable(
        name = "surplus_post_food_types",
        joinColumns = @JoinColumn(name = "surplus_post_id")
    )
    @Column(name = "food_category")
    private Set<FoodCategory> foodCategories = new HashSet<>();

    @Embedded
    private Quantity quantity;

    @Embedded
    private Location pickupLocation;

    @Column(name = "fabrication_date")
    private LocalDate fabricationDate;

    @Column
    private LocalDate expiryDate;

    @Column(name = "expiry_date_predicted")
    private LocalDateTime expiryDatePredicted;

    @Column(name = "expiry_date_effective")
    private LocalDateTime expiryDateEffective;

    @Column(name = "expiry_prediction_confidence")
    private Double expiryPredictionConfidence;

    @Column(name = "expiry_prediction_version", length = 64)
    private String expiryPredictionVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "expiry_prediction_inputs")
    private String expiryPredictionInputs;

    @Column(name = "expiry_overridden", nullable = false)
    private Boolean expiryOverridden = false;

    @Column(name = "expiry_override_reason", length = 255)
    private String expiryOverrideReason;

    @Column(name = "expiry_overridden_at")
    private LocalDateTime expiryOverriddenAt;

    @Column(name = "expiry_overridden_by")
    private Long expiryOverriddenBy;

    @Column(name = "user_provided_expiry_date")
    private LocalDate userProvidedExpiryDate;

    @Column(name = "suggested_expiry_date")
    private LocalDate suggestedExpiryDate;

    @Column(name = "eligible_at_submission")
    private Boolean eligibleAtSubmission;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "warnings_at_submission")
    private String warningsAtSubmission;

    @Column(name = "impact_co2e_kg")
    private Double impactCo2eKg;

    @Column(name = "impact_water_l")
    private Double impactWaterL;

    @Column(name = "impact_factor_version", length = 64)
    private String impactFactorVersion;

    @Column(name = "impact_computed_at")
    private LocalDateTime impactComputedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "impact_inputs")
    private String impactInputs;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate pickupDate;

    @Column(nullable = false)
    private LocalTime pickupFrom;

    @Column(nullable = false)
    private LocalTime pickupTo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.AVAILABLE;

    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "temperature_category")
    private TemperatureCategory temperatureCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "packaging_type")
    private PackagingType packagingType;

    @Enumerated(EnumType.STRING)
    @Column(name = "food_type")
    private FoodType foodType;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "dietary_tags", nullable = false, columnDefinition = "text[]")
    private String[] dietaryTags = new String[0];

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @OneToMany(mappedBy = "surplusPost", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("slotOrder ASC")
    private List<PickupSlot> pickupSlots = new ArrayList<>();

    @OneToMany(mappedBy = "surplusPost", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("timestamp DESC")
    private List<DonationTimeline> timeline = new ArrayList<>();

    @Column(name = "flagged")
    private Boolean flagged = false;
    
    @Column(name = "flag_reason", columnDefinition = "TEXT")
    private String flagReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (foodType == null) {
            foodType = FoodType.PANTRY;
        }
        if (dietaryTags == null) {
            dietaryTags = new String[0];
        }
        if (expiryOverridden == null) {
            expiryOverridden = false;
        }
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }
    
    @PreUpdate
    protected void onUpdate() {
        if (foodType == null) {
            foodType = FoodType.PANTRY;
        }
        if (dietaryTags == null) {
            dietaryTags = new String[0];
        }
        if (expiryOverridden == null) {
            expiryOverridden = false;
        }
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public SurplusPost() {}
    
    // --- Getters and Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Set<FoodCategory> getFoodCategories() { return foodCategories; }
    public void setFoodCategories(Set<FoodCategory> foodCategories) { this.foodCategories = foodCategories; }

    public Quantity getQuantity() { return quantity; }
    public void setQuantity(Quantity quantity) { this.quantity = quantity; }

    public Location getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(Location pickupLocation) { this.pickupLocation = pickupLocation; }

    public LocalDate getFabricationDate() { return fabricationDate; }
    public void setFabricationDate(LocalDate fabricationDate) { this.fabricationDate = fabricationDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public LocalDateTime getExpiryDatePredicted() { return expiryDatePredicted; }
    public void setExpiryDatePredicted(LocalDateTime expiryDatePredicted) { this.expiryDatePredicted = expiryDatePredicted; }

    public LocalDateTime getExpiryDateEffective() { return expiryDateEffective; }
    public void setExpiryDateEffective(LocalDateTime expiryDateEffective) { this.expiryDateEffective = expiryDateEffective; }

    public Double getExpiryPredictionConfidence() { return expiryPredictionConfidence; }
    public void setExpiryPredictionConfidence(Double expiryPredictionConfidence) { this.expiryPredictionConfidence = expiryPredictionConfidence; }

    public String getExpiryPredictionVersion() { return expiryPredictionVersion; }
    public void setExpiryPredictionVersion(String expiryPredictionVersion) { this.expiryPredictionVersion = expiryPredictionVersion; }

    public String getExpiryPredictionInputs() { return expiryPredictionInputs; }
    public void setExpiryPredictionInputs(String expiryPredictionInputs) { this.expiryPredictionInputs = expiryPredictionInputs; }

    public Boolean getExpiryOverridden() { return expiryOverridden; }
    public void setExpiryOverridden(Boolean expiryOverridden) { this.expiryOverridden = expiryOverridden; }

    public String getExpiryOverrideReason() { return expiryOverrideReason; }
    public void setExpiryOverrideReason(String expiryOverrideReason) { this.expiryOverrideReason = expiryOverrideReason; }

    public LocalDateTime getExpiryOverriddenAt() { return expiryOverriddenAt; }
    public void setExpiryOverriddenAt(LocalDateTime expiryOverriddenAt) { this.expiryOverriddenAt = expiryOverriddenAt; }

    public Long getExpiryOverriddenBy() { return expiryOverriddenBy; }
    public void setExpiryOverriddenBy(Long expiryOverriddenBy) { this.expiryOverriddenBy = expiryOverriddenBy; }

    public LocalDate getUserProvidedExpiryDate() { return userProvidedExpiryDate; }
    public void setUserProvidedExpiryDate(LocalDate userProvidedExpiryDate) { this.userProvidedExpiryDate = userProvidedExpiryDate; }

    public LocalDate getSuggestedExpiryDate() { return suggestedExpiryDate; }
    public void setSuggestedExpiryDate(LocalDate suggestedExpiryDate) { this.suggestedExpiryDate = suggestedExpiryDate; }

    public Boolean getEligibleAtSubmission() { return eligibleAtSubmission; }
    public void setEligibleAtSubmission(Boolean eligibleAtSubmission) { this.eligibleAtSubmission = eligibleAtSubmission; }

    public String getWarningsAtSubmission() { return warningsAtSubmission; }
    public void setWarningsAtSubmission(String warningsAtSubmission) { this.warningsAtSubmission = warningsAtSubmission; }

    public Double getImpactCo2eKg() { return impactCo2eKg; }
    public void setImpactCo2eKg(Double impactCo2eKg) { this.impactCo2eKg = impactCo2eKg; }

    public Double getImpactWaterL() { return impactWaterL; }
    public void setImpactWaterL(Double impactWaterL) { this.impactWaterL = impactWaterL; }

    public String getImpactFactorVersion() { return impactFactorVersion; }
    public void setImpactFactorVersion(String impactFactorVersion) { this.impactFactorVersion = impactFactorVersion; }

    public LocalDateTime getImpactComputedAt() { return impactComputedAt; }
    public void setImpactComputedAt(LocalDateTime impactComputedAt) { this.impactComputedAt = impactComputedAt; }

    public String getImpactInputs() { return impactInputs; }
    public void setImpactInputs(String impactInputs) { this.impactInputs = impactInputs; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDate pickupDate) { this.pickupDate = pickupDate; }

    public LocalTime getPickupFrom() { return pickupFrom; }
    public void setPickupFrom(LocalTime pickupFrom) { this.pickupFrom = pickupFrom; }

    public LocalTime getPickupTo() { return pickupTo; }
    public void setPickupTo(LocalTime pickupTo) { this.pickupTo = pickupTo; }

    public PostStatus getStatus() { return status; }
    public void setStatus(PostStatus status) { this.status = status; }

    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }

    public User getDonor() { return donor; }
    public void setDonor(User donor) { this.donor = donor; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<PickupSlot> getPickupSlots() { return pickupSlots; }
    public void setPickupSlots(List<PickupSlot> pickupSlots) { this.pickupSlots = pickupSlots; }

    public List<DonationTimeline> getTimeline() { return timeline; }
    public void setTimeline(List<DonationTimeline> timeline) { this.timeline = timeline; }

    public Boolean getFlagged() { return flagged; }
    public void setFlagged(Boolean flagged) { this.flagged = flagged; }

    public String getFlagReason() { return flagReason; }
    public void setFlagReason(String flagReason) { this.flagReason = flagReason; }

    public TemperatureCategory getTemperatureCategory() { return temperatureCategory; }
    public void setTemperatureCategory(TemperatureCategory temperatureCategory) { this.temperatureCategory = temperatureCategory; }

    public PackagingType getPackagingType() { return packagingType; }
    public void setPackagingType(PackagingType packagingType) { this.packagingType = packagingType; }

    public FoodType getFoodType() { return foodType; }
    public void setFoodType(FoodType foodType) { this.foodType = foodType; }

    public String[] getDietaryTags() { return dietaryTags; }
    public void setDietaryTags(String[] dietaryTags) { this.dietaryTags = dietaryTags; }


    public boolean isClaimed() { return status==PostStatus.CLAIMED; }
}
