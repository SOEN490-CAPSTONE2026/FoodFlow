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
}
