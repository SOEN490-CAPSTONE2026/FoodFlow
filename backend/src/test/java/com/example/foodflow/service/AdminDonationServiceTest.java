package com.example.foodflow.service;

import com.example.foodflow.model.dto.AdminDonationResponse;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.DonationTimelineRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminDonationServiceTest {

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private DonationTimelineRepository timelineRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminDonationService adminDonationService;

    private SurplusPost testPost;
    private User testDonor;
    private User testReceiver;
    private Organization testDonorOrg;
    private Organization testReceiverOrg;
    private Claim testClaim;
    private DonationTimeline testTimeline;

    @BeforeEach
    void setUp() {
        // Setup test donor
        testDonorOrg = new Organization();
        testDonorOrg.setId(1L);
        testDonorOrg.setName("Test Donor Organization");
        testDonorOrg.setContactPerson("John Donor");

        testDonor = new User();
        testDonor.setId(1L);
        testDonor.setEmail("donor@test.com");
        testDonor.setOrganization(testDonorOrg);

        // Setup test receiver
        testReceiverOrg = new Organization();
        testReceiverOrg.setId(2L);
        testReceiverOrg.setName("Test Receiver Organization");
        testReceiverOrg.setContactPerson("Jane Receiver");

        testReceiver = new User();
        testReceiver.setId(2L);
        testReceiver.setEmail("receiver@test.com");
        testReceiver.setOrganization(testReceiverOrg);

        // Setup test surplus post
        testPost = new SurplusPost();
        testPost.setId(1L);
        testPost.setTitle("Test Donation");
        testPost.setDescription("Test description");
        testPost.setDonor(testDonor);
        testPost.setStatus(PostStatus.CLAIMED);
        testPost.setFlagged(false);
        testPost.setQuantity(new Quantity(50.0, Quantity.Unit.KILOGRAM));
        // Note: createdAt and updatedAt are set automatically by JPA @PrePersist/@PreUpdate

        // Setup test claim
        testClaim = new Claim();
        testClaim.setId(1L);
        testClaim.setSurplusPost(testPost);
        testClaim.setReceiver(testReceiver);
        testClaim.setStatus(ClaimStatus.ACTIVE);

        // Setup test timeline
        testTimeline = new DonationTimeline();
        testTimeline.setId(1L);
        testTimeline.setSurplusPost(testPost);
        testTimeline.setEventType("DONATION_CREATED");
        testTimeline.setTimestamp(LocalDateTime.now().minusDays(1));
        testTimeline.setActor("donor");
        testTimeline.setVisibleToUsers(true);
    }

    @Test
    void getAllDonations_WithNoFilters_ReturnsAllDonations() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, null, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        AdminDonationResponse response = result.getContent().get(0);
        assertEquals("Test Donation", response.getTitle());
        assertEquals("donor@test.com", response.getDonorEmail());
        assertEquals("receiver@test.com", response.getReceiverEmail());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithStatusFilter_ReturnsFilteredDonations() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            "CLAIMED", null, null, null, null, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(PostStatus.CLAIMED, result.getContent().get(0).getStatus());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithSearchByNumericId_ReturnsMatchingDonation() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, null, null, "1", 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getId());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithSearchByTitle_ReturnsMatchingDonations() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, null, null, "Test", 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertTrue(result.getContent().get(0).getTitle().contains("Test"));
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithDateRange_ReturnsFilteredDonations() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        LocalDate fromDate = LocalDate.now().minusDays(7);
        LocalDate toDate = LocalDate.now();
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, fromDate, toDate, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithFlaggedFilter_ReturnsOnlyFlaggedDonations() {
        // Arrange
        testPost.setFlagged(true);
        testPost.setFlagReason("Test flag reason");
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, true, null, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertTrue(result.getContent().get(0).getFlagged());
        assertEquals("Test flag reason", result.getContent().get(0).getFlagReason());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getDonationById_WithValidId_ReturnsDonationDetails() {
        // Arrange
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        AdminDonationResponse result = adminDonationService.getDonationById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Donation", result.getTitle());
        assertEquals("donor@test.com", result.getDonorEmail());
        assertEquals("Test Donor Organization", result.getDonorOrganization());
        assertEquals("receiver@test.com", result.getReceiverEmail());
        assertEquals("Test Receiver Organization", result.getReceiverOrganization());
        assertNotNull(result.getTimeline());
        assertEquals(1, result.getTimeline().size());
        verify(surplusPostRepository).findById(1L);
    }

    @Test
    void getDonationById_WithInvalidId_ThrowsException() {
        // Arrange
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            adminDonationService.getDonationById(999L)
        );
        assertTrue(exception.getMessage().contains("Donation not found"));
        verify(surplusPostRepository).findById(999L);
    }

    @Test
    void getDonationById_WithNoClaim_ReturnsNullReceiverInfo() {
        // Arrange
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.empty());
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        AdminDonationResponse result = adminDonationService.getDonationById(1L);

        // Assert
        assertNotNull(result);
        assertNull(result.getReceiverId());
        assertNull(result.getReceiverEmail());
        assertNull(result.getReceiverName());
        verify(claimRepository).findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE);
    }

    @Test
    void overrideStatus_WithValidRequest_UpdatesStatusAndCreatesTimeline() {
        // Arrange
        Long adminUserId = 999L;
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(testPost);
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(testTimeline);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        AdminDonationResponse result = adminDonationService.overrideStatus(
            1L, "COMPLETED", "Admin completed manually", adminUserId
        );

        // Assert
        assertNotNull(result);
        
        // Verify status was updated
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());
        assertEquals(PostStatus.COMPLETED, postCaptor.getValue().getStatus());
        
        // Verify timeline event was created
        ArgumentCaptor<DonationTimeline> timelineCaptor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(timelineCaptor.capture());
        DonationTimeline savedTimeline = timelineCaptor.getValue();
        assertEquals("ADMIN_STATUS_OVERRIDE", savedTimeline.getEventType());
        assertEquals("admin", savedTimeline.getActor());
        assertEquals(adminUserId, savedTimeline.getActorUserId());
        assertEquals("CLAIMED", savedTimeline.getOldStatus());
        assertEquals("COMPLETED", savedTimeline.getNewStatus());
        assertEquals("Admin completed manually", savedTimeline.getDetails());
        assertFalse(savedTimeline.getVisibleToUsers()); // Admin overrides should be hidden from users
    }

    @Test
    void overrideStatus_WithInvalidStatus_ThrowsException() {
        // Arrange
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            adminDonationService.overrideStatus(1L, "INVALID_STATUS", "Test reason", 999L)
        );
        assertTrue(exception.getMessage().contains("Invalid status"));
        verify(surplusPostRepository, never()).save(any());
        verify(timelineRepository, never()).save(any());
    }

    @Test
    void overrideStatus_WithInvalidDonationId_ThrowsException() {
        // Arrange
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
            adminDonationService.overrideStatus(999L, "COMPLETED", "Test reason", 999L)
        );
        assertTrue(exception.getMessage().contains("Donation not found"));
        verify(surplusPostRepository).findById(999L);
        verify(surplusPostRepository, never()).save(any());
    }

    @Test
    void overrideStatus_WithNullReason_UsesDefaultMessage() {
        // Arrange
        Long adminUserId = 999L;
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(testPost);
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(testTimeline);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        adminDonationService.overrideStatus(1L, "COMPLETED", null, adminUserId);

        // Assert
        ArgumentCaptor<DonationTimeline> timelineCaptor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(timelineCaptor.capture());
        assertEquals("Admin manual override", timelineCaptor.getValue().getDetails());
    }

    @Test
    void mapToAdminResponse_WithNoOrganization_UsesEmailAsName() {
        // Arrange
        testDonor.setOrganization(null);
        testReceiver.setOrganization(null);
        
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        AdminDonationResponse result = adminDonationService.getDonationById(1L);

        // Assert
        assertNotNull(result);
        assertEquals("donor@test.com", result.getDonorName());
        assertEquals("receiver@test.com", result.getReceiverName());
        assertNull(result.getDonorOrganization());
        assertNull(result.getReceiverOrganization());
    }

    @Test
    void getAllDonations_WithMultipleFilters_AppliesAllCorrectly() {
        // Arrange
        testPost.setFlagged(true);
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        LocalDate fromDate = LocalDate.now().minusDays(7);
        LocalDate toDate = LocalDate.now();
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            "CLAIMED", 1L, null, true, fromDate, toDate, "Test", 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        AdminDonationResponse response = result.getContent().get(0);
        assertEquals(PostStatus.CLAIMED, response.getStatus());
        assertTrue(response.getFlagged());
        assertEquals(1L, response.getDonorId());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void overrideStatus_FromAvailableToExpired_UpdatesCorrectly() {
        // Arrange
        testPost.setStatus(PostStatus.AVAILABLE);
        Long adminUserId = 999L;
        
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(testPost);
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(testTimeline);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.empty());
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        adminDonationService.overrideStatus(1L, "EXPIRED", "Food expired", adminUserId);

        // Assert
        ArgumentCaptor<DonationTimeline> timelineCaptor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(timelineCaptor.capture());
        DonationTimeline savedTimeline = timelineCaptor.getValue();
        assertEquals("AVAILABLE", savedTimeline.getOldStatus());
        assertEquals("EXPIRED", savedTimeline.getNewStatus());
    }

    @Test
    void getDonationById_WithQuantity_ReturnsQuantityDetails() {
        // Arrange
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        AdminDonationResponse result = adminDonationService.getDonationById(1L);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getQuantity());
        assertEquals(50.0, result.getQuantity().getValue());
        assertEquals(Quantity.Unit.KILOGRAM, result.getQuantity().getUnit());
    }

    // ==================== Additional Tests for 90%+ Coverage ====================

    @Test
    void getAllDonations_WithInvalidStatusFilter_IgnoresFilter() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act - Should not throw exception, just log warning
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            "INVALID_STATUS", null, null, null, null, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithLowercaseStatus_ParsesCorrectly() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            "claimed", null, null, null, null, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithDonorIdFilter_ReturnsCorrectDonations() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, 1L, null, null, null, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getDonorId());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithReceiverIdFilter_ReturnsCorrectDonations() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, 2L, null, null, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(2L, result.getContent().get(0).getReceiverId());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithEmptySearch_ReturnsAllDonations() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, null, null, "", 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithPagination_ReturnsCorrectPage() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts, PageRequest.of(1, 10), 25);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, null, null, null, 1, 10
        );

        // Assert
        assertNotNull(result);
        assertEquals(25, result.getTotalElements());
        assertEquals(1, result.getNumber());
        assertEquals(10, result.getSize());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithEmptyResult_ReturnsEmptyPage() {
        // Arrange
        Page<SurplusPost> emptyPage = new PageImpl<>(Collections.emptyList());
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(emptyPage);

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, null, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
        assertTrue(result.getContent().isEmpty());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getDonationById_WithEmptyTimeline_ReturnsEmptyList() {
        // Arrange
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Collections.emptyList());

        // Act
        AdminDonationResponse result = adminDonationService.getDonationById(1L);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getTimeline());
        assertTrue(result.getTimeline().isEmpty());
        verify(timelineRepository).findBySurplusPostIdOrderByTimestampDesc(1L);
    }

    @Test
    void getDonationById_WithMultipleTimelineEvents_ReturnsAllEvents() {
        // Arrange
        DonationTimeline timeline2 = new DonationTimeline();
        timeline2.setId(2L);
        timeline2.setSurplusPost(testPost);
        timeline2.setEventType("DONATION_CLAIMED");
        timeline2.setTimestamp(LocalDateTime.now());
        timeline2.setActor("receiver");
        timeline2.setVisibleToUsers(true);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(timeline2, testTimeline));

        // Act
        AdminDonationResponse result = adminDonationService.getDonationById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTimeline().size());
        assertEquals("DONATION_CLAIMED", result.getTimeline().get(0).getEventType());
        assertEquals("DONATION_CREATED", result.getTimeline().get(1).getEventType());
    }

    @Test
    void overrideStatus_WithMixedCaseStatus_ParsesCorrectly() {
        // Arrange
        Long adminUserId = 999L;
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(testPost);
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(testTimeline);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        AdminDonationResponse result = adminDonationService.overrideStatus(
            1L, "CoMpLeTeD", "Test reason", adminUserId
        );

        // Assert
        assertNotNull(result);
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());
        assertEquals(PostStatus.COMPLETED, postCaptor.getValue().getStatus());
    }

    @Test
    void overrideStatus_ToAllPossibleStatuses_UpdatesCorrectly() {
        // Test all valid status transitions
        PostStatus[] statuses = {
            PostStatus.AVAILABLE,
            PostStatus.CLAIMED,
            PostStatus.COMPLETED,
            PostStatus.EXPIRED,
            PostStatus.NOT_COMPLETED,
            PostStatus.READY_FOR_PICKUP
        };

        Long adminUserId = 999L;

        for (PostStatus status : statuses) {
            // Arrange
            testPost.setStatus(PostStatus.AVAILABLE); // Reset to a starting state
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(testPost);
            when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(testTimeline);
            when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
                .thenReturn(Optional.empty());
            when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
                .thenReturn(Arrays.asList(testTimeline));

            // Act
            adminDonationService.overrideStatus(1L, status.name(), "Test override", adminUserId);

            // Assert
            ArgumentCaptor<DonationTimeline> timelineCaptor = ArgumentCaptor.forClass(DonationTimeline.class);
            verify(timelineRepository, atLeast(1)).save(timelineCaptor.capture());
            DonationTimeline savedTimeline = timelineCaptor.getValue();
            assertEquals(status.name(), savedTimeline.getNewStatus());
        }
    }

    @Test
    void getAllDonations_WithNonFlaggedFilter_ReturnsOnlyNonFlagged() {
        // Arrange
        testPost.setFlagged(false);
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, false, null, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertFalse(result.getContent().get(0).getFlagged());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getDonationById_MapsAllTimelineFields() {
        // Arrange
        DonationTimeline detailedTimeline = new DonationTimeline();
        detailedTimeline.setId(1L);
        detailedTimeline.setSurplusPost(testPost);
        detailedTimeline.setEventType("PICKUP_CONFIRMED");
        detailedTimeline.setTimestamp(LocalDateTime.now());
        detailedTimeline.setActor("receiver");
        detailedTimeline.setActorUserId(2L);
        detailedTimeline.setOldStatus("READY_FOR_PICKUP");
        detailedTimeline.setNewStatus("COMPLETED");
        detailedTimeline.setDetails("Pickup confirmed with evidence");
        detailedTimeline.setVisibleToUsers(true);
        detailedTimeline.setTemperature(4.5);
        detailedTimeline.setPackagingCondition("GOOD");
        detailedTimeline.setPickupEvidenceUrl("https://example.com/evidence.jpg");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(detailedTimeline));

        // Act
        AdminDonationResponse result = adminDonationService.getDonationById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTimeline().size());
        var timelineDTO = result.getTimeline().get(0);
        assertEquals("PICKUP_CONFIRMED", timelineDTO.getEventType());
        assertEquals(2L, timelineDTO.getActorUserId());
        assertEquals("receiver", timelineDTO.getActor());
        assertEquals("READY_FOR_PICKUP", timelineDTO.getOldStatus());
        assertEquals("COMPLETED", timelineDTO.getNewStatus());
        assertEquals("Pickup confirmed with evidence", timelineDTO.getDetails());
        assertTrue(timelineDTO.getVisibleToUsers());
        assertEquals(4.5, timelineDTO.getTemperature());
        assertEquals("GOOD", timelineDTO.getPackagingCondition());
        assertEquals("https://example.com/evidence.jpg", timelineDTO.getPickupEvidenceUrl());
    }

    @Test
    void getAllDonations_WithSearchByDonorEmail_ReturnsMatching() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, null, null, "donor@test", 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertTrue(result.getContent().get(0).getDonorEmail().contains("donor@test"));
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithSearchByOrganizationName_ReturnsMatching() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, null, null, "Donor Organization", 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertTrue(result.getContent().get(0).getDonorOrganization().contains("Donor Organization"));
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void overrideStatus_CreatesTimelineWithCorrectTimestamp() {
        // Arrange
        Long adminUserId = 999L;
        LocalDateTime beforeCall = LocalDateTime.now().minusSeconds(1);
        
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(testPost);
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(testTimeline);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        adminDonationService.overrideStatus(1L, "COMPLETED", "Test", adminUserId);

        // Assert
        ArgumentCaptor<DonationTimeline> timelineCaptor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(timelineCaptor.capture());
        DonationTimeline savedTimeline = timelineCaptor.getValue();
        
        assertNotNull(savedTimeline.getTimestamp());
        assertTrue(savedTimeline.getTimestamp().isAfter(beforeCall));
        assertTrue(savedTimeline.getTimestamp().isBefore(LocalDateTime.now().plusSeconds(1)));
    }

    @Test
    void getAllDonations_WithFromDateOnly_FiltersCorrectly() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        LocalDate fromDate = LocalDate.now().minusDays(7);
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, fromDate, null, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getAllDonations_WithToDateOnly_FiltersCorrectly() {
        // Arrange
        List<SurplusPost> posts = Arrays.asList(testPost);
        Page<SurplusPost> postPage = new PageImpl<>(posts);
        LocalDate toDate = LocalDate.now();
        
        when(surplusPostRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(postPage);
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        Page<AdminDonationResponse> result = adminDonationService.getAllDonations(
            null, null, null, null, null, toDate, null, 0, 20
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(surplusPostRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getDonationById_WithClaimHavingConfirmedPickupDetails_MapsAllFields() {
        // Arrange
        testClaim.setConfirmedPickupDate(LocalDate.now());
        testClaim.setConfirmedPickupStartTime(LocalDateTime.now().toLocalTime());
        testClaim.setConfirmedPickupEndTime(LocalDateTime.now().plusHours(2).toLocalTime());

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Optional.of(testClaim));
        when(timelineRepository.findBySurplusPostIdOrderByTimestampDesc(1L))
            .thenReturn(Arrays.asList(testTimeline));

        // Act
        AdminDonationResponse result = adminDonationService.getDonationById(1L);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getClaimId());
        assertNotNull(result.getConfirmedPickupDate());
        assertNotNull(result.getConfirmedPickupStartTime());
        assertNotNull(result.getConfirmedPickupEndTime());
        assertEquals(1L, result.getClaimId());
    }
}
