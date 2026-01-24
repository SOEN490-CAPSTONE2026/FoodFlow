package com.example.foodflow.service;

import com.example.foodflow.model.dto.RegionResponse;
import com.example.foodflow.model.dto.UpdateRegionRequest;
import com.example.foodflow.model.dto.UpdateProfileRequest;
import com.example.foodflow.model.dto.UserProfileResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
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
    }
    
    @Test
    void updateRegionSettings_ValidTorontoCanada_ShouldResolveTimezoneAndSave() {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest("Canada", "Toronto");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        RegionResponse response = userProfileService.updateRegionSettings(testUser, request);
        
        // Then
        assertNotNull(response);
        assertEquals("Canada", response.getCountry());
        assertEquals("Toronto", response.getCity());
        assertEquals("America/Toronto", response.getTimezone());
        assertNotNull(response.getTimezoneOffset());
        
        // Verify user was updated
        assertEquals("Canada", testUser.getCountry());
        assertEquals("Toronto", testUser.getCity());
        assertEquals("America/Toronto", testUser.getTimezone());
        
        // Verify repository save was called
        verify(userRepository, times(1)).save(testUser);
    }
    
    @Test
    void updateRegionSettings_ValidNewYorkUS_ShouldResolveCorrectTimezone() {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest("United States", "New York");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        RegionResponse response = userProfileService.updateRegionSettings(testUser, request);
        
        // Then
        assertEquals("United States", response.getCountry());
        assertEquals("New York", response.getCity());
        assertEquals("America/New_York", response.getTimezone());
        assertNotNull(response.getTimezoneOffset());
    }
    
    @Test
    void updateRegionSettings_ValidLondonUK_ShouldResolveCorrectTimezone() {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest("United Kingdom", "London");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        RegionResponse response = userProfileService.updateRegionSettings(testUser, request);
        
        // Then
        assertEquals("United Kingdom", response.getCountry());
        assertEquals("London", response.getCity());
        assertEquals("Europe/London", response.getTimezone());
    }
    
    @Test
    void updateRegionSettings_UnknownCity_ShouldDefaultToUTC() {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest("Unknown Country", "Unknown City");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        RegionResponse response = userProfileService.updateRegionSettings(testUser, request);
        
        // Then
        assertEquals("Unknown Country", response.getCountry());
        assertEquals("Unknown City", response.getCity());
        assertEquals("UTC", response.getTimezone());
        assertEquals("Z", response.getTimezoneOffset()); // Java returns "Z" for UTC
    }
    
    @Test
    void getRegionSettings_UserWithRegionSet_ShouldReturnSettings() {
        // Given
        testUser.setCountry("Canada");
        testUser.setCity("Toronto");
        testUser.setTimezone("America/Toronto");
        
        // When
        RegionResponse response = userProfileService.getRegionSettings(testUser);
        
        // Then
        assertNotNull(response);
        assertEquals("Canada", response.getCountry());
        assertEquals("Toronto", response.getCity());
        assertEquals("America/Toronto", response.getTimezone());
        assertNotNull(response.getTimezoneOffset());
        
        // Verify no save was called (read-only operation)
        verify(userRepository, never()).save(any(User.class));
    }
    
    @Test
    void getRegionSettings_UserWithoutRegionSet_ShouldReturnNullsAndDefaultUTC() {
        // Given
        // testUser has no region/timezone set (all nulls)
        
        // When
        RegionResponse response = userProfileService.getRegionSettings(testUser);
        
        // Then
        assertNotNull(response);
        assertNull(response.getCountry());
        assertNull(response.getCity());
        assertEquals("UTC", response.getTimezone()); // Default to UTC
        assertEquals("Z", response.getTimezoneOffset()); // Java returns "Z" for UTC
    }
    
    @Test
    void updateRegionSettings_ValidParisFrance_ShouldResolveCorrectTimezone() {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest("France", "Paris");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        RegionResponse response = userProfileService.updateRegionSettings(testUser, request);
        
        // Then
        assertEquals("France", response.getCountry());
        assertEquals("Paris", response.getCity());
        assertEquals("Europe/Paris", response.getTimezone());
    }
    
    @Test
    void updateRegionSettings_ValidTokyoJapan_ShouldResolveCorrectTimezone() {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest("Japan", "Tokyo");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        RegionResponse response = userProfileService.updateRegionSettings(testUser, request);
        
        // Then
        assertEquals("Japan", response.getCountry());
        assertEquals("Tokyo", response.getCity());
        assertEquals("Asia/Tokyo", response.getTimezone());
    }
    
    @Test
    void updateRegionSettings_ShouldPersistChanges() {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest("Canada", "Vancouver");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // When
        userProfileService.updateRegionSettings(testUser, request);
        
        // Then
        verify(userRepository, times(1)).save(testUser);
        assertEquals("Canada", testUser.getCountry());
        assertEquals("Vancouver", testUser.getCity());
        assertEquals("America/Vancouver", testUser.getTimezone());
    }

    // --- tests for updateProfile ---
    @Mock
    private com.example.foodflow.repository.OrganizationRepository organizationRepository;

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
        when(organizationRepository.findByUserId(testUser.getId())).thenReturn(java.util.Optional.empty());
        when(organizationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        UserProfileResponse res = userProfileService.updateProfile(testUser, req);

        assertEquals("new@example.com", res.getEmail());
        assertEquals("New Name", res.getFullName());
        assertEquals("+1 555-1234", res.getPhone());
        assertEquals("http://example.com/photo.png", res.getProfilePhoto());
        assertEquals("Org Name", res.getOrganizationName());
        assertEquals("123 Main St", res.getOrganizationAddress());

        verify(userRepository, times(1)).save(testUser);
        verify(organizationRepository, times(1)).save(any());
    }

    @Test
    void updateProfile_EmailAlreadyUsed_ShouldThrow() {
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setFullName("Name");
        req.setEmail("exists@example.com");
        req.setPhone("+1 555-1234");

        when(userRepository.existsByEmail("exists@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> userProfileService.updateProfile(testUser, req));
    }

    @Test
    void updateProfile_InvalidPhone_ShouldThrow() {
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setFullName("Name");
        req.setEmail("ok@example.com");
        req.setPhone("badphone");

        when(userRepository.existsByEmail("ok@example.com")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> userProfileService.updateProfile(testUser, req));
    }
}
