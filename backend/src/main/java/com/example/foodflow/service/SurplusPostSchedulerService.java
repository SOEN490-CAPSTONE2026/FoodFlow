package com.example.foodflow.service;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SurplusPostSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(SurplusPostSchedulerService.class);
    private static final SecureRandom random = new SecureRandom();
    private static final int GRACE_PERIOD_MINUTES = 2;

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final TimelineService timelineService;
    private final NotificationPreferenceService notificationPreferenceService;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${foodflow.expiry.enable-auto-flagging:true}")
    private boolean enableAutoFlagging;

    @Value("${pickup.tolerance.early-minutes:15}")
    private int earlyToleranceMinutes;

    @Value("${pickup.tolerance.late-minutes:15}")
    private int lateToleranceMinutes;

    public SurplusPostSchedulerService(SurplusPostRepository surplusPostRepository,
            ClaimRepository claimRepository,
            TimelineService timelineService,
            NotificationPreferenceService notificationPreferenceService,
            EmailService emailService,
            SimpMessagingTemplate messagingTemplate) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.timelineService = timelineService;
        this.notificationPreferenceService = notificationPreferenceService;
        this.emailService = emailService;
        this.messagingTemplate = messagingTemplate;
    }

    private String generateOtpCode() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Every 5 seconds: mark CLAIMED posts as READY_FOR_PICKUP
     * once the CONFIRMED pickup time has started, with a 2-minute grace period.
     */
    @Scheduled(fixedRate = 5000)
    @Transactional
    public void updatePostsToReadyForPickup() {
        // Use UTC for all time comparisons
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));
        LocalDate today = nowUtc.toLocalDate();
        LocalTime currentTime = nowUtc.toLocalTime();

        logger.info("===== updatePostsToReadyForPickup running at {} UTC =====", nowUtc);

        // Only CLAIMED posts can become READY_FOR_PICKUP
        List<SurplusPost> claimedPosts = surplusPostRepository.findByStatus(PostStatus.CLAIMED);
        logger.info("Found {} CLAIMED posts to evaluate", claimedPosts.size());

        List<SurplusPost> postsToUpdate = claimedPosts.stream()
                .filter(post -> {
                    // Grace period: skip brand-new posts
                    if (post.getCreatedAt() != null &&
                            post.getCreatedAt().isAfter(nowUtc.toLocalDateTime().minusMinutes(GRACE_PERIOD_MINUTES))) {
                        logger.debug("Skipping post ID {} — created recently (grace period active)", post.getId());
                        return false;
                    }

                    // Find the claim for this post to get the confirmed pickup slot
                    Optional<Claim> claimOpt = claimRepository.findBySurplusPost(post);
                    if (claimOpt.isEmpty()) {
                        logger.warn("No claim found for CLAIMED post ID {}", post.getId());
                        return false;
                    }

                    Claim claim = claimOpt.get();

                    // Use the CONFIRMED pickup slot from the claim, not the first slot
                    LocalDate confirmedPickupDate = claim.getConfirmedPickupDate();
                    LocalTime confirmedPickupStartTime = claim.getConfirmedPickupStartTime();

                    if (confirmedPickupDate == null || confirmedPickupStartTime == null) {
                        logger.warn("Post ID {} has no confirmed pickup slot", post.getId());
                        return false;
                    }

                    // Combine date and time for proper comparison (handles midnight crossing)
                    LocalDateTime confirmedStart = LocalDateTime.of(confirmedPickupDate, confirmedPickupStartTime);
                    LocalDateTime nowDateTime = nowUtc.toLocalDateTime();
                    
                    // Apply early tolerance
                    LocalDateTime adjustedStart = confirmedStart.minusMinutes(earlyToleranceMinutes);
                    
                    boolean started = !nowDateTime.isBefore(adjustedStart);
                    
                    logger.debug("Post ID {} - confirmedStart={}, adjustedStart={}, now={}, started={}",
                            post.getId(), confirmedStart, adjustedStart, nowDateTime, started);
                    
                    return started;
                })
                .toList();

        if (postsToUpdate.isEmpty()) {
            logger.info("No CLAIMED posts eligible for READY_FOR_PICKUP.");
            return;
        }

        for (SurplusPost post : postsToUpdate) {
            post.setStatus(PostStatus.READY_FOR_PICKUP);

            if (post.getOtpCode() == null || post.getOtpCode().isEmpty()) {
                String otp = generateOtpCode();
                post.setOtpCode(otp);
                logger.info("Generated OTP {} for post ID {}", otp, post.getId());
            }

            surplusPostRepository.save(post);

            // Create timeline event for automatic status transition
            timelineService.createTimelineEvent(
                    post,
                    "READY_FOR_PICKUP",
                    "system",
                    null,
                    PostStatus.CLAIMED,
                    PostStatus.READY_FOR_PICKUP,
                    "Pickup time arrived - OTP generated automatically",
                    true);

            // Send WebSocket and Email notifications to receiver
            try {
                Optional<Claim> claimOpt = claimRepository.findBySurplusPost(post);
                if (claimOpt.isPresent()) {
                    Claim claim = claimOpt.get();
                    com.example.foodflow.model.entity.User receiver = claim.getReceiver();
                    String receiverName = receiver.getOrganization() != null && receiver.getOrganization().getName() != null
                        ? receiver.getOrganization().getName()
                        : receiver.getFullName();
                    
                    // Send WebSocket notification if preference allows
                    try {
                        logger.info("Checking websocket preference for receiver userId={} for donationReadyForPickup notification", receiver.getId());
                        
                        if (notificationPreferenceService.shouldSendNotification(receiver, "donationReadyForPickup", "websocket")) {
                            logger.info("Receiver {} has websocket notifications enabled for donationReadyForPickup, sending notification", receiver.getId());
                            
                            Map<String, Object> receiverNotification = new HashMap<>();
                            receiverNotification.put("type", "DONATION_READY_FOR_PICKUP");
                            receiverNotification.put("donationId", post.getId());
                            receiverNotification.put("title", post.getTitle());
                            receiverNotification.put("message", "Your donation is ready for pickup!");
                            receiverNotification.put("pickupCode", post.getOtpCode());
                            receiverNotification.put("timestamp", System.currentTimeMillis());
                            
                            messagingTemplate.convertAndSendToUser(
                                receiver.getId().toString(),
                                "/queue/donations/ready-for-pickup",
                                receiverNotification
                            );
                            logger.info("Successfully sent ready for pickup websocket notification to receiver userId={} for postId={}", receiver.getId(), post.getId());
                        } else {
                            logger.info("Receiver {} has websocket notifications disabled for donationReadyForPickup", receiver.getId());
                        }
                    } catch (Exception e) {
                        logger.error("Failed to send ready for pickup websocket notification to receiver: {}", e.getMessage(), e);
                    }
                    
                    // Send Email notification if preference allows
                    try {
                        logger.info("Checking email preference for receiver userId={} for donationReadyForPickup notification", receiver.getId());
                        
                        if (notificationPreferenceService.shouldSendNotification(receiver, "donationReadyForPickup", "email")) {
                            logger.info("Receiver {} has email notifications enabled for donationReadyForPickup, sending email", receiver.getId());
                            
                            Map<String, Object> donationData = new HashMap<>();
                            donationData.put("donationTitle", post.getTitle());
                            donationData.put("quantity", post.getQuantity().getValue() + " " + post.getQuantity().getUnit().getLabel());
                            donationData.put("pickupDate", post.getPickupDate() != null ? post.getPickupDate().toString() : "Check your app");
                            donationData.put("pickupTime", post.getPickupFrom() != null ? post.getPickupFrom().toString() : "Check your app");
                            
                            emailService.sendReadyForPickupNotification(
                                receiver.getEmail(),
                                receiverName,
                                donationData
                            );
                            
                            logger.info("Successfully sent ready for pickup email to receiver userId={} email={}", receiver.getId(), receiver.getEmail());
                        } else {
                            logger.info("Receiver {} has email notifications disabled for donationReadyForPickup or email globally disabled", receiver.getId());
                        }
                    } catch (Exception e) {
                        logger.error("Failed to send ready for pickup email notification to receiver: {}", e.getMessage(), e);
                    }
                }
            } catch (Exception e) {
                logger.error("Error sending ready for pickup notifications for post ID {}: {}", post.getId(), e.getMessage(), e);
            }

            logger.info("Post ID {} updated to READY_FOR_PICKUP", post.getId());
        }
    }

    /**
     * Every minute: mark READY_FOR_PICKUP posts as NOT_COMPLETED
     * if CONFIRMED pickup window has ended, with a 2-minute grace period.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void updatePostsToNotCompleted() {
        // Use UTC for all time comparisons
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));
        LocalDate today = nowUtc.toLocalDate();
        LocalTime currentTime = nowUtc.toLocalTime();

        logger.info("===== updatePostsToNotCompleted running at {} UTC =====", nowUtc);

        List<SurplusPost> readyPosts = surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP);
        logger.info("Found {} READY_FOR_PICKUP posts to evaluate", readyPosts.size());

        List<SurplusPost> postsToUpdate = readyPosts.stream()
                .filter(post -> {
                    // Grace period: skip brand-new posts
                    if (post.getCreatedAt() != null &&
                            post.getCreatedAt().isAfter(nowUtc.toLocalDateTime().minusMinutes(GRACE_PERIOD_MINUTES))) {
                        logger.debug("Skipping post ID {} — created recently (grace period active)", post.getId());
                        return false;
                    }

                    // Find the claim for this post to get the confirmed pickup slot
                    Optional<Claim> claimOpt = claimRepository.findBySurplusPost(post);
                    if (claimOpt.isEmpty()) {
                        logger.warn("No claim found for READY_FOR_PICKUP post ID {}", post.getId());
                        return false;
                    }

                    Claim claim = claimOpt.get();

                    // Use the CONFIRMED pickup slot from the claim
                    LocalDate confirmedPickupDate = claim.getConfirmedPickupDate();
                    LocalTime confirmedPickupEndTime = claim.getConfirmedPickupEndTime();

                    if (confirmedPickupDate == null || confirmedPickupEndTime == null) {
                        logger.warn("Post ID {} has no confirmed pickup slot", post.getId());
                        return false;
                    }

                    // Combine date and time for proper comparison
                    // CRITICAL: This handles the case where pickup windows cross midnight in UTC
                    LocalTime confirmedPickupStartTime = claim.getConfirmedPickupStartTime();
                    LocalDateTime confirmedEnd = LocalDateTime.of(confirmedPickupDate, confirmedPickupEndTime);
                    LocalDateTime nowDateTime = nowUtc.toLocalDateTime();
                    
                    // Handle midnight crossing: if end time is before start time, it crosses to next day
                    if (confirmedPickupStartTime != null && confirmedPickupEndTime.isBefore(confirmedPickupStartTime)) {
                        confirmedEnd = confirmedEnd.plusDays(1);
                        logger.debug("Post ID {} - Detected midnight crossing, adjusted end to: {}", 
                                post.getId(), confirmedEnd);
                    }
                    
                    // Apply late tolerance
                    LocalDateTime adjustedEnd = confirmedEnd.plusMinutes(lateToleranceMinutes);
                    
                    boolean ended = nowDateTime.isAfter(adjustedEnd);
                    
                    logger.debug("Post ID {} - confirmedEnd={}, adjustedEnd={}, now={}, ended={}",
                            post.getId(), confirmedEnd, adjustedEnd, nowDateTime, ended);
                    
                    return ended;
                })
                .toList();

        if (postsToUpdate.isEmpty()) {
            logger.info("No posts eligible for NOT_COMPLETED update.");
            return;
        }

        for (SurplusPost post : postsToUpdate) {
            post.setStatus(PostStatus.NOT_COMPLETED);
            surplusPostRepository.save(post);

            // Also update the claim status to NOT_COMPLETED
            Optional<Claim> claimOpt = claimRepository.findBySurplusPost(post);
            if (claimOpt.isPresent()) {
                Claim claim = claimOpt.get();
                claim.setStatus(com.example.foodflow.model.types.ClaimStatus.NOT_COMPLETED);
                claimRepository.save(claim);
            }
            // Create timeline event for missed pickup
            timelineService.createTimelineEvent(
                    post,
                    "PICKUP_MISSED",
                    "system",
                    null,
                    PostStatus.READY_FOR_PICKUP,
                    PostStatus.NOT_COMPLETED,
                    "Pickup window expired - marked as not completed automatically",
                    true);

            logger.info("Post ID {} marked as NOT_COMPLETED", post.getId());
        }
    }

    /**
     * Every hour: mark AVAILABLE or CLAIMED posts as EXPIRED
     * if their expiry date has passed. Prevents expired food from being claimed.
     */
    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void markExpiredPosts() {
        if (!enableAutoFlagging) {
            logger.debug("Auto-flagging of expired posts is disabled");
            return;
        }

        LocalDate today = LocalDate.now();
        logger.info("===== markExpiredPosts running at {} =====", LocalDateTime.now());

        // Find posts that are AVAILABLE or CLAIMED but have expired
        List<PostStatus> activeStatuses = List.of(PostStatus.AVAILABLE, PostStatus.CLAIMED);
        List<SurplusPost> activePosts = surplusPostRepository.findByStatusIn(activeStatuses);
        logger.info("Found {} active posts to check for expiry", activePosts.size());

        List<SurplusPost> expiredPosts = activePosts.stream()
                .filter(post -> post.getExpiryDate() != null && post.getExpiryDate().isBefore(today))
                .toList();

        if (expiredPosts.isEmpty()) {
            logger.info("No expired posts found.");
            return;
        }

        for (SurplusPost post : expiredPosts) {
            PostStatus oldStatus = post.getStatus();
            post.setStatus(PostStatus.EXPIRED);
            surplusPostRepository.save(post);

            // Create timeline event for expiration
            timelineService.createTimelineEvent(
                    post,
                    "DONATION_EXPIRED",
                    "system",
                    null,
                    oldStatus,
                    PostStatus.EXPIRED,
                    "Expired automatically (expiry date: " + post.getExpiryDate() + ")",
                    true);

            logger.info("Post ID {} marked as EXPIRED (expiry date: {})", post.getId(), post.getExpiryDate());
            
            // Send notification to donor
            User donor = post.getDonor();
            sendExpiredNotificationToDonor(post, donor);
        }

        logger.info("Marked {} posts as EXPIRED", expiredPosts.size());
    }

    private void sendExpiredNotificationToDonor(SurplusPost post, User donor) {
        try {
            logger.info("Checking email preference for donor userId={} for donationExpired notification", donor.getId());
            
            if (notificationPreferenceService.shouldSendNotification(donor, "donationExpired", "email")) {
                logger.info("Donor {} has email notifications enabled for donationExpired, sending email", donor.getId());
                
                Map<String, Object> donationData = new HashMap<>();
                donationData.put("donationTitle", post.getTitle());
                donationData.put("quantity", post.getQuantity().getValue() + " " + post.getQuantity().getUnit().getLabel());
                donationData.put("expiryDate", post.getExpiryDate() != null ? post.getExpiryDate().toString() : "Unknown");
                
                String donorName = donor.getOrganization() != null ? 
                    donor.getOrganization().getName() : donor.getFullName();
                
                emailService.sendDonationExpiredNotification(donor.getEmail(), donorName, donationData);
                logger.info("Successfully sent donation expired email to donor userId={} for postId={}", donor.getId(), post.getId());
            } else {
                logger.info("Donor {} has email notifications disabled for donationExpired", donor.getId());
            }
        } catch (Exception e) {
            logger.error("Failed to send donation expired email to donor: {}", e.getMessage(), e);
        }
        
        // Send WebSocket notification
        try {
            logger.info("Checking websocket preference for donor userId={} for donationExpired notification", donor.getId());
            
            if (notificationPreferenceService.shouldSendNotification(donor, "donationExpired", "websocket")) {
                logger.info("Donor {} has websocket notifications enabled for donationExpired, sending notification", donor.getId());
                
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "DONATION_EXPIRED");
                notification.put("donationId", post.getId());
                notification.put("title", post.getTitle());
                notification.put("message", "Your donation '" + post.getTitle() + "' has expired and been removed from listings.");
                notification.put("expiryDate", post.getExpiryDate().toString());
                notification.put("timestamp", ZonedDateTime.now(ZoneId.of("UTC")).toString());
                
                messagingTemplate.convertAndSendToUser(
                    donor.getId().toString(),
                    "/queue/donations/expired",
                    notification
                );
                logger.info("Successfully sent donation expired websocket notification to donor userId={} for postId={}", donor.getId(), post.getId());
            } else {
                logger.info("Donor {} has websocket notifications disabled for donationExpired", donor.getId());
            }
        } catch (Exception e) {
            logger.error("Failed to send donation expired websocket notification to donor: {}", e.getMessage(), e);
        }
    }
}