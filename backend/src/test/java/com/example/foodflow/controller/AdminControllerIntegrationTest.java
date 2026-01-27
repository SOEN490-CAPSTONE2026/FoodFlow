package com.example.foodflow.controller;

import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import com.example.foodflow.service.AdminDonationService;
import com.example.foodflow.service.AdminUserService;
import com.example.foodflow.service.DisputeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private AdminUserService adminUserService;
    
    @MockBean
    private AdminDonationService adminDonationService;
    
    @MockBean
    private DisputeService disputeService;
    
    @MockBean
    private JwtTokenProvider jwtTokenProvider;
    
    @MockBean
    private UserRepository userRepository;
    
    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;
    private AdminUserResponse testUserResponse;
    
    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@test.com");
        adminUser.setRole(UserRole.ADMIN);
        
        adminAuth = new UsernamePasswordAuthenticationToken(
            adminUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority("ADMIN"))
        );
        
        testUserResponse = new AdminUserResponse();
        testUserResponse.setId(2L);
        testUserResponse.setEmail("user@test.com");
        testUserResponse.setRole("DONOR");
        testUserResponse.setAccountStatus("ACTIVE");
        testUserResponse.setCreatedAt(LocalDateTime.now());
        testUserResponse.setDonationCount(5L);
        testUserResponse.setClaimCount(2L);
    }
    
    @Test
    void getAllUsers_ShouldReturn200() throws Exception {
        // Given
        Page<AdminUserResponse> page = new PageImpl<>(Collections.singletonList(testUserResponse));
        when(adminUserService.getAllUsers(null, null, null, 0, 20)).thenReturn(page);
        
        // When & Then
        mockMvc.perform(get("/api/admin/users")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].email").value("user@test.com"));
    }
    
    @Test
    void getAllUsers_WithFilters_ShouldReturn200() throws Exception {
        // Given
        Page<AdminUserResponse> page = new PageImpl<>(Collections.singletonList(testUserResponse));
        when(adminUserService.getAllUsers("DONOR", "ACTIVE", "user", 0, 20)).thenReturn(page);
        
        // When & Then
        mockMvc.perform(get("/api/admin/users")
                .param("role", "DONOR")
                .param("accountStatus", "ACTIVE")
                .param("search", "user")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].role").value("DONOR"));
    }
    
    @Test
    void getAllUsers_ServiceThrowsException_ShouldReturn500() throws Exception {
        // Given
        when(adminUserService.getAllUsers(any(), any(), any(), anyInt(), anyInt()))
            .thenThrow(new RuntimeException("Database error"));
        
        // When & Then
        mockMvc.perform(get("/api/admin/users")
                .with(authentication(adminAuth)))
                .andExpect(status().isInternalServerError());
    }
    
    @Test
    void getUserById_ShouldReturn200() throws Exception {
        // Given
        when(adminUserService.getUserById(2L)).thenReturn(testUserResponse);
        
        // When & Then
        mockMvc.perform(get("/api/admin/users/2")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.email").value("user@test.com"));
    }
    
    @Test
    void getUserById_UserNotFound_ShouldReturn404() throws Exception {
        // Given
        when(adminUserService.getUserById(999L))
            .thenThrow(new RuntimeException("User not found"));
        
        // When & Then
        mockMvc.perform(get("/api/admin/users/999")
                .with(authentication(adminAuth)))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void deactivateUser_ValidRequest_ShouldReturn200() throws Exception {
        // Given
        DeactivateUserRequest request = new DeactivateUserRequest();
        request.setAdminNotes("Policy violation");
        
        testUserResponse.setAccountStatus("DEACTIVATED");
        testUserResponse.setDeactivatedAt(LocalDateTime.now());
        
        when(jwtTokenProvider.getEmailFromToken(anyString())).thenReturn("admin@test.com");
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(adminUserService.deactivateUser(eq(2L), eq("Policy violation"), eq(1L)))
            .thenReturn(testUserResponse);
        
        // When & Then
        mockMvc.perform(put("/api/admin/users/2/deactivate")
                .header("Authorization", "Bearer fake-token")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountStatus").value("DEACTIVATED"));
    }
    
    @Test
    void deactivateUser_InvalidRequest_ShouldReturn400() throws Exception {
        // Given
        DeactivateUserRequest request = new DeactivateUserRequest();
        request.setAdminNotes("Test");
        
        when(jwtTokenProvider.getEmailFromToken(anyString())).thenReturn("admin@test.com");
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(adminUserService.deactivateUser(anyLong(), anyString(), anyLong()))
            .thenThrow(new RuntimeException("Already deactivated"));
        
        // When & Then
        mockMvc.perform(put("/api/admin/users/2/deactivate")
                .header("Authorization", "Bearer fake-token")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void reactivateUser_ShouldReturn200() throws Exception {
        // Given
        testUserResponse.setAccountStatus("ACTIVE");
        when(adminUserService.reactivateUser(2L)).thenReturn(testUserResponse);
        
        // When & Then
        mockMvc.perform(put("/api/admin/users/2/reactivate")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountStatus").value("ACTIVE"));
    }
    
    @Test
    void reactivateUser_AlreadyActive_ShouldReturn400() throws Exception {
        // Given
        when(adminUserService.reactivateUser(2L))
            .thenThrow(new RuntimeException("User is already active"));
        
        // When & Then
        mockMvc.perform(put("/api/admin/users/2/reactivate")
                .with(authentication(adminAuth)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void sendAlert_ValidRequest_ShouldReturn200() throws Exception {
        // Given
        SendAlertRequest request = new SendAlertRequest();
        request.setMessage("Important notification");
        
        // When & Then
        mockMvc.perform(post("/api/admin/users/2/send-alert")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
    
    @Test
    void getUserActivity_ShouldReturn200() throws Exception {
        // Given
        when(adminUserService.getUserActivity(2L)).thenReturn(testUserResponse);
        
        // When & Then
        mockMvc.perform(get("/api/admin/users/2/activity")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.donationCount").value(5))
                .andExpect(jsonPath("$.claimCount").value(2));
    }
    
    @Test
    void getAllDonations_ShouldReturn200() throws Exception {
        // Given
        AdminDonationResponse donation = new AdminDonationResponse();
        donation.setId(1L);
        donation.setTitle("Test Donation");
        donation.setStatus(PostStatus.AVAILABLE);
        
        Page<AdminDonationResponse> page = new PageImpl<>(Collections.singletonList(donation));
        when(adminDonationService.getAllDonations(null, null, null, null, null, null, null, 0, 20))
            .thenReturn(page);
        
        // When & Then
        mockMvc.perform(get("/api/admin/donations")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Test Donation"));
    }
    
    @Test
    void getDonationById_ShouldReturn200() throws Exception {
        // Given
        AdminDonationResponse donation = new AdminDonationResponse();
        donation.setId(1L);
        donation.setTitle("Test Donation");
        
        when(adminDonationService.getDonationById(1L)).thenReturn(donation);
        
        // When & Then
        mockMvc.perform(get("/api/admin/donations/1")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }
    
    @Test
    void overrideDonationStatus_ShouldReturn200() throws Exception {
        // Given
        OverrideStatusRequest request = new OverrideStatusRequest();
        request.setNewStatus("COMPLETED");
        request.setReason("Admin override");
        
        AdminDonationResponse donation = new AdminDonationResponse();
        donation.setId(1L);
        donation.setStatus(PostStatus.COMPLETED);
        
        when(jwtTokenProvider.getEmailFromToken(anyString())).thenReturn("admin@test.com");
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(adminDonationService.overrideStatus(eq(1L), eq("COMPLETED"), eq("Admin override"), eq(1L)))
            .thenReturn(donation);
        
        // When & Then
        mockMvc.perform(post("/api/admin/donations/1/override-status")
                .header("Authorization", "Bearer fake-token")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
    
    @Test
    void getAllDisputes_ShouldReturn200() throws Exception {
        // Given
        AdminDisputeResponse dispute = new AdminDisputeResponse();
        dispute.setId(1L);
        
        Page<AdminDisputeResponse> page = new PageImpl<>(Collections.singletonList(dispute));
        when(disputeService.getAllDisputes(null, 0, 20)).thenReturn(page);
        
        // When & Then
        mockMvc.perform(get("/api/admin/disputes")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }
    
    @Test
    void getDisputeById_ShouldReturn200() throws Exception {
        // Given
        AdminDisputeResponse dispute = new AdminDisputeResponse();
        dispute.setId(1L);
        
        when(disputeService.getDisputeById(1L)).thenReturn(dispute);
        
        // When & Then
        mockMvc.perform(get("/api/admin/disputes/1")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }
    
    @Test
    void updateDisputeStatus_ShouldReturn200() throws Exception {
        // Given
        UpdateDisputeStatusRequest request = new UpdateDisputeStatusRequest();
        request.setStatus("RESOLVED");
        request.setAdminNotes("Issue resolved");
        
        AdminDisputeResponse dispute = new AdminDisputeResponse();
        dispute.setId(1L);
        
        when(disputeService.updateDisputeStatus(eq(1L), eq("RESOLVED"), eq("Issue resolved")))
            .thenReturn(dispute);
        
        // When & Then
        mockMvc.perform(put("/api/admin/disputes/1/status")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
    
    @Test
    void getAllUsers_Unauthenticated_ShouldReturn403() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void getAllDonations_WithFilters_ShouldReturn200() throws Exception {
        // Given
        AdminDonationResponse donation = new AdminDonationResponse();
        donation.setId(1L);
        donation.setTitle("Filtered Donation");
        donation.setStatus(PostStatus.CLAIMED);
        donation.setDonorId(1L);
        donation.setFlagged(true);
        
        Page<AdminDonationResponse> page = new PageImpl<>(Collections.singletonList(donation));
        when(adminDonationService.getAllDonations(eq("CLAIMED"), eq(1L), eq(2L), eq(true), any(), any(), eq("food"), eq(0), eq(20)))
            .thenReturn(page);
        
        // When & Then
        mockMvc.perform(get("/api/admin/donations")
                .param("status", "CLAIMED")
                .param("donorId", "1")
                .param("receiverId", "2")
                .param("flagged", "true")
                .param("search", "food")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("CLAIMED"));
    }
    
    @Test
    void getDonationById_NotFound_ShouldReturn404() throws Exception {
        // Given
        when(adminDonationService.getDonationById(999L))
            .thenThrow(new RuntimeException("Donation not found"));
        
        // When & Then
        mockMvc.perform(get("/api/admin/donations/999")
                .with(authentication(adminAuth)))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void getAllDisputes_WithStatusFilter_ShouldReturn200() throws Exception {
        // Given
        AdminDisputeResponse dispute = new AdminDisputeResponse();
        dispute.setId(1L);
        
        Page<AdminDisputeResponse> page = new PageImpl<>(Collections.singletonList(dispute));
        when(disputeService.getAllDisputes("OPEN", 0, 20)).thenReturn(page);
        
        // When & Then
        mockMvc.perform(get("/api/admin/disputes")
                .param("status", "OPEN")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk());
    }
    
    @Test
    void getDisputeById_NotFound_ShouldReturn404() throws Exception {
        // Given
        when(disputeService.getDisputeById(999L))
            .thenThrow(new RuntimeException("Dispute not found"));
        
        // When & Then
        mockMvc.perform(get("/api/admin/disputes/999")
                .with(authentication(adminAuth)))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void updateDisputeStatus_InvalidStatus_ShouldReturn400() throws Exception {
        // Given
        UpdateDisputeStatusRequest request = new UpdateDisputeStatusRequest();
        request.setStatus("INVALID");
        request.setAdminNotes("Test");
        
        when(disputeService.updateDisputeStatus(anyLong(), anyString(), anyString()))
            .thenThrow(new RuntimeException("Invalid status"));
        
        // When & Then
        mockMvc.perform(put("/api/admin/disputes/1/status")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void sendAlert_UserNotFound_ShouldReturn400() throws Exception {
        // Given
        SendAlertRequest request = new SendAlertRequest();
        request.setMessage("Alert");
        
        doThrow(new RuntimeException("User not found"))
            .when(adminUserService).sendAlertToUser(eq(999L), anyString());
        
        // When & Then
        mockMvc.perform(post("/api/admin/users/999/send-alert")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void getUserActivity_NotFound_ShouldReturn404() throws Exception {
        // Given
        when(adminUserService.getUserActivity(999L))
            .thenThrow(new RuntimeException("User not found"));
        
        // When & Then
        mockMvc.perform(get("/api/admin/users/999/activity")
                .with(authentication(adminAuth)))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void getAllDonations_ServiceError_ShouldReturn500() throws Exception {
        // Given
        when(adminDonationService.getAllDonations(any(), any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
            .thenThrow(new RuntimeException("Service error"));
        
        // When & Then
        mockMvc.perform(get("/api/admin/donations")
                .with(authentication(adminAuth)))
                .andExpect(status().isInternalServerError());
    }
    
    @Test
    void getAllDisputes_ServiceError_ShouldReturn500() throws Exception {
        // Given
        when(disputeService.getAllDisputes(any(), anyInt(), anyInt()))
            .thenThrow(new RuntimeException("Service error"));
        
        // When & Then
        mockMvc.perform(get("/api/admin/disputes")
                .with(authentication(adminAuth)))
                .andExpect(status().isInternalServerError());
    }
    
    @Test
    void overrideDonationStatus_InvalidStatus_ShouldReturn400() throws Exception {
        // Given
        OverrideStatusRequest request = new OverrideStatusRequest();
        request.setNewStatus("INVALID");
        request.setReason("Test");
        
        when(jwtTokenProvider.getEmailFromToken(anyString())).thenReturn("admin@test.com");
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(adminDonationService.overrideStatus(anyLong(), anyString(), anyString(), anyLong()))
            .thenThrow(new RuntimeException("Invalid status"));
        
        // When & Then
        mockMvc.perform(post("/api/admin/donations/1/override-status")
                .header("Authorization", "Bearer fake-token")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
