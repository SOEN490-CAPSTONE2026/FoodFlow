package com.example.foodflow.service;

import com.example.foodflow.model.dto.RegionResponse;
import com.example.foodflow.model.dto.UpdateRegionRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.util.TimezoneResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing user profile settings including region and timezone.
 */
@Service
public class UserProfileService {
    
    private final UserRepository userRepository;
    
    public UserProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Updates user's region settings (country, city) and automatically resolves timezone.
     * 
     * @param user The authenticated user
     * @param request The region update request containing country and city
     * @return RegionResponse with updated region and timezone information
     */
    @Transactional
    public RegionResponse updateRegionSettings(User user, UpdateRegionRequest request) {
        // Use manual timezone if provided, otherwise resolve from city and country
        String timezone;
        if (request.getTimezone() != null && !request.getTimezone().trim().isEmpty()) {
            String providedTimezone = request.getTimezone().trim();
            
            // Check if it's a UTC offset string (e.g., "UTC-03:30", "UTC+05:00")
            if (providedTimezone.startsWith("UTC") || providedTimezone.startsWith("GMT")) {
                // It's an offset string - convert it to IANA timezone
                timezone = TimezoneResolver.convertOffsetToTimezone(providedTimezone);
            } else {
                // It's (hopefully) a valid IANA timezone ID - validate and use it
                if (TimezoneResolver.isValidTimezone(providedTimezone)) {
                    timezone = providedTimezone;
                } else {
                    // Invalid timezone, fall back to resolution
                    timezone = TimezoneResolver.resolveTimezone(request.getCity(), request.getCountry());
                }
            }
        } else {
            // Auto-resolve timezone from city and country
            timezone = TimezoneResolver.resolveTimezone(request.getCity(), request.getCountry());
        }
        
        // Update user entity
        user.setCountry(request.getCountry());
        user.setCity(request.getCity());
        user.setTimezone(timezone);
        
        // Save to database
        userRepository.save(user);
        
        // Build and return response
        return buildRegionResponse(user);
    }
    
    /**
     * Gets current region settings for a user.
     * 
     * @param user The authenticated user
     * @return RegionResponse with current region and timezone information, or defaults if not set
     */
    @Transactional(readOnly = true)
    public RegionResponse getRegionSettings(User user) {
        return buildRegionResponse(user);
    }
    
    /**
     * Builds a RegionResponse DTO from a User entity.
     * 
     * @param user The user entity
     * @return RegionResponse with region and timezone data
     */
    private RegionResponse buildRegionResponse(User user) {
        RegionResponse response = new RegionResponse();
        
        // Set country and city (may be null if not yet configured)
        response.setCountry(user.getCountry());
        response.setCity(user.getCity());
        
        // Set timezone (default to UTC if not set)
        String timezone = user.getTimezone() != null ? user.getTimezone() : "UTC";
        response.setTimezone(timezone);
        
        // Calculate current offset for the timezone
        response.setTimezoneOffset(TimezoneResolver.getTimezoneOffset(timezone));
        
        return response;
    }
}
