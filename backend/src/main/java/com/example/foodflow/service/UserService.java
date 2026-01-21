package com.example.foodflow.service;

import com.example.foodflow.model.dto.UpdateNotificationPreferencesRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.model.dto.UserDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final NotificationPreferenceService notificationPreferenceService;
    
    public UserService(UserRepository userRepository, ObjectMapper objectMapper,
                      NotificationPreferenceService notificationPreferenceService) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.notificationPreferenceService = notificationPreferenceService;
    }
    
    public void updateLanguagePreference(User user, String languagePreference) {
        user.setLanguagePreference(languagePreference);
        userRepository.save(user);
    }

    @Transactional
    public User updateNotificationPreferences(Long userId, UpdateNotificationPreferencesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        logger.info("Updating notification preferences for userId={}, role={}", userId, user.getRole());
        
        // Admins cannot enable SMS notifications
        if (user.getRole() == UserRole.ADMIN && 
            request.getSmsNotificationsEnabled() != null && 
            request.getSmsNotificationsEnabled()) {
            logger.warn("Attempt to enable SMS for admin userId={} - rejected", userId);
            throw new IllegalArgumentException("SMS notifications are not available for admin users");
        }
        
        // Track what changed for logging
        boolean emailChanged = false;
        boolean smsChanged = false;
        
        if (request.getEmailNotificationsEnabled() != null) {
            boolean oldValue = user.getEmailNotificationsEnabled() != null ? user.getEmailNotificationsEnabled() : false;
            if (oldValue != request.getEmailNotificationsEnabled()) {
                emailChanged = true;
                logger.info("Email notifications changed for userId={}: {} -> {}", 
                    userId, oldValue, request.getEmailNotificationsEnabled());
            }
            user.setEmailNotificationsEnabled(request.getEmailNotificationsEnabled());
        }
        
        if (request.getSmsNotificationsEnabled() != null) {
            boolean oldValue = user.getSmsNotificationsEnabled() != null ? user.getSmsNotificationsEnabled() : false;
            if (oldValue != request.getSmsNotificationsEnabled()) {
                smsChanged = true;
                logger.info("SMS notifications changed for userId={}: {} -> {}", 
                    userId, oldValue, request.getSmsNotificationsEnabled());
            }
            user.setSmsNotificationsEnabled(request.getSmsNotificationsEnabled());
        }
        
        // Handle notification type preferences (JSON)
        if (request.getNotificationTypes() != null) {
            // Validate notification types for user's role
            List<String> invalidTypes = notificationPreferenceService.validateNotificationTypes(
                user, request.getNotificationTypes());
            
            if (!invalidTypes.isEmpty()) {
                logger.warn("Invalid notification types for userId={}, role={}: {}", 
                    userId, user.getRole(), invalidTypes);
                throw new IllegalArgumentException(
                    "Invalid notification types for role " + user.getRole() + ": " + invalidTypes);
            }
            
            try {
                String jsonPreferences = objectMapper.writeValueAsString(request.getNotificationTypes());
                user.setNotificationTypePreferences(jsonPreferences);
                logger.info("Updated notification type preferences for userId={}: {}", 
                    userId, request.getNotificationTypes().keySet());
            } catch (JsonProcessingException e) {
                logger.error("Error serializing notification preferences for userId={}: {}", 
                    userId, e.getMessage());
                throw new RuntimeException("Error serializing notification preferences", e);
            }
        }
        
        User savedUser = userRepository.save(user);
        logger.info("Successfully updated notification preferences for userId={}", userId);
        return savedUser;
    }
    
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }
    
    @SuppressWarnings("unchecked")
    public Map<String, Boolean> getNotificationTypePreferences(Long userId) {
        User user = getUserById(userId);
        String jsonPreferences = user.getNotificationTypePreferences();
        
        if (jsonPreferences == null || jsonPreferences.isEmpty()) {
            return new HashMap<>();
        }
        
        try {
            return objectMapper.readValue(jsonPreferences, Map.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error deserializing notification preferences", e);
        }
    }
}
