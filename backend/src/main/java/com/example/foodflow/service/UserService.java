package com.example.foodflow.service;

import com.example.foodflow.model.dto.UpdateNotificationPreferencesRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {
    
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    
    public UserService(UserRepository userRepository, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }
    
    @Transactional
    public User updateNotificationPreferences(Long userId, UpdateNotificationPreferencesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Admins cannot enable SMS notifications
        if (user.getRole() == UserRole.ADMIN && 
            request.getSmsNotificationsEnabled() != null && 
            request.getSmsNotificationsEnabled()) {
            throw new IllegalArgumentException("SMS notifications are not available for admin users");
        }
        
        if (request.getEmailNotificationsEnabled() != null) {
            user.setEmailNotificationsEnabled(request.getEmailNotificationsEnabled());
        }
        
        if (request.getSmsNotificationsEnabled() != null) {
            user.setSmsNotificationsEnabled(request.getSmsNotificationsEnabled());
        }
        
        // Handle notification type preferences (JSON)
        if (request.getNotificationTypes() != null) {
            try {
                String jsonPreferences = objectMapper.writeValueAsString(request.getNotificationTypes());
                user.setNotificationTypePreferences(jsonPreferences);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Error serializing notification preferences", e);
            }
        }
        
        return userRepository.save(user);
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
