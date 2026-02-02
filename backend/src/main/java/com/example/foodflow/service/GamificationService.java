package com.example.foodflow.service;

import com.example.foodflow.model.dto.AchievementNotificationDTO;
import com.example.foodflow.model.dto.AchievementProgress;
import com.example.foodflow.model.dto.AchievementResponse;
import com.example.foodflow.model.dto.GamificationStatsResponse;
import com.example.foodflow.model.entity.Achievement;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserAchievement;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.CriteriaType;
import com.example.foodflow.repository.AchievementRepository;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.ConversationRepository;
import com.example.foodflow.repository.MessageRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserAchievementRepository;
import com.example.foodflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service handling gamification logic including points, achievements, and progress tracking.
 * Automatically checks and unlocks achievements when criteria are met.
 */
@Service
public class GamificationService {
    private static final Logger logger = LoggerFactory.getLogger(GamificationService.class);

    private final UserRepository userRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public GamificationService(UserRepository userRepository,
                              AchievementRepository achievementRepository,
                              UserAchievementRepository userAchievementRepository,
                              SurplusPostRepository surplusPostRepository,
                              ClaimRepository claimRepository,
                              MessageRepository messageRepository,
                              ConversationRepository conversationRepository,
                              SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Award points to a user and update their total points.
     * 
     * @param userId User receiving points
     * @param points Points to award
     * @param reason Reason for awarding points (for logging)
     */
    @Transactional
    public void awardPoints(Long userId, int points, String reason) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        int currentPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;
        user.setTotalPoints(currentPoints + points);
        userRepository.save(user);

        logger.info("Awarded {} points to userId={} for: {}", points, userId, reason);
    }

    /**
     * Check all active achievements and unlock those where user meets the criteria.
     * Called after point-awarding actions.
     * 
     * @param userId User to check achievements for
     * @return List of newly unlocked achievements
     */
    @Transactional
    public List<UserAchievement> checkAndUnlockAchievements(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all active achievements
        List<Achievement> allAchievements = achievementRepository.findByIsActiveTrue();
        
        // Get already earned achievement IDs
        List<UserAchievement> existingAchievements = userAchievementRepository
            .findByUserIdOrderByEarnedAtDesc(userId);
        List<Long> earnedAchievementIds = existingAchievements.stream()
            .map(ua -> ua.getAchievement().getId())
            .collect(Collectors.toList());

        // Check remaining achievements
        List<UserAchievement> newlyUnlocked = new ArrayList<>();
        for (Achievement achievement : allAchievements) {
            // Skip if already earned
            if (earnedAchievementIds.contains(achievement.getId())) {
                continue;
            }

            // Check if user meets criteria
            if (meetsAchievementCriteria(user, achievement)) {
                UserAchievement userAchievement = new UserAchievement(user, achievement);
                userAchievement = userAchievementRepository.save(userAchievement);
                newlyUnlocked.add(userAchievement);

                // Award achievement points
                int currentPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;
                user.setTotalPoints(currentPoints + achievement.getPointsValue());
                userRepository.save(user);

                // Send WebSocket notification
                sendAchievementNotification(user, userAchievement);

                // Mark as notified
                userAchievement.setNotified(true);
                userAchievementRepository.save(userAchievement);

                logger.info("User {} unlocked achievement: {} (+{} points)",
                    userId, achievement.getName(), achievement.getPointsValue());
            }
        }

        return newlyUnlocked;
    }

    /**
     * Get comprehensive gamification statistics for a user.
     * 
     * @param userId User ID
     * @return Gamification stats including points, achievements, and progress
     */
    @Transactional(readOnly = true)
    public GamificationStatsResponse getUserGamificationStats(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Get total points and achievement count
        Integer totalPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;
        long achievementCount = userAchievementRepository.countByUserId(userId);

        GamificationStatsResponse response = new GamificationStatsResponse(
            userId, totalPoints, (int) achievementCount
        );

        // Get unlocked achievements with earned timestamps
        List<UserAchievement> userAchievements = userAchievementRepository
            .findByUserIdWithAchievementDetails(userId);
        List<AchievementResponse> unlockedList = userAchievements.stream()
            .map(ua -> {
                AchievementResponse ar = AchievementResponse.fromEntity(ua.getAchievement());
                ar.setEarnedAt(ua.getEarnedAt());
                return ar;
            })
            .collect(Collectors.toList());
        response.setUnlockedAchievements(unlockedList);

        // Calculate progress towards next achievements - filtered by user role
        List<Achievement> allActive = achievementRepository.findByIsActiveTrue();
        List<Long> earnedIds = userAchievements.stream()
            .map(ua -> ua.getAchievement().getId())
            .collect(Collectors.toList());

        List<AchievementProgress> progressList = new ArrayList<>();
        for (Achievement achievement : allActive) {
            // Only include achievements relevant to this user's role
            if (!earnedIds.contains(achievement.getId()) && isAchievementRelevantForUser(user, achievement)) {
                int currentValue = getCurrentValueForCriteria(user, achievement.getCriteriaType());
                AchievementProgress progress = new AchievementProgress(
                    achievement.getId(),
                    achievement.getName(),
                    achievement.getDescription(),
                    achievement.getCategory(),
                    achievement.getCriteriaType(),
                    currentValue,
                    achievement.getCriteriaValue()
                );
                progressList.add(progress);
            }
        }
        response.setProgressToNext(progressList);

        return response;
    }

