package com.example.foodflow.model.dto;

import java.time.LocalDateTime;

/**
 * DTO for impact metrics dashboard
 */
public class ImpactMetricsDTO {

    // Basic metrics
    private Double totalFoodWeightKg;
    private Integer estimatedMealsProvided;
    private Integer minMealsProvided; // Bounded estimate
    private Integer maxMealsProvided; // Bounded estimate
    private Double co2EmissionsAvoidedKg;
    private Double waterSavedLiters;
    private Integer peopleFedEstimate;

    // Activity metrics
    private Integer totalDonationsCompleted;
    private Integer totalClaimsMade;
    private Integer totalPostsCreated;
    private Double donationCompletionRate;

    // Waste efficiency metrics
    private Double wasteDiversionEfficiencyPercent;

    // Time & logistics metrics
    private Double medianClaimTimeHours;
    private Double p75ClaimTimeHours;
    private Double pickupTimelinessRate;

    // Engagement metrics
    private Integer activeDonationDays; // Days with donation activity

    // Factor metadata for transparency
    private String factorVersion;
    private String factorDisclosure;
    private Double weightVsPreviousPct;
    private Double co2VsPreviousPct;
    private Double mealsVsPreviousPct;
    private Double waterVsPreviousPct;
    private Double weightVsPreviousAbs;
    private Double co2VsPreviousAbs;
    private Integer mealsVsPreviousAbs;
    private Double waterVsPreviousAbs;
    private String impactAuditJson;

    // User engagement metrics
    private Integer activeDonors;
    private Integer activeReceivers;
    private Integer repeatDonors;
    private Integer repeatReceivers;

    // Time range
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String dateRange; // "WEEKLY", "MONTHLY", "ALL_TIME", "CUSTOM"

    // Role context
    private String role; // "DONOR", "RECEIVER", "ADMIN"
    private Long userId; // null for admin viewing all

    public ImpactMetricsDTO() {}

    // Getters and Setters
    public Double getTotalFoodWeightKg() { return totalFoodWeightKg; }
    public void setTotalFoodWeightKg(Double totalFoodWeightKg) { this.totalFoodWeightKg = totalFoodWeightKg; }

    public Integer getEstimatedMealsProvided() { return estimatedMealsProvided; }
    public void setEstimatedMealsProvided(Integer estimatedMealsProvided) { this.estimatedMealsProvided = estimatedMealsProvided; }

    public Double getCo2EmissionsAvoidedKg() { return co2EmissionsAvoidedKg; }
    public void setCo2EmissionsAvoidedKg(Double co2EmissionsAvoidedKg) { this.co2EmissionsAvoidedKg = co2EmissionsAvoidedKg; }

    public Double getWaterSavedLiters() { return waterSavedLiters; }
    public void setWaterSavedLiters(Double waterSavedLiters) { this.waterSavedLiters = waterSavedLiters; }

    public Integer getPeopleFedEstimate() { return peopleFedEstimate; }
    public void setPeopleFedEstimate(Integer peopleFedEstimate) { this.peopleFedEstimate = peopleFedEstimate; }

    public Integer getTotalDonationsCompleted() { return totalDonationsCompleted; }
    public void setTotalDonationsCompleted(Integer totalDonationsCompleted) { this.totalDonationsCompleted = totalDonationsCompleted; }

    public Integer getTotalClaimsMade() { return totalClaimsMade; }
    public void setTotalClaimsMade(Integer totalClaimsMade) { this.totalClaimsMade = totalClaimsMade; }

    public Integer getTotalPostsCreated() { return totalPostsCreated; }
    public void setTotalPostsCreated(Integer totalPostsCreated) { this.totalPostsCreated = totalPostsCreated; }

    public Double getDonationCompletionRate() { return donationCompletionRate; }
    public void setDonationCompletionRate(Double donationCompletionRate) { this.donationCompletionRate = donationCompletionRate; }

    public Integer getActiveDonors() { return activeDonors; }
    public void setActiveDonors(Integer activeDonors) { this.activeDonors = activeDonors; }

    public Integer getActiveReceivers() { return activeReceivers; }
    public void setActiveReceivers(Integer activeReceivers) { this.activeReceivers = activeReceivers; }

