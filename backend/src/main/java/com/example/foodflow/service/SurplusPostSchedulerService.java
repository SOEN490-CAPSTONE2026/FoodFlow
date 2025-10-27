package com.example.foodflow.service;

import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.PostStatus;
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

    private final SurplusPostRepository surplusPostRepository;

    public SurplusPostSchedulerService(SurplusPostRepository surplusPostRepository) {
        this.surplusPostRepository = surplusPostRepository;
    }

    /**
     * Generate a secure 6-digit OTP code
     */
    private String generateOtpCode() {
        int otp = 100000 + random.nextInt(900000); // 6-digit number
        return String.valueOf(otp);
    }

    /**
     * Check every 5 seconds for posts that should transition to READY_FOR_PICKUP status
     * Runs every 5 seconds for faster status updates
     */
    @Scheduled(fixedRate = 5000) // Changed from 60000 to 5000 (5 seconds)
    @Transactional
    public void updatePostsToReadyForPickup() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        logger.info("===== Scheduler updatePostsToReadyForPickup running at: {} =====", now);

        // Find posts that are CLAIMED or AVAILABLE and whose pickup window has started
        // AVAILABLE posts should also transition to READY_FOR_PICKUP when pickup time arrives
        List<SurplusPost> claimedPosts = surplusPostRepository.findByStatus(PostStatus.CLAIMED);
        List<SurplusPost> availablePosts = surplusPostRepository.findByStatus(PostStatus.AVAILABLE);

        logger.info("Found {} CLAIMED posts and {} AVAILABLE posts", claimedPosts.size(), availablePosts.size());

        List<SurplusPost> postsToUpdate = new java.util.ArrayList<>();
        postsToUpdate.addAll(claimedPosts);
        postsToUpdate.addAll(availablePosts);

        postsToUpdate = postsToUpdate.stream()
            .filter(post -> {
                logger.debug("Evaluating post ID {}: status={}, pickupDate={}, pickupFrom={}, pickupTo={}",
                    post.getId(), post.getStatus(), post.getPickupDate(), post.getPickupFrom(), post.getPickupTo());

                // Check if pickup date is today or in the past
                if (post.getPickupDate().isAfter(today)) {
                    logger.debug("Post ID {} - pickup date is in the future, skipping", post.getId());
                    return false; // Pickup date is in the future
                }

                // If pickup date is today, check if pickup time has started
                if (post.getPickupDate().isEqual(today)) {
                    boolean timeStarted = !currentTime.isBefore(post.getPickupFrom());
                    logger.debug("Post ID {} - pickup date is today, currentTime={}, pickupFrom={}, timeStarted={}",
                        post.getId(), currentTime, post.getPickupFrom(), timeStarted);
                    return timeStarted;
                }

                // If pickup date is in the past, it should be ready
                logger.debug("Post ID {} - pickup date is in the past, should be ready", post.getId());
                return true;
            })
            .toList();

        logger.info("After filtering: {} posts need to be updated to READY_FOR_PICKUP", postsToUpdate.size());

        for (SurplusPost post : postsToUpdate) {
            post.setStatus(PostStatus.READY_FOR_PICKUP);

            // Generate OTP if not already generated
            if (post.getOtpCode() == null || post.getOtpCode().isEmpty()) {
                String otpCode = generateOtpCode();
                post.setOtpCode(otpCode);
                logger.info("Generated OTP {} for surplus post ID: {}", otpCode, post.getId());
            }

            surplusPostRepository.save(post);
            logger.info("Updated surplus post ID {} from {} to READY_FOR_PICKUP status", post.getId(), 
                post.getStatus() == PostStatus.READY_FOR_PICKUP ? "CLAIMED/AVAILABLE" : post.getStatus());
        }
    }

    /**
     * Check every minute for posts whose pickup window has ended without completion
     * Runs every 60 seconds (1 minute)
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void updatePostsToNotCompleted() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        logger.info("===== Scheduler updatePostsToNotCompleted running at: {} =====", now);

        // Find posts that are READY_FOR_PICKUP and whose pickup window has ended
        List<SurplusPost> readyPosts = surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP);
        logger.info("Found {} READY_FOR_PICKUP posts", readyPosts.size());

        List<SurplusPost> postsToUpdate = readyPosts
            .stream()
            .filter(post -> {
                logger.debug("Evaluating READY post ID {}: pickupDate={}, pickupFrom={}, pickupTo={}",
                    post.getId(), post.getPickupDate(), post.getPickupFrom(), post.getPickupTo());

                // Check if pickup date has passed
                if (post.getPickupDate().isBefore(today)) {
                    logger.debug("Post ID {} - pickup date was in the past, should mark NOT_COMPLETED", post.getId());
                    return true; // Pickup date was in the past
                }

                // If pickup date is today, check if pickup window has ended
                if (post.getPickupDate().isEqual(today)) {
                    boolean windowEnded = currentTime.isAfter(post.getPickupTo());
                    logger.debug("Post ID {} - pickup date is today, currentTime={}, pickupTo={}, windowEnded={}",
                        post.getId(), currentTime, post.getPickupTo(), windowEnded);
                    return windowEnded;
                }

                // Future pickup dates don't need updating
                logger.debug("Post ID {} - pickup date is in the future, skipping", post.getId());
                return false;
            })
            .toList();

        logger.info("After filtering: {} posts need to be updated to NOT_COMPLETED", postsToUpdate.size());

        for (SurplusPost post : postsToUpdate) {
            post.setStatus(PostStatus.NOT_COMPLETED);
            surplusPostRepository.save(post);
            logger.info("Updated surplus post ID {} to NOT_COMPLETED status (pickup window ended)", post.getId());
        }
    }
}
