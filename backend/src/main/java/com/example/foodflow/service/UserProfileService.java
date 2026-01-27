package com.example.foodflow.service;

import com.example.foodflow.model.dto.RegionResponse;
import com.example.foodflow.model.dto.UpdateProfileRequest;
import com.example.foodflow.model.dto.UpdateRegionRequest;
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
     */
    @Transactional
    @Timed(value = "userprofile.service.updateRegionSettings", description = "Time taken to update region settings")
    public RegionResponse updateRegionSettings(User user, UpdateRegionRequest request) {
        String timezone;
        if (request.getTimezone() != null && !request.getTimezone().trim().isEmpty()) {
            String providedTimezone = request.getTimezone().trim();
            
            if (providedTimezone.startsWith("UTC") || providedTimezone.startsWith("GMT")) {
                timezone = TimezoneResolver.convertOffsetToTimezone(providedTimezone);
            } else {
                if (TimezoneResolver.isValidTimezone(providedTimezone)) {
                    timezone = providedTimezone;
                } else {
                    timezone = TimezoneResolver.resolveTimezone(request.getCity(), request.getCountry());
                }
            }
        } else {
            timezone = TimezoneResolver.resolveTimezone(request.getCity(), request.getCountry());
        }
        
        user.setCountry(request.getCountry());
        user.setCity(request.getCity());
        user.setTimezone(timezone);
        
        userRepository.save(user);
        businessMetricsService.incrementRegionSettingsUpdates();
        
        return buildRegionResponse(user);
    }
    
    /**
     * Gets current region settings for a user.
     */
    @Transactional(readOnly = true)
    public RegionResponse getRegionSettings(User user) {
        return buildRegionResponse(user);
    }
    
    /**
     * Gets user profile data including organization information.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhone(user.getPhone());
        response.setPhoneNumber(user.getPhone());
        response.setProfilePhoto(user.getProfilePhoto());
        
        Organization org = user.getOrganization();
        if (org != null) {
            response.setOrganizationName(org.getName());
            response.setOrganizationAddress(org.getAddress());
            response.setAddress(org.getAddress());
            // Fallback: use org contact info if user fields are empty
            if (response.getFullName() == null && org.getContactPerson() != null) {
                response.setFullName(org.getContactPerson());
            }
            if (response.getPhone() == null && org.getPhone() != null) {
                response.setPhone(org.getPhone());
                response.setPhoneNumber(org.getPhone());
            }
        } else {
            organizationRepository.findByUserId(user.getId()).ifPresent(o -> {
                response.setOrganizationName(o.getName());
                response.setOrganizationAddress(o.getAddress());
                response.setAddress(o.getAddress());
                if (response.getFullName() == null && o.getContactPerson() != null) {
                    response.setFullName(o.getContactPerson());
                }
                if (response.getPhone() == null && o.getPhone() != null) {
                    response.setPhone(o.getPhone());
                    response.setPhoneNumber(o.getPhone());
                }
            });
        }
        
        return response;
    }
    
    /**
     * Updates user profile data.
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

        // Validate and set phone (supports both phone and phoneNumber fields)
        String phoneValue = request.getPhone();
        if (phoneValue != null && !phoneValue.trim().isEmpty()) {
            final Pattern phonePattern = Pattern.compile("^[+0-9 ()-]{7,20}$");
            if (!phonePattern.matcher(phoneValue).matches()) {
                throw new IllegalArgumentException("Invalid phone format");
            }
            user.setPhone(phoneValue);
        }

        // Full name
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName());
        }

        // Profile photo optional
        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto());
        }

        userRepository.save(user);
        businessMetricsService.incrementProfileUpdates();

        // Organization fields
        String addressValue = request.getOrganizationAddress();
        
        if ((request.getOrganizationName() != null && !request.getOrganizationName().trim().isEmpty()) ||
            (addressValue != null && !addressValue.trim().isEmpty())) {

            Organization org = organizationRepository.findByUserId(user.getId()).orElseGet(() -> {
                Organization o = new Organization();
                o.setUser(user);
                return o;
            });
            
            if (request.getOrganizationName() != null) {
                org.setName(request.getOrganizationName());
            }
            if (addressValue != null) {
                org.setAddress(addressValue);
            }
            if (request.getFullName() != null) {
                org.setContactPerson(request.getFullName());
            }
            if (phoneValue != null) {
                org.setPhone(phoneValue);
            }

            organizationRepository.save(org);
            user.setOrganization(org);
        }
        
        return getProfile(user);
    }
    
    /**
     * Builds a RegionResponse DTO from a User entity.
     */
    private RegionResponse buildRegionResponse(User user) {
        RegionResponse response = new RegionResponse();
        response.setCountry(user.getCountry());
        response.setCity(user.getCity());
        
        String timezone = user.getTimezone() != null ? user.getTimezone() : "UTC";
        response.setTimezone(timezone);
        response.setTimezoneOffset(TimezoneResolver.getTimezoneOffset(timezone));
        
        return response;
    }
}
