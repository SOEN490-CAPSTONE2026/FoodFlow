package com.example.foodflow.controller;

import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.AdminVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminVerificationController Unit Tests")
class AdminVerificationControllerTest {

    @Mock
    private AdminVerificationService adminVerificationService;

    @InjectMocks
    private AdminVerificationController adminVerificationController;

    private UserVerificationDTO testUser;
    private UserVerificationPageResponse testPageResponse;

    @BeforeEach
    void setUp() {
        // Create test user DTO
        testUser = new UserVerificationDTO();
        testUser.setId(1L);
        testUser.setOrganizationName("Community Food Bank");
        testUser.setContactName("John Doe");
        testUser.setEmail("john@foodbank.org");
        testUser.setPhoneNumber("+1 (206) 555-0123");
        testUser.setRole(UserRole.RECEIVER);
        testUser.setAccountStatus(AccountStatus.PENDING_ADMIN_APPROVAL);
        testUser.setCreatedAt(LocalDateTime.now().minusDays(2));

        // Create test page response
        List<UserVerificationDTO> content = Arrays.asList(testUser);
        testPageResponse = new UserVerificationPageResponse(content, 1, 1, 0);
    }

    @Nested
    @DisplayName("GET /api/admin/pending-users Tests")
    class GetPendingUsersTests {

        @Test
        @DisplayName("Should return paginated pending users successfully")
        void getPendingUsers_Success() {
            // Arrange
            when(adminVerificationService.getPendingUsers(
                    eq(0), eq(20), eq("date"), eq("desc"), isNull(), isNull()
            )).thenReturn(testPageResponse);

            // Act
            ResponseEntity<UserVerificationPageResponse> response = 
                    adminVerificationController.getPendingUsers(0, 20, "date", "desc", null, null);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getTotalElements());
            assertEquals(1, response.getBody().getContent().size());
            assertEquals("Community Food Bank", response.getBody().getContent().get(0).getOrganizationName());

            verify(adminVerificationService, times(1))
                    .getPendingUsers(0, 20, "date", "desc", null, null);
        }

        @Test
        @DisplayName("Should apply role filter correctly")
        void getPendingUsers_WithRoleFilter() {
            // Arrange
            when(adminVerificationService.getPendingUsers(
                    eq(0), eq(20), eq("date"), eq("desc"), eq("RECEIVER"), isNull()
            )).thenReturn(testPageResponse);

            // Act
            ResponseEntity<UserVerificationPageResponse> response = 
                    adminVerificationController.getPendingUsers(0, 20, "date", "desc", "RECEIVER", null);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(adminVerificationService, times(1))
                    .getPendingUsers(0, 20, "date", "desc", "RECEIVER", null);
        }

        @Test
        @DisplayName("Should apply search filter correctly")
        void getPendingUsers_WithSearch() {
            // Arrange
            String searchTerm = "food bank";
            when(adminVerificationService.getPendingUsers(
                    eq(0), eq(20), eq("date"), eq("desc"), isNull(), eq(searchTerm)
            )).thenReturn(testPageResponse);

            // Act
            ResponseEntity<UserVerificationPageResponse> response = 
                    adminVerificationController.getPendingUsers(0, 20, "date", "desc", null, searchTerm);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(adminVerificationService, times(1))
                    .getPendingUsers(0, 20, "date", "desc", null, searchTerm);
        }

