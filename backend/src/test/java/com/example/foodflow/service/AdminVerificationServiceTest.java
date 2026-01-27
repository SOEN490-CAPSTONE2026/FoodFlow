package com.example.foodflow.service;

import com.example.foodflow.model.dto.ApprovalResponse;
import com.example.foodflow.model.dto.RejectionResponse;
import com.example.foodflow.model.dto.UserVerificationPageResponse;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.EmailVerificationTokenRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminVerificationService Unit Tests")
class AdminVerificationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private EmailVerificationTokenRepository verificationTokenRepository;

    @InjectMocks
    private AdminVerificationService adminVerificationService;

    private User testUser;
    private Organization testOrganization;

    @BeforeEach
    void setUp() {
        // Create test organization
        testOrganization = new Organization();
        testOrganization.setId(1L);
        testOrganization.setName("Community Food Bank");
        testOrganization.setContactPerson("John Doe");
        testOrganization.setPhone("+1 (206) 555-0123");
        testOrganization.setAddress("123 Main St, Seattle, WA 98101");
        testOrganization.setOrganizationType(OrganizationType.FOOD_BANK);
        testOrganization.setCharityRegistrationNumber("123456789RR0001");
        testOrganization.setCapacity(500);
        testOrganization.setCreatedAt(LocalDateTime.now().minusDays(2));

        // Create test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("john@foodbank.org");
        testUser.setRole(UserRole.RECEIVER);
        testUser.setAccountStatus(AccountStatus.PENDING_ADMIN_APPROVAL);
        testUser.setOrganization(testOrganization);
        testUser.setCity("Seattle");
        testUser.setCountry("United States");
        testUser.setCreatedAt(LocalDateTime.now().minusDays(2));

        // Set bidirectional relationship
        testOrganization.setUser(testUser);
    }

    @Nested
    @DisplayName("getPendingUsers Tests")
    class GetPendingUsersTests {

        @Test
        @DisplayName("Should return paginated pending users")
        void getPendingUsers_Success() {
            // Arrange
            Page<User> userPage = new PageImpl<>(Arrays.asList(testUser));
            when(userRepository.findByAccountStatusInAndSearchTerm(
                    eq(Arrays.asList(AccountStatus.PENDING_ADMIN_APPROVAL, AccountStatus.PENDING_VERIFICATION)),
                    isNull(),
                    isNull(),
                    any(PageRequest.class)
            )).thenReturn(userPage);

            // Act
            UserVerificationPageResponse response = adminVerificationService.getPendingUsers(
                    0, 20, "date", "desc", null, null
            );

            // Assert
            assertNotNull(response);
            assertEquals(1, response.getTotalElements());
            assertEquals(1, response.getTotalPages());
            assertEquals(0, response.getCurrentPage());
            assertEquals(1, response.getContent().size());
            assertEquals("Community Food Bank", response.getContent().get(0).getOrganizationName());
            assertEquals("john@foodbank.org", response.getContent().get(0).getEmail());
        }

        @Test
        @DisplayName("Should filter by role")
        void getPendingUsers_WithRoleFilter() {
            // Arrange
            Page<User> userPage = new PageImpl<>(Arrays.asList(testUser));
            when(userRepository.findByAccountStatusInAndSearchTerm(
                    eq(Arrays.asList(AccountStatus.PENDING_ADMIN_APPROVAL, AccountStatus.PENDING_VERIFICATION)),
                    eq(UserRole.RECEIVER),
                    isNull(),
                    any(PageRequest.class)
            )).thenReturn(userPage);

            // Act
            UserVerificationPageResponse response = adminVerificationService.getPendingUsers(
                    0, 20, "date", "desc", "RECEIVER", null
            );

            // Assert
            assertNotNull(response);
            assertEquals(1, response.getContent().size());
            verify(userRepository).findByAccountStatusInAndSearchTerm(
                    eq(Arrays.asList(AccountStatus.PENDING_ADMIN_APPROVAL, AccountStatus.PENDING_VERIFICATION)),
                    eq(UserRole.RECEIVER),
                    isNull(),
                    any(PageRequest.class)
            );
        }

        @Test
        @DisplayName("Should apply search term")
        void getPendingUsers_WithSearch() {
            // Arrange
            String searchTerm = "food bank";
            Page<User> userPage = new PageImpl<>(Arrays.asList(testUser));
            when(userRepository.findByAccountStatusInAndSearchTerm(
                    eq(Arrays.asList(AccountStatus.PENDING_ADMIN_APPROVAL, AccountStatus.PENDING_VERIFICATION)),
                    isNull(),
                    eq(searchTerm),
                    any(PageRequest.class)
            )).thenReturn(userPage);

            // Act
            UserVerificationPageResponse response = adminVerificationService.getPendingUsers(
                    0, 20, "date", "desc", null, searchTerm
            );

            // Assert
            assertNotNull(response);
            verify(userRepository).findByAccountStatusInAndSearchTerm(
                    eq(Arrays.asList(AccountStatus.PENDING_ADMIN_APPROVAL, AccountStatus.PENDING_VERIFICATION)),
                    isNull(),
                    eq(searchTerm),
                    any(PageRequest.class)
            );
        }

        @Test
        @DisplayName("Should sort by user type")
        void getPendingUsers_SortByUserType() {
            // Arrange
            Page<User> userPage = new PageImpl<>(Arrays.asList(testUser));
            when(userRepository.findByAccountStatusInAndSearchTerm(
                    anyList(),
                    isNull(),
                    isNull(),
                    any(PageRequest.class)
            )).thenReturn(userPage);

            // Act
            adminVerificationService.getPendingUsers(0, 20, "usertype", "asc", null, null);

            // Assert
            verify(userRepository).findByAccountStatusInAndSearchTerm(
                    anyList(),
                    isNull(),
                    isNull(),
                    argThat(pageable -> 
                        pageable.getSort().getOrderFor("role") != null &&
                        pageable.getSort().getOrderFor("role").getDirection() == Sort.Direction.ASC
                    )
            );
        }

        @Test
        @DisplayName("Should ignore invalid role filter")
        void getPendingUsers_InvalidRole() {
            // Arrange
            Page<User> userPage = new PageImpl<>(Arrays.asList(testUser));
            when(userRepository.findByAccountStatusInAndSearchTerm(
                    eq(Arrays.asList(AccountStatus.PENDING_ADMIN_APPROVAL, AccountStatus.PENDING_VERIFICATION)),
                    isNull(), // Should be null for invalid role
                    isNull(),
                    any(PageRequest.class)
            )).thenReturn(userPage);

            // Act
            UserVerificationPageResponse response = adminVerificationService.getPendingUsers(
                    0, 20, "date", "desc", "INVALID_ROLE", null
            );

            // Assert
            assertNotNull(response);
            verify(userRepository).findByAccountStatusInAndSearchTerm(
                    eq(Arrays.asList(AccountStatus.PENDING_ADMIN_APPROVAL, AccountStatus.PENDING_VERIFICATION)),
                    isNull(),
                    isNull(),
                    any(PageRequest.class)
            );
        }
    }

    @Nested
    @DisplayName("approveUser Tests")
    class ApproveUserTests {

        @Test
        @DisplayName("Should approve user successfully")
        void approveUser_Success() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // Act
            ApprovalResponse response = adminVerificationService.approveUser(1L);

            // Assert
            assertNotNull(response);
            assertTrue(response.isSuccess());
            assertEquals("User approved successfully", response.getMessage());
            assertEquals(AccountStatus.ACTIVE, testUser.getAccountStatus());
            
            verify(userRepository).findById(1L);
            verify(userRepository).save(testUser);
            
            // Verify email was sent
            try {
                verify(emailService).sendAccountApprovalEmail(
                        eq("john@foodbank.org"),
                        eq("Community Food Bank")
                );
            } catch (Exception e) {
                fail("Email service should have been called");
            }
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void approveUser_UserNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> adminVerificationService.approveUser(999L)
            );
            assertEquals("User not found", exception.getMessage());
            verify(userRepository).findById(999L);
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when user not pending approval")
        void approveUser_NotPendingApproval() {
            // Arrange
            testUser.setAccountStatus(AccountStatus.ACTIVE);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // Act & Assert
            IllegalStateException exception = assertThrows(
                    IllegalStateException.class,
                    () -> adminVerificationService.approveUser(1L)
            );
            assertEquals("User is not pending admin approval", exception.getMessage());
            verify(userRepository).findById(1L);
            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("rejectUser Tests")
    class RejectUserTests {

        @Test
        @DisplayName("Should reject user successfully with message")
        void rejectUser_SuccessWithMessage() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // Act
            RejectionResponse response = adminVerificationService.rejectUser(
                    1L, "incomplete_info", "Missing registration documents"
            );

            // Assert
            assertNotNull(response);
            assertTrue(response.isSuccess());
            assertEquals("User rejected successfully", response.getMessage());
            assertEquals(AccountStatus.DEACTIVATED, testUser.getAccountStatus());
            assertTrue(testUser.getAdminNotes().contains("incomplete_info"));
            assertTrue(testUser.getAdminNotes().contains("Missing registration documents"));
            
            verify(userRepository).findById(1L);
            verify(userRepository).save(testUser);
            
            // Verify email was sent
            try {
                verify(emailService).sendAccountRejectionEmail(
                        eq("john@foodbank.org"),
                        eq("Community Food Bank"),
                        eq("incomplete_info"),
                        eq("Missing registration documents")
                );
            } catch (Exception e) {
                fail("Email service should have been called");
            }
        }

        @Test
        @DisplayName("Should reject user successfully without custom message")
        void rejectUser_SuccessWithoutMessage() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // Act
            RejectionResponse response = adminVerificationService.rejectUser(
                    1L, "duplicate_account", null
            );

            // Assert
            assertNotNull(response);
            assertTrue(response.isSuccess());
            assertEquals(AccountStatus.DEACTIVATED, testUser.getAccountStatus());
            assertTrue(testUser.getAdminNotes().contains("duplicate_account"));
            
            verify(userRepository).findById(1L);
            verify(userRepository).save(testUser);
            
            // Verify email was sent with null message
            try {
                verify(emailService).sendAccountRejectionEmail(
                        eq("john@foodbank.org"),
                        eq("Community Food Bank"),
                        eq("duplicate_account"),
                        isNull()
                );
            } catch (Exception e) {
                fail("Email service should have been called");
            }
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void rejectUser_UserNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> adminVerificationService.rejectUser(999L, "other", "Test")
            );
            assertEquals("User not found", exception.getMessage());
            verify(userRepository).findById(999L);
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when user not pending approval")
        void rejectUser_NotPendingApproval() {
            // Arrange
            testUser.setAccountStatus(AccountStatus.ACTIVE);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // Act & Assert
            IllegalStateException exception = assertThrows(
                    IllegalStateException.class,
                    () -> adminVerificationService.rejectUser(1L, "other", "Test")
            );
            assertEquals("User is not pending admin approval", exception.getMessage());
            verify(userRepository).findById(1L);
            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("verifyEmailManually Tests")
    class VerifyEmailManuallyTests {

        @Test
        @DisplayName("Should verify email and move to admin approval")
        void verifyEmailManually_Success() {
            // Arrange
            testUser.setAccountStatus(AccountStatus.PENDING_VERIFICATION);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(verificationTokenRepository.findTopByUserIdOrderByCreatedAtDesc(1L))
                    .thenReturn(Optional.empty());

            // Act
            ApprovalResponse response = adminVerificationService.verifyEmailManually(1L);

            // Assert
            assertNotNull(response);
            assertTrue(response.isSuccess());
            assertEquals("Email verified manually", response.getMessage());
            assertEquals(AccountStatus.PENDING_ADMIN_APPROVAL, testUser.getAccountStatus());
            verify(userRepository).findById(1L);
            verify(verificationTokenRepository).findTopByUserIdOrderByCreatedAtDesc(1L);
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("Should throw when user not pending verification")
        void verifyEmailManually_NotPendingVerification() {
            // Arrange
            testUser.setAccountStatus(AccountStatus.PENDING_ADMIN_APPROVAL);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // Act & Assert
            IllegalStateException exception = assertThrows(
                    IllegalStateException.class,
                    () -> adminVerificationService.verifyEmailManually(1L)
            );
            assertEquals("User is not pending email verification", exception.getMessage());
            verify(userRepository).findById(1L);
            verify(userRepository, never()).save(any(User.class));
        }
    }
}
