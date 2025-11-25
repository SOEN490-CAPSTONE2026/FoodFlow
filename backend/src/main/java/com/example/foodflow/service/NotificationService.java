package com.example.foodflow.service;

import com.example.foodflow.model.entity.ReceiverPreferences;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.ReceiverPreferencesRepository;
import com.example.foodflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ReceiverPreferencesRepository receiverPreferencesRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    
    public NotificationService(
            SimpMessagingTemplate messagingTemplate,
            ReceiverPreferencesRepository receiverPreferencesRepository,
            ClaimRepository claimRepository,
            UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.receiverPreferencesRepository = receiverPreferencesRepository;
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Send notification to all eligible receivers when a new post is created
     */
    public void sendNewPostNotification(SurplusPost surplusPost) {
        logger.info("===== NOTIFICATION SERVICE START =====");
        logger.info("Processing new post notification for postId={}, title={}, foodCategories={}", 
            surplusPost.getId(), surplusPost.getTitle(), surplusPost.getFoodCategories());
        
        // Get all receiver users
        List<User> receivers = userRepository.findByRole(UserRole.RECEIVER);
        logger.info("Found {} receiver users in database", receivers.size());
        
        int totalReceivers = receivers.size();
        int notificationsSent = 0;
        int filteredOut = 0;
        
        for (User receiver : receivers) {
            try {
                // Check if receiver should receive notification
                if (shouldNotifyReceiver(receiver, surplusPost)) {
                    String matchReason = getMatchReason(receiver, surplusPost);
                    sendNotificationToReceiver(receiver, surplusPost, matchReason);
                    notificationsSent++;
                    logger.info("Sent notification to receiverId={} for postId={}, reason: {}", 
                        receiver.getId(), surplusPost.getId(), matchReason);
                } else {
                    filteredOut++;
                    logger.debug("Filtered out receiverId={} for postId={}", 
                        receiver.getId(), surplusPost.getId());
                }
            } catch (Exception e) {
                logger.error("Failed to process notification for receiverId={}, postId={}: {}", 
                    receiver.getId(), surplusPost.getId(), e.getMessage());
            }
        }
        
        logger.info("Notification processing complete for postId={}. Total receivers: {}, Sent: {}, Filtered: {}", 
            surplusPost.getId(), totalReceivers, notificationsSent, filteredOut);
    }
    
    /**
     * Determine if a receiver should be notified about a surplus post
     */
    private boolean shouldNotifyReceiver(User receiver, SurplusPost surplusPost) {
        logger.info("Checking if receiverId={} should be notified...", receiver.getId());
        
        // Get receiver preferences
        ReceiverPreferences preferences = receiverPreferencesRepository.findByUserId(receiver.getId())
            .orElse(null);
        
        // If no preferences exist, notify by default
        if (preferences == null) {
            logger.info("  → No preferences found for receiverId={}, notifying by default", receiver.getId());
            return true;
        }
        
        logger.info("  → Preferences found: smartNotifications={}, preferredTypes={}, capacity={}", 
            preferences.getNotificationPreferencesEnabled(), 
            preferences.getPreferredFoodTypes(),
            preferences.getMaxCapacity());
        
        // Check if smart notifications are disabled - if so, notify all
        if (preferences.getNotificationPreferencesEnabled() == null || 
            !preferences.getNotificationPreferencesEnabled()) {
            logger.info("  → Smart notifications DISABLED for receiverId={}, notifying ALL", receiver.getId());
            return true;
        }
        
        logger.info("  → Smart notifications ENABLED - applying filters...");
        
        // Check capacity - don't notify if at or above capacity
        if (capacityReached(receiver, preferences)) {
            logger.info("  → FILTERED: Receiver at capacity");
            return false;
        }
        
        // Check if at least one food category matches preferences
        if (!matchesFoodPreferences(preferences, surplusPost)) {
            logger.info("  → FILTERED: No food type match");
            return false;
        }
        
        // Check if quantity fits within available capacity
        int currentClaimed = getCurrentClaimedQuantity(receiver.getId());
        int availableCapacity = preferences.getMaxCapacity() - currentClaimed;
        int postQuantity = surplusPost.getQuantity() != null ? surplusPost.getQuantity().getValue().intValue() : 0;
        
        logger.info("  → Quantity check: post={}, available={}, current={}", 
            postQuantity, availableCapacity, currentClaimed);
        
        if (postQuantity > availableCapacity) {
            logger.info("  → FILTERED: Post quantity exceeds available capacity");
            return false;
        }
        
        logger.info("  → PASSED all filters - will notify");
        return true;
    }
    
    /**
     * Check if receiver has reached their capacity limit
     */
    private boolean capacityReached(User receiver, ReceiverPreferences preferences) {
        int currentClaimed = getCurrentClaimedQuantity(receiver.getId());
        boolean atCapacity = currentClaimed >= preferences.getMaxCapacity();
        
        if (atCapacity) {
            logger.debug("Capacity check for receiverId={}: current={}, max={}, reached=true", 
                receiver.getId(), currentClaimed, preferences.getMaxCapacity());
        }
        
        return atCapacity;
    }
    
    /**
     * Calculate the total quantity currently claimed by a receiver
     */
    public int getCurrentClaimedQuantity(Long receiverId) {
        List<com.example.foodflow.model.entity.Claim> activeClaims = 
            claimRepository.findByReceiverIdAndStatus(receiverId, ClaimStatus.ACTIVE);
        
        int totalQuantity = activeClaims.stream()
            .map(claim -> claim.getSurplusPost().getQuantity())
            .filter(quantity -> quantity != null)
            .mapToInt(quantity -> quantity.getValue().intValue())
            .sum();
        
        logger.debug("Current claimed quantity for receiverId={}: {}", receiverId, totalQuantity);
        return totalQuantity;
    }
    
    /**
     * Check if surplus post matches receiver's food preferences
     */
    private boolean matchesFoodPreferences(ReceiverPreferences preferences, SurplusPost surplusPost) {
        List<String> preferredFoodTypes = preferences.getPreferredFoodTypes();
        
        // If no preferences set, match all
        if (preferredFoodTypes == null || preferredFoodTypes.isEmpty()) {
            return true;
        }
        
        Set<FoodCategory> postFoodCategories = surplusPost.getFoodCategories();
        if (postFoodCategories == null || postFoodCategories.isEmpty()) {
            return false;
        }
        
        // Convert FoodCategory set to string list for comparison
        List<String> postCategoryNames = postFoodCategories.stream()
            .map(FoodCategory::name)
            .collect(Collectors.toList());
        
        // Check if at least one category matches
        boolean hasMatch = postCategoryNames.stream()
            .anyMatch(preferredFoodTypes::contains);
        
        logger.debug("Food preference match check: preferred={}, post={}, match={}", 
            preferredFoodTypes, postCategoryNames, hasMatch);
        
        return hasMatch;
    }
    
    /**
     * Generate a human-readable reason why the notification was sent
     */
    private String getMatchReason(User receiver, SurplusPost surplusPost) {
        ReceiverPreferences preferences = receiverPreferencesRepository.findByUserId(receiver.getId())
            .orElse(null);
        
        // If no preferences or smart notifications disabled
        if (preferences == null || !preferences.getNotificationPreferencesEnabled()) {
            return "All notifications enabled";
        }
        
        // Find matching food types
        List<String> preferredFoodTypes = preferences.getPreferredFoodTypes();
        Set<FoodCategory> postFoodCategories = surplusPost.getFoodCategories();
        
        if (preferredFoodTypes == null || preferredFoodTypes.isEmpty()) {
            return "Matches all food types";
        }
        
        if (postFoodCategories != null) {
            // Convert FoodCategory set to string list
            List<String> postCategoryNames = postFoodCategories.stream()
                .map(FoodCategory::name)
                .collect(Collectors.toList());
            
            List<String> matchingTypes = postCategoryNames.stream()
                .filter(preferredFoodTypes::contains)
                .collect(Collectors.toList());
            
            if (!matchingTypes.isEmpty()) {
                return "Matches preferred: " + String.join(", ", matchingTypes);
            }
        }
        
        return "Matches your preferences";
    }
    
    /**
     * Send notification to a specific receiver via WebSocket
     */
    private void sendNotificationToReceiver(User receiver, SurplusPost surplusPost, String matchReason) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "NEW_POST");
        notification.put("postId", surplusPost.getId());
        notification.put("title", surplusPost.getTitle());
        notification.put("foodCategories", surplusPost.getFoodCategories());
        notification.put("quantity", surplusPost.getQuantity() != null ? surplusPost.getQuantity().getValue().intValue() : 0);
        notification.put("matchReason", matchReason);
        notification.put("timestamp", System.currentTimeMillis());
        
        try {
            messagingTemplate.convertAndSendToUser(
                receiver.getId().toString(),
                "/queue/notifications",
                notification
            );
        } catch (Exception e) {
            logger.error("Failed to send websocket notification to receiverId={}: {}", 
                receiver.getId(), e.getMessage());
            throw e;
        }
    }
}
