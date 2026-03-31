package com.example.foodflow.service;

import com.example.foodflow.audit.AuditLogger;
import com.example.foodflow.model.dto.AdminPendingChangeDTO;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.ProfileChangeRequestRepository;
import com.example.foodflow.repository.UserRepository;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
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
    private ProfileChangeService profileChangeService;

    private User user;
    private Organization organization;

    @BeforeEach
    void setUp() {
        user = new User();
        setId(user, 1L);
        user.setEmail("user@test.com");
        user.setRole(UserRole.DONOR);

        organization = new Organization();
        organization.setName("Old Org Name");
        organization.setBusinessLicense("OLD-LICENSE");
        organization.setCharityRegistrationNumber("CHARITY-123");
        organization.setCapacity(100);
    }

    // ========== handleOrganizationFieldUpdate TESTS ==========

    @Test
    void handleOrganizationFieldUpdate_NonSensitiveField_ReturnsFalse() {
        when(registry.isSensitive("ORGANIZATION", "email")).thenReturn(false);

        boolean result = profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "email", "new@test.com");

        assertThat(result).isFalse();
        verifyNoInteractions(repository);
    }

    @Test
    void handleOrganizationFieldUpdate_SensitiveField_NoPending_CreatesNewRequest() {
        when(registry.isSensitive("ORGANIZATION", "name")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.empty());

        boolean result = profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "name", "New Org Name");

        assertThat(result).isTrue();
        verify(repository).save(any(ProfileChangeRequest.class));
        verify(auditLogger).logAction(any(AuditLog.class));
    }

    @Test
    void handleOrganizationFieldUpdate_SensitiveField_ExistingPending_UpdatesRequest() {
        when(registry.isSensitive("ORGANIZATION", "name")).thenReturn(true);

        ProfileChangeRequest existing = new ProfileChangeRequest();
        existing.setFieldName("name");
        existing.setNewValue("Previous New Name");
        existing.setStatus(ChangeStatus.PENDING);

        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.of(existing));

        boolean result = profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "name", "Updated Org Name");

        assertThat(result).isTrue();
        assertThat(existing.getNewValue()).isEqualTo("Updated Org Name");
        verify(repository).save(existing);
    }

    @Test
    void handleOrganizationFieldUpdate_NullOrganization_UsesNullOldValue() {
        when(registry.isSensitive("ORGANIZATION", "name")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.empty());

        boolean result = profileChangeService.handleOrganizationFieldUpdate(
                user, null, "name", "New Name");

        assertThat(result).isTrue();
        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOldValue()).isNull();
    }

    @Test
    void handleOrganizationFieldUpdate_ExtractsBusinessLicense() {
        when(registry.isSensitive("ORGANIZATION", "businessLicense")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.empty());

        profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "businessLicense", "NEW-LICENSE");

        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOldValue()).isEqualTo("OLD-LICENSE");
    }

    @Test
    void handleOrganizationFieldUpdate_ExtractsCapacity() {
        when(registry.isSensitive("ORGANIZATION", "capacity")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.empty());

        profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "capacity", "200");

        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOldValue()).isEqualTo("100");
    }

    @Test
    void handleOrganizationFieldUpdate_ExtractsCharityRegistrationNumber() {
        when(registry.isSensitive("ORGANIZATION", "charityRegistrationNumber")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.empty());

        profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "charityRegistrationNumber", "NEW-CHARITY-456");

        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOldValue()).isEqualTo("CHARITY-123");
    }

    @Test
    void handleOrganizationFieldUpdate_ExtractsOrganizationType() {
        organization.setOrganizationType(OrganizationType.RESTAURANT);
        when(registry.isSensitive("ORGANIZATION", "organizationType")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.empty());

        profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "organizationType", "GROCERY");

        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOldValue()).isEqualTo("RESTAURANT");
    }

    @Test
    void handleOrganizationFieldUpdate_NullOrganizationType_OldValueIsNull() {
        organization.setOrganizationType(null);
        when(registry.isSensitive("ORGANIZATION", "organizationType")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.empty());

        profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "organizationType", "GROCERY");

        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOldValue()).isNull();
    }

    @Test
    void handleOrganizationFieldUpdate_NullCapacity_OldValueIsNull() {
        organization.setCapacity(null);
        when(registry.isSensitive("ORGANIZATION", "capacity")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.empty());

        profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "capacity", "50");

        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOldValue()).isNull();
    }

    @Test
    void handleOrganizationFieldUpdate_UnknownField_OldValueIsNull() {
        when(registry.isSensitive("ORGANIZATION", "unknownField")).thenReturn(true);
        when(repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                anyLong(), anyString(), anyString(), any()))
                .thenReturn(Optional.empty());

        profileChangeService.handleOrganizationFieldUpdate(
                user, organization, "unknownField", "someValue");

        ArgumentCaptor<ProfileChangeRequest> captor = ArgumentCaptor.forClass(ProfileChangeRequest.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOldValue()).isNull();
    }

    // ========== approveProfileChange TESTS ==========

    @Test
    void approveProfileChange_ValidPendingRequest_ApprovesAndNotifies() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setUser(user);
        request.setEntityType("ORGANIZATION");
        request.setFieldName("name");
        request.setOldValue("Old Name");
        request.setNewValue("New Name");
        request.setStatus(ChangeStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(request));
        when(organizationRepository.findByUserId(user.getId()))
                .thenReturn(Optional.of(organization));

        profileChangeService.approveProfileChange(1L);

        assertThat(request.getStatus()).isEqualTo(ChangeStatus.APPROVED);
        assertThat(request.getReviewedBy()).isEqualTo(admin);
        verify(repository).save(request);
        verify(auditLogger).logAction(any(AuditLog.class));
        verify(notificationService).sendProfileChangeNotification(eq(user), anyString());
    }

    @Test
    void approveProfileChange_ApproveAddress_SetsAddress() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setUser(user);
        request.setEntityType("ORGANIZATION");
        request.setFieldName("address");
        request.setNewValue("123 New Street");
        request.setStatus(ChangeStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(request));
        when(organizationRepository.findByUserId(user.getId()))
                .thenReturn(Optional.of(organization));

        profileChangeService.approveProfileChange(1L);

        assertThat(organization.getAddress()).isEqualTo("123 New Street");
    }

    @Test
    void approveProfileChange_ApprovePhone_SetsPhone() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setUser(user);
        request.setEntityType("ORGANIZATION");
        request.setFieldName("phone");
        request.setNewValue("+15141234567");
        request.setStatus(ChangeStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(request));
        when(organizationRepository.findByUserId(user.getId()))
                .thenReturn(Optional.of(organization));

        profileChangeService.approveProfileChange(1L);

        assertThat(organization.getPhone()).isEqualTo("+15141234567");
    }

    @Test
    void approveProfileChange_ApproveContactPerson_SetsContactPerson() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setUser(user);
        request.setEntityType("ORGANIZATION");
        request.setFieldName("contactPerson");
        request.setNewValue("Jane Doe");
        request.setStatus(ChangeStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(request));
        when(organizationRepository.findByUserId(user.getId()))
                .thenReturn(Optional.of(organization));

        profileChangeService.approveProfileChange(1L);

        assertThat(organization.getContactPerson()).isEqualTo("Jane Doe");
    }

    @Test
    void approveProfileChange_RequestNotFound_ThrowsException() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileChangeService.approveProfileChange(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Request not found");
    }

    @Test
    void approveProfileChange_NotPending_ThrowsException() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setStatus(ChangeStatus.APPROVED);

        when(repository.findById(1L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> profileChangeService.approveProfileChange(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Request is not pending");
    }

    @Test
    void approveProfileChange_NoExistingOrg_CreatesNewOrg() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setUser(user);
        request.setEntityType("ORGANIZATION");
        request.setFieldName("name");
        request.setNewValue("Brand New Org");
        request.setStatus(ChangeStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(request));
        when(organizationRepository.findByUserId(user.getId()))
                .thenReturn(Optional.empty());

        profileChangeService.approveProfileChange(1L);

        verify(organizationRepository).save(any(Organization.class));
    }

    // ========== rejectProfileChange TESTS ==========

    @Test
    void rejectProfileChange_ValidRequest_RejectsAndNotifies() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setUser(user);
        request.setEntityType("ORGANIZATION");
        request.setFieldName("name");
        request.setOldValue("Old");
        request.setNewValue("New");
        request.setStatus(ChangeStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(request));

        profileChangeService.rejectProfileChange(1L, "Fraud", "Custom message");

        assertThat(request.getStatus()).isEqualTo(ChangeStatus.REJECTED);
        assertThat(request.getRejectionReason()).isEqualTo("Fraud");
        verify(repository).save(request);
        verify(auditLogger).logAction(any(AuditLog.class));
        verify(notificationService).sendProfileChangeNotification(eq(user), eq("Custom message"));
    }

    @Test
    void rejectProfileChange_NullCustomMessage_UsesDefaultMessage() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setUser(user);
        request.setEntityType("ORGANIZATION");
        request.setFieldName("name");
        request.setNewValue("New");
        request.setStatus(ChangeStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(request));

        profileChangeService.rejectProfileChange(1L, "Invalid document", null);

        verify(notificationService).sendProfileChangeNotification(
                eq(user),
                contains("Invalid document")
        );
    }

    @Test
    void rejectProfileChange_BlankCustomMessage_UsesDefaultMessage() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setUser(user);
        request.setEntityType("ORGANIZATION");
        request.setFieldName("name");
        request.setNewValue("New");
        request.setStatus(ChangeStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(request));

        profileChangeService.rejectProfileChange(1L, "Fraud", "   ");

        verify(notificationService).sendProfileChangeNotification(
                eq(user),
                contains("Fraud")
        );
    }

    @Test
    void rejectProfileChange_NotFound_ThrowsException() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileChangeService.rejectProfileChange(99L, "reason", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Request not found");
    }

    @Test
    void rejectProfileChange_NotPending_ThrowsException() {
        User admin = new User();
        setId(admin, 2L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        setupSecurityContext(admin);

        ProfileChangeRequest request = new ProfileChangeRequest();
        setId(request, 1L);
        request.setStatus(ChangeStatus.REJECTED);

        when(repository.findById(1L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> profileChangeService.rejectProfileChange(1L, "reason", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Request is not pending");
    }

    // ========== getPendingChanges TESTS ==========

    @Test
    void getPendingChanges_ReturnsMappedDTOs() {
        User requestUser = new User();
        setId(requestUser, 1L);
        requestUser.setEmail("user@test.com");

        ProfileChangeRequest req1 = new ProfileChangeRequest();
        setId(req1, 1L);
        req1.setUser(requestUser);
        req1.setFieldName("name");
        req1.setOldValue("Old");
        req1.setNewValue("New");

        when(repository.findByStatus(ChangeStatus.PENDING)).thenReturn(List.of(req1));

        List<AdminPendingChangeDTO> result = profileChangeService.getPendingChanges();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFieldName()).isEqualTo("name");
        assertThat(result.get(0).getOldValue()).isEqualTo("Old");
        assertThat(result.get(0).getNewValue()).isEqualTo("New");
    }

    @Test
    void getPendingChanges_EmptyList_ReturnsEmpty() {
        when(repository.findByStatus(ChangeStatus.PENDING)).thenReturn(List.of());

        List<AdminPendingChangeDTO> result = profileChangeService.getPendingChanges();

        assertThat(result).isEmpty();
    }

    // ========== findUserByEmail TESTS ==========

    @Test
    void findUserByEmail_ExistingEmail_ReturnsUser() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        User result = profileChangeService.findUserByEmail("user@test.com");

        assertThat(result).isEqualTo(user);
    }

    @Test
    void findUserByEmail_NotFound_ThrowsException() {
        when(userRepository.findByEmail("missing@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileChangeService.findUserByEmail("missing@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Admin not found");
    }

    // ========== HELPERS ==========

    private void setupSecurityContext(User admin) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(admin);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    private void setId(Object entity, Long id) {
        try {
            java.lang.reflect.Field field = entity.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Could not set id on " + entity.getClass().getSimpleName(), e);
        }
    }
}