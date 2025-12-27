package com.example.foodflow.controller;

import com.example.foodflow.model.dto.RegionResponse;
import com.example.foodflow.model.dto.UpdateRegionRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing user profile settings including region and timezone.
 */
@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class UserProfileController {
    
    private final UserProfileService userProfileService;
    
    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }
    
    /**
     * GET /api/profile/region
     * Retrieves the current region settings for the authenticated user.
     * 
     * @param currentUser The authenticated user (injected by Spring Security)
     * @return RegionResponse containing country, city, timezone, and timezone offset
     */
    @GetMapping("/region")
    public ResponseEntity<RegionResponse> getRegionSettings(
            @AuthenticationPrincipal User currentUser) {
        
        RegionResponse response = userProfileService.getRegionSettings(currentUser);
        return ResponseEntity.ok(response);
    }
    
    /**
     * PUT /api/profile/region
     * Updates the region settings for the authenticated user.
     * Automatically resolves the timezone based on the provided city and country.
     * 
     * @param currentUser The authenticated user (injected by Spring Security)
     * @param request The update request containing country and city
     * @return RegionResponse with updated region and resolved timezone information
     */
    @PutMapping("/region")
    public ResponseEntity<RegionResponse> updateRegionSettings(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateRegionRequest request) {
        
        RegionResponse response = userProfileService.updateRegionSettings(currentUser, request);
        return ResponseEntity.ok(response);
    }
}
