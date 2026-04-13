package com.example.foodflow.model.dto;
import java.math.BigDecimal;
import java.time.LocalDateTime;
/**
 * DTO for donation notifications sent via WebSocket.
 * Supports both user-specific (badge upgrade, donation confirmation)
 * and platform-wide (new donation broadcast) notifications.
 */
public class DonationNotificationDTO {
    private String type;              // "DONATION_RECEIVED", "BADGE_UPGRADED", "PLATFORM_DONATION"
    private Long userId;
    private String displayName;       // Donor display name (or "Anonymous")
    private BigDecimal amount;
    private String currency;
    private String currentBadge;
    private String previousBadge;     // Only set on BADGE_UPGRADED
    private String badgeDescription;
    private BigDecimal totalDonated;
    private Integer donationCount;
    private String nextBadge;
    private BigDecimal amountToNextBadge;
    private Double progressPercent;
    private LocalDateTime timestamp;
    public DonationNotificationDTO() {
        this.timestamp = LocalDateTime.now();
        this.currency = "CAD";
    }
    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getCurrentBadge() { return currentBadge; }
    public void setCurrentBadge(String currentBadge) { this.currentBadge = currentBadge; }
    public String getPreviousBadge() { return previousBadge; }
    public void setPreviousBadge(String previousBadge) { this.previousBadge = previousBadge; }
    public String getBadgeDescription() { return badgeDescription; }
    public void setBadgeDescription(String badgeDescription) { this.badgeDescription = badgeDescription; }
    public BigDecimal getTotalDonated() { return totalDonated; }
    public void setTotalDonated(BigDecimal totalDonated) { this.totalDonated = totalDonated; }
    public Integer getDonationCount() { return donationCount; }
    public void setDonationCount(Integer donationCount) { this.donationCount = donationCount; }
    public String getNextBadge() { return nextBadge; }
    public void setNextBadge(String nextBadge) { this.nextBadge = nextBadge; }
    public BigDecimal getAmountToNextBadge() { return amountToNextBadge; }
    public void setAmountToNextBadge(BigDecimal amountToNextBadge) { this.amountToNextBadge = amountToNextBadge; }
    public Double getProgressPercent() { return progressPercent; }
    public void setProgressPercent(Double progressPercent) { this.progressPercent = progressPercent; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
