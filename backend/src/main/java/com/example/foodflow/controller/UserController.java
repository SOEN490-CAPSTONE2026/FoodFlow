package com.example.foodflow.controller;

import com.example.foodflow.model.dto.UpdateNotificationPreferencesRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "${CORS_ALLOWED_ORIGINS:http://localhost:3000}", allowCredentials = "true")
public class UserController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping("/notifications/preferences")
    public ResponseEntity<Map<String, Boolean>> getNotificationPreferences(
            @AuthenticationPrincipal User currentUser) {
        logger.info("Getting notification preferences for user: {}", currentUser.getId());
        
        User user = userService.getUserById(currentUser.getId());
        
        Map<String, Boolean> preferences = new HashMap<>();
        preferences.put("emailNotificationsEnabled", user.getEmailNotificationsEnabled());
        preferences.put("smsNotificationsEnabled", user.getSmsNotificationsEnabled());
        
        return ResponseEntity.ok(preferences);
    }
    
    @PutMapping("/notifications/preferences")
    public ResponseEntity<Map<String, Boolean>> updateNotificationPreferences(
            @AuthenticationPrincipal User currentUser,
            @RequestBody UpdateNotificationPreferencesRequest request) {
        logger.info("Updating notification preferences for user: {}", currentUser.getId());
        
        try {
            User updatedUser = userService.updateNotificationPreferences(currentUser.getId(), request);
            
            Map<String, Boolean> preferences = new HashMap<>();
            preferences.put("emailNotificationsEnabled", updatedUser.getEmailNotificationsEnabled());
            preferences.put("smsNotificationsEnabled", updatedUser.getSmsNotificationsEnabled());
            
            return ResponseEntity.ok(preferences);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid notification preference update: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating notification preferences: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