    public Integer getRepeatDonors() { return repeatDonors; }
    public void setRepeatDonors(Integer repeatDonors) { this.repeatDonors = repeatDonors; }

    public Integer getRepeatReceivers() { return repeatReceivers; }
    public void setRepeatReceivers(Integer repeatReceivers) { this.repeatReceivers = repeatReceivers; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public String getDateRange() { return dateRange; }
    public void setDateRange(String dateRange) { this.dateRange = dateRange; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Integer getMinMealsProvided() { return minMealsProvided; }
    public void setMinMealsProvided(Integer minMealsProvided) { this.minMealsProvided = minMealsProvided; }

    public Integer getMaxMealsProvided() { return maxMealsProvided; }
    public void setMaxMealsProvided(Integer maxMealsProvided) { this.maxMealsProvided = maxMealsProvided; }

    public Double getWasteDiversionEfficiencyPercent() { return wasteDiversionEfficiencyPercent; }
    public void setWasteDiversionEfficiencyPercent(Double wasteDiversionEfficiencyPercent) { this.wasteDiversionEfficiencyPercent = wasteDiversionEfficiencyPercent; }

    public Double getMedianClaimTimeHours() { return medianClaimTimeHours; }
    public void setMedianClaimTimeHours(Double medianClaimTimeHours) { this.medianClaimTimeHours = medianClaimTimeHours; }

    public Double getP75ClaimTimeHours() { return p75ClaimTimeHours; }
    public void setP75ClaimTimeHours(Double p75ClaimTimeHours) { this.p75ClaimTimeHours = p75ClaimTimeHours; }

    public Double getPickupTimelinessRate() { return pickupTimelinessRate; }
    public void setPickupTimelinessRate(Double pickupTimelinessRate) { this.pickupTimelinessRate = pickupTimelinessRate; }

    public Integer getActiveDonationDays() { return activeDonationDays; }
    public void setActiveDonationDays(Integer activeDonationDays) { this.activeDonationDays = activeDonationDays; }

    public String getFactorVersion() { return factorVersion; }
    public void setFactorVersion(String factorVersion) { this.factorVersion = factorVersion; }

    public String getFactorDisclosure() { return factorDisclosure; }
    public void setFactorDisclosure(String factorDisclosure) { this.factorDisclosure = factorDisclosure; }

    public Double getWeightVsPreviousPct() { return weightVsPreviousPct; }
    public void setWeightVsPreviousPct(Double weightVsPreviousPct) { this.weightVsPreviousPct = weightVsPreviousPct; }

    public Double getCo2VsPreviousPct() { return co2VsPreviousPct; }
    public void setCo2VsPreviousPct(Double co2VsPreviousPct) { this.co2VsPreviousPct = co2VsPreviousPct; }

    public Double getMealsVsPreviousPct() { return mealsVsPreviousPct; }
    public void setMealsVsPreviousPct(Double mealsVsPreviousPct) { this.mealsVsPreviousPct = mealsVsPreviousPct; }

    public Double getWaterVsPreviousPct() { return waterVsPreviousPct; }
    public void setWaterVsPreviousPct(Double waterVsPreviousPct) { this.waterVsPreviousPct = waterVsPreviousPct; }

    public Double getWeightVsPreviousAbs() { return weightVsPreviousAbs; }
    public void setWeightVsPreviousAbs(Double weightVsPreviousAbs) { this.weightVsPreviousAbs = weightVsPreviousAbs; }

    public Double getCo2VsPreviousAbs() { return co2VsPreviousAbs; }
    public void setCo2VsPreviousAbs(Double co2VsPreviousAbs) { this.co2VsPreviousAbs = co2VsPreviousAbs; }

    public Integer getMealsVsPreviousAbs() { return mealsVsPreviousAbs; }
    public void setMealsVsPreviousAbs(Integer mealsVsPreviousAbs) { this.mealsVsPreviousAbs = mealsVsPreviousAbs; }

    public Double getWaterVsPreviousAbs() { return waterVsPreviousAbs; }
    public void setWaterVsPreviousAbs(Double waterVsPreviousAbs) { this.waterVsPreviousAbs = waterVsPreviousAbs; }

    public String getImpactAuditJson() { return impactAuditJson; }
    public void setImpactAuditJson(String impactAuditJson) { this.impactAuditJson = impactAuditJson; }
}
