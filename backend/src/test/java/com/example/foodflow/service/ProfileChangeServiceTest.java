package com.example.foodflow.service;

import com.example.foodflow.audit.AuditLogger;
import com.example.foodflow.model.dto.AdminPendingChangeDTO;
import com.example.foodflow.model.entity.AuditLog;
import com.example.foodflow.model.entity.ChangeStatus;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.ProfileChangeRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.ProfileChangeRequestRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileChangeServiceTest {

    @Mock
    private ProfileChangeRequestRepository repository;

    @Mock
    private AuditLogger auditLogger;

    @Mock
    private SensitiveFieldRegistry registry;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ProfileChangeService service;

    private User user;
    private Organization organization;
    private Long userId;

   @BeforeEach
void setUp() {
    userId = 1L;

    user = mock(User.class);
    lenient().when(user.getId()).thenReturn(userId);
    lenient().when(user.getEmail()).thenReturn("user@test.com");
    lenient().when(user.getFullName()).thenReturn("Test User");

    organization = new Organization();
    organization.setUser(user);
    organization.setName("Old Org");
    organization.setAddress("Old Address");
}

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void handleOrganizationFieldUpdate_nonSensitiveField_returnsFalse() {
        when(registry.isSensitive("ORGANIZATION", "phone")).thenReturn(false);

        boolean result = service.handleOrganizationFieldUpdate(user, organization, "phone", "123456");

        assertFalse(result);
        verify(repository, never()).save(any());
        verify(auditLogger, never()).logAction(any());
    }

    @Test
    void handleOrganizationFieldUpdate_existingPending_updatesRequest() {
        ProfileChangeRequest existing = new ProfileChangeRequest();
        existing.setUser(user);
        existing.setEntityType("ORGANIZATION");
        existing.setFieldName("name");
        existing.setOldValue("Old Org");
        existing.setNewValue("Older Org");
        existing.setStatus(ChangeStatus.PENDING);

        when(registry.isSensitive("ORGANIZATION", "name")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                userId, "ORGANIZATION", "name", ChangeStatus.PENDING
        )).thenReturn(Optional.of(existing));

        boolean result = service.handleOrganizationFieldUpdate(user, organization, "name", "New Org");

        assertTrue(result);
        assertEquals("New Org", existing.getNewValue());
        verify(repository).save(existing);
        verify(auditLogger).logAction(any(AuditLog.class));
    }

    @Test
    void handleOrganizationFieldUpdate_noPending_createsNewRequest() {
        when(registry.isSensitive("ORGANIZATION", "name")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                userId, "ORGANIZATION", "name", ChangeStatus.PENDING
        )).thenReturn(Optional.empty());

        boolean result = service.handleOrganizationFieldUpdate(user, organization, "name", "New Org");

        assertTrue(result);

        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        ProfileChangeRequest saved = captor.getValue();

        assertEquals(user, saved.getUser());
        assertEquals("ORGANIZATION", saved.getEntityType());
        assertEquals("name", saved.getFieldName());
        assertEquals("Old Org", saved.getOldValue());
        assertEquals("New Org", saved.getNewValue());
        assertEquals(ChangeStatus.PENDING, saved.getStatus());
        assertNotNull(saved.getSubmittedAt());
        verify(auditLogger).logAction(any(AuditLog.class));
    }

    @Test
    void handleOrganizationFieldUpdate_addressField_createsNewRequest() {
        when(registry.isSensitive("ORGANIZATION", "address")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                userId, "ORGANIZATION", "address", ChangeStatus.PENDING
        )).thenReturn(Optional.empty());

        boolean result = service.handleOrganizationFieldUpdate(user, organization, "address", "New Address");

        assertTrue(result);
        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        assertEquals("Old Address", captor.getValue().getOldValue());
        assertEquals("New Address", captor.getValue().getNewValue());
    }

    @Test
    void approveProfileChange_updatesOrganizationName_andSendsNotification() {
        User admin = mock(User.class);
        when(admin.getEmail()).thenReturn("admin@test.com");
        mockAuthenticatedUser(admin);

        ProfileChangeRequest request = mock(ProfileChangeRequest.class);
        when(request.getId()).thenReturn(1L);
        when(request.getStatus()).thenReturn(ChangeStatus.PENDING);
        when(request.getUser()).thenReturn(user);
        when(request.getEntityType()).thenReturn("ORGANIZATION");
        when(request.getFieldName()).thenReturn("name");
        when(request.getOldValue()).thenReturn("Old Org");
        when(request.getNewValue()).thenReturn("Approved Org");

        when(repository.findById(1L)).thenReturn(Optional.of(request));
        when(organizationRepository.findByUserId(userId)).thenReturn(Optional.of(organization));

        service.approveProfileChange(1L);

        assertEquals("Approved Org", organization.getName());
        verify(organizationRepository).save(organization);
        verify(request).setStatus(ChangeStatus.APPROVED);
        verify(request).setReviewedAt(any());
        verify(request).setReviewedBy(admin);
        verify(repository).save(request);
        verify(auditLogger).logAction(any(AuditLog.class));
        verify(notificationService).sendProfileChangeNotification(user, "Your profile change has been approved.");
    }

    @Test
    void approveProfileChange_updatesOrganizationAddress() {
        User admin = mock(User.class);
        when(admin.getEmail()).thenReturn("admin@test.com");
        mockAuthenticatedUser(admin);

        ProfileChangeRequest request = mock(ProfileChangeRequest.class);
        when(request.getId()).thenReturn(2L);
        when(request.getStatus()).thenReturn(ChangeStatus.PENDING);
        when(request.getUser()).thenReturn(user);
        when(request.getEntityType()).thenReturn("ORGANIZATION");
        when(request.getFieldName()).thenReturn("address");
        when(request.getOldValue()).thenReturn("Old Address");
        when(request.getNewValue()).thenReturn("Approved Address");

        when(repository.findById(2L)).thenReturn(Optional.of(request));
        when(organizationRepository.findByUserId(userId)).thenReturn(Optional.of(organization));

        service.approveProfileChange(2L);

        assertEquals("Approved Address", organization.getAddress());
        verify(request).setStatus(ChangeStatus.APPROVED);
    }

    @Test
    void approveProfileChange_whenRequestNotFound_throwsException() {
        mockAuthenticatedUser(mock(User.class));
        when(repository.findById(99L)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.approveProfileChange(99L)
        );

        assertEquals("Request not found", exception.getMessage());
        verify(notificationService, never()).sendProfileChangeNotification(any(), any());
    }

    @Test
    void approveProfileChange_whenNotPending_throwsException() {
        mockAuthenticatedUser(mock(User.class));

        ProfileChangeRequest request = mock(ProfileChangeRequest.class);
        when(request.getStatus()).thenReturn(ChangeStatus.APPROVED);
        when(repository.findById(5L)).thenReturn(Optional.of(request));

        assertThrows(IllegalStateException.class, () -> service.approveProfileChange(5L));
        verify(notificationService, never()).sendProfileChangeNotification(any(), any());
    }

    @Test
    void rejectProfileChange_withCustomMessage_sendsCustomNotification() {
        User admin = mock(User.class);
        when(admin.getEmail()).thenReturn("admin@test.com");
        mockAuthenticatedUser(admin);

        ProfileChangeRequest request = mock(ProfileChangeRequest.class);
        when(request.getId()).thenReturn(3L);
        when(request.getStatus()).thenReturn(ChangeStatus.PENDING);
        when(request.getUser()).thenReturn(user);
        when(request.getEntityType()).thenReturn("ORGANIZATION");
        when(request.getOldValue()).thenReturn("Old Org");
        when(request.getNewValue()).thenReturn("Rejected Org");

        when(repository.findById(3L)).thenReturn(Optional.of(request));

        service.rejectProfileChange(3L, "invalid_organization", "Custom rejection message");

        verify(request).setStatus(ChangeStatus.REJECTED);
        verify(request).setRejectionReason("invalid_organization");
        verify(request).setReviewedBy(admin);
        verify(repository).save(request);
        verify(auditLogger).logAction(any(AuditLog.class));
        verify(notificationService).sendProfileChangeNotification(user, "Custom rejection message");
    }

    @Test
    void rejectProfileChange_withoutCustomMessage_usesDefaultNotification() {
        User admin = mock(User.class);
        when(admin.getEmail()).thenReturn("admin@test.com");
        mockAuthenticatedUser(admin);

        ProfileChangeRequest request = mock(ProfileChangeRequest.class);
        when(request.getId()).thenReturn(4L);
        when(request.getStatus()).thenReturn(ChangeStatus.PENDING);
        when(request.getUser()).thenReturn(user);
        when(request.getEntityType()).thenReturn("ORGANIZATION");
        when(request.getOldValue()).thenReturn("Old Org");
        when(request.getNewValue()).thenReturn("Rejected Org");

        when(repository.findById(4L)).thenReturn(Optional.of(request));

        service.rejectProfileChange(4L, "duplicate_account", "");

        verify(notificationService).sendProfileChangeNotification(
                user,
                "Your profile change has been rejected. Reason: duplicate_account"
        );
    }

    @Test
    void rejectProfileChange_whenNotPending_throwsException() {
        mockAuthenticatedUser(mock(User.class));

        ProfileChangeRequest request = mock(ProfileChangeRequest.class);
        when(request.getStatus()).thenReturn(ChangeStatus.REJECTED);
        when(repository.findById(6L)).thenReturn(Optional.of(request));

        assertThrows(IllegalStateException.class,
                () -> service.rejectProfileChange(6L, "reason", "msg"));
    }

    @Test
    void getPendingChanges_mapsRequestsToDtos() {
        ProfileChangeRequest request = new ProfileChangeRequest();
        request.setUser(user);
        request.setFieldName("name");
        request.setOldValue("Old Org");
        request.setNewValue("New Org");
        request.setStatus(ChangeStatus.PENDING);

        when(repository.findByStatus(ChangeStatus.PENDING)).thenReturn(List.of(request));

        List<AdminPendingChangeDTO> result = service.getPendingChanges();

        assertEquals(1, result.size());
        assertEquals("Test User", result.get(0).getUserName());
        assertEquals("name", result.get(0).getFieldName());
        assertEquals("Old Org", result.get(0).getOldValue());
        assertEquals("New Org", result.get(0).getNewValue());
    }

    @Test
    void findUserByEmail_whenUserExists_returnsUser() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        assertEquals(user, service.findUserByEmail("user@test.com"));
    }

    @Test
    void findUserByEmail_whenUserDoesNotExist_throwsException() {
        when(userRepository.findByEmail("missing@test.com")).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.findUserByEmail("missing@test.com")
        );
        assertEquals("User not found", exception.getMessage());
    }

    private void mockAuthenticatedUser(User admin) {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(authentication.getPrincipal()).thenReturn(admin);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
}