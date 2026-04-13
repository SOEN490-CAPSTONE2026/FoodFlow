package com.example.foodflow.model.dto;
/**
 * DTO for updating donor privacy settings.
 * Controls what donation information is visible to other users.
 */
public class DonorPrivacySettingsDTO {
    /** Whether the donor badge is visible on the user's public profile */
    private Boolean showBadgePublicly;
    /** Whether the user's donation history is visible to others */
    private Boolean showDonationHistory;
    /** Whether the user appears on the donation leaderboard */
    private Boolean showOnLeaderboard;
    /** Whether new donations default to anonymous (hiding name in platform feed) */
    private Boolean anonymousByDefault;
    public DonorPrivacySettingsDTO() {}
    public DonorPrivacySettingsDTO(Boolean showBadgePublicly, Boolean showDonationHistory,
                                    Boolean showOnLeaderboard, Boolean anonymousByDefault) {
        this.showBadgePublicly = showBadgePublicly;
        this.showDonationHistory = showDonationHistory;
        this.showOnLeaderboard = showOnLeaderboard;
        this.anonymousByDefault = anonymousByDefault;
    }
    public Boolean getShowBadgePublicly() { return showBadgePublicly; }
    public void setShowBadgePublicly(Boolean showBadgePublicly) { this.showBadgePublicly = showBadgePublicly; }
    public Boolean getShowDonationHistory() { return showDonationHistory; }
    public void setShowDonationHistory(Boolean showDonationHistory) { this.showDonationHistory = showDonationHistory; }
    public Boolean getShowOnLeaderboard() { return showOnLeaderboard; }
    public void setShowOnLeaderboard(Boolean showOnLeaderboard) { this.showOnLeaderboard = showOnLeaderboard; }
    public Boolean getAnonymousByDefault() { return anonymousByDefault; }
    public void setAnonymousByDefault(Boolean anonymousByDefault) { this.anonymousByDefault = anonymousByDefault; }
}
