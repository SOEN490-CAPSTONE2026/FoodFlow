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
     * Check every minute for posts that should transition to READY_FOR_PICKUP status
     * Runs every 60 seconds (1 minute)
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void updatePostsToReadyForPickup() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        // Find posts that are AVAILABLE or CLAIMED and whose pickup window has started
        List<SurplusPost> availablePosts = surplusPostRepository.findByStatus(PostStatus.AVAILABLE);
        List<SurplusPost> claimedPosts = surplusPostRepository.findByStatus(PostStatus.CLAIMED);

        List<SurplusPost> postsToUpdate = new java.util.ArrayList<>();
        postsToUpdate.addAll(availablePosts);
        postsToUpdate.addAll(claimedPosts);

        postsToUpdate = postsToUpdate.stream()
            .filter(post -> {
                // Check if pickup date is today or in the past
                if (post.getPickupDate().isAfter(today)) {
                    return false; // Pickup date is in the future
                }

                // If pickup date is today, check if pickup time has started
                if (post.getPickupDate().isEqual(today)) {
                    return !currentTime.isBefore(post.getPickupFrom());
                }

                // If pickup date is in the past, it should be ready
                return true;
            })
            .toList();

        for (SurplusPost post : postsToUpdate) {
            post.setStatus(PostStatus.READY_FOR_PICKUP);

            // Generate OTP if not already generated
            if (post.getOtpCode() == null || post.getOtpCode().isEmpty()) {
                String otpCode = generateOtpCode();
                post.setOtpCode(otpCode);
                logger.info("Generated OTP {} for surplus post ID: {}", otpCode, post.getId());
            }

            surplusPostRepository.save(post);
            logger.info("Updated surplus post ID {} to READY_FOR_PICKUP status", post.getId());
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

        // Find posts that are READY_FOR_PICKUP and whose pickup window has ended
        List<SurplusPost> postsToUpdate = surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP)
            .stream()
            .filter(post -> {
                // Check if pickup date has passed
                if (post.getPickupDate().isBefore(today)) {
                    return true; // Pickup date was in the past
                }

                // If pickup date is today, check if pickup window has ended
                if (post.getPickupDate().isEqual(today)) {
                    return currentTime.isAfter(post.getPickupTo());
                }

                // Future pickup dates don't need updating
                return false;
            })
            .toList();

        for (SurplusPost post : postsToUpdate) {
            post.setStatus(PostStatus.NOT_COMPLETED);
            surplusPostRepository.save(post);
            logger.info("Updated surplus post ID {} to NOT_COMPLETED status (pickup window ended)", post.getId());
        }
    }
}
