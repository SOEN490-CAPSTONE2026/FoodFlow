package com.example.foodflow.model.dto;

import java.time.LocalDateTime;

/**
 * DTO for impact metrics dashboard
 */
public class ImpactMetricsDTO {

    // Basic metrics
    private Double totalFoodWeightKg;
    private Integer estimatedMealsProvided;
    private Double co2EmissionsAvoidedKg;
    private Double waterSavedLiters;
    private Integer peopleFedEstimate;

    // Activity metrics
    private Integer totalDonationsCompleted;
    private Integer totalClaimsMade;
    private Integer totalPostsCreated;
    private Double donationCompletionRate;

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
}
