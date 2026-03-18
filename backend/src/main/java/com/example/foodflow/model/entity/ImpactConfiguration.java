package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for storing platform-defined environmental impact conversion factors.
 * Supports versioning and audit trails for transparency in impact calculations.
 */
@Entity
@Table(name = "impact_configuration")
public class ImpactConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String version;

    @Column(name = "emission_factors_json", nullable = false, columnDefinition = "TEXT")
    private String emissionFactorsJson; // JSON map of FoodCategory -> CO2 kg per kg

    @Column(name = "water_factors_json", nullable = false, columnDefinition = "TEXT")
    private String waterFactorsJson; // JSON map of FoodCategory -> liters per kg

    @Column(name = "min_meal_weight_kg", nullable = false)
    private Double minMealWeightKg = 0.4;

    @Column(name = "max_meal_weight_kg", nullable = false)
    private Double maxMealWeightKg = 0.6;

    @Column(name = "default_emission_factor", nullable = false)
    private Double defaultEmissionFactor = 1.9;

    @Column(name = "default_water_factor", nullable = false)
    private Double defaultWaterFactor = 500.0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @Column(name = "disclosure_text", columnDefinition = "TEXT")
    private String disclosureText;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public ImpactConfiguration() {}

    public ImpactConfiguration(String version) {
        this.version = version;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getEmissionFactorsJson() {
        return emissionFactorsJson;
    }

    public void setEmissionFactorsJson(String emissionFactorsJson) {
        this.emissionFactorsJson = emissionFactorsJson;
    }

    public String getWaterFactorsJson() {
        return waterFactorsJson;
    }

    public void setWaterFactorsJson(String waterFactorsJson) {
        this.waterFactorsJson = waterFactorsJson;
    }

    public Double getMinMealWeightKg() {
        return minMealWeightKg;
    }

    public void setMinMealWeightKg(Double minMealWeightKg) {
        this.minMealWeightKg = minMealWeightKg;
    }

    public Double getMaxMealWeightKg() {
        return maxMealWeightKg;
    }

    public void setMaxMealWeightKg(Double maxMealWeightKg) {
        this.maxMealWeightKg = maxMealWeightKg;
    }

    public Double getDefaultEmissionFactor() {
        return defaultEmissionFactor;
    }

    public void setDefaultEmissionFactor(Double defaultEmissionFactor) {
        this.defaultEmissionFactor = defaultEmissionFactor;
    }

    public Double getDefaultWaterFactor() {
        return defaultWaterFactor;
    }

    public void setDefaultWaterFactor(Double defaultWaterFactor) {
        this.defaultWaterFactor = defaultWaterFactor;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getDisclosureText() {
        return disclosureText;
    }

    public void setDisclosureText(String disclosureText) {
        this.disclosureText = disclosureText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

