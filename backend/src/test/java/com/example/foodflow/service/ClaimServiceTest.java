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
        verify(surplusPostRepository).save(argThat(post -> 
            post.getStatus() == PostStatus.CLAIMED
        ));
    }

    @Test
    void claimSurplusPost_PostNotFound_ThrowsException() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> claimService.claimSurplusPost(claimRequest, receiver))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Surplus post not found");
        
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
            .hasMessageContaining("no longer available");
        
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
            .hasMessageContaining("already been claimed");
        
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
            .hasMessageContaining("cannot claim your own");
        
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
            eq(receiver.getId()), eq(ClaimStatus.ACTIVE)))
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
            eq(receiver.getId()), eq(ClaimStatus.ACTIVE)))
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
        verify(claimRepository).save(argThat(c -> 
            c.getStatus() == ClaimStatus.CANCELLED
        ));
        verify(surplusPostRepository).save(argThat(post -> 
            post.getStatus() == PostStatus.AVAILABLE
        ));
    }

    @Test
    void cancelClaim_ClaimNotFound_ThrowsException() {
        // Given
        when(claimRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> claimService.cancelClaim(1L, receiver))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Claim not found");
        
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
            .hasMessageContaining("only cancel your own claims");
        
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
        verify(surplusPostRepository).save(argThat(post -> 
            post.getStatus() == PostStatus.CLAIMED
        ));
    }

    @Test
    void claimSurplusPost_WithPickupSlotInPast_SetsStatusToReadyForPickup() {
        // Given - pickup date is in the past
        LocalDate pastDate = LocalDate.now().minusDays(1);
        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        pickupSlot.setPickupDate(pastDate);
        pickupSlot.setStartTime(LocalTime.of(10, 0));
        pickupSlot.setEndTime(LocalTime.of(12, 0));
        
        claimRequest.setPickupSlot(pickupSlot);
        surplusPost.setPickupDate(pastDate);
        
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);
        
        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        claimService.claimSurplusPost(claimRequest, receiver);

        // Then - status should be READY_FOR_PICKUP and OTP code generated
        verify(surplusPostRepository).save(argThat(post -> 
            post.getStatus() == PostStatus.READY_FOR_PICKUP && 
            post.getOtpCode() != null && 
            !post.getOtpCode().isEmpty()
        ));
    }

    @Test
    void claimSurplusPost_WithPickupSlotToday_ChecksCurrentTime() {
        // Given - pickup is today but hasn't started yet
        LocalDate today = LocalDate.now();
        LocalTime futureTime = LocalTime.now().plusHours(2);
        
        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        pickupSlot.setPickupDate(today);
        pickupSlot.setStartTime(futureTime);
        pickupSlot.setEndTime(futureTime.plusHours(2));
        
        claimRequest.setPickupSlot(pickupSlot);
        surplusPost.setPickupDate(today);
        surplusPost.setPickupFrom(futureTime);
        
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(claimRepository.existsBySurplusPostIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(false);
        
        Claim savedClaim = new Claim(surplusPost, receiver);
        savedClaim.setId(1L);
        when(claimRepository.save(any(Claim.class))).thenReturn(savedClaim);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(surplusPost);

        // When
        claimService.claimSurplusPost(claimRequest, receiver);

        // Then - status should be CLAIMED since pickup hasn't started
        verify(surplusPostRepository).save(argThat(post -> 
            post.getStatus() == PostStatus.CLAIMED
        ));
    }
}
