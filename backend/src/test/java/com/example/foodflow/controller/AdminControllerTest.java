package com.example.foodflow.controller;

import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import com.example.foodflow.service.AdminDonationService;
import com.example.foodflow.service.AdminUserService;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminUserService adminUserService;

    @MockBean
    private AdminDonationService adminDonationService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private AdminUserResponse testUserResponse;
    private AdminDonationResponse testDonationResponse;
    private User adminUser;

    @BeforeEach
    void setUp() {
        testUserResponse = new AdminUserResponse();
        testUserResponse.setId(1L);
        testUserResponse.setEmail("test@example.com");
        testUserResponse.setRole("DONOR");
        testUserResponse.setAccountStatus("ACTIVE");
        testUserResponse.setCreatedAt(LocalDateTime.now());
        testUserResponse.setOrganizationName("Test Org");
        testUserResponse.setDonationCount(5L);
        testUserResponse.setClaimCount(0L);

        adminUser = new User();
        adminUser.setId(999L);
        adminUser.setEmail("admin@test.com");
        adminUser.setRole(UserRole.ADMIN);

        // Setup test donation response
        testDonationResponse = new AdminDonationResponse();
        testDonationResponse.setId(1L);
        testDonationResponse.setTitle("Test Donation");
        testDonationResponse.setStatus(PostStatus.CLAIMED);
        testDonationResponse.setDonorId(1L);
        testDonationResponse.setDonorEmail("donor@test.com");
        testDonationResponse.setDonorName("Test Donor");
        testDonationResponse.setFlagged(false);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllUsers_WithAdminAuth_ReturnsUserList() throws Exception {
        Page<AdminUserResponse> userPage = new PageImpl<>(Arrays.asList(testUserResponse));
        when(adminUserService.getAllUsers(null, null, null, 0, 20))
            .thenReturn(userPage);

        mockMvc.perform(get("/api/admin/users")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].email").value("test@example.com"))
            .andExpect(jsonPath("$.totalElements").value(1));

        verify(adminUserService).getAllUsers(null, null, null, 0, 20);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllUsers_WithRoleFilter_ReturnsFilteredUsers() throws Exception {
        Page<AdminUserResponse> userPage = new PageImpl<>(Arrays.asList(testUserResponse));
        when(adminUserService.getAllUsers("DONOR", null, null, 0, 20))
            .thenReturn(userPage);

        mockMvc.perform(get("/api/admin/users")
                .param("role", "DONOR")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].role").value("DONOR"));

        verify(adminUserService).getAllUsers("DONOR", null, null, 0, 20);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllUsers_WithSearchParam_ReturnsMatchingUsers() throws Exception {
        Page<AdminUserResponse> userPage = new PageImpl<>(Arrays.asList(testUserResponse));
        when(adminUserService.getAllUsers(null, null, "test", 0, 20))
            .thenReturn(userPage);

        mockMvc.perform(get("/api/admin/users")
                .param("search", "test")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].email").value("test@example.com"));

        verify(adminUserService).getAllUsers(null, null, "test", 0, 20);
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void getAllUsers_WithoutAdminAuth_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isForbidden());

        verify(adminUserService, never()).getAllUsers(any(), any(), any(), anyInt(), anyInt());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getUserById_WithValidId_ReturnsUser() throws Exception {
        when(adminUserService.getUserById(1L)).thenReturn(testUserResponse);

        mockMvc.perform(get("/api/admin/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.email").value("test@example.com"))
            .andExpect(jsonPath("$.role").value("DONOR"));

        verify(adminUserService).getUserById(1L);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getUserById_WithInvalidId_ReturnsNotFound() throws Exception {
        when(adminUserService.getUserById(999L))
            .thenThrow(new RuntimeException("User not found"));

        mockMvc.perform(get("/api/admin/users/999"))
            .andExpect(status().isNotFound());

        verify(adminUserService).getUserById(999L);
    }

    @Test
    @WithMockUser(authorities = "ADMIN", username = "admin@test.com")
    void deactivateUser_WithValidRequest_ReturnsDeactivatedUser() throws Exception {
        DeactivateUserRequest request = new DeactivateUserRequest();
        request.setAdminNotes("Test deactivation reason");

        testUserResponse.setAccountStatus("DEACTIVATED");
        testUserResponse.setDeactivatedAt(LocalDateTime.now());
        testUserResponse.setAdminNotes("Test deactivation reason");
        
        // Mock JWT token extraction
        when(jwtTokenProvider.getEmailFromToken("mock-jwt-token")).thenReturn("admin@test.com");
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        
        when(adminUserService.deactivateUser(eq(1L), eq("Test deactivation reason"), eq(999L)))
            .thenReturn(testUserResponse);

        mockMvc.perform(put("/api/admin/users/1/deactivate")
                .header("Authorization", "Bearer mock-jwt-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountStatus").value("DEACTIVATED"))
            .andExpect(jsonPath("$.adminNotes").value("Test deactivation reason"));

        verify(adminUserService).deactivateUser(eq(1L), eq("Test deactivation reason"), eq(999L));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void deactivateUser_WithAdminUser_ReturnsBadRequest() throws Exception {
        DeactivateUserRequest request = new DeactivateUserRequest();
        request.setAdminNotes("Test");

        when(adminUserService.deactivateUser(anyLong(), anyString(), anyLong()))
            .thenThrow(new RuntimeException("Cannot deactivate admin users"));

        mockMvc.perform(put("/api/admin/users/1/deactivate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void reactivateUser_WithDeactivatedUser_ReturnsActivatedUser() throws Exception {
        testUserResponse.setAccountStatus("ACTIVE");
        testUserResponse.setDeactivatedAt(null);
        
        when(adminUserService.reactivateUser(1L)).thenReturn(testUserResponse);

        mockMvc.perform(put("/api/admin/users/1/reactivate"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountStatus").value("ACTIVE"))
            .andExpect(jsonPath("$.deactivatedAt").doesNotExist());

        verify(adminUserService).reactivateUser(1L);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void reactivateUser_WithActiveUser_ReturnsBadRequest() throws Exception {
        when(adminUserService.reactivateUser(1L))
            .thenThrow(new RuntimeException("User is already active"));

        mockMvc.perform(put("/api/admin/users/1/reactivate"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void sendAlert_WithValidRequest_ReturnsSuccess() throws Exception {
        SendAlertRequest request = new SendAlertRequest();
        request.setMessage("Important alert message");

        doNothing().when(adminUserService).sendAlertToUser(1L, "Important alert message");

        mockMvc.perform(post("/api/admin/users/1/send-alert")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        verify(adminUserService).sendAlertToUser(1L, "Important alert message");
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void sendAlert_WithInvalidUser_ReturnsError() throws Exception {
        SendAlertRequest request = new SendAlertRequest();
        request.setMessage("Test alert");

        doThrow(new RuntimeException("User not found"))
            .when(adminUserService).sendAlertToUser(999L, "Test alert");

        mockMvc.perform(post("/api/admin/users/999/send-alert")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void sendAlert_WithEmptyMessage_ReturnsSuccess() throws Exception {
        SendAlertRequest request = new SendAlertRequest();
        request.setMessage("");

        doNothing().when(adminUserService).sendAlertToUser(1L, "");

        mockMvc.perform(post("/api/admin/users/1/send-alert")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        verify(adminUserService).sendAlertToUser(1L, "");
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void sendAlert_WithoutAdminAuth_ReturnsForbidden() throws Exception {
        SendAlertRequest request = new SendAlertRequest();
        request.setMessage("Test alert");

        mockMvc.perform(post("/api/admin/users/1/send-alert")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());

        verify(adminUserService, never()).sendAlertToUser(anyLong(), anyString());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getUserActivity_WithValidId_ReturnsActivity() throws Exception {
        when(adminUserService.getUserActivity(1L)).thenReturn(testUserResponse);

        mockMvc.perform(get("/api/admin/users/1/activity"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.donationCount").value(5))
            .andExpect(jsonPath("$.claimCount").value(0));

        verify(adminUserService).getUserActivity(1L);
    }

    @Test
    void getAllUsers_WithoutAuth_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isForbidden());

        verify(adminUserService, never()).getAllUsers(any(), any(), any(), anyInt(), anyInt());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void deactivateUser_WithMissingAdminNotes_ReturnsBadRequest() throws Exception {
        DeactivateUserRequest request = new DeactivateUserRequest();
        // adminNotes is null

        mockMvc.perform(put("/api/admin/users/1/deactivate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());

        verify(adminUserService, never()).deactivateUser(anyLong(), any(), anyLong());
    }

    // ==================== DONATION ENDPOINT TESTS ====================

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllDonations_WithAdminAuth_ReturnsDonationList() throws Exception {
        Page<AdminDonationResponse> donationPage = new PageImpl<>(Arrays.asList(testDonationResponse));
        when(adminDonationService.getAllDonations(null, null, null, null, null, null, null, 0, 20))
            .thenReturn(donationPage);

        mockMvc.perform(get("/api/admin/donations")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].id").value(1))
            .andExpect(jsonPath("$.content[0].title").value("Test Donation"))
            .andExpect(jsonPath("$.totalElements").value(1));

        verify(adminDonationService).getAllDonations(null, null, null, null, null, null, null, 0, 20);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllDonations_WithStatusFilter_ReturnsFilteredDonations() throws Exception {
        Page<AdminDonationResponse> donationPage = new PageImpl<>(Arrays.asList(testDonationResponse));
        when(adminDonationService.getAllDonations("CLAIMED", null, null, null, null, null, null, 0, 20))
            .thenReturn(donationPage);

        mockMvc.perform(get("/api/admin/donations")
                .param("status", "CLAIMED")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].status").value("CLAIMED"));

        verify(adminDonationService).getAllDonations("CLAIMED", null, null, null, null, null, null, 0, 20);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllDonations_WithSearchParam_ReturnsMatchingDonations() throws Exception {
        Page<AdminDonationResponse> donationPage = new PageImpl<>(Arrays.asList(testDonationResponse));
        when(adminDonationService.getAllDonations(null, null, null, null, null, null, "test", 0, 20))
            .thenReturn(donationPage);

        mockMvc.perform(get("/api/admin/donations")
                .param("search", "test")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].title").value("Test Donation"));

        verify(adminDonationService).getAllDonations(null, null, null, null, null, null, "test", 0, 20);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllDonations_WithFlaggedFilter_ReturnsOnlyFlaggedDonations() throws Exception {
        testDonationResponse.setFlagged(true);
        Page<AdminDonationResponse> donationPage = new PageImpl<>(Arrays.asList(testDonationResponse));
        when(adminDonationService.getAllDonations(null, null, null, true, null, null, null, 0, 20))
            .thenReturn(donationPage);

        mockMvc.perform(get("/api/admin/donations")
                .param("flagged", "true")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].flagged").value(true));

        verify(adminDonationService).getAllDonations(null, null, null, true, null, null, null, 0, 20);
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void getAllDonations_WithoutAdminAuth_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/donations")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isForbidden());

        verify(adminDonationService, never()).getAllDonations(any(), any(), any(), any(), any(), any(), any(), anyInt(), anyInt());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getDonationById_WithValidId_ReturnsDonationDetails() throws Exception {
        when(adminDonationService.getDonationById(1L)).thenReturn(testDonationResponse);

        mockMvc.perform(get("/api/admin/donations/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.title").value("Test Donation"))
            .andExpect(jsonPath("$.status").value("CLAIMED"))
            .andExpect(jsonPath("$.donorEmail").value("donor@test.com"));

        verify(adminDonationService).getDonationById(1L);
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getDonationById_WithInvalidId_ReturnsNotFound() throws Exception {
        when(adminDonationService.getDonationById(999L))
            .thenThrow(new RuntimeException("Donation not found"));

        mockMvc.perform(get("/api/admin/donations/999"))
            .andExpect(status().isNotFound());

        verify(adminDonationService).getDonationById(999L);
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void getDonationById_WithoutAdminAuth_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/donations/1"))
            .andExpect(status().isForbidden());

        verify(adminDonationService, never()).getDonationById(anyLong());
    }

    @Test
    @WithMockUser(authorities = "ADMIN", username = "admin@test.com")
    void overrideDonationStatus_WithValidRequest_ReturnsUpdatedDonation() throws Exception {
        OverrideStatusRequest request = new OverrideStatusRequest();
        request.setNewStatus("COMPLETED");
        request.setReason("Admin manually completed");

        testDonationResponse.setStatus(PostStatus.COMPLETED);
        
        when(jwtTokenProvider.getEmailFromToken("mock-jwt-token")).thenReturn("admin@test.com");
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(adminDonationService.overrideStatus(eq(1L), eq("COMPLETED"), eq("Admin manually completed"), eq(999L)))
            .thenReturn(testDonationResponse);

        mockMvc.perform(post("/api/admin/donations/1/override-status")
                .header("Authorization", "Bearer mock-jwt-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("COMPLETED"));

        verify(adminDonationService).overrideStatus(eq(1L), eq("COMPLETED"), eq("Admin manually completed"), eq(999L));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void overrideDonationStatus_WithInvalidStatus_ReturnsBadRequest() throws Exception {
        OverrideStatusRequest request = new OverrideStatusRequest();
        request.setNewStatus("INVALID_STATUS");
        request.setReason("Test");

        when(adminDonationService.overrideStatus(anyLong(), eq("INVALID_STATUS"), anyString(), anyLong()))
            .thenThrow(new RuntimeException("Invalid status"));

        mockMvc.perform(post("/api/admin/donations/1/override-status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void overrideDonationStatus_WithMissingNewStatus_ReturnsBadRequest() throws Exception {
        OverrideStatusRequest request = new OverrideStatusRequest();
        // newStatus is null
        request.setReason("Test reason");

        mockMvc.perform(post("/api/admin/donations/1/override-status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());

        verify(adminDonationService, never()).overrideStatus(anyLong(), any(), any(), anyLong());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void overrideDonationStatus_WithMissingReason_ReturnsBadRequest() throws Exception {
        OverrideStatusRequest request = new OverrideStatusRequest();
        request.setNewStatus("COMPLETED");
        // reason is null

        mockMvc.perform(post("/api/admin/donations/1/override-status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());

        verify(adminDonationService, never()).overrideStatus(anyLong(), any(), any(), anyLong());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void overrideDonationStatus_WithoutAdminAuth_ReturnsForbidden() throws Exception {
        OverrideStatusRequest request = new OverrideStatusRequest();
        request.setNewStatus("COMPLETED");
        request.setReason("Test");

        mockMvc.perform(post("/api/admin/donations/1/override-status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());

        verify(adminDonationService, never()).overrideStatus(anyLong(), any(), any(), anyLong());
    }

    @Test
    @WithMockUser(authorities = "ADMIN", username = "admin@test.com")
    void overrideDonationStatus_WithInvalidDonationId_ReturnsBadRequest() throws Exception {
        OverrideStatusRequest request = new OverrideStatusRequest();
        request.setNewStatus("COMPLETED");
        request.setReason("Test");

        when(jwtTokenProvider.getEmailFromToken("mock-jwt-token")).thenReturn("admin@test.com");
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(adminDonationService.overrideStatus(eq(999L), anyString(), anyString(), anyLong()))
            .thenThrow(new RuntimeException("Donation not found"));

        mockMvc.perform(post("/api/admin/donations/999/override-status")
                .header("Authorization", "Bearer mock-jwt-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }
}
