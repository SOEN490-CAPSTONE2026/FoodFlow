package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ReceiverPreferencesRequest;
import com.example.foodflow.model.dto.ReceiverPreferencesResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.ReceiverPreferencesService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/receiver/preferences")
@CrossOrigin(origins = "http://localhost:3000")
public class ReceiverPreferencesController {
    
    private static final Logger logger = LoggerFactory.getLogger(ReceiverPreferencesController.class);
    
    @Autowired
    private ReceiverPreferencesService preferencesService;
    
    /**
     * GET /api/receiver/preferences
     * Get current user's preferences
     */
    @GetMapping
    public ResponseEntity<ReceiverPreferencesResponse> getPreferences(
            @AuthenticationPrincipal User currentUser) {
        
        logger.info("Getting preferences for user: {}", currentUser != null ? currentUser.getId() : "null");
        
        try {
            Optional<ReceiverPreferencesResponse> preferences = preferencesService.getPreferences(currentUser);
            
            if (preferences.isPresent()) {
                return ResponseEntity.ok(preferences.get());
            } else {
                // Return default preferences if none exist
                ReceiverPreferencesResponse defaultPrefs = preferencesService.getOrCreateDefaultPreferences(currentUser);
                return ResponseEntity.ok(defaultPrefs);
            }
        } catch (Exception e) {
            logger.error("Error getting preferences for user {}: {}", currentUser.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/receiver/preferences
     * Create new preferences
     */
    @PostMapping
    public ResponseEntity<ReceiverPreferencesResponse> createPreferences(
            @Valid @RequestBody ReceiverPreferencesRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        logger.info("Creating preferences for user: {}", currentUser != null ? currentUser.getId() : "null");
        
        try {
            // Check if preferences already exist
            if (preferencesService.hasPreferences(currentUser)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(null); // Preferences already exist, use PUT to update
            }
            
            ReceiverPreferencesResponse response = preferencesService.savePreferences(currentUser, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            logger.error("Validation error creating preferences: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error creating preferences for user {}: {}", currentUser.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUT /api/receiver/preferences
     * Update existing preferences
     */
    @PutMapping
    public ResponseEntity<ReceiverPreferencesResponse> updatePreferences(
            @Valid @RequestBody ReceiverPreferencesRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        logger.info("Updating preferences for user: {}", currentUser != null ? currentUser.getId() : "null");
        
        try {
            ReceiverPreferencesResponse response = preferencesService.savePreferences(currentUser, request);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.error("Validation error updating preferences: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating preferences for user {}: {}", currentUser.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * DELETE /api/receiver/preferences
     * Delete user's preferences (reset to default)
     */
    @DeleteMapping
    public ResponseEntity<Void> deletePreferences(
            @AuthenticationPrincipal User currentUser) {
        
        logger.info("Deleting preferences for user: {}", currentUser != null ? currentUser.getId() : "null");
        
        try {
            preferencesService.deletePreferences(currentUser);
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            logger.error("Error deleting preferences for user {}: {}", currentUser.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/receiver/preferences/exists
     * Check if user has preferences set
     */
    @GetMapping("/exists")
    public ResponseEntity<Boolean> hasPreferences(
            @AuthenticationPrincipal User currentUser) {
        
        try {
            boolean exists = preferencesService.hasPreferences(currentUser);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            logger.error("Error checking preferences existence for user {}: {}", currentUser != null ? currentUser.getId() : "null", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
