package com.example.foodflow.service;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SurplusPostSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(SurplusPostSchedulerService.class);
    private static final SecureRandom random = new SecureRandom();
    private static final int GRACE_PERIOD_MINUTES = 2;

    // Track which posts have already received pickup reminders to prevent duplicates
    private final java.util.Set<Long> remindersSentForPosts = java.util.concurrent.ConcurrentHashMap.newKeySet();

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final TimelineService timelineService;
    private final NotificationPreferenceService notificationPreferenceService;
    private final EmailService emailService;
    private final SmsService smsService;

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
            SmsService smsService) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.timelineService = timelineService;
        this.notificationPreferenceService = notificationPreferenceService;
        this.emailService = emailService;
        this.smsService = smsService;
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
        }

        logger.info("Marked {} posts as EXPIRED", expiredPosts.size());
    }
    
    /**
     * Every 5 minutes: send ONE pickup reminder notification to donor and receiver
     * exactly 1 hour before pickup time starts (only sent once per post)
     */
    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    @Transactional
    public void sendPickupReminders() {
        // Use UTC for all time comparisons
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));
        LocalDateTime nowDateTime = nowUtc.toLocalDateTime();
        
        logger.info("===== sendPickupReminders running at {} UTC =====", nowUtc);
        
        // Find CLAIMED posts (pickup hasn't started yet)
        List<SurplusPost> claimedPosts = surplusPostRepository.findByStatus(PostStatus.CLAIMED);
        logger.info("Found {} CLAIMED posts to check for pickup reminders", claimedPosts.size());
        
        for (SurplusPost post : claimedPosts) {
            try {
                // Skip if reminder already sent for this post
                if (remindersSentForPosts.contains(post.getId())) {
                    logger.debug("Post ID {} - Reminder already sent, skipping", post.getId());
                    continue;
                }
                
                // Find the claim to get confirmed pickup time
                Optional<Claim> claimOpt = claimRepository.findBySurplusPost(post);
                if (claimOpt.isEmpty()) {
                    continue;
                }
                
                Claim claim = claimOpt.get();
                LocalDate confirmedPickupDate = claim.getConfirmedPickupDate();
                LocalTime confirmedPickupStartTime = claim.getConfirmedPickupStartTime();
                
                if (confirmedPickupDate == null || confirmedPickupStartTime == null) {
                    continue;
                }
                
                // Calculate pickup start time
                LocalDateTime pickupStartTime = LocalDateTime.of(confirmedPickupDate, confirmedPickupStartTime);
                
                // Calculate time until pickup (in minutes)
                long minutesUntilPickup = java.time.Duration.between(nowDateTime, pickupStartTime).toMinutes();
                
                // Send reminder if pickup is between 55-65 minutes away
                // This 10-minute window accounts for the 5-minute scheduler interval
                // But we only send ONCE per post thanks to the tracking set
                if (minutesUntilPickup >= 55 && minutesUntilPickup <= 65) {
                    logger.info("Post ID {} - Pickup in {} minutes, sending ONE-TIME reminder", post.getId(), minutesUntilPickup);
                    
                    // Mark as sent BEFORE sending to prevent race conditions
                    remindersSentForPosts.add(post.getId());
                    
                    // Get donor and receiver
                    com.example.foodflow.model.entity.User donor = post.getDonor();
                    com.example.foodflow.model.entity.User receiver = claim.getReceiver();
                    
                    // Format pickup time for messages
                    String pickupTimeFormatted = confirmedPickupStartTime.toString();
                    
                    // Prepare notification data
                    java.util.Map<String, Object> reminderData = new java.util.HashMap<>();
                    reminderData.put("donationTitle", post.getTitle());
                    reminderData.put("pickupTime", pickupTimeFormatted);
                    reminderData.put("pickupDate", confirmedPickupDate.toString());
                    
                    // Send to DONOR
                    sendPickupReminderToUser(donor, "pickupReminder", reminderData, "donor", post.getId());
                    
                    // Send to RECEIVER
                    sendPickupReminderToUser(receiver, "pickupReminder", reminderData, "receiver", post.getId());
                    
                    logger.info("Post ID {} - Pickup reminder sent successfully (will not send again)", post.getId());
                }
                
            } catch (Exception e) {
                logger.error("Error processing pickup reminder for post ID {}: {}", post.getId(), e.getMessage());
            }
        }
        
        // Clean up tracking set: remove posts that are no longer CLAIMED
        // This allows reminders to be sent again if a post is reclaimed later
        List<Long> claimedPostIds = claimedPosts.stream().map(SurplusPost::getId).toList();
        remindersSentForPosts.retainAll(claimedPostIds);
    }
    
    /**
     * Helper method to send pickup reminder to a user via SMS
     */
    private void sendPickupReminderToUser(com.example.foodflow.model.entity.User user, String notificationType, 
            java.util.Map<String, Object> reminderData, String userType, Long postId) {
        
        String userName = getUserName(user);
        
        // Send SMS if enabled
        if (notificationPreferenceService.shouldSendNotification(user, notificationType, "sms")) {
            if (hasValidPhoneNumber(user)) {
                try {
                    boolean smsSent = smsService.sendPickupReminderNotification(user.getPhone(), userName, reminderData);
                    if (smsSent) {
                        logger.info("Sent pickup reminder SMS to {} userId={} for postId={}", userType, user.getId(), postId);
                    } else {
                        logger.warn("SMS pickup reminder failed for {} userId={}", userType, user.getId());
                    }
                } catch (Exception e) {
                    logger.error("Failed to send pickup reminder SMS to {} userId={}: {}", userType, user.getId(), e.getMessage());
                }
            } else {
                logger.debug("Cannot send SMS to {} userId={} - no valid phone number", userType, user.getId());
            }
        } else {
            logger.debug("{} userId={} has pickup reminder SMS disabled", userType, user.getId());
        }
    }
    
    /**
     * Get user name (from organization or default)
     */
    private String getUserName(com.example.foodflow.model.entity.User user) {
        if (user.getOrganization() != null && user.getOrganization().getName() != null) {
            return user.getOrganization().getName();
        }
        return "User";
    }
    
    /**
     * Check if user has a valid phone number for SMS notifications
     */
    private boolean hasValidPhoneNumber(com.example.foodflow.model.entity.User user) {
        if (user == null || user.getPhone() == null || user.getPhone().trim().isEmpty()) {
            return false;
        }
        
        String phone = user.getPhone().trim();
        
        // E.164 format validation: +[country code][number] (e.g., +12345678901)
        // Must start with +, followed by 1-15 digits
        return phone.matches("^\\+[1-9]\\d{1,14}$");
    }
}
