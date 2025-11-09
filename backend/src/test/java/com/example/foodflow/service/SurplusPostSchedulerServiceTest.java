package com.example.foodflow.service;

import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
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

    @InjectMocks
    private SurplusPostSchedulerService schedulerService;

    private User donor;
    private SurplusPost availablePost;
    private SurplusPost claimedPost;
    private SurplusPost readyPost;

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

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.singletonList(claimedPost));
        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE))
            .thenReturn(Collections.emptyList());
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
    void testUpdatePostsToReadyForPickup_AvailablePostTransitionsToReady() {
        // Given - AVAILABLE post with pickup date in the past should transition to READY_FOR_PICKUP
        availablePost.setPickupDate(LocalDate.now().minusDays(1));
        availablePost.setPickupFrom(LocalTime.of(9, 0));
        availablePost.setPickupTo(LocalTime.of(17, 0));

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.emptyList());
        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE))
            .thenReturn(Collections.singletonList(availablePost));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(availablePost);

        // When
        schedulerService.updatePostsToReadyForPickup();

        // Then - AVAILABLE posts should also transition when pickup time arrives
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());

        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getStatus()).isEqualTo(PostStatus.READY_FOR_PICKUP);
        assertThat(savedPost.getOtpCode()).isNotNull();
    }

    @Test
    void testUpdatePostsToReadyForPickup_ClaimedPostPickupDateInPast_UpdatesStatus() {
        // Given - CLAIMED post with pickup date in the past
        claimedPost.setPickupDate(LocalDate.now().minusDays(1));
        claimedPost.setPickupFrom(LocalTime.of(9, 0));
        claimedPost.setPickupTo(LocalTime.of(17, 0));

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.singletonList(claimedPost));
        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE))
            .thenReturn(Collections.emptyList());
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
        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE))
            .thenReturn(Collections.emptyList());

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

        claimedPost2.setPickupDate(LocalDate.now().minusDays(1));
        claimedPost2.setPickupFrom(LocalTime.of(9, 0));
        claimedPost2.setPickupTo(LocalTime.of(17, 0));

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Arrays.asList(claimedPost, claimedPost2));
        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE))
            .thenReturn(Collections.emptyList());
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

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.singletonList(claimedPost));
        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE))
            .thenReturn(Collections.emptyList());
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

        when(surplusPostRepository.findByStatus(PostStatus.CLAIMED))
            .thenReturn(Collections.singletonList(claimedPost));
        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE))
            .thenReturn(Collections.emptyList());
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
        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE))
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
        // Given - Pickup window is still active (use fixed future time to avoid race conditions)
        readyPost.setPickupDate(LocalDate.now());
        readyPost.setPickupFrom(LocalTime.of(9, 0));
        readyPost.setPickupTo(LocalTime.of(23, 59)); // Definitely in the future
        readyPost.setOtpCode("123456");

        when(surplusPostRepository.findByStatus(PostStatus.READY_FOR_PICKUP))
            .thenReturn(Collections.singletonList(readyPost));

        // When
        schedulerService.updatePostsToNotCompleted();

        // Then - Should not update since pickup window hasn't ended
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository, atMost(0)).save(postCaptor.capture());
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
}
