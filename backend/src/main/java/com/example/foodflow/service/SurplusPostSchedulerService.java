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

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final TimelineService timelineService;

    @Value("${foodflow.expiry.enable-auto-flagging:true}")
    private boolean enableAutoFlagging;

    @Value("${pickup.tolerance.early-minutes:15}")
    private int earlyToleranceMinutes;

    @Value("${pickup.tolerance.late-minutes:15}")
    private int lateToleranceMinutes;

    public SurplusPostSchedulerService(SurplusPostRepository surplusPostRepository,
            ClaimRepository claimRepository,
            TimelineService timelineService) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.timelineService = timelineService;
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

                    // Skip if confirmed pickup date is in the future
                    if (confirmedPickupDate.isAfter(today)) {
                        return false;
                    }

                    // If confirmed pickup date is today, check if start time has arrived
                    // Apply early tolerance - allow READY_FOR_PICKUP status before window starts
                    if (confirmedPickupDate.isEqual(today)) {
                        LocalTime adjustedStartTime = confirmedPickupStartTime.minusMinutes(earlyToleranceMinutes);
                        boolean started = !currentTime.isBefore(adjustedStartTime);
                        logger.debug("Post ID {} - confirmedStart={}, adjustedStart={}, currentTime={}, started={}",
                                post.getId(), confirmedPickupStartTime, adjustedStartTime, currentTime, started);
                        return started;
                    }

                    // Confirmed pickup date in the past → should be ready
                    return true;
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

                    // Confirmed pickup date before today → definitely missed
                    if (confirmedPickupDate.isBefore(today)) {
                        return true;
                    }

                    // Confirmed pickup date is today and window ended
                    // Apply late tolerance - only mark as NOT_COMPLETED after tolerance period
                    if (confirmedPickupDate.isEqual(today)) {
                        LocalTime adjustedEndTime = confirmedPickupEndTime.plusMinutes(lateToleranceMinutes);
                        boolean ended = currentTime.isAfter(adjustedEndTime);
                        logger.debug("Post ID {} - confirmedEnd={}, adjustedEnd={}, currentTime={}, ended={}",
                                post.getId(), confirmedPickupEndTime, adjustedEndTime, currentTime, ended);
                        return ended;
                    }

                    return false;
                })
                .toList();

        if (postsToUpdate.isEmpty()) {
            logger.info("No posts eligible for NOT_COMPLETED update.");
            return;
        }

        for (SurplusPost post : postsToUpdate) {
            post.setStatus(PostStatus.NOT_COMPLETED);
            surplusPostRepository.save(post);

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
}
