package com.example.foodflow.service;

import com.example.foodflow.model.dto.AdminUserResponse;
import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.entity.VerificationStatus;
import com.example.foodflow.audit.AuditLogger;
import com.example.foodflow.model.dto.UserActivityDTO;
import com.example.foodflow.model.entity.AuditLog;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.repository.AuditLogRepository;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.ConversationRepository;
import com.example.foodflow.repository.MessageRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.mock;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private NotificationPreferenceService notificationPreferenceService;

    @Mock
    private EmailNotificationService emailService;

    @Mock
    private AuditLogger auditLogger;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private MessageSource messageSource;

    @InjectMocks
    private AdminUserService adminUserService;

    private User testDonor;
    private User testReceiver;
    private User testAdmin;
    private Organization testOrganization;

    @BeforeEach
    void setUp() {
        testOrganization = new Organization();
        testOrganization.setName("Test Organization");
        testOrganization.setContactPerson("John Doe");
        testOrganization.setPhone("123-456-7890");

        testDonor = new User();
        testDonor.setId(1L);
        testDonor.setEmail("donor@test.com");
        testDonor.setRole(UserRole.DONOR);
        testDonor.setAccountStatus(AccountStatus.ACTIVE);
        testDonor.setOrganization(testOrganization);
        testDonor.setCreatedAt(LocalDateTime.now());

        testReceiver = new User();
        testReceiver.setId(2L);
        testReceiver.setEmail("receiver@test.com");
        testReceiver.setRole(UserRole.RECEIVER);
        testReceiver.setAccountStatus(AccountStatus.ACTIVE);
        testReceiver.setOrganization(testOrganization);
        testReceiver.setCreatedAt(LocalDateTime.now());

        testAdmin = new User();
        testAdmin.setId(3L);
        testAdmin.setEmail("admin@test.com");
        testAdmin.setRole(UserRole.ADMIN);
        testAdmin.setAccountStatus(AccountStatus.ACTIVE);
        testAdmin.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void getAllUsers_WithNoFilters_ReturnsAllUsers() {
        Pageable pageable = PageRequest.of(0, 20, org.springframework.data.domain.Sort.by("createdAt").descending());
        Page<User> userPage = new PageImpl<>(Arrays.asList(testDonor, testReceiver, testAdmin));
        
        when(userRepository.findAll(pageable)).thenReturn(userPage);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(claimRepository.countByReceiverId(2L)).thenReturn(3L);

        Page<AdminUserResponse> result = adminUserService.getAllUsers(null, null, null, 0, 20);

        assertNotNull(result);
        assertEquals(3, result.getTotalElements());
        verify(userRepository).findAll(pageable);
    }

    @Test
    void getAllUsers_WithRoleFilter_ReturnsFilteredUsers() {
        Pageable pageable = PageRequest.of(0, 20, org.springframework.data.domain.Sort.by("createdAt").descending());
        Page<User> userPage = new PageImpl<>(Arrays.asList(testDonor));
        
        when(userRepository.findByRole(UserRole.DONOR, pageable)).thenReturn(userPage);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);

        Page<AdminUserResponse> result = adminUserService.getAllUsers("DONOR", null, null, 0, 20);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("DONOR", result.getContent().get(0).getRole());
        verify(userRepository).findByRole(UserRole.DONOR, pageable);
    }

    @Test
    void getAllUsers_WithSearchTerm_ReturnsMatchingUsers() {
        Pageable pageable = PageRequest.of(0, 20, org.springframework.data.domain.Sort.by("createdAt").descending());
        Page<User> userPage = new PageImpl<>(Arrays.asList(testDonor));
        
        when(userRepository.findByEmailContainingIgnoreCase("donor", pageable)).thenReturn(userPage);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);

        Page<AdminUserResponse> result = adminUserService.getAllUsers(null, null, "donor", 0, 20);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertTrue(result.getContent().get(0).getEmail().contains("donor"));
        verify(userRepository).findByEmailContainingIgnoreCase("donor", pageable);
    }

    @Test
    void getUserById_WithValidId_ReturnsUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);

        AdminUserResponse result = adminUserService.getUserById(1L);

        assertNotNull(result);
        assertEquals("donor@test.com", result.getEmail());
        assertEquals("DONOR", result.getRole());
        assertEquals(5L, result.getDonationCount());
        verify(userRepository).findById(1L);
    }

    @Test
    void getUserById_WithInvalidId_ThrowsException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> adminUserService.getUserById(999L));
        verify(userRepository).findById(999L);
    }

    @Test
    void deactivateUser_WithValidDonor_DeactivatesSuccessfully() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), anyString(), anyString())).thenReturn(true);

        AdminUserResponse result = adminUserService.deactivateUser(1L, "Test deactivation", 3L);

        assertNotNull(result);
        assertEquals(AccountStatus.DEACTIVATED, testDonor.getAccountStatus());
        assertEquals("Test deactivation", testDonor.getAdminNotes());
        assertNotNull(testDonor.getDeactivatedAt());
        assertEquals(3L, testDonor.getDeactivatedBy());
        verify(userRepository).save(testDonor);
    }

    @Test
    void deactivateUser_WithAdminUser_ThrowsException() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(testAdmin));

        assertThrows(RuntimeException.class, 
            () -> adminUserService.deactivateUser(3L, "Test deactivation", 3L));
        verify(userRepository, never()).save(any());
    }

    @Test
    void deactivateUser_WithAlreadyDeactivatedUser_ThrowsException() {
        testDonor.setAccountStatus(AccountStatus.DEACTIVATED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));

        assertThrows(RuntimeException.class, 
            () -> adminUserService.deactivateUser(1L, "Test deactivation", 3L));
        verify(userRepository, never()).save(any());
    }

    @Test
    void reactivateUser_WithDeactivatedUser_ReactivatesSuccessfully() {
        testDonor.setAccountStatus(AccountStatus.DEACTIVATED);
        testDonor.setDeactivatedAt(LocalDateTime.now());
        testDonor.setDeactivatedBy(3L);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), anyString(), anyString())).thenReturn(true);

        AdminUserResponse result = adminUserService.reactivateUser(1L);

        assertNotNull(result);
        assertEquals(AccountStatus.ACTIVE, testDonor.getAccountStatus());
        assertNull(testDonor.getDeactivatedAt());
        assertNull(testDonor.getDeactivatedBy());
        verify(userRepository).save(testDonor);
    }

    @Test
    void reactivateUser_WithActiveUser_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));

        assertThrows(RuntimeException.class, () -> adminUserService.reactivateUser(1L));
        verify(userRepository, never()).save(any());
    }

    @Test
    void sendAlertToUser_WithValidUser_SendsAlertSuccessfully() {
        Conversation conversation = new Conversation(testAdmin, testDonor);
        testDonor.setLanguagePreference("fr");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.findByRole(UserRole.ADMIN)).thenReturn(Arrays.asList(testAdmin));
        when(conversationRepository.findByUsers(1L, 3L)).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(userRepository.save(any(User.class))).thenReturn(testDonor);

        adminUserService.sendAlertToUser(1L, "Test alert message");

        verify(messagingTemplate).convertAndSendToUser(
            eq("1"),
            eq("/queue/messages"),
            anyMap()
        );
        verify(messageRepository).save(any());
        verify(emailService).sendAdminAlertEmail(eq("donor@test.com"), anyString(), eq("Test alert message"), eq("fr"));
        verify(userRepository).save(testDonor);
        assertTrue(testDonor.getAdminNotes().contains("Test alert message"));
    }

    @Test
    void sendAlertToUser_WithInvalidUser_ThrowsException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, 
            () -> adminUserService.sendAlertToUser(999L, "Test alert"));
        verify(messagingTemplate, never()).convertAndSendToUser(any(), any(), any());
    }

    @Test
    void getUserActivity_WithDonor_ReturnsCorrectCounts() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(10L);

        AdminUserResponse result = adminUserService.getUserActivity(1L);

        assertNotNull(result);
        assertEquals(10L, result.getDonationCount());
        assertEquals(0L, result.getClaimCount());
        verify(surplusPostRepository).countByDonorId(1L);
    }

    @Test
    void getUserActivity_WithReceiver_ReturnsCorrectCounts() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(testReceiver));
        when(claimRepository.countByReceiverId(2L)).thenReturn(7L);

        AdminUserResponse result = adminUserService.getUserActivity(2L);

        assertNotNull(result);
        assertEquals(0L, result.getDonationCount());
        assertEquals(7L, result.getClaimCount());
        verify(claimRepository).countByReceiverId(2L);
    }

    // Notification-related tests

    @Test
    void deactivateUser_WithEmailNotificationsDisabled_DoesNotSendEmail() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("email"))).thenReturn(false);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("websocket"))).thenReturn(true);

        adminUserService.deactivateUser(1L, "Test deactivation", 3L);

        verify(emailService, never()).sendAccountDeactivationEmail(anyString(), anyString());
        verify(messagingTemplate).convertAndSendToUser(anyString(), anyString(), anyMap());
    }

    @Test
    void deactivateUser_WithWebSocketNotificationsDisabled_DoesNotSendWebSocket() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("email"))).thenReturn(true);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("websocket"))).thenReturn(false);

        adminUserService.deactivateUser(1L, "Test deactivation", 3L);

        verify(emailService).sendAccountDeactivationEmail(eq("donor@test.com"), anyString());
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), anyMap());
    }

    @Test
    void deactivateUser_WithBothNotificationsEnabled_SendsBoth() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("email"))).thenReturn(true);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("websocket"))).thenReturn(true);

        adminUserService.deactivateUser(1L, "Test deactivation", 3L);

        verify(emailService).sendAccountDeactivationEmail(eq("donor@test.com"), anyString());
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/verification/approved"), anyMap());
    }

    @Test
    void deactivateUser_WithBothNotificationsDisabled_SendsNeither() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), anyString(), anyString())).thenReturn(false);

        adminUserService.deactivateUser(1L, "Test deactivation", 3L);

        verify(emailService, never()).sendAccountDeactivationEmail(anyString(), anyString());
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), anyMap());
    }

    @Test
    void reactivateUser_WithEmailNotificationsEnabled_SendsEmail() throws Exception {
        testDonor.setAccountStatus(AccountStatus.DEACTIVATED);
        testDonor.setDeactivatedAt(LocalDateTime.now());
        testDonor.setDeactivatedBy(3L);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("email"))).thenReturn(true);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("websocket"))).thenReturn(false);

        adminUserService.reactivateUser(1L);

        verify(emailService).sendAccountReactivationEmail(eq("donor@test.com"), anyString());
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), anyMap());
    }

    @Test
    void reactivateUser_WithWebSocketNotificationsEnabled_SendsWebSocket() throws Exception {
        testDonor.setAccountStatus(AccountStatus.DEACTIVATED);
        testDonor.setDeactivatedAt(LocalDateTime.now());
        testDonor.setDeactivatedBy(3L);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("email"))).thenReturn(false);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("websocket"))).thenReturn(true);

        adminUserService.reactivateUser(1L);

        verify(emailService, never()).sendAccountReactivationEmail(anyString(), anyString());
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/verification/approved"), anyMap());
    }

    @Test
    void reactivateUser_WithBothNotificationsEnabled_SendsBoth() throws Exception {
        testDonor.setAccountStatus(AccountStatus.DEACTIVATED);
        testDonor.setDeactivatedAt(LocalDateTime.now());
        testDonor.setDeactivatedBy(3L);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("email"))).thenReturn(true);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("verificationStatusChanged"), eq("websocket"))).thenReturn(true);

        adminUserService.reactivateUser(1L);

        verify(emailService).sendAccountReactivationEmail(eq("donor@test.com"), anyString());
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/verification/approved"), anyMap());
    }

    @Test
    void reactivateUser_WithAllNotificationsDisabled_SendsNeither() throws Exception {
        testDonor.setAccountStatus(AccountStatus.DEACTIVATED);
        testDonor.setDeactivatedAt(LocalDateTime.now());
        testDonor.setDeactivatedBy(3L);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), anyString(), anyString())).thenReturn(false);

        adminUserService.reactivateUser(1L);

        verify(emailService, never()).sendAccountReactivationEmail(anyString(), anyString());
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), anyMap());
    }

    // -----------------------------------------------------------------------
    // getAllUsers – additional filter combinations
    // -----------------------------------------------------------------------

    @Test
    void getAllUsers_WithRoleAndAccountStatus_ReturnsFilteredUsers() {
        org.springframework.data.domain.Pageable pageable =
                PageRequest.of(0, 20, org.springframework.data.domain.Sort.by("createdAt").descending());
        Page<User> userPage = new PageImpl<>(Arrays.asList(testDonor));

        when(userRepository.findByRoleAndAccountStatus(UserRole.DONOR, AccountStatus.ACTIVE, pageable))
                .thenReturn(userPage);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(3L);

        Page<AdminUserResponse> result =
                adminUserService.getAllUsers("DONOR", "ACTIVE", null, 0, 20);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("DONOR", result.getContent().get(0).getRole());
        assertEquals("ACTIVE", result.getContent().get(0).getAccountStatus());
        verify(userRepository).findByRoleAndAccountStatus(UserRole.DONOR, AccountStatus.ACTIVE, pageable);
    }

    @Test
    void getAllUsers_WithAccountStatusOnly_ReturnsFilteredUsers() {
        org.springframework.data.domain.Pageable pageable =
                PageRequest.of(0, 20, org.springframework.data.domain.Sort.by("createdAt").descending());
        testDonor.setAccountStatus(AccountStatus.DEACTIVATED);
        Page<User> userPage = new PageImpl<>(Arrays.asList(testDonor));

        when(userRepository.findByAccountStatus(AccountStatus.DEACTIVATED, pageable))
                .thenReturn(userPage);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(2L);

        Page<AdminUserResponse> result =
                adminUserService.getAllUsers(null, "DEACTIVATED", null, 0, 20);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("DEACTIVATED", result.getContent().get(0).getAccountStatus());
        verify(userRepository).findByAccountStatus(AccountStatus.DEACTIVATED, pageable);
    }

    @Test
    void getAllUsers_WithBlankSearchTerm_ReturnsFindAll() {
        org.springframework.data.domain.Pageable pageable =
                PageRequest.of(0, 20, org.springframework.data.domain.Sort.by("createdAt").descending());
        Page<User> userPage = new PageImpl<>(Arrays.asList(testDonor, testReceiver));

        when(userRepository.findAll(pageable)).thenReturn(userPage);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);
        when(claimRepository.countByReceiverId(2L)).thenReturn(0L);

        // Whitespace-only search should be treated the same as null
        Page<AdminUserResponse> result =
                adminUserService.getAllUsers(null, null, "   ", 0, 20);

        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(userRepository).findAll(pageable);
        verify(userRepository, never()).findByEmailContainingIgnoreCase(anyString(), any());
    }

    @Test
    void getAllUsers_WithInvalidRole_ThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> adminUserService.getAllUsers("INVALID_ROLE", null, null, 0, 20));
    }

    @Test
    void getAllUsers_WithInvalidAccountStatus_ThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> adminUserService.getAllUsers(null, "INVALID_STATUS", null, 0, 20));
    }

    // -----------------------------------------------------------------------
    // getUserById – organisation and role-specific response mapping
    // -----------------------------------------------------------------------

    @Test
    void getUserById_WithReceiver_ReturnsCorrectClaimCount() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(testReceiver));
        when(claimRepository.countByReceiverId(2L)).thenReturn(8L);

        AdminUserResponse result = adminUserService.getUserById(2L);

        assertNotNull(result);
        assertEquals("receiver@test.com", result.getEmail());
        assertEquals("RECEIVER", result.getRole());
        assertEquals(8L, result.getClaimCount());
        assertEquals(0L, result.getDonationCount());
    }

    @Test
    void getUserById_WithAdmin_ReturnsZeroCounts() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(testAdmin));

        AdminUserResponse result = adminUserService.getUserById(3L);

        assertNotNull(result);
        assertEquals("admin@test.com", result.getEmail());
        assertEquals("ADMIN", result.getRole());
        assertEquals(0L, result.getDonationCount());
        assertEquals(0L, result.getClaimCount());
    }

    @Test
    void getUserById_WithOrganization_MapsOrganizationFields() {
        com.example.foodflow.model.entity.VerificationStatus verStatus =
                com.example.foodflow.model.entity.VerificationStatus.VERIFIED;
        testOrganization.setAddress("123 Test St");
        testOrganization.setBusinessLicense("BL-001");
        testOrganization.setCharityRegistrationNumber("CRN-999");
        testOrganization.setVerificationStatus(verStatus);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(2L);

        AdminUserResponse result = adminUserService.getUserById(1L);

        assertNotNull(result);
        assertEquals("Test Organization", result.getOrganizationName());
        assertEquals("John Doe", result.getContactPerson());
        assertEquals("123-456-7890", result.getPhone());
        assertEquals("123 Test St", result.getAddress());
        assertEquals("BL-001", result.getBusinessLicense());
        assertEquals("CRN-999", result.getCharityRegistrationNumber());
        assertEquals("VERIFIED", result.getVerificationStatus());
    }

    @Test
    void getUserById_WithNoOrganization_LeavesOrganizationFieldsNull() {
        testDonor.setOrganization(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);

        AdminUserResponse result = adminUserService.getUserById(1L);

        assertNotNull(result);
        assertNull(result.getOrganizationName());
        assertNull(result.getContactPerson());
        assertNull(result.getPhone());
        assertNull(result.getVerificationStatus());
    }

    @Test
    void getUserById_WithNullAccountStatus_DefaultsToACTIVE() {
        testDonor.setAccountStatus(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);

        AdminUserResponse result = adminUserService.getUserById(1L);

        assertEquals("ACTIVE", result.getAccountStatus());
    }

    @Test
    void getUserById_WithLanguagePreference_MapsLanguagePreference() {
        testDonor.setLanguagePreference("fr");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);

        AdminUserResponse result = adminUserService.getUserById(1L);

        assertEquals("fr", result.getLanguagePreference());
    }

    // -----------------------------------------------------------------------
    // deactivateUser – edge cases
    // -----------------------------------------------------------------------

    @Test
    void deactivateUser_WithNonExistentUser_ThrowsException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> adminUserService.deactivateUser(999L, "notes", 3L));
        verify(userRepository, never()).save(any());
    }

    @Test
    void deactivateUser_SetsDeactivatedByToAdminId() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);
        when(notificationPreferenceService.shouldSendNotification(any(), anyString(), anyString())).thenReturn(false);

        adminUserService.deactivateUser(1L, "policy violation", 99L);

        assertEquals(99L, testDonor.getDeactivatedBy());
        assertEquals("policy violation", testDonor.getAdminNotes());
    }

    // -----------------------------------------------------------------------
    // reactivateUser – edge cases
    // -----------------------------------------------------------------------

    @Test
    void reactivateUser_WithNonExistentUser_ThrowsException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> adminUserService.reactivateUser(999L));
        verify(userRepository, never()).save(any());
    }

    @Test
    void reactivateUser_ClearsDeactivationFields() {
        testDonor.setAccountStatus(AccountStatus.DEACTIVATED);
        testDonor.setDeactivatedAt(LocalDateTime.now());
        testDonor.setDeactivatedBy(5L);
        testDonor.setAdminNotes("was bad");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);
        when(notificationPreferenceService.shouldSendNotification(any(), anyString(), anyString())).thenReturn(false);

        adminUserService.reactivateUser(1L);

        assertEquals(AccountStatus.ACTIVE, testDonor.getAccountStatus());
        assertNull(testDonor.getDeactivatedAt());
        assertNull(testDonor.getDeactivatedBy());
        // Admin notes should be preserved for historical record
        assertEquals("was bad", testDonor.getAdminNotes());
    }

    // -----------------------------------------------------------------------
    // sendAlertToUser – edge cases
    // -----------------------------------------------------------------------

    @Test
    void sendAlertToUser_WithExistingAdminNotes_AppendsToNotes() {
        testDonor.setAdminNotes("Previous note");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);

        adminUserService.sendAlertToUser(1L, "New alert");

        assertTrue(testDonor.getAdminNotes().contains("Previous note"));
        assertTrue(testDonor.getAdminNotes().contains("New alert"));
    }

    @Test
    void sendAlertToUser_WithNullAdminNotes_CreatesNewNote() {
        testDonor.setAdminNotes(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);

        adminUserService.sendAlertToUser(1L, "First alert");

        assertNotNull(testDonor.getAdminNotes());
        assertTrue(testDonor.getAdminNotes().contains("First alert"));
    }

    @Test
    void sendAlertToUser_SendsWebSocketToCorrectUserQueue() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);

        adminUserService.sendAlertToUser(1L, "Hello!");

        verify(messagingTemplate).convertAndSendToUser(
                eq("1"),
                eq("/queue/messages"),
                anyMap()
        );
    }

    @Test
    void sendAlertToUser_WithUnsupportedPreferredLanguage_FallsBackToEnglish() {
        testDonor.setLanguagePreference("de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(messageSource.getMessage(eq("admin.alert.template.warning"), isNull(), anyString(), any(java.util.Locale.class)))
            .thenReturn("Localized warning in English");

        adminUserService.sendAlertToUser(1L, "Hello!", "warning");

        verify(messagingTemplate).convertAndSendToUser(
                eq("1"),
                eq("/queue/messages"),
            argThat(payload -> "en".equals(((Map<?, ?>) payload).get("preferredLanguage"))
                && "Localized warning in English".equals(((Map<?, ?>) payload).get("messageBody")))
        );
        verify(emailService).sendAdminAlertEmail(eq("donor@test.com"), anyString(), eq("Localized warning in English"), eq("en"));
    }

    // -----------------------------------------------------------------------
    // getUserActivity – admin role
    // -----------------------------------------------------------------------

    @Test
    void getUserActivity_WithAdmin_ReturnsZeroCounts() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(testAdmin));

        AdminUserResponse result = adminUserService.getUserActivity(3L);

        assertNotNull(result);
        assertEquals(0L, result.getDonationCount());
        assertEquals(0L, result.getClaimCount());
        verify(surplusPostRepository, never()).countByDonorId(anyLong());
        verify(claimRepository, never()).countByReceiverId(anyLong());
    }

    @Test
    void getUserActivity_WithNonExistentUser_ThrowsException() {
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> adminUserService.getUserActivity(404L));
    }

    // -----------------------------------------------------------------------
    // deactivateUser – audit logging and in-app deactivation message
    // -----------------------------------------------------------------------

    @Test
    void deactivateUser_WritesAuditLog() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);
        when(notificationPreferenceService.shouldSendNotification(any(), anyString(), anyString())).thenReturn(false);

        adminUserService.deactivateUser(1L, "policy violation", 3L);

        verify(auditLogger).logAction(any(AuditLog.class));
    }

    @Test
    void deactivateUser_WhenAdminFound_SendsDeactivationMessage() {
        Conversation savedConversation = new Conversation();
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.findById(3L)).thenReturn(Optional.of(testAdmin));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);
        when(notificationPreferenceService.shouldSendNotification(any(), anyString(), anyString())).thenReturn(false);
        when(conversationRepository.findByUsers(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(savedConversation);

        adminUserService.deactivateUser(1L, "policy violation", 3L);

        verify(messageRepository).save(any());
        verify(messagingTemplate).convertAndSendToUser(
                eq("1"),
                eq("/queue/messages"),
                anyMap()
        );
    }

    @Test
    void deactivateUser_AuditLog_ContainsAdminEmailAndReason() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.findById(3L)).thenReturn(Optional.of(testAdmin));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);
        when(notificationPreferenceService.shouldSendNotification(any(), anyString(), anyString())).thenReturn(false);
        when(conversationRepository.findByUsers(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(new Conversation());

        adminUserService.deactivateUser(1L, "misconduct", 3L);

        verify(auditLogger).logAction(argThat(log ->
                "DEACTIVATE_USER".equals(log.getAction())
                && "User".equals(log.getEntityType())
                && "1".equals(log.getEntityId())
                && "misconduct".equals(log.getNewValue())
        ));
    }

    // -----------------------------------------------------------------------
    // getRecentActivity
    // -----------------------------------------------------------------------

    @Test
    void getRecentActivity_WithNonExistentUser_ThrowsException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> adminUserService.getRecentActivity(999L, 3));
    }

    @Test
    void getRecentActivity_WithDonor_ReturnsDonationActivities() {
        testOrganization.setVerificationStatus(null);
        SurplusPost mockPost = mock(SurplusPost.class);
        when(mockPost.getTitle()).thenReturn("Rice Bags");
        when(mockPost.getQuantity()).thenReturn(null);
        when(mockPost.getId()).thenReturn(10L);
        when(mockPost.getCreatedAt()).thenReturn(LocalDateTime.now().minusDays(1));

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.findByDonorOrderByCreatedAtDesc(testDonor))
                .thenReturn(Arrays.asList(mockPost));
        when(auditLogRepository.findByEntityIdAndActionOrderByTimestampDesc("1", "DEACTIVATE_USER"))
                .thenReturn(Collections.emptyList());

        List<UserActivityDTO> result = adminUserService.getRecentActivity(1L, 3);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("DONATION", result.get(0).getAction());
        assertEquals("Rice Bags", result.get(0).getTitle());
        assertEquals(10L, result.get(0).getEntityId());
        verify(surplusPostRepository).findByDonorOrderByCreatedAtDesc(testDonor);
    }

    @Test
    void getRecentActivity_WithDonor_FormatsQuantityWhenPresent() {
        testOrganization.setVerificationStatus(null);
        com.example.foodflow.model.types.Quantity qty =
                new com.example.foodflow.model.types.Quantity(50.0, com.example.foodflow.model.types.Quantity.Unit.KILOGRAM);
        SurplusPost mockPost = mock(SurplusPost.class);
        when(mockPost.getTitle()).thenReturn("Bread");
        when(mockPost.getQuantity()).thenReturn(qty);
        when(mockPost.getId()).thenReturn(11L);
        when(mockPost.getCreatedAt()).thenReturn(LocalDateTime.now().minusHours(1));

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.findByDonorOrderByCreatedAtDesc(testDonor))
                .thenReturn(Arrays.asList(mockPost));
        when(auditLogRepository.findByEntityIdAndActionOrderByTimestampDesc("1", "DEACTIVATE_USER"))
                .thenReturn(Collections.emptyList());

        List<UserActivityDTO> result = adminUserService.getRecentActivity(1L, 3);

        assertEquals(1, result.size());
        assertEquals("50kg", result.get(0).getQuantity());
    }

    @Test
    void getRecentActivity_WithReceiver_ReturnsClaimActivities() {
        testOrganization.setVerificationStatus(null);
        Claim mockClaim = mock(Claim.class);
        SurplusPost mockPost = mock(SurplusPost.class);
        when(mockClaim.getSurplusPost()).thenReturn(mockPost);
        when(mockClaim.getClaimedAt()).thenReturn(LocalDateTime.now().minusDays(2));
        when(mockClaim.getId()).thenReturn(20L);
        when(mockPost.getTitle()).thenReturn("Vegetables");
        when(mockPost.getQuantity()).thenReturn(null);

        when(userRepository.findById(2L)).thenReturn(Optional.of(testReceiver));
        when(claimRepository.findReceiverClaimsWithDetails(eq(2L), anyList()))
                .thenReturn(Arrays.asList(mockClaim));
        when(auditLogRepository.findByEntityIdAndActionOrderByTimestampDesc("2", "DEACTIVATE_USER"))
                .thenReturn(Collections.emptyList());

        List<UserActivityDTO> result = adminUserService.getRecentActivity(2L, 3);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CLAIM", result.get(0).getAction());
        assertEquals("Vegetables", result.get(0).getTitle());
        assertEquals(20L, result.get(0).getEntityId());
        verify(claimRepository).findReceiverClaimsWithDetails(eq(2L), anyList());
    }

    @Test
    void getRecentActivity_WithAdminUser_ReturnsEmpty() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(testAdmin));
        when(auditLogRepository.findByEntityIdAndActionOrderByTimestampDesc("3", "DEACTIVATE_USER"))
                .thenReturn(Collections.emptyList());

        List<UserActivityDTO> result = adminUserService.getRecentActivity(3L, 3);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getRecentActivity_RespectsLimit() {
        testOrganization.setVerificationStatus(null);
        SurplusPost p1 = mock(SurplusPost.class);
        SurplusPost p2 = mock(SurplusPost.class);
        SurplusPost p3 = mock(SurplusPost.class);
        when(p1.getTitle()).thenReturn("Post 1");
        when(p1.getQuantity()).thenReturn(null);
        when(p1.getId()).thenReturn(1L);
        when(p1.getCreatedAt()).thenReturn(LocalDateTime.now().minusDays(1));
        when(p2.getTitle()).thenReturn("Post 2");
        when(p2.getQuantity()).thenReturn(null);
        when(p2.getId()).thenReturn(2L);
        when(p2.getCreatedAt()).thenReturn(LocalDateTime.now().minusDays(2));
        // p3 stubs intentionally omitted – the loop breaks at limit=2, so p3 is never accessed

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.findByDonorOrderByCreatedAtDesc(testDonor))
                .thenReturn(Arrays.asList(p1, p2, p3));
        when(auditLogRepository.findByEntityIdAndActionOrderByTimestampDesc("1", "DEACTIVATE_USER"))
                .thenReturn(Collections.emptyList());

        List<UserActivityDTO> result = adminUserService.getRecentActivity(1L, 2);

        assertEquals(2, result.size());
    }

    @Test
    void getRecentActivity_IncludesDeactivationFromAuditLog() {
        testOrganization.setVerificationStatus(null);
        AuditLog deactivationEntry = new AuditLog(
                "admin@test.com", "DEACTIVATE_USER", "User", "1",
                null, "donor@test.com", "Terms violation");
        deactivationEntry.setTimestamp(LocalDateTime.now().minusHours(1));

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.findByDonorOrderByCreatedAtDesc(testDonor))
                .thenReturn(Collections.emptyList());
        when(auditLogRepository.findByEntityIdAndActionOrderByTimestampDesc("1", "DEACTIVATE_USER"))
                .thenReturn(Arrays.asList(deactivationEntry));

        List<UserActivityDTO> result = adminUserService.getRecentActivity(1L, 3);

        assertEquals(1, result.size());
        assertEquals("DEACTIVATE_USER", result.get(0).getAction());
        assertEquals(1L, result.get(0).getEntityId());
    }

    @Test
    void getRecentActivity_WithVerifiedOrg_IncludesVerificationActivity() {
        testOrganization.setVerificationStatus(VerificationStatus.VERIFIED);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.findByDonorOrderByCreatedAtDesc(testDonor))
                .thenReturn(Collections.emptyList());
        when(auditLogRepository.findByEntityIdAndActionOrderByTimestampDesc("1", "DEACTIVATE_USER"))
                .thenReturn(Collections.emptyList());

        List<UserActivityDTO> result = adminUserService.getRecentActivity(1L, 3);

        assertEquals(1, result.size());
        assertEquals("VERIFICATION", result.get(0).getAction());
    }

    @Test
    void getRecentActivity_ResultIsSortedByTimestampDescending() {
        testOrganization.setVerificationStatus(null);
        AuditLog olderEntry = new AuditLog(
                "admin@test.com", "DEACTIVATE_USER", "User",
                "1", null, null, "first");
        olderEntry.setTimestamp(LocalDateTime.now().minusDays(5));

        SurplusPost recentPost = mock(SurplusPost.class);
        when(recentPost.getTitle()).thenReturn("Recent Donation");
        when(recentPost.getQuantity()).thenReturn(null);
        when(recentPost.getId()).thenReturn(7L);
        when(recentPost.getCreatedAt()).thenReturn(LocalDateTime.now().minusDays(1));

        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(surplusPostRepository.findByDonorOrderByCreatedAtDesc(testDonor))
                .thenReturn(Arrays.asList(recentPost));
        when(auditLogRepository.findByEntityIdAndActionOrderByTimestampDesc("1", "DEACTIVATE_USER"))
                .thenReturn(Arrays.asList(olderEntry));

        List<UserActivityDTO> result = adminUserService.getRecentActivity(1L, 5);

        assertEquals(2, result.size());
        assertEquals("DONATION", result.get(0).getAction());   // newer first
        assertEquals("DEACTIVATE_USER", result.get(1).getAction()); // older second
    }
}
