package com.example.foodflow.model.types;

public enum CriteriaType {
    // Count-based criteria
    DONATION_COUNT("Number of donations created"),
    CLAIM_COUNT("Number of claims made"),
    PICKUP_COUNT("Number of pickups completed"),
    MESSAGE_COUNT("Number of messages sent"),
    UNIQUE_PARTNER_COUNT("Number of unique organizations interacted with"),
    
    // Time-based criteria
    WEEKLY_STREAK("Consecutive weeks with activity"),
    DAILY_STREAK("Consecutive days with activity"),
    
    // Speed-based criteria
    QUICK_CLAIM_COUNT("Number of claims made within time threshold"),
    
    // Weight-based criteria
    TOTAL_WEIGHT_DONATED("Total weight of food donated in kg");

    private final String description;

    CriteriaType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
