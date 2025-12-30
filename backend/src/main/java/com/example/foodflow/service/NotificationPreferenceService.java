package com.example.foodflow.service;

import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;


@Service
public class NotificationPreferenceService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationPreferenceService.class);
    
    private final ObjectMapper objectMapper;
    
    private static final Map<UserRole, Set<String>> VALID_NOTIFICATION_TYPES = new HashMap<>();
    
    static {
        // DONOR notification types
        VALID_NOTIFICATION_TYPES.put(UserRole.DONOR, new HashSet<>(Arrays.asList(
            "donationClaimed",
            "claimCanceled",
            "pickupReminder",
            "donationPickedUp",
            "donationExpired",
            "newMessageFromReceiver",
            "receiverReview",
            "donationFlagged",
            "donationStatusUpdated",
            "complianceWarning",
            "issueResolved",
            "verificationStatusChanged"
        )));
        
        // RECEIVER notification types
        VALID_NOTIFICATION_TYPES.put(UserRole.RECEIVER, new HashSet<>(Arrays.asList(
            "newDonationAvailable",
            "donationReadyForPickup",
            "pickupReminder",
            "donationCompleted",
            "newMessageFromDonor",
            "donorReview",
            "claimFlagged",
            "donationStatusChanged",
            "disputeResolved",
            "verificationStatusChanged"
        )));
        
        // ADMIN notification types
        VALID_NOTIFICATION_TYPES.put(UserRole.ADMIN, new HashSet<>(Arrays.asList(
            "donationFlagged",
            "suspiciousActivity",
            "verificationRequest",
            "newDispute",
            "escalatedIssue",
            "safetyAlert",
            "systemError",
            "highVolumeDonation"
        )));
    }
    
    public NotificationPreferenceService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    // Check if a user should receive a specific type of notification
    public boolean shouldSendNotification(User user, String notificationType, String channel) {
        logger.debug("Checking notification preference for userId={}, type={}, channel={}", 
            user.getId(), notificationType, channel);
        
        if ("email".equals(channel)) {
            if (user.getEmailNotificationsEnabled() == null || !user.getEmailNotificationsEnabled()) {
                logger.info("Email notifications disabled for userId={}", user.getId());
                return false;
            }
        } else if ("sms".equals(channel)) {
            if (user.getSmsNotificationsEnabled() == null || !user.getSmsNotificationsEnabled()) {
                logger.debug("SMS notifications disabled for userId={}", user.getId());
                return false;
            }
        }
        
        // Check specific notification type preference
        Map<String, Boolean> typePreferences = getNotificationTypePreferences(user);
        
        // If no preferences exist, default to true (allow notification)
        if (typePreferences == null || typePreferences.isEmpty()) {
            logger.debug("No notification type preferences found for userId={}, defaulting to allow", user.getId());
            return true;
        }
        
        // Check if this specific notification type is enabled
        Boolean enabled = typePreferences.get(notificationType);
        if (enabled == null) {
            // Notification type not in preferences, default to true
            logger.debug("Notification type '{}' not found in preferences for userId={}, defaulting to allow", 
                notificationType, user.getId());
            return true;
        }
        
        if (!enabled) {
            logger.info("Notification type '{}' is disabled for userId={}", notificationType, user.getId());
        }
        
        return enabled;
    }
    
    // Validate that notification types are valid for the user's role
    public List<String> validateNotificationTypes(User user, Map<String, Boolean> notificationTypes) {
        List<String> invalidTypes = new ArrayList<>();
        
        Set<String> validTypes = VALID_NOTIFICATION_TYPES.get(user.getRole());
        if (validTypes == null) {
            logger.warn("No valid notification types defined for role={}", user.getRole());
            return invalidTypes;
        }
        
        for (String notificationType : notificationTypes.keySet()) {
            if (!validTypes.contains(notificationType)) {
                invalidTypes.add(notificationType);
                logger.warn("Invalid notification type '{}' for role={} userId={}", 
                    notificationType, user.getRole(), user.getId());
            }
        }
        
        return invalidTypes;
    }
    
    // Get valid notification types for a user's role
    public Set<String> getValidNotificationTypes(UserRole role) {
        return VALID_NOTIFICATION_TYPES.getOrDefault(role, new HashSet<>());
    }
    
    // Get notification type preferences from user's JSON field
    @SuppressWarnings("unchecked")
    private Map<String, Boolean> getNotificationTypePreferences(User user) {
        String jsonPreferences = user.getNotificationTypePreferences();
        
        if (jsonPreferences == null || jsonPreferences.isEmpty()) {
            return new HashMap<>();
        }
        
        try {
            return objectMapper.readValue(jsonPreferences, Map.class);
        } catch (JsonProcessingException e) {
            logger.error("Error deserializing notification preferences for userId={}: {}", 
                user.getId(), e.getMessage());
            return new HashMap<>();
        }
    }
}
