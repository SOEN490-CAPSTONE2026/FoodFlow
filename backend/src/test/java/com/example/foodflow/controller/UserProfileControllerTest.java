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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
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
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.RECEIVER);
        
        // Mock UserRepository to return testUser when findByEmail is called
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
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
        mockMvc.perform(get("/api/profile/region"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country").value("Canada"))
                .andExpect(jsonPath("$.city").value("Toronto"))
                .andExpect(jsonPath("$.timezone").value("America/Toronto"))
                .andExpect(jsonPath("$.timezoneOffset").value("-05:00"));
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
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
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country").value("Canada"))
                .andExpect(jsonPath("$.city").value("Toronto"))
                .andExpect(jsonPath("$.timezone").value("America/Toronto"))
                .andExpect(jsonPath("$.timezoneOffset").value("-05:00"));
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void updateRegionSettings_MissingCountry_ShouldReturn400() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCity("Toronto");
        // Country is missing
        
        // When & Then
        mockMvc.perform(put("/api/profile/region")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void updateRegionSettings_MissingCity_ShouldReturn400() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCountry("Canada");
        // City is missing
        
        // When & Then
        mockMvc.perform(put("/api/profile/region")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void updateRegionSettings_EmptyCountry_ShouldReturn400() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCountry("");  // Empty string
        request.setCity("Toronto");
        
        // When & Then
        mockMvc.perform(put("/api/profile/region")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void updateRegionSettings_EmptyCity_ShouldReturn400() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCountry("Canada");
        request.setCity("");  // Empty string
        
        // When & Then
        mockMvc.perform(put("/api/profile/region")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
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
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(usRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country").value("United States"))
                .andExpect(jsonPath("$.city").value("New York"))
                .andExpect(jsonPath("$.timezone").value("America/New_York"));
    }
    
    @Test
    void getRegionSettings_Unauthenticated_ShouldReturn403() throws Exception {
        // When & Then - Spring Security returns 403 for unauthenticated requests
        mockMvc.perform(get("/api/profile/region"))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void updateRegionSettings_Unauthenticated_ShouldReturn403() throws Exception {
        // Given
        UpdateRegionRequest request = new UpdateRegionRequest();
        request.setCountry("Canada");
        request.setCity("Toronto");
        
        // When & Then - Spring Security returns 403 for unauthenticated requests
        mockMvc.perform(put("/api/profile/region")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
