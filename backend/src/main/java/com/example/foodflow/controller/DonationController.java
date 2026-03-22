package com.example.foodflow.controller;

import com.example.foodflow.model.dto.DonorPrivacySettingsDTO;
import com.example.foodflow.service.DonationStatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/donations")
public class DonationController {

    private final DonationStatsService donationStatsService;

    public DonationController(DonationStatsService donationStatsService) {
        this.donationStatsService = donationStatsService;
    }

    /**
     * Get platform-wide monetary donation totals and impact metrics.
     * Returns aggregate statistics: total amount donated, total donation count,
     * total unique donors, and currency.
     *
     * @return Platform donation totals
     */
    @GetMapping("/stats/platform")
    public ResponseEntity<Map<String, Object>> getPlatformDonationStats() {
        Map<String, Object> totals = donationStatsService.getPlatformTotals();
        return ResponseEntity.ok(totals);
    }

    /**
     * Get detailed platform donation metrics from the database view.
     * Includes time-windowed stats (last 7 days, last 30 days), averages,
     * largest/smallest donations, and anonymous donation counts.
     *
     * @return Detailed platform donation metrics
     */
    @GetMapping("/stats/platform/detailed")
    public ResponseEntity<Map<String, Object>> getDetailedPlatformMetrics() {
        Map<String, Object> metrics = donationStatsService.getPlatformMetricsFromView();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get badge information for a specific user.
     * Returns the current badge tier, progress toward next tier,
     * and all relevant badge metadata for frontend display/animation.
     *
     * @param userId The ID of the user
     * @return Badge information including current badge, next badge, progress percentage
     */
    @GetMapping("/badge/{userId}")
    public ResponseEntity<Map<String, Object>> getUserBadge(@PathVariable Long userId) {
        Map<String, Object> badgeInfo = donationStatsService.getUserBadgeInfo(userId);
        return ResponseEntity.ok(badgeInfo);
    }

    /**
     * Get the current privacy settings for a user's donor profile.
     *
     * @param userId The ID of the user
     * @return Current privacy settings
     */
    @GetMapping("/privacy/{userId}")
    public ResponseEntity<DonorPrivacySettingsDTO> getPrivacySettings(@PathVariable Long userId) {
        DonorPrivacySettingsDTO settings = donationStatsService.getPrivacySettings(userId);
        return ResponseEntity.ok(settings);
    }

    /**
     * Update privacy settings for a user's donor profile.
     * Supports partial updates — only non-null fields are applied.
     *
     * @param userId   The ID of the user
     * @param settings The privacy settings to update
     * @return Updated privacy settings
     */
    @PutMapping("/privacy/{userId}")
    public ResponseEntity<DonorPrivacySettingsDTO> updatePrivacySettings(
            @PathVariable Long userId,
            @RequestBody DonorPrivacySettingsDTO settings) {
        DonorPrivacySettingsDTO updated = donationStatsService.updatePrivacySettings(userId, settings);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get a user's public donor profile, respecting their privacy settings.
     * Only returns information the user has opted to show publicly.
     *
     * @param userId The ID of the user
     * @return Public-facing donor profile information
     */
    @GetMapping("/profile/{userId}/public")
    public ResponseEntity<Map<String, Object>> getPublicDonorProfile(@PathVariable Long userId) {
        Map<String, Object> profile = donationStatsService.getPublicDonorProfile(userId);
        return ResponseEntity.ok(profile);
    }
}
