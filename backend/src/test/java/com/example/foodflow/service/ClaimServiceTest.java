package com.example.foodflow.service;

import com.example.foodflow.model.dto.ClaimRequest;
import com.example.foodflow.model.dto.ClaimResponse;
import com.example.foodflow.model.dto.PickupSlotRequest;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.PickupSlot;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private BusinessMetricsService businessMetricsService;

    @Mock
    private NotificationPreferenceService notificationPreferenceService;

    @Mock
    private TimelineService timelineService;

    @Mock
    private EmailService emailService;

    @Mock
    private GamificationService gamificationService;

    @Mock
    private SmsService smsService;

    @InjectMocks
    private ClaimService claimService;

    private User donor;
    private User receiver;
    private SurplusPost surplusPost;
    private ClaimRequest claimRequest;

    @BeforeEach
    void setUp() {
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);

        receiver = new User();
        receiver.setId(2L);
        receiver.setEmail("receiver@test.com");
        receiver.setRole(UserRole.RECEIVER);

        surplusPost = new SurplusPost();
        surplusPost.setId(1L);
        surplusPost.setTitle("Test Food");
        surplusPost.setStatus(PostStatus.AVAILABLE);
        surplusPost.setDonor(donor);
        // Add required fields for pickup date/time
        surplusPost.setPickupDate(LocalDate.now().plusDays(1));
        surplusPost.setPickupFrom(LocalTime.of(9, 0));
        surplusPost.setPickupTo(LocalTime.of(17, 0));

        claimRequest = new ClaimRequest();
        claimRequest.setSurplusPostId(1L);

        // Mock notification preference service to allow all notifications by default
        // Use lenient() because not all tests use this mock
        lenient()
                .when(notificationPreferenceService.shouldSendNotification(any(User.class), any(String.class),
                        any(String.class)))
                .thenReturn(true);
    }

    @Test
    void claimSurplusPost_Success() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        ClaimResponse response = claimService.claimSurplusPost(claimRequest, receiver);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        verify(claimRepository).save(any(Claim.class));
        verify(surplusPostRepository).save(argThat(post -> post.getStatus() == PostStatus.CLAIMED));
    }

    @Test
    void claimSurplusPost_PostNotFound_ThrowsException() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> claimService.claimSurplusPost(claimRequest, receiver))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.resource.not_found");

        verify(claimRepository, never()).save(any());
    }

    @Test
    void claimSurplusPost_PostAlreadyClaimed_ThrowsException() {
        // Given
        surplusPost.setStatus(PostStatus.CLAIMED);
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));

        // When & Then
        assertThatThrownBy(() -> claimService.claimSurplusPost(claimRequest, receiver))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.claim.not_available");

        verify(claimRepository, never()).save(any());
    }

    @Test
    void claimSurplusPost_AlreadyHasActiveClaim_ThrowsException() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> claimService.claimSurplusPost(claimRequest, receiver))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.claim.already_claimed");

        verify(claimRepository, never()).save(any());
    }

    @Test
    void claimSurplusPost_DonorClaimingOwnPost_ThrowsException() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        // When & Then (donor trying to claim their own post)
        assertThatThrownBy(() -> claimService.claimSurplusPost(claimRequest, donor))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.claim.own_post");

        verify(claimRepository, never()).save(any());
    }

    @Test
    void getReceiverClaims_ReturnsListOfClaims() {
        // Given
        Claim claim1 = new Claim(surplusPost, receiver);
        claim1.setId(1L);
        Claim claim2 = new Claim(surplusPost, receiver);
        claim2.setId(2L);

        when(claimRepository.findReceiverClaimsWithDetails(
            eq(receiver.getId()),
            eq(List.of(
                ClaimStatus.ACTIVE,
                ClaimStatus.COMPLETED,
                ClaimStatus.NOT_COMPLETED,
                ClaimStatus.EXPIRED
            ))))
            .thenReturn(Arrays.asList(claim1, claim2));

        // When
        List<ClaimResponse> responses = claimService.getReceiverClaims(receiver);

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getId()).isEqualTo(1L);
        assertThat(responses.get(1).getId()).isEqualTo(2L);
    }

    @Test
    void getReceiverClaims_NoClaims_ReturnsEmptyList() {
        // Given
        when(claimRepository.findReceiverClaimsWithDetails(
            eq(receiver.getId()),
            eq(List.of(
                ClaimStatus.ACTIVE,
                ClaimStatus.COMPLETED,
                ClaimStatus.NOT_COMPLETED,
                ClaimStatus.EXPIRED
            ))))
            .thenReturn(Arrays.asList());

        // When
        List<ClaimResponse> responses = claimService.getReceiverClaims(receiver);

        // Then
        assertThat(responses).isEmpty();
    }

    @Test
    void getClaimsForSurplusPost_ReturnsClaims() {
        // Given
        Claim claim = new Claim(surplusPost, receiver);
        claim.setId(1L);

        when(claimRepository.findBySurplusPostId(1L))
                .thenReturn(Arrays.asList(claim));

        // When
        List<ClaimResponse> responses = claimService.getClaimsForSurplusPost(1L);

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(1L);
    }

    @Test
    void cancelClaim_Success() {
        // Given
        Claim claim = new Claim(surplusPost, receiver);
        claim.setId(1L);

        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
        when(claimRepository.save(any(Claim.class))).thenReturn(claim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        claimService.cancelClaim(1L, receiver);

        // Then
        verify(claimRepository).save(argThat(c -> c.getStatus() == ClaimStatus.CANCELLED));
        verify(surplusPostRepository).save(argThat(post -> post.getStatus() == PostStatus.AVAILABLE));
    }

    @Test
    void cancelClaim_ClaimNotFound_ThrowsException() {
        // Given
        when(claimRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> claimService.cancelClaim(1L, receiver))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.resource.not_found");

        verify(surplusPostRepository, never()).save(any());
    }

    @Test
    void cancelClaim_NotClaimOwner_ThrowsException() {
        // Given
        Claim claim = new Claim(surplusPost, receiver);
        claim.setId(1L);

        User otherReceiver = new User();
        otherReceiver.setId(3L);
        otherReceiver.setEmail("other@test.com");

        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));

        // When & Then
        assertThatThrownBy(() -> claimService.cancelClaim(1L, otherReceiver))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.claim.unauthorized_cancel");

        verify(claimRepository, never()).save(any());
        verify(surplusPostRepository, never()).save(any());
    }

    // ========== PICKUP SLOT TESTS ==========

    @Test
    void claimSurplusPost_WithInlinePickupSlot_StoresConfirmedPickupTime() {
        // Given
        LocalDate pickupDate = LocalDate.now().plusDays(2);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(12, 0);

        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        pickupSlot.setPickupDate(pickupDate);
        pickupSlot.setStartTime(startTime);
        pickupSlot.setEndTime(endTime);

        claimRequest.setPickupSlot(pickupSlot);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        ArgumentCaptor<Claim> claimCaptor = ArgumentCaptor.forClass(Claim.class);
        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        savedClaim.setConfirmedPickupDate(pickupDate);
        savedClaim.setConfirmedPickupStartTime(startTime);
        savedClaim.setConfirmedPickupEndTime(endTime);
        when(claimRepository.save(claimCaptor.capture())).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        ClaimResponse response = claimService.claimSurplusPost(claimRequest, receiver);

        // Then
        assertThat(response).isNotNull();
        Claim capturedClaim = claimCaptor.getValue();
        assertThat(capturedClaim.getConfirmedPickupDate()).isEqualTo(pickupDate);
        assertThat(capturedClaim.getConfirmedPickupStartTime()).isEqualTo(startTime);
        assertThat(capturedClaim.getConfirmedPickupEndTime()).isEqualTo(endTime);
    }

    @Test
    void claimSurplusPost_WithPickupSlotId_StoresConfirmedPickupTime() {
        // Given
        LocalDate pickupDate = LocalDate.now().plusDays(2);
        LocalTime startTime = LocalTime.of(14, 0);
        LocalTime endTime = LocalTime.of(16, 0);

        PickupSlot existingSlot = new PickupSlot();
        existingSlot.setId(100L);
        existingSlot.setPickupDate(pickupDate);
        existingSlot.setStartTime(startTime);
        existingSlot.setEndTime(endTime);
        existingSlot.setSurplusPost(surplusPost);

        List<PickupSlot> pickupSlots = new ArrayList<>();
        pickupSlots.add(existingSlot);
        surplusPost.setPickupSlots(pickupSlots);

        claimRequest.setPickupSlotId(100L);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        ArgumentCaptor<Claim> claimCaptor = ArgumentCaptor.forClass(Claim.class);
        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        savedClaim.setConfirmedPickupDate(pickupDate);
        savedClaim.setConfirmedPickupStartTime(startTime);
        savedClaim.setConfirmedPickupEndTime(endTime);
        when(claimRepository.save(claimCaptor.capture())).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        ClaimResponse response = claimService.claimSurplusPost(claimRequest, receiver);

        // Then
        assertThat(response).isNotNull();
        Claim capturedClaim = claimCaptor.getValue();
        assertThat(capturedClaim.getConfirmedPickupDate()).isEqualTo(pickupDate);
        assertThat(capturedClaim.getConfirmedPickupStartTime()).isEqualTo(startTime);
        assertThat(capturedClaim.getConfirmedPickupEndTime()).isEqualTo(endTime);
    }

    @Test
    void claimSurplusPost_WithInvalidPickupSlotId_DoesNotSetConfirmedTime() {
        // Given
        PickupSlot existingSlot = new PickupSlot();
        existingSlot.setId(100L);
        existingSlot.setPickupDate(LocalDate.now().plusDays(2));
        existingSlot.setStartTime(LocalTime.of(14, 0));
        existingSlot.setEndTime(LocalTime.of(16, 0));

        List<PickupSlot> pickupSlots = new ArrayList<>();
        pickupSlots.add(existingSlot);
        surplusPost.setPickupSlots(pickupSlots);

        // Request a non-existent slot ID
        claimRequest.setPickupSlotId(999L);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        ArgumentCaptor<Claim> claimCaptor = ArgumentCaptor.forClass(Claim.class);
        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        // Fallback to post's default times
        savedClaim.setConfirmedPickupDate(surplusPost.getPickupDate());
        savedClaim.setConfirmedPickupStartTime(surplusPost.getPickupFrom());
        savedClaim.setConfirmedPickupEndTime(surplusPost.getPickupTo());
        when(claimRepository.save(claimCaptor.capture())).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        ClaimResponse response = claimService.claimSurplusPost(claimRequest, receiver);

        // Then - should fallback to post's default times
        assertThat(response).isNotNull();
        Claim capturedClaim = claimCaptor.getValue();
        assertThat(capturedClaim.getConfirmedPickupDate()).isEqualTo(surplusPost.getPickupDate());
        assertThat(capturedClaim.getConfirmedPickupStartTime()).isEqualTo(surplusPost.getPickupFrom());
        assertThat(capturedClaim.getConfirmedPickupEndTime()).isEqualTo(surplusPost.getPickupTo());
    }

    @Test
    void claimSurplusPost_WithoutPickupSlot_UsesFallbackTimes() {
        // Given - no pickup slot provided in request
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        ArgumentCaptor<Claim> claimCaptor = ArgumentCaptor.forClass(Claim.class);
        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        savedClaim.setConfirmedPickupDate(surplusPost.getPickupDate());
        savedClaim.setConfirmedPickupStartTime(surplusPost.getPickupFrom());
        savedClaim.setConfirmedPickupEndTime(surplusPost.getPickupTo());
        when(claimRepository.save(claimCaptor.capture())).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        ClaimResponse response = claimService.claimSurplusPost(claimRequest, receiver);

        // Then - should use post's default pickup times
        assertThat(response).isNotNull();
        Claim capturedClaim = claimCaptor.getValue();
        assertThat(capturedClaim.getConfirmedPickupDate()).isEqualTo(surplusPost.getPickupDate());
        assertThat(capturedClaim.getConfirmedPickupStartTime()).isEqualTo(surplusPost.getPickupFrom());
        assertThat(capturedClaim.getConfirmedPickupEndTime()).isEqualTo(surplusPost.getPickupTo());
    }

    @Test
    void claimSurplusPost_WithPickupSlot_SetsStatusToClaimedWhenFuture() {
        // Given - pickup date is in the future
        LocalDate futureDate = LocalDate.now().plusDays(3);
        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        pickupSlot.setPickupDate(futureDate);
        pickupSlot.setStartTime(LocalTime.of(10, 0));
        pickupSlot.setEndTime(LocalTime.of(12, 0));

        claimRequest.setPickupSlot(pickupSlot);
        surplusPost.setPickupDate(futureDate);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        claimService.claimSurplusPost(claimRequest, receiver);

        // Then - status should be CLAIMED (not READY_FOR_PICKUP)
        verify(surplusPostRepository).save(argThat(post -> post.getStatus() == PostStatus.CLAIMED));
    }

    @Test
    void claimSurplusPost_WithPickupSlotInPast_SetsStatusToReadyForPickup() {
        // Given - pickup date is in the past
        LocalDate pastDate = LocalDate.now().minusDays(1);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(12, 0);

        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        pickupSlot.setPickupDate(pastDate);
        pickupSlot.setStartTime(startTime);
        pickupSlot.setEndTime(endTime);

        claimRequest.setPickupSlot(pickupSlot);
        surplusPost.setPickupDate(pastDate);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        // Mock needs to return a claim with confirmed pickup dates set!
        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        savedClaim.setConfirmedPickupDate(pastDate);
        savedClaim.setConfirmedPickupStartTime(startTime);
        savedClaim.setConfirmedPickupEndTime(endTime);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        claimService.claimSurplusPost(claimRequest, receiver);

        // Then - status should be READY_FOR_PICKUP and OTP code generated
        verify(surplusPostRepository).save(argThat(post -> post.getStatus() == PostStatus.READY_FOR_PICKUP &&
                post.getOtpCode() != null &&
                !post.getOtpCode().isEmpty()));
    }

    @Test
    void claimSurplusPost_WithPickupSlotToday_ChecksCurrentTime() {
        // Given - pickup is tomorrow (future date means it stays CLAIMED)
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalTime pickupStart = LocalTime.of(10, 0);
        LocalTime pickupEnd = LocalTime.of(12, 0);

        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        pickupSlot.setPickupDate(tomorrow);
        pickupSlot.setStartTime(pickupStart);
        pickupSlot.setEndTime(pickupEnd);

        claimRequest.setPickupSlot(pickupSlot);
        surplusPost.setPickupDate(tomorrow);
        surplusPost.setPickupFrom(pickupStart);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        when(surplusPostRepository.save(postCaptor.capture())).thenReturn(surplusPost);

        // When
        claimService.claimSurplusPost(claimRequest, receiver);

        // Then - status should be CLAIMED since pickup date is in the future
        SurplusPost savedPost = postCaptor.getValue();
        assertThat(savedPost.getStatus()).isEqualTo(PostStatus.CLAIMED);
    }

    // Notification Tests

    @Test
    void claimSurplusPost_WithEmailNotificationsEnabled_SendsEmailToDonor() {
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("email")))
                .thenReturn(true);
        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("websocket")))
                .thenReturn(true);

        claimService.claimSurplusPost(claimRequest, receiver);

        verify(notificationPreferenceService).shouldSendNotification(eq(donor), eq("donationClaimed"), eq("email"));
        verify(notificationPreferenceService).shouldSendNotification(eq(donor), eq("donationClaimed"), eq("websocket"));
    }

    @Test
    void claimSurplusPost_WithEmailNotificationsDisabled_DoesNotSendEmail() {
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("email")))
                .thenReturn(false);
        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("websocket")))
                .thenReturn(true);

        claimService.claimSurplusPost(claimRequest, receiver);

        verify(notificationPreferenceService).shouldSendNotification(eq(donor), eq("donationClaimed"), eq("email"));
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/claims"), any());
        verify(messagingTemplate).convertAndSendToUser(eq("2"), eq("/queue/claims"), any());
    }

    @Test
    void claimSurplusPost_WithWebSocketNotificationsDisabled_DoesNotSendWebSocket() {
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("websocket")))
                .thenReturn(false);
        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("email")))
                .thenReturn(true);

        claimService.claimSurplusPost(claimRequest, receiver);

        verify(notificationPreferenceService).shouldSendNotification(eq(donor), eq("donationClaimed"), eq("websocket"));
        // Should still send to receiver (notification always sent to claim creator)
        verify(messagingTemplate).convertAndSendToUser(eq("2"), eq("/queue/claims"), any());
    }

    @Test
    void claimSurplusPost_WithAllNotificationsDisabled_DoesNotSendToDonor() {
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), anyString()))
                .thenReturn(false);

        claimService.claimSurplusPost(claimRequest, receiver);

        verify(notificationPreferenceService, times(3)).shouldSendNotification(eq(donor), eq("donationClaimed"), anyString());
        // Should still send to receiver
        verify(messagingTemplate).convertAndSendToUser(eq("2"), eq("/queue/claims"), any());
    }

    @Test
    void cancelClaim_WithEmailNotificationsEnabled_SendsEmailToDonor() {
        Claim activeClaim = new Claim(surplusPost, receiver);
        activeClaim.setId(1L);
        activeClaim.setStatus(ClaimStatus.ACTIVE);

        when(claimRepository.findById(1L)).thenReturn(Optional.of(activeClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(activeClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("email")))
                .thenReturn(true);
        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("websocket")))
                .thenReturn(true);

        claimService.cancelClaim(1L, receiver);

        verify(notificationPreferenceService).shouldSendNotification(eq(donor), eq("claimCanceled"), eq("email"));
        verify(notificationPreferenceService).shouldSendNotification(eq(donor), eq("claimCanceled"), eq("websocket"));
    }

    @Test
    void cancelClaim_WithEmailNotificationsDisabled_DoesNotSendEmail() {
        Claim activeClaim = new Claim(surplusPost, receiver);
        activeClaim.setId(1L);
        activeClaim.setStatus(ClaimStatus.ACTIVE);

        when(claimRepository.findById(1L)).thenReturn(Optional.of(activeClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(activeClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("email")))
                .thenReturn(false);
        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("websocket")))
                .thenReturn(true);

        claimService.cancelClaim(1L, receiver);

        verify(notificationPreferenceService).shouldSendNotification(eq(donor), eq("claimCanceled"), eq("email"));
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/claims/cancelled"), any());
    }

    @Test
    void cancelClaim_WithWebSocketNotificationsDisabled_DoesNotSendWebSocket() {
        Claim activeClaim = new Claim(surplusPost, receiver);
        activeClaim.setId(1L);
        activeClaim.setStatus(ClaimStatus.ACTIVE);

        when(claimRepository.findById(1L)).thenReturn(Optional.of(activeClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(activeClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("websocket")))
                .thenReturn(false);
        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("email")))
                .thenReturn(true);

        claimService.cancelClaim(1L, receiver);

        verify(notificationPreferenceService).shouldSendNotification(eq(donor), eq("claimCanceled"), eq("websocket"));
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), eq("/queue/claims/cancelled"), any());
    }

    @Test
    void cancelClaim_WithAllNotificationsDisabled_DoesNotSendToDonor() {
        Claim activeClaim = new Claim(surplusPost, receiver);
        activeClaim.setId(1L);
        activeClaim.setStatus(ClaimStatus.ACTIVE);

        when(claimRepository.findById(1L)).thenReturn(Optional.of(activeClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(activeClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), anyString()))
                .thenReturn(false);

        claimService.cancelClaim(1L, receiver);

        verify(notificationPreferenceService, times(3)).shouldSendNotification(eq(donor), eq("claimCanceled"), anyString());
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), eq("/queue/claims/cancelled"), any());
    }

    @Test
    void claimSurplusPost_VerifiesCorrectNotificationChannelsChecked() {
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(any(User.class), anyString(), anyString()))
                .thenReturn(true);

        claimService.claimSurplusPost(claimRequest, receiver);

        // Verify both websocket and email channels are checked for donor
        verify(notificationPreferenceService).shouldSendNotification(donor, "donationClaimed", "websocket");
        verify(notificationPreferenceService).shouldSendNotification(donor, "donationClaimed", "email");
    }

    @Test
    void claimSurplusPost_SendsSmsWhenEnabledAndPhoneValid() {
        donor.setPhone("+12345678901");
        
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("sms")))
                .thenReturn(true);

        claimService.claimSurplusPost(claimRequest, receiver);

        verify(smsService).sendDonationClaimedNotification(anyString(), anyString(), any());
    }

    @Test
    void claimSurplusPost_DoesNotSendSmsWhenPhoneInvalid() {
        donor.setPhone("invalid-phone");
        
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("sms")))
                .thenReturn(true);

        claimService.claimSurplusPost(claimRequest, receiver);

        verify(smsService, never()).sendDonationClaimedNotification(anyString(), anyString(), any());
    }

    @Test
    void cancelClaim_SendsSmsWhenEnabledAndPhoneValid() {
        donor.setPhone("+19876543210");
        
        Claim activeClaim = new Claim(surplusPost, receiver);
        activeClaim.setId(1L);
        activeClaim.setStatus(ClaimStatus.ACTIVE);

        when(claimRepository.findById(1L)).thenReturn(Optional.of(activeClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(activeClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("sms")))
                .thenReturn(true);

        claimService.cancelClaim(1L, receiver);

        verify(smsService).sendClaimCanceledNotification(anyString(), anyString(), any());
    }

    @Test
    void cancelClaim_DoesNotSendSmsWhenPhoneMissing() {
        donor.setPhone(null);
        
        Claim activeClaim = new Claim(surplusPost, receiver);
        activeClaim.setId(1L);
        activeClaim.setStatus(ClaimStatus.ACTIVE);

        when(claimRepository.findById(1L)).thenReturn(Optional.of(activeClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(activeClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("sms")))
                .thenReturn(true);

        claimService.cancelClaim(1L, receiver);

        verify(smsService, never()).sendClaimCanceledNotification(anyString(), anyString(), any());
    }

    @Test
    void claimSurplusPost_SendsEmailWithDonorNameWhenNoOrganization() {
        // Ensure donor has no organization
        donor.setOrganization(null);
        
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("email")))
                .thenReturn(true);

        claimService.claimSurplusPost(claimRequest, receiver);

        verify(emailService).sendDonationClaimedNotification(eq("donor@test.com"), eq("Donor"), any());
    }

    @Test
    void cancelClaim_SendsEmailWithDonorNameWhenNoOrganization() {
        // Ensure donor has no organization
        donor.setOrganization(null);
        
        Claim activeClaim = new Claim(surplusPost, receiver);
        activeClaim.setId(1L);
        activeClaim.setStatus(ClaimStatus.ACTIVE);

        when(claimRepository.findById(1L)).thenReturn(Optional.of(activeClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(activeClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("email")))
                .thenReturn(true);

        claimService.cancelClaim(1L, receiver);

        verify(emailService).sendClaimCanceledNotification(eq("donor@test.com"), eq("Donor"), any());
    }

    @Test
    void claimSurplusPost_DoesNotSendSmsWhenPhoneEmpty() {
        donor.setPhone("   ");  // Empty/whitespace phone
        
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("donationClaimed"), eq("sms")))
                .thenReturn(true);

        claimService.claimSurplusPost(claimRequest, receiver);

        verify(smsService, never()).sendDonationClaimedNotification(anyString(), anyString(), any());
    }

    @Test
    void cancelClaim_DoesNotSendSmsWhenPhoneEmpty() {
        donor.setPhone("");  // Empty string phone
        
        Claim activeClaim = new Claim(surplusPost, receiver);
        activeClaim.setId(1L);
        activeClaim.setStatus(ClaimStatus.ACTIVE);

        when(claimRepository.findById(1L)).thenReturn(Optional.of(activeClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(activeClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        when(notificationPreferenceService.shouldSendNotification(eq(donor), eq("claimCanceled"), eq("sms")))
                .thenReturn(true);

        claimService.cancelClaim(1L, receiver);

        verify(smsService, never()).sendClaimCanceledNotification(anyString(), anyString(), any());
    }

    @Test
    void claimSurplusPost_UsesReceiverOrganizationNameInTimeline() {
        // Set up receiver with organization
        com.example.foodflow.model.entity.Organization receiverOrg = new com.example.foodflow.model.entity.Organization();
        receiverOrg.setId(10L);
        receiverOrg.setName("Test Food Bank");
        receiver.setOrganization(receiverOrg);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        claimService.claimSurplusPost(claimRequest, receiver);

        // Verify timeline event was created with organization name
        verify(timelineService).createTimelineEvent(
                eq(surplusPost),
                eq("DONATION_CLAIMED"),
                eq("receiver"),
                eq(receiver.getId()),
                eq(PostStatus.AVAILABLE),
                any(PostStatus.class),
                eq("Claimed by Test Food Bank"),
                eq(true)
        );
    }

    @Test
    void claimSurplusPost_UsesReceiverEmailInTimelineWhenNoOrganization() {
        // Ensure receiver has no organization (default in setUp)
        receiver.setOrganization(null);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        claimService.claimSurplusPost(claimRequest, receiver);

        // Verify timeline event was created with email as fallback
        verify(timelineService).createTimelineEvent(
                eq(surplusPost),
                eq("DONATION_CLAIMED"),
                eq("receiver"),
                eq(receiver.getId()),
                eq(PostStatus.AVAILABLE),
                any(PostStatus.class),
                eq("Claimed by receiver@test.com"),
                eq(true)
        );
    }

    @Test
    void claimSurplusPost_WithExistingOtpCode_DoesNotRegenerateCode() {
        // Given - post already has OTP code and pickup time has started
        LocalDate pastDate = LocalDate.now().minusDays(1);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(12, 0);

        surplusPost.setOtpCode("EXISTING123");
        surplusPost.setPickupDate(pastDate);

        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        pickupSlot.setPickupDate(pastDate);
        pickupSlot.setStartTime(startTime);
        pickupSlot.setEndTime(endTime);
        claimRequest.setPickupSlot(pickupSlot);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        savedClaim.setConfirmedPickupDate(pastDate);
        savedClaim.setConfirmedPickupStartTime(startTime);
        savedClaim.setConfirmedPickupEndTime(endTime);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        claimService.claimSurplusPost(claimRequest, receiver);

        // Verify OTP code wasn't changed
        verify(surplusPostRepository).save(argThat(post -> 
                "EXISTING123".equals(post.getOtpCode()) && 
                post.getStatus() == PostStatus.READY_FOR_PICKUP
        ));
    }

    @Test
    void claimSurplusPost_WithInvalidSlotTimes_LogsWarning() {
        // Given - slot with end time before start time (suspicious timezone issue)
        LocalDate pickupDate = LocalDate.now().plusDays(2);
        LocalTime startTime = LocalTime.of(16, 0);  // 4 PM
        LocalTime endTime = LocalTime.of(14, 0);    // 2 PM (before start!)

        PickupSlot suspiciousSlot = new PickupSlot();
        suspiciousSlot.setId(200L);
        suspiciousSlot.setPickupDate(pickupDate);
        suspiciousSlot.setStartTime(startTime);
        suspiciousSlot.setEndTime(endTime);
        suspiciousSlot.setSurplusPost(surplusPost);

        List<PickupSlot> pickupSlots = new ArrayList<>();
        pickupSlots.add(suspiciousSlot);
        surplusPost.setPickupSlots(pickupSlots);

        claimRequest.setPickupSlotId(200L);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);

        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        savedClaim.setConfirmedPickupDate(pickupDate);
        savedClaim.setConfirmedPickupStartTime(startTime);
        savedClaim.setConfirmedPickupEndTime(endTime);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        ClaimResponse response = claimService.claimSurplusPost(claimRequest, receiver);

        // Then - claim should still be created despite suspicious times
        assertThat(response).isNotNull();
        verify(claimRepository).save(any(Claim.class));
    }
}
