package com.example.foodflow.service;
import com.example.foodflow.model.dto.DonorPrivacySettingsDTO;
import com.example.foodflow.model.entity.MonetaryDonation;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserDonationStats;
import com.example.foodflow.model.types.DonorBadge;
import com.example.foodflow.repository.MonetaryDonationRepository;
import com.example.foodflow.repository.UserDonationStatsRepository;
import com.example.foodflow.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
@Service
public class DonationStatsService {
    private static final Logger logger = LoggerFactory.getLogger(DonationStatsService.class);
    private static final String STATUS_COMPLETED = "COMPLETED";
    @PersistenceContext
    private EntityManager entityManager;
    private final UserDonationStatsRepository userDonationStatsRepository;
    private final MonetaryDonationRepository monetaryDonationRepository;
    private final UserRepository userRepository;
    private final DonationNotificationService donationNotificationService;
    public DonationStatsService(UserDonationStatsRepository userDonationStatsRepository,
                                MonetaryDonationRepository monetaryDonationRepository,
                                UserRepository userRepository,
                                DonationNotificationService donationNotificationService) {
        this.userDonationStatsRepository = userDonationStatsRepository;
        this.monetaryDonationRepository = monetaryDonationRepository;
        this.userRepository = userRepository;
        this.donationNotificationService = donationNotificationService;
    }
    /**
     * Updates the user's donation stats after a completed monetary donation.
     * Increments donation count, adds to total donated amount, and updates last donation date.
     * Also updates the denormalized donationCount on the User entity.
     *
     * @param userId The ID of the user who made the donation
     * @param amount The donation amount
     */
    @Transactional
    public UserDonationStats updateUserStats(Long userId, BigDecimal amount) {
        logger.info("Updating donation stats for userId={}, amount={}", userId, amount);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        // Find or create the stats record
        UserDonationStats stats = userDonationStatsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    logger.info("Creating new donation stats record for userId={}", userId);
                    UserDonationStats newStats = new UserDonationStats(user);
                    return newStats;
                });
        // Update the stats
        DonorBadge previousBadge = stats.getDonorBadge();
        stats.setTotalDonated(stats.getTotalDonated().add(amount));
        stats.setDonationCount(stats.getDonationCount() + 1);
        stats.setLastDonationDate(LocalDateTime.now());
        // Recalculate badge based on new total
        DonorBadge newBadge = DonorBadge.fromTotalDonated(stats.getTotalDonated());
        stats.setDonorBadge(newBadge);
        UserDonationStats savedStats = userDonationStatsRepository.save(stats);
        // Also update the denormalized donation count on the User entity
        user.setDonationCount(savedStats.getDonationCount());
        userRepository.save(user);
        // Log badge upgrade if it changed
        boolean badgeUpgraded = previousBadge != newBadge;
        if (badgeUpgraded) {
            logger.info("Badge upgraded for userId={}: {} -> {} (totalDonated={})",
                    userId, previousBadge, newBadge, savedStats.getTotalDonated());
        }
        logger.info("Updated donation stats for userId={}: totalDonated={}, donationCount={}, badge={}, lastDonationDate={}",
                userId, savedStats.getTotalDonated(), savedStats.getDonationCount(), savedStats.getDonorBadge(), savedStats.getLastDonationDate());
        // Send real-time WebSocket notifications
        donationNotificationService.notifyDonationReceived(user, amount, savedStats);
        if (badgeUpgraded) {
            donationNotificationService.notifyBadgeUpgraded(user, amount, savedStats, previousBadge);
        }
        // Respect user's anonymousByDefault privacy setting for the platform broadcast
        boolean anonymous = Boolean.TRUE.equals(savedStats.getAnonymousByDefault());
        donationNotificationService.broadcastPlatformDonation(user, amount, anonymous);
        return savedStats;
    }
    /**
     * Retrieves the monetary donation history for a specific user.
     * Returns all completed donations sorted by most recent first.
     *
     * @param userId The ID of the user
     * @return List of MonetaryDonation records ordered by creation date descending
     */
    @Transactional(readOnly = true)
    public List<MonetaryDonation> getUserDonationHistory(Long userId) {
        logger.info("Fetching donation history for userId={}", userId);
        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        return monetaryDonationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    /**
     * Retrieves platform-wide donation totals and impact metrics.
     * Returns aggregate statistics across all users and donations.
     *
     * @return Map containing platform totals:
     *   - totalAmountDonated: cumulative amount donated across the platform
     *   - totalDonationCount: total number of completed donations
     *   - totalDonorCount: number of unique users who have donated
     *   - currency: the default currency (CAD)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getPlatformTotals() {
        logger.info("Fetching platform donation totals");
        BigDecimal totalAmountDonated = userDonationStatsRepository.sumAllTotalDonated();
        Long totalDonationCount = userDonationStatsRepository.sumAllDonationCounts();
        Long totalDonorCount = userDonationStatsRepository.countUsersWhoDonated();
        Map<String, Object> totals = new HashMap<>();
        totals.put("totalAmountDonated", totalAmountDonated != null ? totalAmountDonated : BigDecimal.ZERO);
        totals.put("totalDonationCount", totalDonationCount != null ? totalDonationCount : 0L);
        totals.put("totalDonorCount", totalDonorCount != null ? totalDonorCount : 0L);
        totals.put("currency", "CAD");
        logger.info("Platform totals: amount={}, count={}, donors={}",
                totals.get("totalAmountDonated"), totals.get("totalDonationCount"), totals.get("totalDonorCount"));
        return totals;
    }
    /**
     * Gets the donation summary/stats for a specific user.
     * Useful for determining badge display and animation state.
     *
     * @param userId The ID of the user
     * @return UserDonationStats or a default empty stats object if user has never donated
     */
    @Transactional(readOnly = true)
    public UserDonationStats getUserStats(Long userId) {
        return userDonationStatsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
                    // Return a transient (unsaved) default stats object
                    return new UserDonationStats(user);
                });
    }
    /**
     * Returns badge information for a specific user, including current badge,
     * next tier, amount remaining to reach next tier, and progress percentage.
     *
     * @param userId The ID of the user
     * @return Map with badge details
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserBadgeInfo(Long userId) {
        UserDonationStats stats = getUserStats(userId);
        DonorBadge currentBadge = stats.getDonorBadge() != null ? stats.getDonorBadge() : DonorBadge.NONE;
        DonorBadge nextBadge = currentBadge.nextTier();
        BigDecimal totalDonated = stats.getTotalDonated();
        BigDecimal amountToNext = currentBadge.amountToNextTier(totalDonated);
        Map<String, Object> badgeInfo = new HashMap<>();
        badgeInfo.put("currentBadge", currentBadge.name());
        badgeInfo.put("badgeDescription", currentBadge.getDescription());
        badgeInfo.put("totalDonated", totalDonated);
        badgeInfo.put("donationCount", stats.getDonationCount());
        if (nextBadge != null) {
            badgeInfo.put("nextBadge", nextBadge.name());
            badgeInfo.put("nextBadgeThreshold", nextBadge.getThreshold());
            badgeInfo.put("amountToNextBadge", amountToNext);
            // Calculate progress percentage toward next badge
            BigDecimal currentThreshold = currentBadge.getThreshold();
            BigDecimal nextThreshold = nextBadge.getThreshold();
            BigDecimal range = nextThreshold.subtract(currentThreshold);
            BigDecimal progress = totalDonated.subtract(currentThreshold);
            double progressPercent = range.compareTo(BigDecimal.ZERO) > 0
                    ? progress.doubleValue() / range.doubleValue() * 100.0
                    : 100.0;
            badgeInfo.put("progressPercent", Math.min(Math.max(progressPercent, 0.0), 100.0));
        } else {
            badgeInfo.put("nextBadge", null);
            badgeInfo.put("nextBadgeThreshold", null);
            badgeInfo.put("amountToNextBadge", BigDecimal.ZERO);
            badgeInfo.put("progressPercent", 100.0);
        }
        badgeInfo.put("badgeUpgraded", false); // Used for animation triggers on the frontend
        badgeInfo.put("currency", "CAD");
        return badgeInfo;
    }
    /**
     * Quick check whether a user has ever made a monetary donation.
     *
     * @param userId The ID of the user
     * @return true if the user has at least one completed donation
     */
    @Transactional(readOnly = true)
    public boolean hasDonated(Long userId) {
        return userDonationStatsRepository.findByUserId(userId)
                .map(stats -> stats.getDonationCount() > 0)
                .orElse(false);
    }
    /**
     * Retrieves detailed platform donation metrics from the database view.
     * The view pre-aggregates all completed monetary donations and includes
     * time-windowed metrics (last 7 days, last 30 days).
     *
     * @return Map containing detailed platform metrics:
     *   - totalAmountDonated, totalDonationCount, totalUniqueDonors
     *   - averageDonationAmount, largestDonation, smallestDonation
     *   - anonymousDonationCount
     *   - donationsLast30Days, amountLast30Days
     *   - donationsLast7Days, amountLast7Days
     *   - currency
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public Map<String, Object> getPlatformMetricsFromView() {
        logger.info("Fetching platform donation metrics from database view");
        List<Object[]> results = entityManager
                .createNativeQuery("SELECT * FROM platform_donation_metrics")
                .getResultList();
        Map<String, Object> metrics = new HashMap<>();
        if (results != null && !results.isEmpty()) {
            Object[] row = results.get(0);
            metrics.put("totalAmountDonated", toBigDecimal(row[0]));
            metrics.put("totalDonationCount", toLong(row[1]));
            metrics.put("totalUniqueDonors", toLong(row[2]));
            metrics.put("averageDonationAmount", toBigDecimal(row[3]));
            metrics.put("largestDonation", toBigDecimal(row[4]));
            metrics.put("smallestDonation", toBigDecimal(row[5]));
            metrics.put("anonymousDonationCount", toLong(row[6]));
            metrics.put("donationsLast30Days", toLong(row[7]));
            metrics.put("amountLast30Days", toBigDecimal(row[8]));
            metrics.put("donationsLast7Days", toLong(row[9]));
            metrics.put("amountLast7Days", toBigDecimal(row[10]));
        } else {
            metrics.put("totalAmountDonated", BigDecimal.ZERO);
            metrics.put("totalDonationCount", 0L);
            metrics.put("totalUniqueDonors", 0L);
            metrics.put("averageDonationAmount", BigDecimal.ZERO);
            metrics.put("largestDonation", BigDecimal.ZERO);
            metrics.put("smallestDonation", BigDecimal.ZERO);
            metrics.put("anonymousDonationCount", 0L);
            metrics.put("donationsLast30Days", 0L);
            metrics.put("amountLast30Days", BigDecimal.ZERO);
            metrics.put("donationsLast7Days", 0L);
            metrics.put("amountLast7Days", BigDecimal.ZERO);
        }
        metrics.put("currency", "CAD");
        logger.info("Platform metrics from view: totalAmount={}, totalCount={}, uniqueDonors={}",
                metrics.get("totalAmountDonated"), metrics.get("totalDonationCount"), metrics.get("totalUniqueDonors"));
        return metrics;
    }
    /**
     * Gets the current privacy settings for a user's donor profile.
     *
     * @param userId The ID of the user
     * @return DTO containing all privacy settings
     */
    @Transactional(readOnly = true)
    public DonorPrivacySettingsDTO getPrivacySettings(Long userId) {
        UserDonationStats stats = getUserStats(userId);
        return new DonorPrivacySettingsDTO(
                stats.getShowBadgePublicly(),
                stats.getShowDonationHistory(),
                stats.getShowOnLeaderboard(),
                stats.getAnonymousByDefault()
        );
    }
    /**
     * Updates privacy settings for a user's donor profile.
     * Only non-null fields in the DTO are applied (partial update).
     *
     * @param userId   The ID of the user
     * @param settings The privacy settings to update
     * @return Updated privacy settings
     */
    @Transactional
    public DonorPrivacySettingsDTO updatePrivacySettings(Long userId, DonorPrivacySettingsDTO settings) {
        logger.info("Updating privacy settings for userId={}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        UserDonationStats stats = userDonationStatsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserDonationStats newStats = new UserDonationStats(user);
                    return newStats;
                });
        // Apply only non-null fields (partial update)
        if (settings.getShowBadgePublicly() != null) {
            stats.setShowBadgePublicly(settings.getShowBadgePublicly());
        }
        if (settings.getShowDonationHistory() != null) {
            stats.setShowDonationHistory(settings.getShowDonationHistory());
        }
        if (settings.getShowOnLeaderboard() != null) {
            stats.setShowOnLeaderboard(settings.getShowOnLeaderboard());
        }
        if (settings.getAnonymousByDefault() != null) {
            stats.setAnonymousByDefault(settings.getAnonymousByDefault());
        }
        UserDonationStats saved = userDonationStatsRepository.save(stats);
        logger.info("Updated privacy settings for userId={}: badge={}, history={}, leaderboard={}, anonymous={}",
                userId, saved.getShowBadgePublicly(), saved.getShowDonationHistory(),
                saved.getShowOnLeaderboard(), saved.getAnonymousByDefault());
        return new DonorPrivacySettingsDTO(
                saved.getShowBadgePublicly(),
                saved.getShowDonationHistory(),
                saved.getShowOnLeaderboard(),
                saved.getAnonymousByDefault()
        );
    }
    /**
     * Gets a user's public donor profile, respecting their privacy settings.
     * Only returns information the user has opted to show publicly.
     *
     * @param userId The ID of the user whose public profile is requested
     * @return Map with only the public-facing donor information
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getPublicDonorProfile(Long userId) {
        UserDonationStats stats = getUserStats(userId);
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", userId);
        // Badge is only shown if user opted in
        if (Boolean.TRUE.equals(stats.getShowBadgePublicly())) {
            DonorBadge badge = stats.getDonorBadge() != null ? stats.getDonorBadge() : DonorBadge.NONE;
            profile.put("badge", badge.name());
            profile.put("badgeDescription", badge.getDescription());
        } else {
            profile.put("badge", null);
            profile.put("badgeDescription", null);
        }
        // Donation count/total only shown if history is public
        if (Boolean.TRUE.equals(stats.getShowDonationHistory())) {
            profile.put("totalDonated", stats.getTotalDonated());
            profile.put("donationCount", stats.getDonationCount());
            profile.put("lastDonationDate", stats.getLastDonationDate());
        } else {
            profile.put("totalDonated", null);
            profile.put("donationCount", null);
            profile.put("lastDonationDate", null);
        }
        profile.put("showOnLeaderboard", stats.getShowOnLeaderboard());
        return profile;
    }
    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        return new BigDecimal(value.toString());
    }
    private Long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Long) return (Long) value;
        return Long.valueOf(value.toString());
    }
}