        @Test
        @DisplayName("Should use default pagination parameters")
        void getPendingUsers_DefaultParameters() {
            // Arrange
            when(adminVerificationService.getPendingUsers(
                    eq(0), eq(20), eq("date"), eq("desc"), isNull(), isNull()
            )).thenReturn(testPageResponse);

            // Act
            ResponseEntity<UserVerificationPageResponse> response = 
                    adminVerificationController.getPendingUsers(0, 20, "date", "desc", null, null);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
        }
    }

    @Nested
    @DisplayName("POST /api/admin/approve/{userId} Tests")
    class ApproveUserTests {

        @Test
        @DisplayName("Should approve user successfully")
        void approveUser_Success() {
            // Arrange
            Long userId = 1L;
            ApprovalResponse expectedResponse = new ApprovalResponse(true, "User approved successfully");
            when(adminVerificationService.approveUser(userId)).thenReturn(expectedResponse);

            // Act
            ResponseEntity<ApprovalResponse> response = adminVerificationController.approveUser(userId);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals("User approved successfully", response.getBody().getMessage());

            verify(adminVerificationService, times(1)).approveUser(userId);
        }

        @Test
        @DisplayName("Should return bad request when user not found")
        void approveUser_UserNotFound() {
            // Arrange
            Long userId = 999L;
            when(adminVerificationService.approveUser(userId))
                    .thenThrow(new IllegalArgumentException("User not found"));

            // Act
            ResponseEntity<ApprovalResponse> response = adminVerificationController.approveUser(userId);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().isSuccess());
            assertEquals("User not found", response.getBody().getMessage());
        }

        @Test
        @DisplayName("Should return bad request when user not pending approval")
        void approveUser_NotPendingApproval() {
            // Arrange
            Long userId = 1L;
            when(adminVerificationService.approveUser(userId))
                    .thenThrow(new IllegalStateException("User is not pending admin approval"));

            // Act
            ResponseEntity<ApprovalResponse> response = adminVerificationController.approveUser(userId);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().isSuccess());
            assertEquals("User is not pending admin approval", response.getBody().getMessage());
        }
    }

    @Nested
    @DisplayName("POST /api/admin/reject/{userId} Tests")
    class RejectUserTests {

        @Test
        @DisplayName("Should reject user successfully")
        void rejectUser_Success() {
            // Arrange
            Long userId = 1L;
            RejectionRequest request = new RejectionRequest("incomplete_info", "Missing documents");
            RejectionResponse expectedResponse = new RejectionResponse(true, "User rejected successfully");
            
            when(adminVerificationService.rejectUser(userId, "incomplete_info", "Missing documents"))
                    .thenReturn(expectedResponse);

            // Act
            ResponseEntity<RejectionResponse> response = adminVerificationController.rejectUser(userId, request);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals("User rejected successfully", response.getBody().getMessage());

            verify(adminVerificationService, times(1))
                    .rejectUser(userId, "incomplete_info", "Missing documents");
        }

        @Test
        @DisplayName("Should reject user without custom message")
        void rejectUser_WithoutCustomMessage() {
            // Arrange
            Long userId = 1L;
            RejectionRequest request = new RejectionRequest("duplicate_account", null);
            RejectionResponse expectedResponse = new RejectionResponse(true, "User rejected successfully");
            
            when(adminVerificationService.rejectUser(userId, "duplicate_account", null))
                    .thenReturn(expectedResponse);

            // Act
            ResponseEntity<RejectionResponse> response = adminVerificationController.rejectUser(userId, request);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody().isSuccess());
        }

        @Test
        @DisplayName("Should return bad request when user not found")
        void rejectUser_UserNotFound() {
            // Arrange
            Long userId = 999L;
            RejectionRequest request = new RejectionRequest("other", "Test");
            
            when(adminVerificationService.rejectUser(userId, "other", "Test"))
                    .thenThrow(new IllegalArgumentException("User not found"));

            // Act
            ResponseEntity<RejectionResponse> response = adminVerificationController.rejectUser(userId, request);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().isSuccess());
            assertEquals("User not found", response.getBody().getMessage());
        }

        @Test
        @DisplayName("Should return bad request when user not pending approval")
        void rejectUser_NotPendingApproval() {
            // Arrange
            Long userId = 1L;
            RejectionRequest request = new RejectionRequest("other", "Test");
            
            when(adminVerificationService.rejectUser(userId, "other", "Test"))
                    .thenThrow(new IllegalStateException("User is not pending admin approval"));

            // Act
            ResponseEntity<RejectionResponse> response = adminVerificationController.rejectUser(userId, request);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().isSuccess());
            assertEquals("User is not pending admin approval", response.getBody().getMessage());
        }
    }
}
