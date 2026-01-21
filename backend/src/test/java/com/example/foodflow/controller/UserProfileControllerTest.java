package com.example.foodflow.controller;

import com.example.foodflow.model.dto.RegionResponse;
import com.example.foodflow.model.dto.UpdateRegionRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.service.UserProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserProfileControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private UserProfileService userProfileService;
    
    @MockBean
    private UserRepository userRepository;
    
    private User testUser;
    private UsernamePasswordAuthenticationToken authentication;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.RECEIVER);
        
        // Create authentication token with the User entity as principal
        authentication = new UsernamePasswordAuthenticationToken(
            testUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority(UserRole.RECEIVER.name()))
        );
        
        // Mock UserRepository to return testUser when findByEmail is called
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        
        // Clear SecurityContext before each test to ensure clean state
        SecurityContextHolder.clearContext();
    }
    
    @Test
    void getRegionSettings_AuthenticatedUser_ShouldReturn200() throws Exception {
        // Given
        RegionResponse response = new RegionResponse();
        response.setCountry("Canada");
        response.setCity("Toronto");
        response.setTimezone("America/Toronto");
        response.setTimezoneOffset("-05:00");
        
        when(userProfileService.getRegionSettings(any()))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(get("/api/profile/region")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country").value("Canada"))
                .andExpect(jsonPath("$.city").value("Toronto"))
                .andExpect(jsonPath("$.timezone").value("America/Toronto"))
                .andExpect(jsonPath("$.timezoneOffset").value("-05:00"));
    }
    
    @Test
    void updateRegionSettings_ValidRequest_ShouldReturn200() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCountry("Canada");
        request.setCity("Toronto");
        
        RegionResponse response = new RegionResponse();
        response.setCountry("Canada");
        response.setCity("Toronto");
        response.setTimezone("America/Toronto");
        response.setTimezoneOffset("-05:00");
        
        when(userProfileService.updateRegionSettings(any(), any(UpdateRegionRequest.class)))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(put("/api/profile/region")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country").value("Canada"))
                .andExpect(jsonPath("$.city").value("Toronto"))
                .andExpect(jsonPath("$.timezone").value("America/Toronto"))
                .andExpect(jsonPath("$.timezoneOffset").value("-05:00"));
    }
    
    @Test
    void updateRegionSettings_MissingCountry_ShouldReturn400() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCity("Toronto");
        // Country is missing
        
        // When & Then
        mockMvc.perform(put("/api/profile/region")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void updateRegionSettings_MissingCity_ShouldReturn400() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCountry("Canada");
        // City is missing
        
        // When & Then
        mockMvc.perform(put("/api/profile/region")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void updateRegionSettings_EmptyCountry_ShouldReturn400() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCountry("");  // Empty string
        request.setCity("Toronto");
        
        // When & Then
        mockMvc.perform(put("/api/profile/region")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void updateRegionSettings_EmptyCity_ShouldReturn400() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCountry("Canada");
        request.setCity("");  // Empty string
        
        // When & Then
        mockMvc.perform(put("/api/profile/region")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void updateRegionSettings_DifferentCountries_ShouldWorkCorrectly() throws Exception {
        // Test with different country/city combinations
        
        // United States - New York
        UpdateRegionRequest usRequest = new UpdateRegionRequest();
        usRequest.setCountry("United States");
        usRequest.setCity("New York");
        
        RegionResponse usResponse = new RegionResponse();
        usResponse.setCountry("United States");
        usResponse.setCity("New York");
        usResponse.setTimezone("America/New_York");
        usResponse.setTimezoneOffset("-05:00");
        
        when(userProfileService.updateRegionSettings(any(), any(UpdateRegionRequest.class)))
            .thenReturn(usResponse);
        
        mockMvc.perform(put("/api/profile/region")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(usRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country").value("United States"))
                .andExpect(jsonPath("$.city").value("New York"))
                .andExpect(jsonPath("$.timezone").value("America/New_York"));
    }
    
    @Test
    void getRegionSettings_Unauthenticated_ShouldReturn403() throws Exception {
        // When & Then - No authentication provided, Spring Security should return 403
        mockMvc.perform(get("/api/profile/region"))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void updateRegionSettings_Unauthenticated_ShouldReturn403() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCountry("Canada");
        request.setCity("Toronto");
        
        // When & Then - No authentication provided, Spring Security should return 403
        mockMvc.perform(put("/api/profile/region")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getProfile_AuthenticatedUser_ShouldReturn200() throws Exception {
        // Given
        com.example.foodflow.model.dto.UserProfileResponse response = 
            new com.example.foodflow.model.dto.UserProfileResponse();
        response.setId(1L);
        response.setEmail("test@example.com");
        response.setFullName("John Doe");
        response.setPhone("+1234567890");
        response.setProfilePhoto("https://example.com/photo.jpg");
        response.setOrganizationName("Test Organization");
        response.setOrganizationAddress("123 Test St, Test City");
        
        when(userProfileService.getProfile(any()))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(get("/api/profile")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.fullName").value("John Doe"))
                .andExpect(jsonPath("$.phone").value("+1234567890"))
                .andExpect(jsonPath("$.profilePhoto").value("https://example.com/photo.jpg"))
                .andExpect(jsonPath("$.organizationName").value("Test Organization"))
                .andExpect(jsonPath("$.organizationAddress").value("123 Test St, Test City"));
    }
    
    @Test
    void getProfile_Unauthenticated_ShouldReturn403() throws Exception {
        // When & Then - No authentication provided, Spring Security should return 403
        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void updateProfile_Unauthenticated_ShouldReturn403() throws Exception {
        // Given
        com.example.foodflow.model.dto.UpdateProfileRequest request = 
            new com.example.foodflow.model.dto.UpdateProfileRequest();
        request.setFullName("Jane Smith");
        
        // When & Then - No authentication provided, Spring Security should return 403
        mockMvc.perform(put("/api/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void updateProfile_InvalidEmail_ShouldReturn400() throws Exception {
        // Given - Assuming UpdateProfileRequest has email validation
        com.example.foodflow.model.dto.UpdateProfileRequest request = 
            new com.example.foodflow.model.dto.UpdateProfileRequest();
        request.setFullName("Jane Smith");
        request.setEmail("invalid-email"); // Invalid email format
        
        // When & Then - Should return 400 due to validation error
        mockMvc.perform(put("/api/profile")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void updateProfile_EmptyFullName_ShouldReturn400() throws Exception {
        // Given - Assuming fullName has @NotBlank validation
        com.example.foodflow.model.dto.UpdateProfileRequest request = 
            new com.example.foodflow.model.dto.UpdateProfileRequest();
        request.setFullName(""); // Empty string
        request.setPhone("+1234567890");
        
        // When & Then - Should return 400 due to validation error
        mockMvc.perform(put("/api/profile")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}