package com.example.foodflow.service;

import com.example.foodflow.model.dto.RegionResponse;
import com.example.foodflow.model.dto.UpdateOnboardingRequest;
import com.example.foodflow.model.dto.UpdateRegionRequest;
import com.example.foodflow.model.dto.UpdateProfileRequest;
import com.example.foodflow.model.dto.UserProfileResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.entity.ChangeStatus;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.repository.ProfileChangeRequestRepository;
import com.example.foodflow.repository.OrganizationRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessMetricsService businessMetricsService;

    @Mock
    private ProfileChangeRequestRepository changeRepository;

    @Mock
    private SensitiveFieldRegistry sensitiveFieldRegistry;

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private UserProfileService userProfileService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword("hashedpassword");
        testUser.setRole(UserRole.DONOR);

        lenient().when(changeRepository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(),
                anyString(),
                anyString(),
                any(ChangeStatus.class)
        )).thenReturn(java.util.Optional.empty());

        lenient().when(sensitiveFieldRegistry.isSensitive(anyString(), anyString()))
                .thenReturn(false);
    }

    @Test
    void updateRegionSettings_ValidTorontoCanada_ShouldResolveTimezoneAndSave() {
        UpdateRegionRequest request = new UpdateRegionRequest("Canada", "Toronto");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        RegionResponse response = userProfileService.updateRegionSettings(testUser, request);

        assertNotNull(response);
        assertEquals("Canada", response.getCountry());
        assertEquals("Toronto", response.getCity());
        assertEquals("America/Toronto", response.getTimezone());

        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfile_SuccessfulUpdate_ShouldPersistFields() {
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setFullName("New Name");
        req.setEmail("new@example.com");
        req.setPhone("+1 555-1234");
        req.setProfilePhoto("http://example.com/photo.png");
        req.setOrganizationName("Org Name");
        req.setOrganizationAddress("123 Main St");

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(organizationRepository.findByUserId(testUser.getId()))
                .thenReturn(java.util.Optional.empty());
        when(organizationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        UserProfileResponse res = userProfileService.updateProfile(testUser, req);

        assertEquals("new@example.com", res.getEmail());
        assertEquals("New Name", res.getFullName());

        verify(userRepository).save(testUser);
        verify(organizationRepository, times(2)).save(any());
    }

    @Test
    void updateOnboarding_ShouldPersistCompletionState() {
        UpdateOnboardingRequest request = new UpdateOnboardingRequest();
        request.setOnboardingCompleted(true);

        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserProfileResponse response =
                userProfileService.updateOnboarding(testUser, request);

        assertTrue(testUser.getOnboardingCompleted());
        assertTrue(response.getOnboardingCompleted());

        verify(userRepository).save(testUser);
    }
}