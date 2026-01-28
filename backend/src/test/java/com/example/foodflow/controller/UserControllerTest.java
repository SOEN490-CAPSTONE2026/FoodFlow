package com.example.foodflow.controller;

import com.example.foodflow.model.dto.UpdateNotificationPreferencesRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.UserService;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private UserService userService;
    
    private User testUser;
    private UsernamePasswordAuthenticationToken authentication;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.RECEIVER);
        testUser.setEmailNotificationsEnabled(true);
        testUser.setSmsNotificationsEnabled(false);
        
        authentication = new UsernamePasswordAuthenticationToken(
            testUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority(UserRole.RECEIVER.name()))
        );
    }
    
    @Test
    void getNotificationPreferences_AuthenticatedUser_ShouldReturn200() throws Exception {
        // Given
        when(userService.getUserById(anyLong())).thenReturn(testUser);
        
        Map<String, Boolean> notificationTypes = new HashMap<>();
        notificationTypes.put("NEW_CLAIM", true);
        notificationTypes.put("DONATION_UPDATE", true);
        notificationTypes.put("MESSAGE", false);
        
        when(userService.getNotificationTypePreferences(anyLong())).thenReturn(notificationTypes);
        
        // When & Then
        mockMvc.perform(get("/api/user/notifications/preferences")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(true))
                .andExpect(jsonPath("$.smsNotificationsEnabled").value(false))
                .andExpect(jsonPath("$.notificationTypes.NEW_CLAIM").value(true))
                .andExpect(jsonPath("$.notificationTypes.DONATION_UPDATE").value(true))
                .andExpect(jsonPath("$.notificationTypes.MESSAGE").value(false));
    }
    
    @Test
    void getNotificationPreferences_Unauthenticated_ShouldReturn403() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/user/notifications/preferences"))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void updateNotificationPreferences_ValidRequest_ShouldReturn200() throws Exception {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(false);
        request.setSmsNotificationsEnabled(true);
        
        Map<String, Boolean> notificationTypes = new HashMap<>();
        notificationTypes.put("NEW_CLAIM", false);
        notificationTypes.put("DONATION_UPDATE", true);
        request.setNotificationTypes(notificationTypes);
        
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setEmailNotificationsEnabled(false);
        updatedUser.setSmsNotificationsEnabled(true);
        
        when(userService.updateNotificationPreferences(anyLong(), any(UpdateNotificationPreferencesRequest.class)))
            .thenReturn(updatedUser);
        
        when(userService.getNotificationTypePreferences(anyLong())).thenReturn(notificationTypes);
        
        // When & Then
        mockMvc.perform(put("/api/user/notifications/preferences")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(false))
                .andExpect(jsonPath("$.smsNotificationsEnabled").value(true))
                .andExpect(jsonPath("$.notificationTypes.NEW_CLAIM").value(false))
                .andExpect(jsonPath("$.notificationTypes.DONATION_UPDATE").value(true));
    }
    
    @Test
    void updateNotificationPreferences_InvalidRequest_ShouldReturn400() throws Exception {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(true);
        
        when(userService.updateNotificationPreferences(anyLong(), any(UpdateNotificationPreferencesRequest.class)))
            .thenThrow(new IllegalArgumentException("Invalid notification preference"));
        
        // When & Then
        mockMvc.perform(put("/api/user/notifications/preferences")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void updateNotificationPreferences_ServiceError_ShouldReturn500() throws Exception {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(true);
        
        when(userService.updateNotificationPreferences(anyLong(), any(UpdateNotificationPreferencesRequest.class)))
            .thenThrow(new RuntimeException("Database error"));
        
        // When & Then
        mockMvc.perform(put("/api/user/notifications/preferences")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }
    
    @Test
    void updateNotificationPreferences_Unauthenticated_ShouldReturn403() throws Exception {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(true);
        
        // When & Then
        mockMvc.perform(put("/api/user/notifications/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void updateNotificationPreferences_EnableAllNotifications_ShouldReturn200() throws Exception {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(true);
        request.setSmsNotificationsEnabled(true);
        
        Map<String, Boolean> notificationTypes = new HashMap<>();
        notificationTypes.put("NEW_CLAIM", true);
        notificationTypes.put("DONATION_UPDATE", true);
        notificationTypes.put("MESSAGE", true);
        request.setNotificationTypes(notificationTypes);
        
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setEmailNotificationsEnabled(true);
        updatedUser.setSmsNotificationsEnabled(true);
        
        when(userService.updateNotificationPreferences(anyLong(), any(UpdateNotificationPreferencesRequest.class)))
            .thenReturn(updatedUser);
        
        when(userService.getNotificationTypePreferences(anyLong())).thenReturn(notificationTypes);
        
        // When & Then
        mockMvc.perform(put("/api/user/notifications/preferences")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(true))
                .andExpect(jsonPath("$.smsNotificationsEnabled").value(true))
                .andExpect(jsonPath("$.notificationTypes.NEW_CLAIM").value(true))
                .andExpect(jsonPath("$.notificationTypes.DONATION_UPDATE").value(true))
                .andExpect(jsonPath("$.notificationTypes.MESSAGE").value(true));
    }
    
    @Test
    void updateNotificationPreferences_DisableAllNotifications_ShouldReturn200() throws Exception {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(false);
        request.setSmsNotificationsEnabled(false);
        
        Map<String, Boolean> notificationTypes = new HashMap<>();
        notificationTypes.put("NEW_CLAIM", false);
        notificationTypes.put("DONATION_UPDATE", false);
        notificationTypes.put("MESSAGE", false);
        request.setNotificationTypes(notificationTypes);
        
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setEmailNotificationsEnabled(false);
        updatedUser.setSmsNotificationsEnabled(false);
        
        when(userService.updateNotificationPreferences(anyLong(), any(UpdateNotificationPreferencesRequest.class)))
            .thenReturn(updatedUser);
        
        when(userService.getNotificationTypePreferences(anyLong())).thenReturn(notificationTypes);
        
        // When & Then
        mockMvc.perform(put("/api/user/notifications/preferences")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(false))
                .andExpect(jsonPath("$.smsNotificationsEnabled").value(false))
                .andExpect(jsonPath("$.notificationTypes.NEW_CLAIM").value(false))
                .andExpect(jsonPath("$.notificationTypes.DONATION_UPDATE").value(false))
                .andExpect(jsonPath("$.notificationTypes.MESSAGE").value(false));
    }
}
