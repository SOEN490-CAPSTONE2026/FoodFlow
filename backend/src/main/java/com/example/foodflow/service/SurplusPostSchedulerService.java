package com.example.foodflow.service;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class SurplusPostSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(SurplusPostSchedulerService.class);
    private static final SecureRandom random = new SecureRandom();
    private static final int GRACE_PERIOD_MINUTES = 2;

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;

    public SurplusPostSchedulerService(SurplusPostRepository surplusPostRepository, ClaimRepository claimRepository) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
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
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        logger.info("===== updatePostsToReadyForPickup running at {} =====", now);

        // Only CLAIMED posts can become READY_FOR_PICKUP
        List<SurplusPost> claimedPosts = surplusPostRepository.findByStatus(PostStatus.CLAIMED);
        logger.info("Found {} CLAIMED posts to evaluate", claimedPosts.size());

        List<SurplusPost> postsToUpdate = claimedPosts.stream()
            .filter(post -> {
                // Grace period: skip brand-new posts
                if (post.getCreatedAt() != null &&
                    post.getCreatedAt().isAfter(now.minusMinutes(GRACE_PERIOD_MINUTES))) {
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
                if (confirmedPickupDate.isEqual(today)) {
                    boolean started = !currentTime.isBefore(confirmedPickupStartTime);
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
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        logger.info("===== updatePostsToNotCompleted running at {} =====", now);

        List<SurplusPost> readyPosts = surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP);
        logger.info("Found {} READY_FOR_PICKUP posts to evaluate", readyPosts.size());

        List<SurplusPost> postsToUpdate = readyPosts.stream()
            .filter(post -> {
                // Grace period: skip brand-new posts
                if (post.getCreatedAt() != null &&
                    post.getCreatedAt().isAfter(now.minusMinutes(GRACE_PERIOD_MINUTES))) {
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
                if (confirmedPickupDate.isEqual(today)) {
                    return currentTime.isAfter(confirmedPickupEndTime);
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
            logger.info("Post ID {} marked as NOT_COMPLETED", post.getId());
        }
    }
}
