package com.example.foodflow.service;

import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.*;
import com.example.foodflow.util.TimezoneResolver;
import io.micrometer.core.annotation.Timed;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final BusinessMetricsService businessMetricsService;
    private final ProfileChangeService profileChangeService;
    private final SensitiveFieldRegistry sensitiveFieldRegistry;
    private final ProfileChangeRequestRepository changeRepository;

    public UserProfileService(UserRepository userRepository,
                              OrganizationRepository organizationRepository,
                              BusinessMetricsService businessMetricsService,
                              ProfileChangeService profileChangeService,
                              SensitiveFieldRegistry sensitiveFieldRegistry,
                              ProfileChangeRequestRepository changeRepository) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.businessMetricsService = businessMetricsService;
        this.profileChangeService = profileChangeService;
        this.sensitiveFieldRegistry = sensitiveFieldRegistry;
        this.changeRepository = changeRepository;
    }

    // ============================================
    // REGION SETTINGS
    // ============================================

    @Transactional(readOnly = true)
    public RegionResponse getRegionSettings(User user) {
        return buildRegionResponse(user);
    }

    @Transactional
    @Timed(value = "userprofile.service.updateRegionSettings",
            description = "Time taken to update region settings")
    public RegionResponse updateRegionSettings(User user, UpdateRegionRequest request) {

        String timezone;

        if (request.getTimezone() != null && !request.getTimezone().trim().isEmpty()) {

            String providedTimezone = request.getTimezone().trim();

            if (providedTimezone.startsWith("UTC") || providedTimezone.startsWith("GMT")) {
                timezone = TimezoneResolver.convertOffsetToTimezone(providedTimezone);
            } else if (TimezoneResolver.isValidTimezone(providedTimezone)) {
                timezone = providedTimezone;
            } else {
                timezone = TimezoneResolver.resolveTimezone(
                        request.getCity(),
                        request.getCountry()
                );
            }

        } else {
            timezone = TimezoneResolver.resolveTimezone(
                    request.getCity(),
                    request.getCountry()
            );
        }

        user.setCountry(request.getCountry());
        user.setCity(request.getCity());
        user.setTimezone(timezone);

        userRepository.save(user);

        return buildRegionResponse(user);
    }

    // ============================================
    // UPDATE PROFILE
    // ============================================

    @Transactional
    @Timed(value = "userprofile.service.updateProfile",
            description = "Time taken to update user profile")
    public UserProfileResponse updateProfile(User user, UpdateProfileRequest request) {

        boolean namePending = false;
        boolean addressPending = false;

        if (request.getEmail() != null &&
                !request.getEmail().equalsIgnoreCase(user.getEmail())) {

            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email already in use");
            }

            user.setEmail(request.getEmail());
        }

        String phoneValue = request.getPhone();
        if (phoneValue != null && !phoneValue.trim().isEmpty()) {

            Pattern phonePattern = Pattern.compile("^[+0-9 ()-]{7,20}$");

            if (!phonePattern.matcher(phoneValue).matches()) {
                throw new IllegalArgumentException("Invalid phone format");
            }

            user.setPhone(phoneValue);
        }

        if (request.getFullName() != null &&
                !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName());
        }

        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto());
        }

        userRepository.save(user);
        businessMetricsService.incrementProfileUpdates();

        Organization existingOrg =
                organizationRepository.findByUserId(user.getId()).orElse(null);

        String nameValue = request.getOrganizationName();
        String addressValue = request.getOrganizationAddress();

        if (nameValue != null && !nameValue.trim().isEmpty()) {

            boolean isSensitive =
                    sensitiveFieldRegistry.isSensitive("ORGANIZATION", "name");

            if (isSensitive) {
                namePending = profileChangeService.handleOrganizationFieldUpdate(
                        user, existingOrg, "name", nameValue);
            } else {
                if (existingOrg == null) {
                    existingOrg = new Organization();
                    existingOrg.setUser(user);
                }
                existingOrg.setName(nameValue);
                organizationRepository.save(existingOrg);
            }
        }

        if (addressValue != null && !addressValue.trim().isEmpty()) {

            boolean isSensitive =
                    sensitiveFieldRegistry.isSensitive("ORGANIZATION", "address");

            if (isSensitive) {
                addressPending = profileChangeService.handleOrganizationFieldUpdate(
                        user, existingOrg, "address", addressValue);
            } else {
                if (existingOrg == null) {
                    existingOrg = new Organization();
                    existingOrg.setUser(user);
                }
                existingOrg.setAddress(addressValue);
                organizationRepository.save(existingOrg);
            }
        }

        UserProfileResponse response = getProfile(user);
        response.setOrganizationChangePending(namePending || addressPending);

        return response;
    }

    // ============================================
    // UPDATE ONBOARDING ✅
    // ============================================

    @Transactional
    public UserProfileResponse updateOnboarding(User user, UpdateOnboardingRequest request) {
        user.setOnboardingCompleted(Boolean.TRUE.equals(request.getOnboardingCompleted()));
        userRepository.save(user);
        return getProfile(user);
    }

    // ============================================
    // GET PROFILE
    // ============================================

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(User user) {

        UserProfileResponse response = new UserProfileResponse();

        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhone(user.getPhone());
        response.setPhoneNumber(user.getPhone());
        response.setProfilePhoto(user.getProfilePhoto());
        response.setOnboardingCompleted(Boolean.TRUE.equals(user.getOnboardingCompleted()));

        Organization org =
                organizationRepository.findByUserId(user.getId()).orElse(null);

        if (org != null) {
            response.setOrganizationName(org.getName());
            response.setOrganizationAddress(org.getAddress());
            response.setAddress(org.getAddress());
        }

        Optional<ProfileChangeRequest> pending =
                changeRepository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                        user.getId(),
                        "ORGANIZATION",
                        "name",
                        ChangeStatus.PENDING
                );

        pending.ifPresent(request -> {
            PendingChangeDTO dto = new PendingChangeDTO();
            dto.setNewValue(request.getNewValue());
            dto.setStatus(request.getStatus().name());
            response.setPendingOrganizationChange(dto);
        });

        Optional<ProfileChangeRequest> rejected =
                changeRepository.findTopByUser_IdAndEntityTypeAndFieldNameAndStatusOrderByReviewedAtDesc(
                        user.getId(),
                        "ORGANIZATION",
                        "name",
                        ChangeStatus.REJECTED
                );

        rejected.ifPresent(request -> {
            PendingChangeDTO dto = new PendingChangeDTO();
            dto.setNewValue(request.getNewValue());
            dto.setStatus(request.getStatus().name());
            response.setLastRejectedOrganizationChange(dto);
        });

        return response;
    }

    private RegionResponse buildRegionResponse(User user) {

        RegionResponse response = new RegionResponse();
        response.setCountry(user.getCountry());
        response.setCity(user.getCity());

        String timezone = user.getTimezone() != null ? user.getTimezone() : "UTC";
        response.setTimezone(timezone);
        response.setTimezoneOffset(
                TimezoneResolver.getTimezoneOffset(timezone)
        );

        return response;
    }
}