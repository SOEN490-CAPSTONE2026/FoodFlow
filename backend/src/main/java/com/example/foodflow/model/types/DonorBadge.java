package com.example.foodflow.model.types;

import java.math.BigDecimal;

/**
 * Badge tiers awarded to users based on their cumulative monetary donations.
 * Each tier has a minimum threshold amount (in CAD) that must be reached.
 */
public enum DonorBadge {

    NONE(BigDecimal.ZERO, "No badge yet"),
    BRONZE(new BigDecimal("10"), "Bronze Supporter — $10+ donated"),
    SILVER(new BigDecimal("50"), "Silver Supporter — $50+ donated"),
    GOLD(new BigDecimal("100"), "Gold Supporter — $100+ donated"),
    PLATINUM(new BigDecimal("500"), "Platinum Supporter — $500+ donated");

    private final BigDecimal threshold;
    private final String description;

    DonorBadge(BigDecimal threshold, String description) {
        this.threshold = threshold;
        this.description = description;
    }

    public BigDecimal getThreshold() {
        return threshold;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Determines the highest badge tier a user qualifies for based on their total donated amount.
     * Checks from highest tier (PLATINUM) down to lowest (BRONZE).
     *
     * @param totalDonated The cumulative amount the user has donated
     * @return The highest badge tier the user qualifies for, or NONE if below all thresholds
     */
    public static DonorBadge fromTotalDonated(BigDecimal totalDonated) {
        if (totalDonated == null) {
            return NONE;
        }
        // Check from highest to lowest
        if (totalDonated.compareTo(PLATINUM.threshold) >= 0) {
            return PLATINUM;
        }
        if (totalDonated.compareTo(GOLD.threshold) >= 0) {
            return GOLD;
        }
        if (totalDonated.compareTo(SILVER.threshold) >= 0) {
            return SILVER;
        }
        if (totalDonated.compareTo(BRONZE.threshold) >= 0) {
            return BRONZE;
        }
        return NONE;
    }

    /**
     * Returns the next badge tier after the current one, or null if already at PLATINUM.
     */
    public DonorBadge nextTier() {
        return switch (this) {
            case NONE -> BRONZE;
            case BRONZE -> SILVER;
            case SILVER -> GOLD;
            case GOLD -> PLATINUM;
            case PLATINUM -> null;
        };
    }

    /**
     * Returns the amount still needed to reach the next badge tier.
     *
     * @param totalDonated Current total donated amount
     * @return Amount remaining to next tier, or BigDecimal.ZERO if already at PLATINUM
     */
    public BigDecimal amountToNextTier(BigDecimal totalDonated) {
        DonorBadge next = nextTier();
        if (next == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal remaining = next.threshold.subtract(totalDonated);
        return remaining.compareTo(BigDecimal.ZERO) > 0 ? remaining : BigDecimal.ZERO;
    }
}
