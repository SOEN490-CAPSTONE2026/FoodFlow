package com.example.foodflow.service;

import com.example.foodflow.model.dto.AdminDisputeResponse;
import com.example.foodflow.model.dto.CreateReportRequest;
import com.example.foodflow.model.dto.DisputeResponse;
import com.example.foodflow.model.entity.Dispute;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.DisputeStatus;
import com.example.foodflow.repository.DisputeRepository;
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

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DisputeServiceTest {

    @Mock
    private DisputeRepository disputeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock  
    private BusinessMetricsService businessMetricsService;

    @InjectMocks
    private DisputeService disputeService;

    private User reporter;
    private User reported;
    private SurplusPost surplusPost;
    private Dispute dispute;
    private Organization organization;

    @BeforeEach
    void setUp() {
        organization = new Organization();
        organization.setId(1L);
        organization.setName("Test Organization");

        reporter = new User();
        reporter.setId(1L);
        reporter.setEmail("reporter@test.com");
        reporter.setRole(UserRole.RECEIVER);
        reporter.setOrganization(organization);

        reported = new User();
        reported.setId(2L);
        reported.setEmail("reported@test.com");
        reported.setRole(UserRole.DONOR);

        surplusPost = new SurplusPost();
        surplusPost.setId(1L);
        surplusPost.setTitle("Test Donation");
        surplusPost.setDonor(reported);

        dispute = new Dispute(reporter, reported, surplusPost, "Test description");
        dispute.setId(1L);
        dispute.setStatus(DisputeStatus.OPEN);
    }

    // ==================== Tests for createReport ====================

    @Test
    void testCreateReport_Success() {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(1L);
        request.setDescription("User did not show up for pickup");
        request.setImageUrl("http://example.com/evidence.jpg");

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reported));
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(disputeRepository.save(any(Dispute.class))).thenReturn(dispute);

        // When
        DisputeResponse response = disputeService.createReport(request, 1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getReporterId()).isEqualTo(1L);
        assertThat(response.getReportedId()).isEqualTo(2L);
        assertThat(response.getDonationId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(DisputeStatus.OPEN);
        verify(disputeRepository).save(any(Dispute.class));
    }

    @Test
    void testCreateReport_WithoutDonation() {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(null);
        request.setDescription("Inappropriate behavior");

        Dispute disputeWithoutDonation = new Dispute(reporter, reported, null, "Inappropriate behavior");
        disputeWithoutDonation.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reported));
        when(disputeRepository.save(any(Dispute.class))).thenReturn(disputeWithoutDonation);

        // When
        DisputeResponse response = disputeService.createReport(request, 1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getDonationId()).isNull();
        assertThat(response.getDonationTitle()).isNull();
        verify(surplusPostRepository, never()).findById(any());
    }

    @Test
    void testCreateReport_ReporterNotFound() {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDescription("Test");

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> disputeService.createReport(request, 999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Reporter not found");

        verify(disputeRepository, never()).save(any(Dispute.class));
    }

    @Test
    void testCreateReport_ReportedUserNotFound() {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(999L);
        request.setDescription("Test");

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> disputeService.createReport(request, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Reported user not found");

        verify(disputeRepository, never()).save(any(Dispute.class));
    }

    @Test
    void testCreateReport_DonationNotFound_DoesNotFail() {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(999L);
        request.setDescription("Test");

        Dispute disputeWithoutDonation = new Dispute(reporter, reported, null, "Test");
        disputeWithoutDonation.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reported));
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());
        when(disputeRepository.save(any(Dispute.class))).thenReturn(disputeWithoutDonation);

        // When
        DisputeResponse response = disputeService.createReport(request, 1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getDonationId()).isNull();
    }

    @Test
    void testCreateReport_WithImageUrl() {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDescription("Test");
        request.setImageUrl("http://example.com/evidence.jpg");

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reported));
        when(disputeRepository.save(any(Dispute.class))).thenReturn(dispute);

        // When
        DisputeResponse response = disputeService.createReport(request, 1L);

        // Then
        assertThat(response).isNotNull();
        verify(disputeRepository).save(any(Dispute.class));
    }

    @Test
    void testCreateReport_UserWithOrganization() {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDescription("Test");

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reported));
        when(disputeRepository.save(any(Dispute.class))).thenReturn(dispute);

        // When
        DisputeResponse response = disputeService.createReport(request, 1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getReporterName()).isEqualTo("Test Organization");
    }

    @Test
    void testCreateReport_UserWithoutOrganization() {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDescription("Test");

        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reported));
        when(disputeRepository.save(any(Dispute.class))).thenReturn(dispute);

        // When
        DisputeResponse response = disputeService.createReport(request, 1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getReportedName()).isEqualTo("reported@test.com");
    }

    // ==================== Tests for getAllDisputes ====================

    @Test
    void testGetAllDisputes_NoFilter() {
        // Given
        Page<Dispute> disputePage = new PageImpl<>(Arrays.asList(dispute));
        when(disputeRepository.findAll(any(Pageable.class))).thenReturn(disputePage);

        // When
        Page<AdminDisputeResponse> result = disputeService.getAllDisputes(null, 0, 10);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo(1L);
        verify(disputeRepository).findAll(any(Pageable.class));
        verify(disputeRepository, never()).findByStatus(any(), any());
    }

    @Test
    void testGetAllDisputes_WithStatusFilter() {
        // Given
        Page<Dispute> disputePage = new PageImpl<>(Arrays.asList(dispute));
        when(disputeRepository.findByStatus(eq(DisputeStatus.OPEN), any(Pageable.class)))
                .thenReturn(disputePage);

        // When
        Page<AdminDisputeResponse> result = disputeService.getAllDisputes("OPEN", 0, 10);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(disputeRepository).findByStatus(eq(DisputeStatus.OPEN), any(Pageable.class));
        verify(disputeRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    void testGetAllDisputes_InvalidStatusFilter() {
        // Given
        Page<Dispute> disputePage = new PageImpl<>(Arrays.asList(dispute));
        when(disputeRepository.findAll(any(Pageable.class))).thenReturn(disputePage);

        // When
        Page<AdminDisputeResponse> result = disputeService.getAllDisputes("INVALID_STATUS", 0, 10);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(disputeRepository).findAll(any(Pageable.class));
        verify(disputeRepository, never()).findByStatus(any(), any());
    }

    @Test
    void testGetAllDisputes_EmptyStatusFilter() {
        // Given
        Page<Dispute> disputePage = new PageImpl<>(Arrays.asList(dispute));
        when(disputeRepository.findAll(any(Pageable.class))).thenReturn(disputePage);

        // When
        Page<AdminDisputeResponse> result = disputeService.getAllDisputes("", 0, 10);

        // Then
        assertThat(result).isNotNull();
        verify(disputeRepository).findAll(any(Pageable.class));
    }

    @Test
    void testGetAllDisputes_WithPagination() {
        // Given
        Dispute dispute2 = new Dispute(reporter, reported, null, "Second dispute");
        dispute2.setId(2L);

        Page<Dispute> disputePage = new PageImpl<>(Arrays.asList(dispute, dispute2));
        when(disputeRepository.findAll(any(Pageable.class))).thenReturn(disputePage);

        // When
        Page<AdminDisputeResponse> result = disputeService.getAllDisputes(null, 0, 20);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(2);
        verify(disputeRepository).findAll(any(Pageable.class));
    }

    @Test
    void testGetAllDisputes_EmptyResult() {
        // Given
        Page<Dispute> emptyPage = new PageImpl<>(Collections.emptyList());
        when(disputeRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

        // When
        Page<AdminDisputeResponse> result = disputeService.getAllDisputes(null, 0, 10);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void testGetAllDisputes_ResolvedStatus() {
        // Given
        dispute.setStatus(DisputeStatus.RESOLVED);
        Page<Dispute> disputePage = new PageImpl<>(Arrays.asList(dispute));
        when(disputeRepository.findByStatus(eq(DisputeStatus.RESOLVED), any(Pageable.class)))
                .thenReturn(disputePage);

        // When
        Page<AdminDisputeResponse> result = disputeService.getAllDisputes("RESOLVED", 0, 10);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(DisputeStatus.RESOLVED);
    }

    @Test
    void testGetAllDisputes_ClosedStatus() {
        // Given
        dispute.setStatus(DisputeStatus.CLOSED);
        Page<Dispute> disputePage = new PageImpl<>(Arrays.asList(dispute));
        when(disputeRepository.findByStatus(eq(DisputeStatus.CLOSED), any(Pageable.class)))
                .thenReturn(disputePage);

        // When
        Page<AdminDisputeResponse> result = disputeService.getAllDisputes("CLOSED", 0, 10);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(DisputeStatus.CLOSED);
    }

    // ==================== Tests for getDisputeById ====================

    @Test
    void testGetDisputeById_Success() {
        // Given
        when(disputeRepository.findById(1L)).thenReturn(Optional.of(dispute));

        // When
        AdminDisputeResponse response = disputeService.getDisputeById(1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getReporterId()).isEqualTo(1L);
        assertThat(response.getReportedId()).isEqualTo(2L);
        assertThat(response.getDonationId()).isEqualTo(1L);
        verify(disputeRepository).findById(1L);
    }

    @Test
    void testGetDisputeById_NotFound() {
        // Given
        when(disputeRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> disputeService.getDisputeById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Dispute not found with ID: 999");
    }

    @Test
    void testGetDisputeById_WithoutDonation() {
        // Given
        Dispute disputeWithoutDonation = new Dispute(reporter, reported, null, "Test");
        disputeWithoutDonation.setId(1L);

        when(disputeRepository.findById(1L)).thenReturn(Optional.of(disputeWithoutDonation));

        // When
        AdminDisputeResponse response = disputeService.getDisputeById(1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getDonationId()).isNull();
        assertThat(response.getDonationTitle()).isNull();
    }

    @Test
    void testGetDisputeById_WithAdminNotes() {
        // Given
        dispute.setAdminNotes("Admin reviewed this case");
        when(disputeRepository.findById(1L)).thenReturn(Optional.of(dispute));

        // When
        AdminDisputeResponse response = disputeService.getDisputeById(1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAdminNotes()).isEqualTo("Admin reviewed this case");
    }

    // ==================== Tests for updateDisputeStatus ====================

    @Test
    void testUpdateDisputeStatus_Success() {
        // Given
        when(disputeRepository.findById(1L)).thenReturn(Optional.of(dispute));
        when(disputeRepository.save(any(Dispute.class))).thenReturn(dispute);

        // When
        AdminDisputeResponse response = disputeService.updateDisputeStatus(1L, "RESOLVED", "Case resolved");

        // Then
        assertThat(response).isNotNull();
        verify(disputeRepository).save(any(Dispute.class));
    }

    @Test
    void testUpdateDisputeStatus_DisputeNotFound() {
        // Given
        when(disputeRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> disputeService.updateDisputeStatus(999L, "RESOLVED", "Notes"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Dispute not found with ID: 999");

        verify(disputeRepository, never()).save(any(Dispute.class));
    }

    @Test
    void testUpdateDisputeStatus_InvalidStatus() {
        // Given
        when(disputeRepository.findById(1L)).thenReturn(Optional.of(dispute));

        // When & Then
        assertThatThrownBy(() -> disputeService.updateDisputeStatus(1L, "INVALID_STATUS", "Notes"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid status: INVALID_STATUS");

        verify(disputeRepository, never()).save(any(Dispute.class));
    }

    @Test
    void testUpdateDisputeStatus_WithoutAdminNotes() {
        // Given
        when(disputeRepository.findById(1L)).thenReturn(Optional.of(dispute));
        when(disputeRepository.save(any(Dispute.class))).thenReturn(dispute);

        // When
        AdminDisputeResponse response = disputeService.updateDisputeStatus(1L, "RESOLVED", null);

        // Then
        assertThat(response).isNotNull();
        verify(disputeRepository).save(any(Dispute.class));
    }

    @Test
    void testUpdateDisputeStatus_EmptyAdminNotes() {
        // Given
        when(disputeRepository.findById(1L)).thenReturn(Optional.of(dispute));
        when(disputeRepository.save(any(Dispute.class))).thenReturn(dispute);

        // When
        AdminDisputeResponse response = disputeService.updateDisputeStatus(1L, "RESOLVED", "");

        // Then
        assertThat(response).isNotNull();
        verify(disputeRepository).save(any(Dispute.class));
    }

    @Test
    void testUpdateDisputeStatus_ToResolved() {
        // Given
        when(disputeRepository.findById(1L)).thenReturn(Optional.of(dispute));
        when(disputeRepository.save(any(Dispute.class))).thenAnswer(invocation -> {
            Dispute saved = invocation.getArgument(0);
            saved.setStatus(DisputeStatus.RESOLVED);
            return saved;
        });

        // When
        AdminDisputeResponse response = disputeService.updateDisputeStatus(1L, "RESOLVED", "Resolved by admin");

        // Then
        assertThat(response).isNotNull();
        verify(disputeRepository).save(any(Dispute.class));
    }

    @Test
    void testUpdateDisputeStatus_ToClosed() {
        // Given
        when(disputeRepository.findById(1L)).thenReturn(Optional.of(dispute));
        when(disputeRepository.save(any(Dispute.class))).thenAnswer(invocation -> {
            Dispute saved = invocation.getArgument(0);
            saved.setStatus(DisputeStatus.CLOSED);
            return saved;
        });

        // When
        AdminDisputeResponse response = disputeService.updateDisputeStatus(1L, "CLOSED", "Case closed");

        // Then
        assertThat(response).isNotNull();
        verify(disputeRepository).save(any(Dispute.class));
    }

    @Test
    void testUpdateDisputeStatus_CaseInsensitive() {
        // Given
        when(disputeRepository.findById(1L)).thenReturn(Optional.of(dispute));
        when(disputeRepository.save(any(Dispute.class))).thenReturn(dispute);

        // When
        AdminDisputeResponse response = disputeService.updateDisputeStatus(1L, "resolved", "Notes");

        // Then
        assertThat(response).isNotNull();
        verify(disputeRepository).save(any(Dispute.class));
    }
}
