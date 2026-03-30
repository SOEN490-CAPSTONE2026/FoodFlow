package com.example.foodflow.service;

import com.example.foodflow.model.dto.DonationNotificationDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserDonationStats;
import com.example.foodflow.model.types.DonorBadge;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Service responsible for sending real-time donation notifications via WebSocket.
 * Sends three types of notifications:
 *   1. DONATION_RECEIVED  — private to the donor after a successful donation
 *   2. BADGE_UPGRADED     — private to the donor when their badge tier changes
 *   3. PLATFORM_DONATION  — broadcast to all connected users (live feed)
 */
@Service
public class DonationNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(DonationNotificationService.class);

    private static final String USER_DONATION_DESTINATION = "/queue/donations";
    private static final String PLATFORM_DONATION_TOPIC = "/topic/donations";

    private final SimpMessagingTemplate messagingTemplate;

    public DonationNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Sends a donation confirmation notification to the donor via their private WebSocket queue.
     *
     * @param user        The user who made the donation
     * @param amount      The donation amount
     * @param stats       The updated donation stats
     */
    public void notifyDonationReceived(User user, BigDecimal amount, UserDonationStats stats) {
        try {
            DonationNotificationDTO notification = buildBaseNotification(user, amount, stats);
            notification.setType("DONATION_RECEIVED");

            messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    USER_DONATION_DESTINATION,
                    notification
            );

            logger.info("Sent DONATION_RECEIVED WebSocket notification to userId={}", user.getId());
        } catch (Exception e) {
            logger.error("Failed to send DONATION_RECEIVED notification to userId={}: {}",
                    user.getId(), e.getMessage(), e);
        }
    }

    /**
     * Sends a badge upgrade notification to the donor via their private WebSocket queue.
     *
     * @param user          The user whose badge was upgraded
     * @param amount        The donation amount that triggered the upgrade
     * @param stats         The updated donation stats
     * @param previousBadge The badge tier before the upgrade
     */
    public void notifyBadgeUpgraded(User user, BigDecimal amount, UserDonationStats stats, DonorBadge previousBadge) {
        try {
            DonationNotificationDTO notification = buildBaseNotification(user, amount, stats);
            notification.setType("BADGE_UPGRADED");
            notification.setPreviousBadge(previousBadge.name());

            messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    USER_DONATION_DESTINATION,
                    notification
            );

            logger.info("Sent BADGE_UPGRADED WebSocket notification to userId={}: {} -> {}",
                    user.getId(), previousBadge, stats.getDonorBadge());
        } catch (Exception e) {
            logger.error("Failed to send BADGE_UPGRADED notification to userId={}: {}",
                    user.getId(), e.getMessage(), e);
        }
    }

    /**
     * Broadcasts a new donation event to all connected users on the platform topic.
     * Respects anonymity — if the donation is anonymous, the display name is hidden.
     *
     * @param user      The user who made the donation
     * @param amount    The donation amount
     * @param anonymous Whether the donation should be shown anonymously
     */
    public void broadcastPlatformDonation(User user, BigDecimal amount, boolean anonymous) {
        try {
            DonationNotificationDTO notification = new DonationNotificationDTO();
            notification.setType("PLATFORM_DONATION");
            notification.setAmount(amount);
            notification.setCurrency("CAD");

            if (anonymous) {
                notification.setDisplayName("Anonymous");
                notification.setUserId(null);
            } else {
                notification.setDisplayName(getDisplayName(user));
                notification.setUserId(user.getId());
            }

            messagingTemplate.convertAndSend(PLATFORM_DONATION_TOPIC, notification);

            logger.info("Broadcast PLATFORM_DONATION WebSocket notification: amount={}, anonymous={}",
                    amount, anonymous);
        } catch (Exception e) {
            logger.error("Failed to broadcast PLATFORM_DONATION notification: {}", e.getMessage(), e);
        }
    }

    private DonationNotificationDTO buildBaseNotification(User user, BigDecimal amount, UserDonationStats stats) {
        DonorBadge currentBadge = stats.getDonorBadge() != null ? stats.getDonorBadge() : DonorBadge.NONE;
        DonorBadge nextBadge = currentBadge.nextTier();

        DonationNotificationDTO dto = new DonationNotificationDTO();
        dto.setUserId(user.getId());
        dto.setDisplayName(getDisplayName(user));
        dto.setAmount(amount);
        dto.setCurrency("CAD");
        dto.setCurrentBadge(currentBadge.name());
        dto.setBadgeDescription(currentBadge.getDescription());
        dto.setTotalDonated(stats.getTotalDonated());
        dto.setDonationCount(stats.getDonationCount());

        if (nextBadge != null) {
            dto.setNextBadge(nextBadge.name());
            dto.setAmountToNextBadge(currentBadge.amountToNextTier(stats.getTotalDonated()));

            BigDecimal currentThreshold = currentBadge.getThreshold();
            BigDecimal nextThreshold = nextBadge.getThreshold();
            BigDecimal range = nextThreshold.subtract(currentThreshold);
            BigDecimal progress = stats.getTotalDonated().subtract(currentThreshold);
            double progressPercent = range.compareTo(BigDecimal.ZERO) > 0
                    ? progress.doubleValue() / range.doubleValue() * 100.0
                    : 100.0;
            dto.setProgressPercent(Math.min(Math.max(progressPercent, 0.0), 100.0));
        } else {
            dto.setNextBadge(null);
            dto.setAmountToNextBadge(BigDecimal.ZERO);
            dto.setProgressPercent(100.0);
        }

        return dto;
    }

    private String getDisplayName(User user) {
        String fullName = user.getFullName();
        if (fullName != null && !fullName.isBlank()) {
            // Show first name + last initial for privacy (e.g. "John D.")
            String[] parts = fullName.trim().split("\\s+");
            if (parts.length >= 2) {
                return parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
            }
            return parts[0];
        }
        return "A Supporter";
    }
}
