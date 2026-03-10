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
    private final ProfileChangeService profileChangeService;
    private final SensitiveFieldRegistry sensitiveFieldRegistry;

    public UserProfileService(UserRepository userRepository,
                              OrganizationRepository organizationRepository,
                              BusinessMetricsService businessMetricsService,
                              ProfileChangeService profileChangeService,
                              SensitiveFieldRegistry sensitiveFieldRegistry) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.businessMetricsService = businessMetricsService;
        this.profileChangeService = profileChangeService;
        this.sensitiveFieldRegistry = sensitiveFieldRegistry;
    }

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
        businessMetricsService.incrementRegionSettingsUpdates();

        return buildRegionResponse(user);
    }

    @Transactional(readOnly = true)
    public RegionResponse getRegionSettings(User user) {
        return buildRegionResponse(user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(User user) {

        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhone(user.getPhone());
        response.setPhoneNumber(user.getPhone());
        response.setProfilePhoto(user.getProfilePhoto());

        Organization org = organizationRepository.findByUserId(user.getId()).orElse(null);

        if (org != null) {
            response.setOrganizationName(org.getName());
            response.setOrganizationAddress(org.getAddress());
            response.setAddress(org.getAddress());

            if (response.getFullName() == null && org.getContactPerson() != null) {
                response.setFullName(org.getContactPerson());
            }
            if (response.getPhone() == null && org.getPhone() != null) {
                response.setPhone(org.getPhone());
                response.setPhoneNumber(org.getPhone());
            }
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

        // Validate and set phone
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

        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto());
        }

        userRepository.save(user);
        businessMetricsService.incrementProfileUpdates();

        /*
         * ==============================
         * ORGANIZATION HANDLING (FIXED)
         * ==============================
         */

        Organization existingOrg =
                organizationRepository.findByUserId(user.getId()).orElse(null);

        String nameValue = request.getOrganizationName();
        String addressValue = request.getOrganizationAddress();

        // Handle sensitive organization name
        if (nameValue != null && !nameValue.trim().isEmpty()) {

            boolean isSensitive =
                    sensitiveFieldRegistry.isSensitive("ORGANIZATION", "name");

            if (isSensitive) {

                profileChangeService.handleOrganizationFieldUpdate(
                        user,
                        existingOrg,
                        "name",
                        nameValue
                );

            } else {

                if (existingOrg == null) {
                    existingOrg = new Organization();
                    existingOrg.setUser(user);
                }

                existingOrg.setName(nameValue);
                organizationRepository.save(existingOrg);
            }
        }

        // Handle address (ONLY if org already exists)
        if (addressValue != null && !addressValue.trim().isEmpty()) {

            if (existingOrg != null) {
                existingOrg.setAddress(addressValue);
                organizationRepository.save(existingOrg);
            }
        }

        userRepository.save(user);
        return getProfile(user);
    }

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
