package com.example.foodflow.service;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.ClaimStatus;
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

@Service
public class SurplusPostSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(SurplusPostSchedulerService.class);
    private static final SecureRandom random = new SecureRandom();
    private static final int GRACE_PERIOD_MINUTES = 2;

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;

    public SurplusPostSchedulerService(SurplusPostRepository surplusPostRepository, 
                                     ClaimRepository claimRepository) {
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

        // Get claims with confirmed pickup times for CLAIMED posts
        List<Claim> activeClaimsWithPickupTimes = claimRepository.findActiveClaimsWithConfirmedPickupTimes(ClaimStatus.ACTIVE);
        logger.info("Found {} active claims with confirmed pickup times to evaluate", activeClaimsWithPickupTimes.size());

        List<SurplusPost> postsToUpdate = activeClaimsWithPickupTimes.stream()
            .filter(claim -> {
                SurplusPost post = claim.getSurplusPost();
                
                // Grace period: skip brand-new posts
                if (post.getCreatedAt() != null &&
                    post.getCreatedAt().isAfter(now.minusMinutes(GRACE_PERIOD_MINUTES))) {
                    logger.debug("Skipping post ID {} — created recently (grace period active)", post.getId());
                    return false;
                }

                // Skip claims whose confirmed pickup date is still in the future
                if (claim.getConfirmedPickupDate().isAfter(today)) {
                    logger.debug("Skipping post ID {} — confirmed pickup date {} is in the future", 
                               post.getId(), claim.getConfirmedPickupDate());
                    return false;
                }

                // If confirmed pickup date is today, check if confirmed start time has arrived
                if (claim.getConfirmedPickupDate().isEqual(today)) {
                    boolean started = !currentTime.isBefore(claim.getConfirmedPickupStartTime());
                    logger.debug("Post ID {} — confirmed pickup starts at {}, current time {}, started: {}", 
                               post.getId(), claim.getConfirmedPickupStartTime(), currentTime, started);
                    return started;
                }

                // Confirmed pickup date in the past → should be ready
                logger.debug("Post ID {} — confirmed pickup date {} is in the past", 
                           post.getId(), claim.getConfirmedPickupDate());
                return true;
            })
            .map(Claim::getSurplusPost)
            .toList();

        if (postsToUpdate.isEmpty()) {
            logger.info("No CLAIMED posts eligible for READY_FOR_PICKUP based on confirmed pickup times.");
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
            logger.info("Post ID {} updated to READY_FOR_PICKUP based on confirmed pickup time", post.getId());
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

        // Get READY_FOR_PICKUP posts and their associated claims
        List<SurplusPost> readyPosts = surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP);
        logger.info("Found {} READY_FOR_PICKUP posts to evaluate", readyPosts.size());

        List<SurplusPost> postsToUpdate = readyPosts.stream()
            .filter(post -> {
                // Get the active claim for this post to check confirmed pickup times
                var claimOpt = claimRepository.findBySurplusPostIdAndStatus(post.getId(), ClaimStatus.ACTIVE);
                
                if (claimOpt.isEmpty()) {
                    logger.warn("No active claim found for READY_FOR_PICKUP post ID {}, marking as NOT_COMPLETED", post.getId());
                    return true; // No claim means something went wrong, mark as not completed
                }
                
                Claim claim = claimOpt.get();
                
                // If no confirmed pickup times, fall back to original post times (shouldn't happen but safety check)
                if (claim.getConfirmedPickupDate() == null || claim.getConfirmedPickupEndTime() == null) {
                    logger.warn("Post ID {} has no confirmed pickup times, falling back to post pickup window", post.getId());
                    
                    // Grace period: skip brand-new posts
                    if (post.getCreatedAt() != null &&
                        post.getCreatedAt().isAfter(now.minusMinutes(GRACE_PERIOD_MINUTES))) {
                        return false;
                    }
                    
                    // Pickup date before today → definitely missed
                    if (post.getPickupDate().isBefore(today)) {
                        return true;
                    }
                    
                    // Pickup date today and window ended
                    if (post.getPickupDate().isEqual(today)) {
                        return currentTime.isAfter(post.getPickupTo());
                    }
                    
                    return false;
                }
                
                // Grace period: skip brand-new posts
                if (post.getCreatedAt() != null &&
                    post.getCreatedAt().isAfter(now.minusMinutes(GRACE_PERIOD_MINUTES))) {
                    logger.debug("Skipping post ID {} — created recently (grace period active)", post.getId());
                    return false;
                }

                // Confirmed pickup date before today → definitely missed
                if (claim.getConfirmedPickupDate().isBefore(today)) {
                    logger.debug("Post ID {} — confirmed pickup date {} is in the past", 
                               post.getId(), claim.getConfirmedPickupDate());
                    return true;
                }

                // Confirmed pickup date today and confirmed window ended
                if (claim.getConfirmedPickupDate().isEqual(today)) {
                    boolean windowEnded = currentTime.isAfter(claim.getConfirmedPickupEndTime());
                    logger.debug("Post ID {} — confirmed pickup ends at {}, current time {}, window ended: {}", 
                               post.getId(), claim.getConfirmedPickupEndTime(), currentTime, windowEnded);
                    return windowEnded;
                }

                return false;
            })
            .toList();

        if (postsToUpdate.isEmpty()) {
            logger.info("No posts eligible for NOT_COMPLETED update based on confirmed pickup times.");
            return;
        }

        for (SurplusPost post : postsToUpdate) {
            // Update post status
            post.setStatus(PostStatus.NOT_COMPLETED);
            surplusPostRepository.save(post);
            
            // Also update the associated claim status to NOT_COMPLETED
            var claimOpt = claimRepository.findBySurplusPostIdAndStatus(post.getId(), ClaimStatus.ACTIVE);
            if (claimOpt.isPresent()) {
                Claim claim = claimOpt.get();
                claim.setStatus(ClaimStatus.NOT_COMPLETED);
                claimRepository.save(claim);
                logger.info("Post ID {} and associated claim ID {} both marked as NOT_COMPLETED due to missed pickup window", 
                           post.getId(), claim.getId());
            } else {
                logger.info("Post ID {} marked as NOT_COMPLETED based on confirmed pickup window", post.getId());
            }
        }
    }
}
