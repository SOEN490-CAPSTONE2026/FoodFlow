package com.example.foodflow.service;

import com.example.foodflow.model.dto.AdminUserResponse;
import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

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
        when(userRepository.findById(1L)).thenReturn(Optional.of(testDonor));
        when(userRepository.save(any(User.class))).thenReturn(testDonor);

        adminUserService.sendAlertToUser(1L, "Test alert message");

        verify(messagingTemplate).convertAndSendToUser(
            eq("1"),
            eq("/queue/messages"),
            anyMap()
        );
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
}
