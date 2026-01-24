package com.example.foodflow.controller;

import com.example.foodflow.model.dto.RegionResponse;
import com.example.foodflow.model.dto.UpdateProfileRequest;
import com.example.foodflow.model.dto.UpdateRegionRequest;
import com.example.foodflow.model.dto.UserProfileResponse;
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
    
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserProfileController.class);

    private final UserProfileService userProfileService;
    
    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }
    
    /**
     * GET /api/profile
     * Retrieves the user profile data including organization information.
     * 
     * @param currentUser The authenticated user (injected by Spring Security)
     * @return UserProfileResponse containing email, fullName, phone, organization name, and address
     */
    @GetMapping("")
    public ResponseEntity<UserProfileResponse> getProfile(
            @AuthenticationPrincipal User currentUser) {
        
        UserProfileResponse response = userProfileService.getProfile(currentUser);
        return ResponseEntity.ok(response);
    }
    
    /**
     * PUT /api/profile
     * Updates the user profile data including organization information.
     * 
     * @param currentUser The authenticated user (injected by Spring Security)
     * @param request The update request containing fullName, phoneNumber, organizationName, address
     * @return UserProfileResponse with the updated profile data
     */
    @PutMapping("")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        
        // Debugging: log authentication and headers to diagnose 403s
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            log.debug("updateProfile called. currentUser={}, authentication={}, AuthorizationHeader={}",
                    currentUser, auth, httpRequest.getHeader("Authorization"));
        } catch (Exception e) {
            log.warn("Failed to log authentication info: {}", e.getMessage());
        }

        UserProfileResponse response = userProfileService.updateProfile(currentUser, request);
        return ResponseEntity.ok(response);
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
