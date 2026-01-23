package com.example.foodflow.service;

import com.example.foodflow.model.dto.RegionResponse;
import com.example.foodflow.model.dto.UpdateRegionRequest;
import com.example.foodflow.model.dto.UpdateProfileRequest;
import com.example.foodflow.model.dto.UserProfileResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.util.TimezoneResolver;
import com.example.foodflow.service.BusinessMetricsService;
import io.micrometer.core.annotation.Timed;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

/**
 * Service for managing user profile settings including region and timezone.
 */
@Service
public class UserProfileService {
    
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final BusinessMetricsService businessMetricsService;
    
    public UserProfileService(UserRepository userRepository, OrganizationRepository organizationRepository, BusinessMetricsService businessMetricsService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.businessMetricsService = businessMetricsService;
    }
    
    /**
     * Updates user's region settings (country, city) and automatically resolves timezone.
     * 
     * @param user The authenticated user
     * @param request The region update request containing country and city
     * @return RegionResponse with updated region and timezone information
     */
    @Transactional
    @Timed(value = "userprofile.service.updateRegionSettings", description = "Time taken to update region settings")
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
        businessMetricsService.incrementRegionSettingsUpdates();
        
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
     * Returns basic profile information for the user
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhone(user.getPhone());
        response.setProfilePhoto(user.getProfilePhoto());

        if (user.getOrganization() != null) {
            Organization org = user.getOrganization();
            response.setOrganizationName(org.getName());
            response.setOrganizationAddress(org.getAddress());
        } else {
            organizationRepository.findByUserId(user.getId()).ifPresent(org -> {
                response.setOrganizationName(org.getName());
                response.setOrganizationAddress(org.getAddress());
            });
        }

        return response;
    }

    /**
     * Updates user's profile fields and organization info when provided
     */
    @Transactional
    @Timed(value = "userprofile.service.updateProfile", description = "Time taken to update user profile")
    public UserProfileResponse updateProfile(User user, UpdateProfileRequest request) {
        // Validate email uniqueness if changing
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        // Validate and set phone ONLY if provided
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            final Pattern phonePattern = Pattern.compile("^[+0-9 ()-]{7,20}$");
            if (!phonePattern.matcher(request.getPhone()).matches()) {
                throw new IllegalArgumentException("Invalid phone format");
            }
            user.setPhone(request.getPhone());
        }

        // Full name required
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName());
        }

        // Profile photo optional (store provided string base64)
        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto());
        }

        userRepository.save(user);
        businessMetricsService.incrementProfileUpdates();

        // Organization fields
        if ((request.getOrganizationName() != null && !request.getOrganizationName().trim().isEmpty()) ||
            (request.getOrganizationAddress() != null && !request.getOrganizationAddress().trim().isEmpty())) {

            Organization org = organizationRepository.findByUserId(user.getId()).orElseGet(() -> {
                Organization o = new Organization();
                o.setUser(user);
                return o;
            });
            if (request.getOrganizationName() != null) org.setName(request.getOrganizationName());
            if (request.getOrganizationAddress() != null) org.setAddress(request.getOrganizationAddress());

            organizationRepository.save(org);
            user.setOrganization(org);
        }
        return getProfile(user);
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
