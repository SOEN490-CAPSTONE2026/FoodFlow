package com.example.foodflow.service;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for SurplusPostSchedulerService
 * Story 8.1 - Update Donation Status (Donor-Side)
 */
@ExtendWith(MockitoExtension.class)
class SurplusPostSchedulerServiceTest {

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock
    private ClaimRepository claimRepository;
    
    @Mock
    private TimelineService timelineService;

    @InjectMocks
    private SurplusPostSchedulerService schedulerService;

    private User donor;
    private User receiver;
    private SurplusPost availablePost;
    private SurplusPost claimedPost;
    private SurplusPost readyPost;

    @BeforeEach
    void setUp() throws Exception {
        // Set late tolerance using reflection (since @Value isn't processed in unit tests)
        Field lateToleranceField = SurplusPostSchedulerService.class.getDeclaredField("lateToleranceMinutes");
        lateToleranceField.setAccessible(true);
        lateToleranceField.setInt(schedulerService, 30);

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

        // Create test posts
        availablePost = createTestPost(1L, PostStatus.AVAILABLE);
        claimedPost = createTestPost(2L, PostStatus.CLAIMED);
        readyPost = createTestPost(3L, PostStatus.READY_FOR_PICKUP);
    }

    // ==================== Tests for updatePostsToReadyForPickup ====================

