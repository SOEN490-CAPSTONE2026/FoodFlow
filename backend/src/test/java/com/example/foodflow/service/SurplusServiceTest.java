package com.example.foodflow.service;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.DonationTimelineDTO;
import com.example.foodflow.model.dto.PickupSlotRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.DonationTimeline;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.PickupSlot;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.DonationTimelineRepository;
import com.example.foodflow.repository.ExpiryAuditLogRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import static org.assertj.core.api.Assertions.within;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SurplusServiceTest {

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private PickupSlotValidationService pickupSlotValidationService;

    @Mock
    private BusinessMetricsService businessMetricsService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ExpiryCalculationService expiryCalculationService;

    @Mock
    private ExpiryPredictionService expiryPredictionService;

    @Mock
    private ExpirySuggestionService expirySuggestionService;

    @Mock
    private ExpiryAuditLogRepository expiryAuditLogRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private TimelineService timelineService;

    @Mock
    private DonationTimelineRepository timelineRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private GamificationService gamificationService;

    @Mock
    private ClaimService claimService;

    @Mock
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Mock
    private EmailService emailService;

    @Mock
    private NotificationPreferenceService notificationPreferenceService;

    @Mock
    private FoodTypeImpactService foodTypeImpactService;

    @InjectMocks
    private SurplusService surplusService;

    private User donor;
    private User receiver;
    private CreateSurplusRequest request;

    @BeforeEach
    void setUp() {
        // Create test organization
        Organization organization = new Organization();
        organization.setId(1L);
        organization.setName("Test Restaurant");
        organization.setOrganizationType(OrganizationType.RESTAURANT);

        // Create test donor
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);
        donor.setOrganization(organization);

        // Create test receiver
        receiver = new User();
        receiver.setId(2L);
        receiver.setEmail("receiver@test.com");
        receiver.setRole(UserRole.RECEIVER);

        // Create test request with NEW structure
        request = new CreateSurplusRequest();
        request.setTitle("Vegetable Lasagna");
        request.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        request.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(2));
        request.setPickupDate(LocalDate.now());
        request.setPickupFrom(LocalTime.now().plusHours(3));
        request.setPickupTo(LocalTime.now().plusHours(5));
        request.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));
        request.setDescription("Vegetarian lasagna");

        // Add pickup slots for backward compatibility tests
        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.now().plusHours(3));
        slot.setEndTime(LocalTime.now().plusHours(5));
        slot.setNotes("Test slot");
        slots.add(slot);
        request.setPickupSlots(slots);

        try {
            lenient().when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        } catch (Exception ignored) {
        }
        lenient().when(expiryPredictionService.predict(any(SurplusPost.class))).thenReturn(
                new ExpiryPredictionService.PredictionResult(
                        java.time.Instant.now().plus(java.time.Duration.ofDays(2)),
                        0.75d,
                        "rules_v1",
                        Map.of("foodType", "PREPARED")));
        lenient().when(expirySuggestionService.computeSuggestedExpiry(any(), any(), any(), any())).thenReturn(
                new ExpirySuggestionService.SuggestionResult(
                        LocalDate.now().plusDays(2),
                        2,
                        true,
                        List.of(),
                        "Suggested expiry: " + LocalDate.now().plusDays(2)));
    }

    @Test
    void testCreateSurplusPost_Success() {
        // Given
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(request.getTitle());
        savedPost.setFoodCategories(request.getFoodCategories());
        savedPost.setQuantity(request.getQuantity());
        savedPost.setPickupLocation(request.getPickupLocation());
        savedPost.setExpiryDate(request.getExpiryDate());
        savedPost.setPickupDate(request.getPickupDate());
        savedPost.setPickupFrom(request.getPickupFrom());
        savedPost.setPickupTo(request.getPickupTo());
        savedPost.setDescription(request.getDescription());

        // Mock validation service
        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(request, donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("Vegetable Lasagna");
        assertThat(response.getFoodCategories()).isEqualTo(Set.of(FoodCategory.PREPARED_MEALS));
        assertThat(response.getQuantity()).isEqualTo(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        assertThat(response.getPickupLocation()).isEqualTo(new Location(45.2903, -34.0987, "123 Main St"));
        assertThat(response.getDonorEmail()).isEqualTo("donor@test.com");

        verify(pickupSlotValidationService, times(1)).validateSlots(any());
        verify(surplusPostRepository, times(1)).save(any(SurplusPost.class));
    }

    @Test
    void testCreateSurplusPost_ComputesExpirySuggestionSnapshot() {
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(101L);
        savedPost.setDonor(donor);
        savedPost.setTitle(request.getTitle());
        savedPost.setFoodCategories(request.getFoodCategories());
        savedPost.setQuantity(request.getQuantity());
        savedPost.setPickupLocation(request.getPickupLocation());
        savedPost.setExpiryDate(request.getExpiryDate());
        savedPost.setPickupDate(request.getPickupDate());
        savedPost.setPickupFrom(request.getPickupFrom());
        savedPost.setPickupTo(request.getPickupTo());
        savedPost.setDescription(request.getDescription());

        when(expirySuggestionService.computeSuggestedExpiry(any(), any(), any(), any())).thenReturn(
                new ExpirySuggestionService.SuggestionResult(
                        LocalDate.of(2026, 2, 20),
                        3,
                        true,
                        List.of("Packaging suggests cold storage, confirm temperature"),
                        "Suggested expiry: 2026-02-20"));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        surplusService.createSurplusPost(request, donor);

        ArgumentCaptor<SurplusPost> captor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(captor.capture());
        SurplusPost created = captor.getValue();

        assertThat(created.getSuggestedExpiryDate()).isEqualTo(LocalDate.of(2026, 2, 20));
        assertThat(created.getEligibleAtSubmission()).isTrue();
        assertThat(created.getWarningsAtSubmission()).isEqualTo("{}");
    }

    @Test
    void testCreateSurplusPost_NotEligibleMarksForReview() {
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(102L);
        savedPost.setDonor(donor);
        savedPost.setTitle(request.getTitle());
        savedPost.setFoodCategories(request.getFoodCategories());
        savedPost.setQuantity(request.getQuantity());
        savedPost.setPickupLocation(request.getPickupLocation());
        savedPost.setExpiryDate(request.getExpiryDate());
        savedPost.setPickupDate(request.getPickupDate());
        savedPost.setPickupFrom(request.getPickupFrom());
        savedPost.setPickupTo(request.getPickupTo());
        savedPost.setDescription(request.getDescription());

        when(expirySuggestionService.computeSuggestedExpiry(any(), any(), any(), any())).thenReturn(
                new ExpirySuggestionService.SuggestionResult(
                        LocalDate.of(2026, 2, 17),
                        0,
                        false,
                        List.of("Hot food must be cooled and refrigerated to be eligible for donation"),
                        "Suggested expiry: 2026-02-17"));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        surplusService.createSurplusPost(request, donor);

        ArgumentCaptor<SurplusPost> captor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(captor.capture());
        SurplusPost created = captor.getValue();

        assertThat(created.getEligibleAtSubmission()).isFalse();
        assertThat(created.getFlagged()).isTrue();
        assertThat(created.getFlagReason()).contains("requires_review");
    }

    @Test
    void testCreateSurplusPost_SetsCorrectDonor() {
        // Given
        SurplusPost mockSavedPost = new SurplusPost();
        mockSavedPost.setId(1L);
        mockSavedPost.setDonor(donor);
        mockSavedPost.setTitle(request.getTitle());
        mockSavedPost.setFoodCategories(request.getFoodCategories());
        mockSavedPost.setQuantity(request.getQuantity());
        mockSavedPost.setPickupLocation(request.getPickupLocation());
        mockSavedPost.setExpiryDate(request.getExpiryDate());
        mockSavedPost.setPickupDate(request.getPickupDate());
        mockSavedPost.setPickupFrom(request.getPickupFrom());
        mockSavedPost.setPickupTo(request.getPickupTo());
        mockSavedPost.setDescription(request.getDescription());

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(mockSavedPost);

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();

        assertThat(capturedPost.getDonor()).isEqualTo(donor);
        assertThat(capturedPost.getTitle()).isEqualTo("Vegetable Lasagna");
        assertThat(capturedPost.getFoodCategories()).isEqualTo(Set.of(FoodCategory.PREPARED_MEALS));
        assertThat(capturedPost.getQuantity()).isEqualTo(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        assertThat(capturedPost.getPickupLocation()).isEqualTo(new Location(45.2903, -34.0987, "123 Main St"));
        assertThat(capturedPost.getDescription()).isEqualTo("Vegetarian lasagna");
    }

    @Test
    void testCreateSurplusPost_MapsAllFields() {
        // Given
        SurplusPost mockSavedPost = new SurplusPost();
        mockSavedPost.setId(1L);
        mockSavedPost.setDonor(donor);
        mockSavedPost.setTitle(request.getTitle());
        mockSavedPost.setFoodCategories(request.getFoodCategories());
        mockSavedPost.setQuantity(request.getQuantity());
        mockSavedPost.setPickupLocation(request.getPickupLocation());
        mockSavedPost.setExpiryDate(request.getExpiryDate());
        mockSavedPost.setPickupDate(request.getPickupDate());
        mockSavedPost.setPickupFrom(request.getPickupFrom());
        mockSavedPost.setPickupTo(request.getPickupTo());
        mockSavedPost.setDescription(request.getDescription());

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(mockSavedPost);

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();

        assertThat(capturedPost.getTitle()).isEqualTo(request.getTitle());
        assertThat(capturedPost.getFoodCategories()).isEqualTo(request.getFoodCategories());
        assertThat(capturedPost.getQuantity()).isEqualTo(request.getQuantity());
        assertThat(capturedPost.getPickupLocation()).isEqualTo(request.getPickupLocation());
        assertThat(capturedPost.getExpiryDate()).isEqualTo(request.getExpiryDate());
        assertThat(capturedPost.getPickupDate()).isEqualTo(request.getPickupDate());
        // Use isCloseTo for time comparisons to handle nanosecond precision differences
        assertThat(capturedPost.getPickupFrom()).isCloseTo(request.getPickupFrom(), within(1, ChronoUnit.MILLIS));
        assertThat(capturedPost.getPickupTo()).isCloseTo(request.getPickupTo(), within(1, ChronoUnit.MILLIS));
        assertThat(capturedPost.getDescription()).isEqualTo(request.getDescription());
        assertThat(capturedPost.getDonor()).isEqualTo(donor);
    }

    // ==================== Tests for completeSurplusPost - Story 8.1
    // ====================

    @Test
    void testCompleteSurplusPost_Success() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");
        post.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        post.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupDate(LocalDate.now());
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(post);

        // When
        SurplusResponse response = surplusService.completeSurplusPost(1L, "123456", donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(PostStatus.COMPLETED);

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());
        assertThat(postCaptor.getValue().getStatus()).isEqualTo(PostStatus.COMPLETED);
    }

    @Test
    void testCompleteSurplusPost_PostNotFound_ThrowsException() {
        // Given
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(999L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Surplus post not found");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_UnauthorizedUser_ThrowsException() {
        // Given - Create another donor
        User otherDonor = new User();
        otherDonor.setId(2L);
        otherDonor.setEmail("other@test.com");
        otherDonor.setRole(UserRole.DONOR);

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor); // Post belongs to original donor
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then - Try to complete with different donor
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", otherDonor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not authorized");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_WrongStatus_ThrowsException() {
        // Given - Post is AVAILABLE, not READY_FOR_PICKUP
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.AVAILABLE); // Wrong status
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("READY_FOR_PICKUP");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_InvalidOtp_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then - Try with wrong OTP
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "999999", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.auth.invalid_credentials");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_NullOtp_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode(null); // No OTP set

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.auth.invalid_credentials");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_ClaimedStatus_ThrowsException() {
        // Given - Post is CLAIMED, not READY_FOR_PICKUP
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.CLAIMED);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("READY_FOR_PICKUP")
                .hasMessageContaining("CLAIMED");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_CompletedStatus_ThrowsException() {
        // Given - Post is already COMPLETED
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.COMPLETED);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("READY_FOR_PICKUP")
                .hasMessageContaining("COMPLETED");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    // ==================== Tests for getAllAvailableSurplusPosts
    // ====================

    @Test
    void testGetAllAvailableSurplusPosts_IncludesAvailableAndReadyForPickup() {
        // Given - Posts with different statuses
        SurplusPost availablePost = new SurplusPost();
        availablePost.setId(1L);
        availablePost.setDonor(donor);
        availablePost.setTitle("Available Food");
        availablePost.setStatus(PostStatus.AVAILABLE);
        availablePost.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        availablePost.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        availablePost.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        availablePost.setExpiryDate(LocalDate.now().plusDays(2));
        availablePost.setPickupDate(LocalDate.now());
        availablePost.setPickupFrom(LocalTime.of(9, 0));
        availablePost.setPickupTo(LocalTime.of(17, 0));

        SurplusPost readyPost = new SurplusPost();
        readyPost.setId(2L);
        readyPost.setDonor(donor);
        readyPost.setTitle("Ready Food");
        readyPost.setStatus(PostStatus.READY_FOR_PICKUP);
        readyPost.setOtpCode("123456");
        readyPost.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        readyPost.setQuantity(new Quantity(3.0, Quantity.Unit.KILOGRAM));
        readyPost.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        readyPost.setExpiryDate(LocalDate.now().plusDays(1));
        readyPost.setPickupDate(LocalDate.now());
        readyPost.setPickupFrom(LocalTime.of(10, 0));
        readyPost.setPickupTo(LocalTime.of(18, 0));

        when(surplusPostRepository.findByStatusIn(any()))
                .thenReturn(Arrays.asList(availablePost, readyPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(anyLong(), any(ClaimStatus.class)))
                .thenReturn(false);

        // When
        List<SurplusResponse> responses = surplusService.getAllAvailableSurplusPosts();

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(SurplusResponse::getTitle)
                .containsExactlyInAnyOrder("Available Food", "Ready Food");
        assertThat(responses).extracting(SurplusResponse::getStatus)
                .containsExactlyInAnyOrder(PostStatus.AVAILABLE, PostStatus.READY_FOR_PICKUP);

        // Verify the repository was called with correct statuses
        ArgumentCaptor<List<PostStatus>> statusCaptor = ArgumentCaptor.forClass(List.class);
        verify(surplusPostRepository).findByStatusIn(statusCaptor.capture());
        List<PostStatus> capturedStatuses = statusCaptor.getValue();
        assertThat(capturedStatuses).containsExactlyInAnyOrder(
                PostStatus.AVAILABLE,
                PostStatus.READY_FOR_PICKUP);
    }

    // ==================== Tests for Multiple Pickup Slots Feature
    // ====================

    @Test
    void testCreateSurplusPost_WithMultiplePickupSlots_Success() {
        // Given - Request with multiple pickup slots
        List<PickupSlotRequest> slots = new ArrayList<>();

        PickupSlotRequest slot1 = new PickupSlotRequest();
        slot1.setPickupDate(LocalDate.now().plusDays(1));
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(12, 0));
        slot1.setNotes("Morning slot");
        slots.add(slot1);

        PickupSlotRequest slot2 = new PickupSlotRequest();
        slot2.setPickupDate(LocalDate.now().plusDays(1));
        slot2.setStartTime(LocalTime.of(14, 0));
        slot2.setEndTime(LocalTime.of(17, 0));
        slot2.setNotes("Afternoon slot");
        slots.add(slot2);

        request.setPickupSlots(slots);

        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(request.getTitle());
        savedPost.setPickupDate(slot1.getPickupDate());
        savedPost.setPickupFrom(slot1.getStartTime());
        savedPost.setPickupTo(slot1.getEndTime());

        doNothing().when(pickupSlotValidationService).validateSlots(slots);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(request, donor);

        // Then
        assertThat(response).isNotNull();
        verify(pickupSlotValidationService, times(1)).validateSlots(slots);
        verify(surplusPostRepository, times(1)).save(any(SurplusPost.class));
    }

    @Test
    void testCreateSurplusPost_WithoutPickupSlots_UsesLegacyFields() {
        // Given - Request without pickup slots (backward compatibility)
        request.setPickupSlots(null);

        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(request.getTitle());
        savedPost.setPickupDate(request.getPickupDate());
        savedPost.setPickupFrom(request.getPickupFrom());
        savedPost.setPickupTo(request.getPickupTo());

        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(request, donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPickupDate()).isEqualTo(request.getPickupDate());
        assertThat(response.getPickupFrom()).isEqualTo(request.getPickupFrom());
        assertThat(response.getPickupTo()).isEqualTo(request.getPickupTo());

        // Validation service should NOT be called since no slots provided
        verify(pickupSlotValidationService, never()).validateSlots(any());
        verify(surplusPostRepository, times(1)).save(any(SurplusPost.class));
    }

    @Test
    void testCreateSurplusPost_LegacyFieldsPopulatedFromFirstSlot() {
        // Given - Multiple slots, verify first slot populates legacy fields
        List<PickupSlotRequest> slots = new ArrayList<>();

        PickupSlotRequest slot1 = new PickupSlotRequest();
        slot1.setPickupDate(LocalDate.now().plusDays(1));
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(12, 0));
        slots.add(slot1);

        PickupSlotRequest slot2 = new PickupSlotRequest();
        slot2.setPickupDate(LocalDate.now().plusDays(2));
        slot2.setStartTime(LocalTime.of(14, 0));
        slot2.setEndTime(LocalTime.of(17, 0));
        slots.add(slot2);

        request.setPickupSlots(slots);

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);

        doNothing().when(pickupSlotValidationService).validateSlots(slots);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();

        // Legacy fields should match first slot
        assertThat(capturedPost.getPickupDate()).isEqualTo(slot1.getPickupDate());
        assertThat(capturedPost.getPickupFrom()).isEqualTo(slot1.getStartTime());
        assertThat(capturedPost.getPickupTo()).isEqualTo(slot1.getEndTime());
    }

    @Test
    void testCreateSurplusPost_PickupSlotsCreatedWithCorrectOrder() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();

        for (int i = 0; i < 3; i++) {
            PickupSlotRequest slot = new PickupSlotRequest();
            slot.setPickupDate(LocalDate.now().plusDays(1));
            slot.setStartTime(LocalTime.of(9 + (i * 3), 0));
            slot.setEndTime(LocalTime.of(11 + (i * 3), 0));
            slot.setNotes("Slot " + (i + 1));
            slots.add(slot);
        }

        request.setPickupSlots(slots);

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor); // FIXED: Add donor to avoid NullPointerException

        doNothing().when(pickupSlotValidationService).validateSlots(slots);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();

        assertThat(capturedPost.getPickupSlots()).hasSize(3);

        // Verify slot order
        for (int i = 0; i < 3; i++) {
            PickupSlot slot = capturedPost.getPickupSlots().get(i);
            assertThat(slot.getSlotOrder()).isEqualTo(i + 1);
            assertThat(slot.getNotes()).isEqualTo("Slot " + (i + 1));
        }
    }

    @Test
    void testGetAllAvailableSurplusPosts_ExcludesClaimedAndCompletedPosts() {
        // Given - Only AVAILABLE and READY_FOR_PICKUP posts should be returned
        SurplusPost availablePost = new SurplusPost();
        availablePost.setId(1L);
        availablePost.setDonor(donor);
        availablePost.setTitle("Available Food");
        availablePost.setStatus(PostStatus.AVAILABLE);
        availablePost.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        availablePost.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        availablePost.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        availablePost.setExpiryDate(LocalDate.now().plusDays(2));
        availablePost.setPickupDate(LocalDate.now());
        availablePost.setPickupFrom(LocalTime.of(9, 0));
        availablePost.setPickupTo(LocalTime.of(17, 0));

        // Repository returns only posts with AVAILABLE or READY_FOR_PICKUP status
        when(surplusPostRepository.findByStatusIn(any()))
                .thenReturn(Collections.singletonList(availablePost));
        when(claimRepository.existsBySurplusPostIdAndStatus(anyLong(), any(ClaimStatus.class)))
                .thenReturn(false);

        // When
        List<SurplusResponse> responses = surplusService.getAllAvailableSurplusPosts();

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getStatus()).isEqualTo(PostStatus.AVAILABLE);

        // Verify CLAIMED, COMPLETED, NOT_COMPLETED are NOT in the query
        ArgumentCaptor<List<PostStatus>> statusCaptor = ArgumentCaptor.forClass(List.class);
        verify(surplusPostRepository).findByStatusIn(statusCaptor.capture());
        List<PostStatus> capturedStatuses = statusCaptor.getValue();
        assertThat(capturedStatuses).doesNotContain(
                PostStatus.CLAIMED,
                PostStatus.COMPLETED,
                PostStatus.NOT_COMPLETED,
                PostStatus.EXPIRED);
    }

    // ==================== Tests for confirmPickup ====================

    @Test
    void testConfirmPickup_Success() {
        // Given
        com.example.foodflow.model.entity.Claim claim = new com.example.foodflow.model.entity.Claim();
        claim.setId(1L);
        claim.setStatus(ClaimStatus.ACTIVE);

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");
        post.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        post.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupDate(LocalDate.now());
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));

        claim.setSurplusPost(post);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(claimRepository.findBySurplusPost(post)).thenReturn(Optional.of(claim));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(post);
        doNothing().when(claimService).completeClaim(anyLong());

        // When
        SurplusResponse response = surplusService.confirmPickup(1L, "123456", donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(PostStatus.COMPLETED);

        // Verify post was updated
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());
        assertThat(postCaptor.getValue().getStatus()).isEqualTo(PostStatus.COMPLETED);
        assertThat(postCaptor.getValue().getOtpCode()).isNull();

        // Verify claim was completed via service
        verify(claimService).completeClaim(1L);
    }

    @Test
    void testConfirmPickup_PostNotFound_ThrowsException() {
        // Given
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.confirmPickup(999L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Surplus post not found");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
        verify(claimRepository, never()).save(any(com.example.foodflow.model.entity.Claim.class));
    }

    @Test
    void testConfirmPickup_UnauthorizedDonor_ThrowsException() {
        // Given - Create another donor
        User otherDonor = new User();
        otherDonor.setId(2L);
        otherDonor.setEmail("other@test.com");
        otherDonor.setRole(UserRole.DONOR);

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor); // Post belongs to original donor
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then - Try to confirm with different donor
        assertThatThrownBy(() -> surplusService.confirmPickup(1L, "123456", otherDonor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not authorized");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
        verify(claimRepository, never()).save(any(com.example.foodflow.model.entity.Claim.class));
    }

    @Test
    void testConfirmPickup_NoOtpSet_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode(null); // No OTP set

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.confirmPickup(1L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No OTP is set");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
        verify(claimRepository, never()).save(any(com.example.foodflow.model.entity.Claim.class));
    }

    @Test
    void testConfirmPickup_InvalidOtp_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then - Try with wrong OTP
        assertThatThrownBy(() -> surplusService.confirmPickup(1L, "999999", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid or expired OTP code");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
        verify(claimRepository, never()).save(any(com.example.foodflow.model.entity.Claim.class));
    }

    @Test
    void testConfirmPickup_WrongStatus_ThrowsException() {
        // Given - Post is AVAILABLE, not READY_FOR_PICKUP
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.AVAILABLE); // Wrong status
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.confirmPickup(1L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not ready for pickup");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
        verify(claimRepository, never()).save(any(com.example.foodflow.model.entity.Claim.class));
    }

    @Test
    void testConfirmPickup_NoClaimFound_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(claimRepository.findBySurplusPost(post)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.confirmPickup(1L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No active claim found");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
        verify(claimRepository, never()).save(any(com.example.foodflow.model.entity.Claim.class));
    }

    @Test
    void testConfirmPickup_ClaimedStatus_ThrowsException() {
        // Given - Post is CLAIMED, not READY_FOR_PICKUP
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.CLAIMED);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.confirmPickup(1L, "123456", donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not ready for pickup")
                .hasMessageContaining("CLAIMED");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    // ==================== Tests for NotificationService Integration
    // ====================

    @Test
    void testCreateSurplusPost_CallsNotificationService() {
        // Given
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(request.getTitle());
        savedPost.setFoodCategories(request.getFoodCategories());
        savedPost.setQuantity(request.getQuantity());
        savedPost.setPickupLocation(request.getPickupLocation());
        savedPost.setExpiryDate(request.getExpiryDate());
        savedPost.setPickupDate(request.getPickupDate());
        savedPost.setPickupFrom(request.getPickupFrom());
        savedPost.setPickupTo(request.getPickupTo());
        savedPost.setDescription(request.getDescription());

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);
        doNothing().when(notificationService).sendNewPostNotification(any(SurplusPost.class));

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(notificationService, times(1)).sendNewPostNotification(savedPost);
    }

    @Test
    void testCreateSurplusPost_NotificationServiceException_DoesNotFailPostCreation() {
        // Given
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(request.getTitle());
        savedPost.setFoodCategories(request.getFoodCategories());
        savedPost.setQuantity(request.getQuantity());
        savedPost.setPickupLocation(request.getPickupLocation());
        savedPost.setExpiryDate(request.getExpiryDate());
        savedPost.setPickupDate(request.getPickupDate());
        savedPost.setPickupFrom(request.getPickupFrom());
        savedPost.setPickupTo(request.getPickupTo());
        savedPost.setDescription(request.getDescription());

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);
        doThrow(new RuntimeException("Notification failed")).when(notificationService)
                .sendNewPostNotification(any(SurplusPost.class));

        // When
        SurplusResponse response = surplusService.createSurplusPost(request, donor);

        // Then - Post creation succeeds even if notifications fail
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        verify(notificationService, times(1)).sendNewPostNotification(savedPost);
        verify(surplusPostRepository, times(1)).save(any(SurplusPost.class));
    }

    @Test
    void testCreateSurplusPost_NotificationServiceCalledAfterSave() {
        // Given
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(request.getTitle());
        savedPost.setFoodCategories(request.getFoodCategories());
        savedPost.setQuantity(request.getQuantity());

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);
        doNothing().when(notificationService).sendNewPostNotification(any(SurplusPost.class));

        // When
        surplusService.createSurplusPost(request, donor);

        // Then - Verify order: save happens before notification
        var inOrder = inOrder(surplusPostRepository, notificationService);
        inOrder.verify(surplusPostRepository).save(any(SurplusPost.class));
        inOrder.verify(notificationService).sendNewPostNotification(savedPost);
    }

    @Test
    void testCreateSurplusPost_NotificationServiceReceivesCorrectPost() {
        // Given
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle("Test Notification Post");
        savedPost.setFoodCategories(Set.of(FoodCategory.BAKERY_PASTRY));
        savedPost.setQuantity(new Quantity(15.0, Quantity.Unit.ITEM));

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        doNothing().when(notificationService).sendNewPostNotification(postCaptor.capture());

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        SurplusPost capturedPost = postCaptor.getValue();
        assertThat(capturedPost.getId()).isEqualTo(1L);
        assertThat(capturedPost.getTitle()).isEqualTo("Test Notification Post");
        assertThat(capturedPost.getFoodCategories()).contains(FoodCategory.BAKERY_PASTRY);
        assertThat(capturedPost.getQuantity().getValue()).isEqualTo(15.0);
    }

    @Test
    void testConfirmPickup_OtpClearedAfterCompletion() {
        // Given
        com.example.foodflow.model.entity.Claim claim = new com.example.foodflow.model.entity.Claim();
        claim.setId(1L);
        claim.setStatus(ClaimStatus.ACTIVE);

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");
        post.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        post.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupDate(LocalDate.now());
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));

        claim.setSurplusPost(post);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(claimRepository.findBySurplusPost(post)).thenReturn(Optional.of(claim));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(post);
        doNothing().when(claimService).completeClaim(anyLong());

        // When
        surplusService.confirmPickup(1L, "123456", donor);

        // Then - Verify OTP was cleared
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());
        assertThat(postCaptor.getValue().getOtpCode()).isNull();

        // Verify claim was completed via service
        verify(claimService).completeClaim(1L);
    }

    // ==================== Tests for Fabrication Date Feature ====================

    @Test
    void testCreateSurplusPost_WithFabricationDate_AutoCalculatesExpiry() {
        // Given
        CreateSurplusRequest requestWithFabrication = new CreateSurplusRequest();
        requestWithFabrication.setTitle("Fresh Prepared Meal");
        requestWithFabrication.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        requestWithFabrication.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        requestWithFabrication.setFabricationDate(LocalDate.now().minusDays(1));
        // No expiry date provided - should be auto-calculated
        requestWithFabrication.setPickupDate(LocalDate.now());
        requestWithFabrication.setPickupFrom(LocalTime.now().plusHours(3));
        requestWithFabrication.setPickupTo(LocalTime.now().plusHours(5));
        requestWithFabrication.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.now().plusHours(3));
        slot.setEndTime(LocalTime.now().plusHours(5));
        slots.add(slot);
        requestWithFabrication.setPickupSlots(slots);

        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(requestWithFabrication.getTitle());
        savedPost.setFoodCategories(requestWithFabrication.getFoodCategories());
        savedPost.setQuantity(requestWithFabrication.getQuantity());
        savedPost.setPickupLocation(requestWithFabrication.getPickupLocation());
        savedPost.setFabricationDate(requestWithFabrication.getFabricationDate());
        savedPost.setExpiryDate(requestWithFabrication.getFabricationDate().plusDays(3)); // Prepared meals = 3 days

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(expiryCalculationService.isValidFabricationDate(any())).thenReturn(true);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(requestWithFabrication, donor);

        // Then
        assertThat(response).isNotNull();
        verify(expiryCalculationService).isValidFabricationDate(LocalDate.now().minusDays(1));
        verify(expiryPredictionService).predict(any(SurplusPost.class));

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost capturedPost = postCaptor.getValue();
        assertThat(capturedPost.getFabricationDate()).isEqualTo(LocalDate.now().minusDays(1));
        assertThat(capturedPost.getExpiryDatePredicted()).isNotNull();
        assertThat(capturedPost.getExpiryDateEffective()).isNotNull();
    }

    @Test
    void testCreateSurplusPost_WithFabricationAndExpiryDate_UsesProvidedExpiry() {
        // Given
        CreateSurplusRequest requestWithBoth = new CreateSurplusRequest();
        requestWithBoth.setTitle("Custom Expiry Meal");
        requestWithBoth.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        requestWithBoth.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        requestWithBoth.setFabricationDate(LocalDate.now().minusDays(1));
        requestWithBoth.setExpiryDate(LocalDate.now().plusDays(1)); // Custom expiry
        requestWithBoth.setPickupDate(LocalDate.now());
        requestWithBoth.setPickupFrom(LocalTime.now().plusHours(3));
        requestWithBoth.setPickupTo(LocalTime.now().plusHours(5));
        requestWithBoth.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.now().plusHours(3));
        slot.setEndTime(LocalTime.now().plusHours(5));
        slots.add(slot);
        requestWithBoth.setPickupSlots(slots);

        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(requestWithBoth.getTitle());
        savedPost.setFoodCategories(requestWithBoth.getFoodCategories());
        savedPost.setQuantity(requestWithBoth.getQuantity());
        savedPost.setPickupLocation(requestWithBoth.getPickupLocation());
        savedPost.setFabricationDate(requestWithBoth.getFabricationDate());
        savedPost.setExpiryDate(requestWithBoth.getExpiryDate());

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(expiryCalculationService.isValidFabricationDate(any())).thenReturn(true);
        when(expiryCalculationService.isValidExpiryDate(any(), any())).thenReturn(true);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(requestWithBoth, donor);

        // Then
        assertThat(response).isNotNull();
        verify(expiryCalculationService).isValidFabricationDate(LocalDate.now().minusDays(1));
        verify(expiryCalculationService).isValidExpiryDate(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost capturedPost = postCaptor.getValue();
        assertThat(capturedPost.getFabricationDate()).isEqualTo(LocalDate.now().minusDays(1));
        assertThat(capturedPost.getExpiryDate()).isEqualTo(LocalDate.now().plusDays(1)); // Uses provided
    }

    @Test
    void testCreateSurplusPost_FutureFabricationDate_ThrowsException() {
        // Given
        CreateSurplusRequest requestWithFutureFabrication = new CreateSurplusRequest();
        requestWithFutureFabrication.setTitle("Invalid Future Meal");
        requestWithFutureFabrication.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        requestWithFutureFabrication.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        requestWithFutureFabrication.setFabricationDate(LocalDate.now().plusDays(1)); // Future date - invalid
        requestWithFutureFabrication.setPickupDate(LocalDate.now());
        requestWithFutureFabrication.setPickupFrom(LocalTime.now().plusHours(3));
        requestWithFutureFabrication.setPickupTo(LocalTime.now().plusHours(5));
        requestWithFutureFabrication.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.now().plusHours(3));
        slot.setEndTime(LocalTime.now().plusHours(5));
        slots.add(slot);
        requestWithFutureFabrication.setPickupSlots(slots);

        when(expiryCalculationService.isValidFabricationDate(any())).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> surplusService.createSurplusPost(requestWithFutureFabrication, donor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Fabrication date cannot be in the future");

        verify(expiryCalculationService).isValidFabricationDate(LocalDate.now().plusDays(1));
    }

    @Test
    void testCreateSurplusPost_ExpiryBeforeFabrication_ThrowsException() {
        // Given
        CreateSurplusRequest requestWithInvalidExpiry = new CreateSurplusRequest();
        requestWithInvalidExpiry.setTitle("Invalid Expiry Meal");
        requestWithInvalidExpiry.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        requestWithInvalidExpiry.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        requestWithInvalidExpiry.setFabricationDate(LocalDate.now());
        requestWithInvalidExpiry.setExpiryDate(LocalDate.now().minusDays(1)); // Before fabrication - invalid
        requestWithInvalidExpiry.setPickupDate(LocalDate.now());
        requestWithInvalidExpiry.setPickupFrom(LocalTime.now().plusHours(3));
        requestWithInvalidExpiry.setPickupTo(LocalTime.now().plusHours(5));
        requestWithInvalidExpiry.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.now().plusHours(3));
        slot.setEndTime(LocalTime.now().plusHours(5));
        slots.add(slot);
        requestWithInvalidExpiry.setPickupSlots(slots);

        when(expiryCalculationService.isValidFabricationDate(any())).thenReturn(true);
        when(expiryCalculationService.isValidExpiryDate(any(), any())).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> surplusService.createSurplusPost(requestWithInvalidExpiry, donor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Expiry date must be after fabrication date");

        verify(expiryCalculationService).isValidFabricationDate(LocalDate.now());
        verify(expiryCalculationService).isValidExpiryDate(LocalDate.now(), LocalDate.now().minusDays(1));
    }

    @Test
    void testCreateSurplusPost_NoFabricationDate_RequiresExpiryDate() {
        // Given
        CreateSurplusRequest requestWithoutFabrication = new CreateSurplusRequest();
        requestWithoutFabrication.setTitle("No Fabrication Meal");
        requestWithoutFabrication.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        requestWithoutFabrication.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        // No fabrication date and no expiry date
        requestWithoutFabrication.setExpiryDate(LocalDate.now().plusDays(2)); // Must provide expiry
        requestWithoutFabrication.setPickupDate(LocalDate.now());
        requestWithoutFabrication.setPickupFrom(LocalTime.now().plusHours(3));
        requestWithoutFabrication.setPickupTo(LocalTime.now().plusHours(5));
        requestWithoutFabrication.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.now().plusHours(3));
        slot.setEndTime(LocalTime.now().plusHours(5));
        slots.add(slot);
        requestWithoutFabrication.setPickupSlots(slots);

        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(requestWithoutFabrication.getTitle());
        savedPost.setFoodCategories(requestWithoutFabrication.getFoodCategories());
        savedPost.setQuantity(requestWithoutFabrication.getQuantity());
        savedPost.setPickupLocation(requestWithoutFabrication.getPickupLocation());
        savedPost.setExpiryDate(requestWithoutFabrication.getExpiryDate());

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(requestWithoutFabrication, donor);

        // Then
        assertThat(response).isNotNull();
        verify(surplusPostRepository, times(1)).save(any(SurplusPost.class));
    }

    @Test
    void testCreateSurplusPost_WithoutFabricationOrExpiry_UsesPrediction() {
        // Given
        CreateSurplusRequest requestWithoutDates = new CreateSurplusRequest();
        requestWithoutDates.setTitle("No Dates Meal");
        requestWithoutDates.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        requestWithoutDates.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        // No fabrication date and no expiry date - should fail
        requestWithoutDates.setPickupDate(LocalDate.now());
        requestWithoutDates.setPickupFrom(LocalTime.now().plusHours(3));
        requestWithoutDates.setPickupTo(LocalTime.now().plusHours(5));
        requestWithoutDates.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.now().plusHours(3));
        slot.setEndTime(LocalTime.now().plusHours(5));
        slots.add(slot);
        requestWithoutDates.setPickupSlots(slots);

        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(requestWithoutDates.getTitle());
        savedPost.setFoodCategories(requestWithoutDates.getFoodCategories());
        savedPost.setQuantity(requestWithoutDates.getQuantity());
        savedPost.setPickupLocation(requestWithoutDates.getPickupLocation());

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(requestWithoutDates, donor);

        // Then
        assertThat(response).isNotNull();
        verify(expiryPredictionService).predict(any(SurplusPost.class));
        verify(surplusPostRepository).save(any(SurplusPost.class));
    }

    @Test
    void testCreateSurplusPost_MultipleCategories_UsesShortestShelfLife() {
        // Given
        CreateSurplusRequest requestWithMultipleCategories = new CreateSurplusRequest();
        requestWithMultipleCategories.setTitle("Mixed Food");
        requestWithMultipleCategories.getFoodCategories().add(FoodCategory.PREPARED_MEALS); // 3 days
        requestWithMultipleCategories.getFoodCategories().add(FoodCategory.FROZEN); // 30 days
        requestWithMultipleCategories.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        requestWithMultipleCategories.setFabricationDate(LocalDate.now());
        // No expiry - should calculate using shortest (3 days)
        requestWithMultipleCategories.setPickupDate(LocalDate.now());
        requestWithMultipleCategories.setPickupFrom(LocalTime.now().plusHours(3));
        requestWithMultipleCategories.setPickupTo(LocalTime.now().plusHours(5));
        requestWithMultipleCategories.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.now().plusHours(3));
        slot.setEndTime(LocalTime.now().plusHours(5));
        slots.add(slot);
        requestWithMultipleCategories.setPickupSlots(slots);

        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(requestWithMultipleCategories.getTitle());
        savedPost.setFoodCategories(requestWithMultipleCategories.getFoodCategories());
        savedPost.setQuantity(requestWithMultipleCategories.getQuantity());
        savedPost.setPickupLocation(requestWithMultipleCategories.getPickupLocation());
        savedPost.setFabricationDate(LocalDate.now());
        savedPost.setExpiryDate(LocalDate.now().plusDays(3)); // Shortest shelf life

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(expiryCalculationService.isValidFabricationDate(any())).thenReturn(true);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(requestWithMultipleCategories, donor);

        // Then
        assertThat(response).isNotNull();
        verify(expiryPredictionService).predict(any(SurplusPost.class));

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost capturedPost = postCaptor.getValue();
        assertThat(capturedPost.getExpiryDatePredicted()).isNotNull();
        assertThat(capturedPost.getExpiryDateEffective()).isNotNull();
    }

    @Test
    void testCreateSurplusPost_FrozenFood_LongerShelfLife() {
        // Given
        CreateSurplusRequest requestWithFrozen = new CreateSurplusRequest();
        requestWithFrozen.setTitle("Frozen Meals");
        requestWithFrozen.getFoodCategories().add(FoodCategory.FROZEN_MEALS);
        requestWithFrozen.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        requestWithFrozen.setFabricationDate(LocalDate.now());
        // No expiry - should calculate 30 days for frozen
        requestWithFrozen.setPickupDate(LocalDate.now());
        requestWithFrozen.setPickupFrom(LocalTime.now().plusHours(3));
        requestWithFrozen.setPickupTo(LocalTime.now().plusHours(5));
        requestWithFrozen.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.now().plusHours(3));
        slot.setEndTime(LocalTime.now().plusHours(5));
        slots.add(slot);
        requestWithFrozen.setPickupSlots(slots);

        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(requestWithFrozen.getTitle());
        savedPost.setFoodCategories(requestWithFrozen.getFoodCategories());
        savedPost.setQuantity(requestWithFrozen.getQuantity());
        savedPost.setPickupLocation(requestWithFrozen.getPickupLocation());
        savedPost.setFabricationDate(LocalDate.now());
        savedPost.setExpiryDate(LocalDate.now().plusDays(30)); // Frozen = 30 days

        doNothing().when(pickupSlotValidationService).validateSlots(any());
        when(expiryCalculationService.isValidFabricationDate(any())).thenReturn(true);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(requestWithFrozen, donor);

        // Then
        assertThat(response).isNotNull();
        verify(expiryPredictionService).predict(any(SurplusPost.class));

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost capturedPost = postCaptor.getValue();
        assertThat(capturedPost.getExpiryDatePredicted()).isNotNull();
        assertThat(capturedPost.getExpiryDateEffective()).isNotNull();
    }

    // ==================== Tests for Timeline Feature ====================

    @Test
    void testGetTimelineForPost_AsDonor_ReturnsTimeline() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.AVAILABLE);

        com.example.foodflow.model.entity.DonationTimeline timeline1 = new com.example.foodflow.model.entity.DonationTimeline();
        timeline1.setId(1L);
        timeline1.setSurplusPost(post);
        timeline1.setEventType("DONATION_POSTED");
        timeline1.setTimestamp(LocalDateTime.now().minusHours(2));
        timeline1.setActor("donor");
        timeline1.setActorUserId(donor.getId());
        timeline1.setNewStatus("AVAILABLE");
        timeline1.setVisibleToUsers(true);

        com.example.foodflow.model.entity.DonationTimeline timeline2 = new com.example.foodflow.model.entity.DonationTimeline();
        timeline2.setId(2L);
        timeline2.setSurplusPost(post);
        timeline2.setEventType("DONATION_CLAIMED");
        timeline2.setTimestamp(LocalDateTime.now().minusHours(1));
        timeline2.setActor("receiver");
        timeline2.setActorUserId(receiver.getId());
        timeline2.setOldStatus("AVAILABLE");
        timeline2.setNewStatus("CLAIMED");
        timeline2.setVisibleToUsers(true);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(timelineRepository.findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(1L, true))
                .thenReturn(Arrays.asList(timeline2, timeline1));

        // When
        List<com.example.foodflow.model.dto.DonationTimelineDTO> result = surplusService.getTimelineForPost(1L, donor);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEventType()).isEqualTo("DONATION_CLAIMED");
        assertThat(result.get(1).getEventType()).isEqualTo("DONATION_POSTED");

        verify(surplusPostRepository).findById(1L);
        verify(timelineRepository).findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(1L, true);
    }

    @Test
    void testGetTimelineForPost_AsReceiverWithActiveClaim_ReturnsTimeline() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.CLAIMED);

        com.example.foodflow.model.entity.Claim claim = new com.example.foodflow.model.entity.Claim();
        claim.setId(1L);
        claim.setReceiver(receiver);
        claim.setSurplusPost(post);
        claim.setStatus(ClaimStatus.ACTIVE);

        com.example.foodflow.model.entity.DonationTimeline timeline = new com.example.foodflow.model.entity.DonationTimeline();
        timeline.setId(1L);
        timeline.setSurplusPost(post);
        timeline.setEventType("DONATION_CLAIMED");
        timeline.setTimestamp(LocalDateTime.now());
        timeline.setActor("receiver");
        timeline.setActorUserId(receiver.getId());
        timeline.setVisibleToUsers(true);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
                .thenReturn(Optional.of(claim));
        when(timelineRepository.findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(1L, true))
                .thenReturn(Collections.singletonList(timeline));

        // When
        List<com.example.foodflow.model.dto.DonationTimelineDTO> result = surplusService.getTimelineForPost(1L,
                receiver);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEventType()).isEqualTo("DONATION_CLAIMED");
        assertThat(result.get(0).getActorUserId()).isEqualTo(receiver.getId());

        verify(claimRepository).findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE);
    }

    @Test
    void testGetTimelineForPost_AsReceiverWithCompletedClaim_ReturnsTimeline() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.COMPLETED);

        com.example.foodflow.model.entity.Claim claim = new com.example.foodflow.model.entity.Claim();
        claim.setId(1L);
        claim.setReceiver(receiver);
        claim.setSurplusPost(post);
        claim.setStatus(ClaimStatus.COMPLETED);

        com.example.foodflow.model.entity.DonationTimeline timeline = new com.example.foodflow.model.entity.DonationTimeline();
        timeline.setId(1L);
        timeline.setSurplusPost(post);
        timeline.setEventType("DONATION_COMPLETED");
        timeline.setTimestamp(LocalDateTime.now());
        timeline.setActor("donor");
        timeline.setActorUserId(donor.getId());
        timeline.setVisibleToUsers(true);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.COMPLETED))
                .thenReturn(Optional.of(claim));
        when(timelineRepository.findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(1L, true))
                .thenReturn(Collections.singletonList(timeline));

        // When
        List<com.example.foodflow.model.dto.DonationTimelineDTO> result = surplusService.getTimelineForPost(1L,
                receiver);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEventType()).isEqualTo("DONATION_COMPLETED");

        verify(claimRepository).findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE);
        verify(claimRepository).findBySurplusPostIdAndStatus(1L, ClaimStatus.COMPLETED);
    }

    @Test
    void testGetTimelineForPost_AsUnauthorizedUser_ThrowsException() {
        // Given
        User unauthorizedUser = new User();
        unauthorizedUser.setId(999L);
        unauthorizedUser.setEmail("unauthorized@test.com");
        unauthorizedUser.setRole(UserRole.RECEIVER);

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.AVAILABLE);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(claimRepository.findBySurplusPostIdAndStatus(1L, ClaimStatus.COMPLETED))
                .thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.getTimelineForPost(1L, unauthorizedUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not authorized to view this timeline");

        verify(timelineRepository, never()).findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(anyLong(),
                anyBoolean());
    }

    @Test
    void testGetTimelineForPost_PostNotFound_ThrowsException() {
        // Given
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.getTimelineForPost(999L, donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Surplus post not found");

        verify(timelineRepository, never()).findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(anyLong(),
                anyBoolean());
    }

    @Test
    void testGetTimelineForPost_EmptyTimeline_ReturnsEmptyList() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.AVAILABLE);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(timelineRepository.findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(1L, true))
                .thenReturn(Collections.emptyList());

        // When
        List<com.example.foodflow.model.dto.DonationTimelineDTO> result = surplusService.getTimelineForPost(1L, donor);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();

        verify(timelineRepository).findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(1L, true);
    }

    @Test
    void testGetTimelineForPost_OnlyVisibleEvents_ReturnsFiltered() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.AVAILABLE);

        com.example.foodflow.model.entity.DonationTimeline visibleEvent = new com.example.foodflow.model.entity.DonationTimeline();
        visibleEvent.setId(1L);
        visibleEvent.setSurplusPost(post);
        visibleEvent.setEventType("DONATION_POSTED");
        visibleEvent.setTimestamp(LocalDateTime.now());
        visibleEvent.setActor("donor");
        visibleEvent.setVisibleToUsers(true);

        // Admin-only event should not be returned by repository query
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(timelineRepository.findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(1L, true))
                .thenReturn(Collections.singletonList(visibleEvent));

        // When
        List<com.example.foodflow.model.dto.DonationTimelineDTO> result = surplusService.getTimelineForPost(1L, donor);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getVisibleToUsers()).isTrue();

        // Verify repository was queried with visibleToUsers=true
        verify(timelineRepository).findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(1L, true);
    }

    @Test
    void testGetTimelineForPost_MapsAllDTOFields() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.COMPLETED);

        LocalDateTime eventTime = LocalDateTime.now().minusHours(1);

        com.example.foodflow.model.entity.DonationTimeline timeline = new com.example.foodflow.model.entity.DonationTimeline();
        timeline.setId(1L);
        timeline.setSurplusPost(post);
        timeline.setEventType("PICKUP_CONFIRMED");
        timeline.setTimestamp(eventTime);
        timeline.setActor("receiver");
        timeline.setActorUserId(receiver.getId());
        timeline.setOldStatus("READY_FOR_PICKUP");
        timeline.setNewStatus("COMPLETED");
        timeline.setDetails("Pickup confirmed successfully");
        timeline.setVisibleToUsers(true);
        timeline.setTemperature(4.5);
        timeline.setPackagingCondition("GOOD");
        timeline.setPickupEvidenceUrl("https://example.com/evidence.jpg");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(timelineRepository.findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(1L, true))
                .thenReturn(Collections.singletonList(timeline));

        // When
        List<com.example.foodflow.model.dto.DonationTimelineDTO> result = surplusService.getTimelineForPost(1L, donor);

        // Then
        assertThat(result).hasSize(1);
        com.example.foodflow.model.dto.DonationTimelineDTO dto = result.get(0);
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getEventType()).isEqualTo("PICKUP_CONFIRMED");
        assertThat(dto.getTimestamp()).isEqualTo(eventTime);
        assertThat(dto.getActor()).isEqualTo("receiver");
        assertThat(dto.getActorUserId()).isEqualTo(receiver.getId());
        assertThat(dto.getOldStatus()).isEqualTo("READY_FOR_PICKUP");
        assertThat(dto.getNewStatus()).isEqualTo("COMPLETED");
        assertThat(dto.getDetails()).isEqualTo("Pickup confirmed successfully");
        assertThat(dto.getVisibleToUsers()).isTrue();
        assertThat(dto.getTemperature()).isEqualTo(4.5);
        assertThat(dto.getPackagingCondition()).isEqualTo("GOOD");
        assertThat(dto.getPickupEvidenceUrl()).isEqualTo("https://example.com/evidence.jpg");
    }

    // ==================== Tests for getUserSurplusPosts ====================

    @Test
    void testGetUserSurplusPosts_Success() {
        // Given
        donor.setTimezone("America/New_York");
        
        SurplusPost post1 = new SurplusPost();
        post1.setId(1L);
        post1.setDonor(donor);
        post1.setTitle("Food 1");
        post1.setStatus(PostStatus.AVAILABLE);
        post1.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        post1.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post1.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post1.setExpiryDate(LocalDate.now().plusDays(2));
        post1.setPickupDate(LocalDate.now());
        post1.setPickupFrom(LocalTime.of(9, 0));
        post1.setPickupTo(LocalTime.of(17, 0));

        SurplusPost post2 = new SurplusPost();
        post2.setId(2L);
        post2.setDonor(donor);
        post2.setTitle("Food 2");
        post2.setStatus(PostStatus.CLAIMED);
        post2.setFoodCategories(Set.of(FoodCategory.BAKERY_PASTRY));
        post2.setQuantity(new Quantity(3.0, Quantity.Unit.KILOGRAM));
        post2.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post2.setExpiryDate(LocalDate.now().plusDays(1));
        post2.setPickupDate(LocalDate.now());
        post2.setPickupFrom(LocalTime.of(10, 0));
        post2.setPickupTo(LocalTime.of(18, 0));

        when(surplusPostRepository.findByDonorId(donor.getId()))
                .thenReturn(Arrays.asList(post1, post2));

        // When
        List<SurplusResponse> responses = surplusService.getUserSurplusPosts(donor);

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(SurplusResponse::getTitle)
                .containsExactlyInAnyOrder("Food 1", "Food 2");
        verify(surplusPostRepository).findByDonorId(donor.getId());
    }

    @Test
    void testGetUserSurplusPosts_EmptyList() {
        // Given
        when(surplusPostRepository.findByDonorId(donor.getId()))
                .thenReturn(Collections.emptyList());

        // When
        List<SurplusResponse> responses = surplusService.getUserSurplusPosts(donor);

        // Then
        assertThat(responses).isEmpty();
        verify(surplusPostRepository).findByDonorId(donor.getId());
    }

    // ==================== Tests for getSurplusPostByIdForDonor ====================

    @Test
    void testGetSurplusPostByIdForDonor_Success() {
        // Given
        donor.setTimezone("America/Toronto");
        
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.AVAILABLE);
        post.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        post.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupDate(LocalDate.now());
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When
        SurplusResponse response = surplusService.getSurplusPostByIdForDonor(1L, donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("Test Food");
        verify(surplusPostRepository).findById(1L);
    }

    @Test
    void testGetSurplusPostByIdForDonor_PostNotFound() {
        // Given
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.getSurplusPostByIdForDonor(999L, donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Surplus post not found");
    }

    @Test
    void testGetSurplusPostByIdForDonor_UnauthorizedUser() {
        // Given
        User otherDonor = new User();
        otherDonor.setId(99L);
        otherDonor.setEmail("other@test.com");

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.getSurplusPostByIdForDonor(1L, otherDonor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not authorized");
    }

    // ==================== Tests for updateSurplusPost ====================

    @Test
    void testUpdateSurplusPost_Success() {
        // Given
        SurplusPost existingPost = new SurplusPost();
        existingPost.setId(1L);
        existingPost.setDonor(donor);
        existingPost.setTitle("Old Title");
        existingPost.setStatus(PostStatus.AVAILABLE);
        existingPost.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        existingPost.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        existingPost.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        existingPost.setExpiryDate(LocalDate.now().plusDays(2));
        existingPost.setPickupDate(LocalDate.now());
        existingPost.setPickupFrom(LocalTime.of(9, 0));
        existingPost.setPickupTo(LocalTime.of(17, 0));
        existingPost.setPickupSlots(new ArrayList<>());

        CreateSurplusRequest updateRequest = new CreateSurplusRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.getFoodCategories().add(FoodCategory.BAKERY_PASTRY);
        updateRequest.setQuantity(new Quantity(8.0, Quantity.Unit.KILOGRAM));
        updateRequest.setExpiryDate(LocalDate.now().plusDays(3));
        updateRequest.setPickupDate(LocalDate.now().plusDays(1));
        updateRequest.setPickupFrom(LocalTime.of(10, 0));
        updateRequest.setPickupTo(LocalTime.of(16, 0));
        updateRequest.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        updateRequest.setDescription("Updated description");

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(16, 0));
        slots.add(slot);
        updateRequest.setPickupSlots(slots);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(existingPost));
        when(surplusPostRepository.saveAndFlush(any(SurplusPost.class))).thenReturn(existingPost);
        doNothing().when(pickupSlotValidationService).validateSlots(any());

        // When
        SurplusResponse response = surplusService.updateSurplusPost(1L, updateRequest, donor);

        // Then
        assertThat(response).isNotNull();
        verify(surplusPostRepository).findById(1L);
        verify(surplusPostRepository, times(2)).saveAndFlush(any(SurplusPost.class));
        verify(pickupSlotValidationService).validateSlots(any());
    }

    @Test
    void testUpdateSurplusPost_PostNotFound() {
        // Given
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.updateSurplusPost(999L, request, donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Surplus post not found");
    }

    @Test
    void testUpdateSurplusPost_UnauthorizedUser() {
        // Given
        User otherDonor = new User();
        otherDonor.setId(99L);
        otherDonor.setEmail("other@test.com");

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.AVAILABLE);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.updateSurplusPost(1L, request, otherDonor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    void testUpdateSurplusPost_ClaimedPost_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.CLAIMED);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.updateSurplusPost(1L, request, donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot edit a post that has been claimed");
    }

    @Test
    void testUpdateSurplusPost_CompletedPost_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.COMPLETED);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.updateSurplusPost(1L, request, donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot edit a post that has been claimed or completed");
    }

    // ==================== Tests for deleteSurplusPost ====================

    @Test
    void testDeleteSurplusPost_Success() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.AVAILABLE);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(claimRepository.findBySurplusPostId(1L)).thenReturn(Collections.emptyList());
        doNothing().when(surplusPostRepository).delete(post);

        // When
        surplusService.deleteSurplusPost(1L, donor);

        // Then
        verify(surplusPostRepository).findById(1L);
        verify(surplusPostRepository).delete(post);
    }

    @Test
    void testDeleteSurplusPost_PostNotFound() {
        // Given
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.deleteSurplusPost(999L, donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Surplus post not found");

        verify(surplusPostRepository, never()).delete(any(SurplusPost.class));
    }

    @Test
    void testDeleteSurplusPost_UnauthorizedUser() {
        // Given
        User otherDonor = new User();
        otherDonor.setId(99L);
        otherDonor.setEmail("other@test.com");

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.deleteSurplusPost(1L, otherDonor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not authorized");

        verify(surplusPostRepository, never()).delete(any(SurplusPost.class));
    }

    @Test
    void testDeleteSurplusPost_ClaimedPost_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.CLAIMED);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.deleteSurplusPost(1L, donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("cannot delete a post that has already been claimed");

        verify(surplusPostRepository, never()).delete(any(SurplusPost.class));
    }

    @Test
    void testDeleteSurplusPost_CompletedPost_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.COMPLETED);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.deleteSurplusPost(1L, donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("cannot delete a post that has already been claimed or completed");

        verify(surplusPostRepository, never()).delete(any(SurplusPost.class));
    }

    // ==================== Tests for searchSurplusPosts ====================

    @Test
    void testSearchSurplusPosts_WithFilters() {
        // Given
        com.example.foodflow.model.dto.SurplusFilterRequest filterRequest = 
                new com.example.foodflow.model.dto.SurplusFilterRequest();
        filterRequest.setStatus(PostStatus.AVAILABLE.name());

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Filtered Food");
        post.setStatus(PostStatus.AVAILABLE);
        post.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        post.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupDate(LocalDate.now());
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));

        when(surplusPostRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                .thenReturn(Collections.singletonList(post));

        // When
        List<SurplusResponse> responses = surplusService.searchSurplusPosts(filterRequest);

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("Filtered Food");
        verify(surplusPostRepository).findAll(any(org.springframework.data.jpa.domain.Specification.class));
    }

    // ==================== Tests for searchSurplusPostsForReceiver ====================

    @Test
    void testSearchSurplusPostsForReceiver_WithFilters() {
        // Given
        receiver.setTimezone("America/New_York");
        
        com.example.foodflow.model.dto.SurplusFilterRequest filterRequest = 
                new com.example.foodflow.model.dto.SurplusFilterRequest();
        filterRequest.setStatus(PostStatus.AVAILABLE.name());

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Filtered Food");
        post.setStatus(PostStatus.AVAILABLE);
        post.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        post.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupDate(LocalDate.now());
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));

        when(surplusPostRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                .thenReturn(Collections.singletonList(post));

        // When
        List<SurplusResponse> responses = surplusService.searchSurplusPostsForReceiver(filterRequest, receiver);

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("Filtered Food");
        verify(surplusPostRepository).findAll(any(org.springframework.data.jpa.domain.Specification.class));
    }

    // ==================== Tests for uploadPickupEvidence ====================

    @Test
    void testUploadPickupEvidence_Success() throws Exception {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.CLAIMED);

        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(fileStorageService.storePickupEvidence(mockFile, 1L)).thenReturn("http://example.com/evidence.jpg");
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(new DonationTimeline());

        // When
        com.example.foodflow.model.dto.UploadEvidenceResponse response = 
                surplusService.uploadPickupEvidence(1L, mockFile, donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getUrl()).isEqualTo("http://example.com/evidence.jpg");
        verify(fileStorageService).storePickupEvidence(mockFile, 1L);
        verify(timelineRepository).save(any(DonationTimeline.class));
    }

    @Test
    void testUploadPickupEvidence_PostNotFound() {
        // Given
        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.uploadPickupEvidence(999L, mockFile, donor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Donation not found");
    }

    @Test
    void testUploadPickupEvidence_UnauthorizedDonor() {
        // Given
        User otherDonor = new User();
        otherDonor.setId(99L);
        otherDonor.setEmail("other@test.com");

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.CLAIMED);

        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.uploadPickupEvidence(1L, mockFile, otherDonor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    void testUploadPickupEvidence_InvalidStatus() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.AVAILABLE); // Invalid status

        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.uploadPickupEvidence(1L, mockFile, donor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Evidence can only be uploaded for claimed");
    }

}