    /**
     * Get all available achievements (both locked and unlocked).
     * 
     * @return List of all active achievements
     */
    @Transactional(readOnly = true)
    public List<AchievementResponse> getAllAchievements() {
        List<Achievement> achievements = achievementRepository.findByIsActiveTrue();
        return achievements.stream()
            .map(AchievementResponse::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Check if an achievement is relevant for a user based on their role.
     * Donors can earn DONATION-based and SOCIAL achievements.
     * Receivers can earn CLAIM/PICKUP-based and SOCIAL achievements.
     * 
     * @param user User to check
     * @param achievement Achievement to check
     * @return true if achievement is relevant for this user's role
     */
    private boolean isAchievementRelevantForUser(User user, Achievement achievement) {
        CriteriaType criteriaType = achievement.getCriteriaType();
        UserRole userRole = user.getRole();

        // SOCIAL achievements are available to everyone
        if (criteriaType == CriteriaType.MESSAGE_COUNT || 
            criteriaType == CriteriaType.UNIQUE_PARTNER_COUNT) {
            return true;
        }

        // Donor-specific achievements
        if (userRole == UserRole.DONOR) {
            return criteriaType == CriteriaType.DONATION_COUNT || 
                   criteriaType == CriteriaType.WEEKLY_STREAK;
        }

        // Receiver-specific achievements
        if (userRole == UserRole.RECEIVER) {
            return criteriaType == CriteriaType.CLAIM_COUNT || 
                   criteriaType == CriteriaType.PICKUP_COUNT || 
                   criteriaType == CriteriaType.QUICK_CLAIM_COUNT;
        }

        // Default: show achievement (for future role types)
        return true;
    }

    /**
     * Check if user meets the criteria for a specific achievement.
     * 
     * @param user User to check
     * @param achievement Achievement to check against
     * @return true if user meets criteria
     */
    private boolean meetsAchievementCriteria(User user, Achievement achievement) {
        // Only check achievements relevant to this user's role
        if (!isAchievementRelevantForUser(user, achievement)) {
            return false;
        }
        
        int currentValue = getCurrentValueForCriteria(user, achievement.getCriteriaType());
        return currentValue >= achievement.getCriteriaValue();
    }

    /**
     * Get the current value for a specific criteria type for a user.
     * 
     * @param user User to check
     * @param criteriaType Type of criteria
     * @return Current value
     */
    private int getCurrentValueForCriteria(User user, CriteriaType criteriaType) {
        switch (criteriaType) {
            case DONATION_COUNT:
                return (int) surplusPostRepository.countByDonorId(user.getId());

            case CLAIM_COUNT:
                return (int) claimRepository.countByReceiverId(user.getId());

            case PICKUP_COUNT:
                // Count completed claims - receiver claims with COMPLETED status
                return (int) claimRepository.findReceiverClaimsWithDetails(
                    user.getId(),
                    java.util.List.of(ClaimStatus.COMPLETED)
                ).size();

            case MESSAGE_COUNT:
                // Count messages sent by user
                return (int) messageRepository.findAll().stream()
                    .filter(message -> message.getSender().getId().equals(user.getId()))
                    .count();

            case UNIQUE_PARTNER_COUNT:
                // Count unique conversation partners the user has interacted with
                return (int) conversationRepository.findByUserId(user.getId()).stream()
                    .map(conversation -> conversation.getOtherParticipant(user.getId()).getId())
                    .distinct()
                    .count();

            default:
                logger.warn("Unsupported criteria type for achievement checking: {}", criteriaType);
                return 0;
        }
    }

    /**
     * Send WebSocket notification when achievement is unlocked.
     *
     * @param user User who unlocked the achievement
     * @param userAchievement The unlocked achievement
     */
    private void sendAchievementNotification(User user, UserAchievement userAchievement) {
        try {
            Achievement achievement = userAchievement.getAchievement();

            AchievementNotificationDTO notification = new AchievementNotificationDTO(
                achievement.getId(),
                achievement.getName(),
                achievement.getDescription(),
                achievement.getIconName(), // Achievement entity uses 'iconName' field
                achievement.getPointsValue(),
                achievement.getCategory() != null ? achievement.getCategory().toString() : null,
                userAchievement.getEarnedAt()
            );

            messagingTemplate.convertAndSendToUser(
                user.getId().toString(),
                "/queue/achievements",
                notification
            );

            logger.info("Sent achievement notification to userId={} for achievement: {}",
                user.getId(), achievement.getName());
        } catch (Exception e) {
            logger.error("Failed to send achievement notification to userId={}: {}",
                user.getId(), e.getMessage());
        }
    }
}