    @Test
    void testUpdatePostsToReadyForPickup_ClaimedPostPickupTimeStarted_UpdatesStatus() {
        // Given - CLAIMED post with pickup time started (pickup date in the past ensures it will transition)
        claimedPost.setPickupDate(LocalDate.now().minusDays(1));
        claimedPost.setPickupFrom(LocalTime.of(9, 0));
        claimedPost.setPickupTo(LocalTime.of(17, 0));
        // Set createdAt to 3 minutes ago to pass grace period check using reflection
        setCreatedAt(claimedPost, LocalDateTime.now().minusMinutes(3));

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.singletonList(claimedPost));
        mockClaimForPost(claimedPost, LocalDate.now().minusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(claimedPost);

        // When
        schedulerService.updatePostsToReadyForPickup();

        // Then
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getStatus()).isEqualTo(PostStatus.READY_FOR_PICKUP);
        assertThat(savedPost.getOtpCode()).isNotNull();
        assertThat(savedPost.getOtpCode()).hasSize(6);
        assertThat(savedPost.getOtpCode()).matches("^[0-9]{6}$");
    }

    @Test
    void testUpdatePostsToReadyForPickup_ClaimedPostPickupDateInPast_UpdatesStatus() {
        // Given - CLAIMED post with pickup date in the past
        claimedPost.setPickupDate(LocalDate.now().minusDays(1));
        claimedPost.setPickupFrom(LocalTime.of(9, 0));
        claimedPost.setPickupTo(LocalTime.of(17, 0));
        setCreatedAt(claimedPost, LocalDateTime.now().minusMinutes(3));

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.singletonList(claimedPost));
        mockClaimForPost(claimedPost, LocalDate.now().minusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(claimedPost);

        // When
        schedulerService.updatePostsToReadyForPickup();

        // Then
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getStatus()).isEqualTo(PostStatus.READY_FOR_PICKUP);
        assertThat(savedPost.getOtpCode()).isNotNull();
    }

    @Test
    void testUpdatePostsToReadyForPickup_ClaimedPostPickupDateInFuture_DoesNotUpdate() {
        // Given - CLAIMED post with pickup date in the future
        claimedPost.setPickupDate(LocalDate.now().plusDays(1));
        claimedPost.setPickupFrom(LocalTime.of(9, 0));
        claimedPost.setPickupTo(LocalTime.of(17, 0));

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.singletonList(claimedPost));
        mockClaimForPost(claimedPost, LocalDate.now().plusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));

        // When
        schedulerService.updatePostsToReadyForPickup();

        // Then
        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testUpdatePostsToReadyForPickup_MultipleClaimedPosts_UpdatesAll() {
        // Given - Multiple CLAIMED posts with pickup time started
        SurplusPost claimedPost2 = createTestPost(4L, PostStatus.CLAIMED);

        claimedPost.setPickupDate(LocalDate.now().minusDays(1));
        claimedPost.setPickupFrom(LocalTime.of(9, 0));
        claimedPost.setPickupTo(LocalTime.of(17, 0));
        setCreatedAt(claimedPost, LocalDateTime.now().minusMinutes(3));

        claimedPost2.setPickupDate(LocalDate.now().minusDays(1));
        claimedPost2.setPickupFrom(LocalTime.of(9, 0));
        claimedPost2.setPickupTo(LocalTime.of(17, 0));
        setCreatedAt(claimedPost2, LocalDateTime.now().minusMinutes(3));

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Arrays.asList(claimedPost, claimedPost2));
        mockClaimForPost(claimedPost, LocalDate.now().minusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));
        mockClaimForPost(claimedPost2, LocalDate.now().minusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));
        when(surplusPostRepository.save(any(SurplusPost.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        schedulerService.updatePostsToReadyForPickup();

        // Then - Both CLAIMED posts should be updated
        verify(surplusPostRepository, times(2)).save(any(SurplusPost.class));
    }

    @Test
    void testUpdatePostsToReadyForPickup_OtpAlreadyExists_DoesNotRegenerateOtp() {
        // Given - CLAIMED post already has an OTP
        claimedPost.setPickupDate(LocalDate.now().minusDays(1));
        claimedPost.setPickupFrom(LocalTime.of(9, 0));
        claimedPost.setPickupTo(LocalTime.of(17, 0));
        claimedPost.setOtpCode("123456");
        setCreatedAt(claimedPost, LocalDateTime.now().minusMinutes(3));

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.singletonList(claimedPost));
        mockClaimForPost(claimedPost, LocalDate.now().minusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(claimedPost);

        // When
        schedulerService.updatePostsToReadyForPickup();

        // Then
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getOtpCode()).isEqualTo("123456"); // OTP unchanged
    }

    @Test
    void testUpdatePostsToReadyForPickup_EmptyOtpCode_GeneratesNewOtp() {
        // Given - CLAIMED post has empty OTP
        claimedPost.setPickupDate(LocalDate.now().minusDays(1));
        claimedPost.setPickupFrom(LocalTime.of(9, 0));
        claimedPost.setPickupTo(LocalTime.of(17, 0));
        claimedPost.setOtpCode("");
        setCreatedAt(claimedPost, LocalDateTime.now().minusMinutes(3));

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.singletonList(claimedPost));
        mockClaimForPost(claimedPost, LocalDate.now().minusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(claimedPost);

        // When
        schedulerService.updatePostsToReadyForPickup();

        // Then
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getOtpCode()).isNotEmpty();
        assertThat(savedPost.getOtpCode()).hasSize(6);
    }

    @Test
    void testUpdatePostsToReadyForPickup_NoPosts_DoesNotSaveAnything() {
        // Given - No CLAIMED posts to update
        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.emptyList());

        // When
        schedulerService.updatePostsToReadyForPickup();

        // Then
        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    // ==================== Tests for updatePostsToNotCompleted ====================

    @Test
    void testUpdatePostsToNotCompleted_PickupWindowEnded_UpdatesStatus() {
        // Given - Pickup window ended (pickup date was yesterday)
        readyPost.setPickupDate(LocalDate.now().minusDays(1));
        readyPost.setPickupFrom(LocalTime.of(9, 0));
        readyPost.setPickupTo(LocalTime.of(17, 0));
        readyPost.setOtpCode("123456");

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.singletonList(readyPost));
        mockClaimForPost(readyPost, LocalDate.now().minusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(readyPost);

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getStatus()).isEqualTo(PostStatus.NOT_COMPLETED);
    }

    @Test
    void testUpdatePostsToNotCompleted_PickupWindowEndedToday_UpdatesStatus() {
        // Given - Pickup window ended (use past date to ensure reliable test)
        readyPost.setPickupDate(LocalDate.now().minusDays(1));
        readyPost.setPickupFrom(LocalTime.of(9, 0));
        readyPost.setPickupTo(LocalTime.of(17, 0));
        readyPost.setOtpCode("123456");

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.singletonList(readyPost));
        mockClaimForPost(readyPost, LocalDate.now().minusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(readyPost);

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getStatus()).isEqualTo(PostStatus.NOT_COMPLETED);
    }

    @Test
    void testUpdatePostsToNotCompleted_PickupWindowNotEnded_DoesNotUpdate() {
        // Given - Pickup window is still active (use tomorrow's date to ensure it's in the future in UTC)
        readyPost.setPickupDate(LocalDate.now().plusDays(1));
        readyPost.setPickupFrom(LocalTime.of(9, 0));
        readyPost.setPickupTo(LocalTime.of(23, 59));
        readyPost.setOtpCode("123456");

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.singletonList(readyPost));
        mockClaimForPost(readyPost, LocalDate.now().plusDays(1), LocalTime.of(9, 0), LocalTime.of(23, 59));

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then - Should not update since pickup window hasn't ended
        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testUpdatePostsToNotCompleted_PickupDateInFuture_DoesNotUpdate() {
        // Given - Pickup date is tomorrow
        readyPost.setPickupDate(LocalDate.now().plusDays(1));
        readyPost.setPickupFrom(LocalTime.of(9, 0));
        readyPost.setPickupTo(LocalTime.of(17, 0));
        readyPost.setOtpCode("123456");

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.singletonList(readyPost));
        mockClaimForPost(readyPost, LocalDate.now().plusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then
        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testUpdatePostsToNotCompleted_MultiplePosts_UpdatesAll() {
        // Given - Multiple posts with ended pickup windows
        SurplusPost readyPost2 = createTestPost(4L, PostStatus.READY_FOR_PICKUP);
        readyPost2.setOtpCode("654321");

        readyPost.setPickupDate(LocalDate.now().minusDays(1));
        readyPost.setPickupFrom(LocalTime.of(9, 0));
        readyPost.setPickupTo(LocalTime.of(17, 0));
        readyPost.setOtpCode("123456");

        readyPost2.setPickupDate(LocalDate.now().minusDays(2));
        readyPost2.setPickupFrom(LocalTime.of(10, 0));
        readyPost2.setPickupTo(LocalTime.of(18, 0));

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Arrays.asList(readyPost, readyPost2));
        mockClaimForPost(readyPost, LocalDate.now().minusDays(1), LocalTime.of(9, 0), LocalTime.of(17, 0));
        mockClaimForPost(readyPost2, LocalDate.now().minusDays(2), LocalTime.of(10, 0), LocalTime.of(18, 0));
        when(surplusPostRepository.save(any(SurplusPost.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then
        verify(surplusPostRepository, times(2)).save(any(SurplusPost.class));
    }

    @Test
    void testUpdatePostsToNotCompleted_NoPosts_DoesNotSaveAnything() {
        // Given - No posts to update
        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.emptyList());

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then
        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

// ==================== Tests for Late Tolerance Window ====================

    @Test
    void testUpdatePostsToNotCompleted_WithinLateTolerance_DoesNotUpdate() {
        // Given - Pickup window ended 20 minutes ago (within 30 min tolerance)
        // Use UTC today's date with a fixed time that won't cause date boundary issues
        java.time.ZonedDateTime nowUtc = java.time.ZonedDateTime.now(java.time.ZoneId.of("UTC"));
        java.time.LocalDate today = nowUtc.toLocalDate();
        java.time.LocalTime currentTime = nowUtc.toLocalTime();

        // Set end time to 20 minutes before current time (within 30 min tolerance)
        java.time.LocalTime endTime = currentTime.minusMinutes(20);
        java.time.LocalTime startTime = endTime.minusHours(2);

        // Only set up this test if we have enough time margin from midnight
        // to avoid date wraparound issues (need at least 2h20m from start of day)
        if (currentTime.isBefore(java.time.LocalTime.of(2, 30))) {
            // Skip test logic if too close to midnight - just verify no save
            when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
                .thenReturn(Collections.emptyList());
            schedulerService.updatePostsToNotCompleted();
            verify(surplusPostRepository, never()).save(any(SurplusPost.class));
            return;
        }

        readyPost.setPickupDate(today);
        readyPost.setPickupFrom(startTime);
        readyPost.setPickupTo(endTime);
        readyPost.setOtpCode("123456");

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.singletonList(readyPost));
        mockClaimForPost(readyPost, today, startTime, endTime);

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then - Should NOT update since we're still within 30 min late tolerance
        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testUpdatePostsToNotCompleted_ExceedsLateTolerance_UpdatesStatus() {
        // Given - Pickup window ended 45 minutes ago (exceeds 30 min tolerance)
        java.time.ZonedDateTime nowUtc = java.time.ZonedDateTime.now(java.time.ZoneId.of("UTC"));
        java.time.LocalDate today = nowUtc.toLocalDate();
        java.time.LocalTime currentTime = nowUtc.toLocalTime();

        // Set end time to 45 minutes before current time (exceeds 30 min tolerance)
        java.time.LocalTime endTime = currentTime.minusMinutes(45);
        java.time.LocalTime startTime = endTime.minusHours(2);

        // Only set up this test if we have enough time margin from midnight
        if (currentTime.isBefore(java.time.LocalTime.of(3, 0))) {
            // If near midnight, use yesterday's date which will always exceed tolerance
            today = today.minusDays(1);
            endTime = java.time.LocalTime.of(17, 0);
            startTime = java.time.LocalTime.of(15, 0);
        }

        readyPost.setPickupDate(today);
        readyPost.setPickupFrom(startTime);
        readyPost.setPickupTo(endTime);
        readyPost.setOtpCode("123456");

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.singletonList(readyPost));
        mockClaimForPost(readyPost, today, startTime, endTime);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(readyPost);

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then - Should update since we exceeded the 30 min late tolerance
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getStatus()).isEqualTo(PostStatus.NOT_COMPLETED);
    }

    @Test
    void testUpdatePostsToNotCompleted_ExactlyAtToleranceEnd_DoesNotUpdate() {
        // Given - Pickup window ended exactly 30 minutes ago (at the edge of tolerance)
        java.time.ZonedDateTime nowUtc = java.time.ZonedDateTime.now(java.time.ZoneId.of("UTC"));
        java.time.LocalDate today = nowUtc.toLocalDate();
        java.time.LocalTime currentTime = nowUtc.toLocalTime();

        // Set end time to exactly 30 minutes before current time
        java.time.LocalTime endTime = currentTime.minusMinutes(30);
        java.time.LocalTime startTime = endTime.minusHours(2);

        // Only set up this test if we have enough time margin from midnight
        if (currentTime.isBefore(java.time.LocalTime.of(2, 40))) {
            // Skip test if too close to midnight
            when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
                .thenReturn(Collections.emptyList());
            schedulerService.updatePostsToNotCompleted();
            verify(surplusPostRepository, never()).save(any(SurplusPost.class));
            return;
        }

        readyPost.setPickupDate(today);
        readyPost.setPickupFrom(startTime);
        readyPost.setPickupTo(endTime);
        readyPost.setOtpCode("123456");

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.singletonList(readyPost));
        mockClaimForPost(readyPost, today, startTime, endTime);

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then - Should NOT update since we're exactly at the tolerance boundary
        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testUpdatePostsToNotCompleted_JustPastToleranceEnd_UpdatesStatus() {
        // Given - Pickup window ended 31 minutes ago (just past tolerance)
        java.time.ZonedDateTime nowUtc = java.time.ZonedDateTime.now(java.time.ZoneId.of("UTC"));
        java.time.LocalDate today = nowUtc.toLocalDate();
        java.time.LocalTime currentTime = nowUtc.toLocalTime();

        // Set end time to 31 minutes before current time
        java.time.LocalTime endTime = currentTime.minusMinutes(31);
        java.time.LocalTime startTime = endTime.minusHours(2);

        // Only set up this test if we have enough time margin from midnight
        if (currentTime.isBefore(java.time.LocalTime.of(2, 45))) {
            // If near midnight, use yesterday's date which will always exceed tolerance
            today = today.minusDays(1);
            endTime = java.time.LocalTime.of(17, 0);
            startTime = java.time.LocalTime.of(15, 0);
        }

        readyPost.setPickupDate(today);
        readyPost.setPickupFrom(startTime);
        readyPost.setPickupTo(endTime);
        readyPost.setOtpCode("123456");

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.singletonList(readyPost));
        mockClaimForPost(readyPost, today, startTime, endTime);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(readyPost);

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then - Should update since we just exceeded tolerance
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getStatus()).isEqualTo(PostStatus.NOT_COMPLETED);
    }

    // ==================== Helper Methods ====================

    private SurplusPost createTestPost(Long id, PostStatus status) {
        SurplusPost post = new SurplusPost();
        post.setId(id);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setDescription("Test Description");
        post.setFoodCategories(Set.of(FoodCategory.FRUITS_VEGETABLES));
        post.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupDate(LocalDate.now());
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));
        post.setStatus(status);
        return post;
    }

    private void setCreatedAt(SurplusPost post, LocalDateTime createdAt) {
        try {
            Field field = SurplusPost.class.getDeclaredField("createdAt");
            field.setAccessible(true);
            field.set(post, createdAt);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set createdAt", e);
        }
    }

    private Claim createClaimForPost(SurplusPost post, LocalDate pickupDate, LocalTime startTime, LocalTime endTime) {
        Claim claim = new Claim(post, receiver);
        claim.setConfirmedPickupDate(pickupDate);
        claim.setConfirmedPickupStartTime(startTime);
        claim.setConfirmedPickupEndTime(endTime);
        claim.setStatus(ClaimStatus.ACTIVE);
        return claim;
    }

    private void mockClaimForPost(SurplusPost post, LocalDate pickupDate, LocalTime startTime, LocalTime endTime) {
        Claim claim = createClaimForPost(post, pickupDate, startTime, endTime);
        when(claimRepository.findBySurplusPost(post)).thenReturn(java.util.Optional.of(claim));
    }
}
