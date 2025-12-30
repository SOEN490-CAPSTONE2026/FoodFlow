package com.example.foodflow.service;

import com.example.foodflow.model.dto.ClaimRequest;
import com.example.foodflow.model.dto.ClaimResponse;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.PickupSlot;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.Timer;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClaimService {
    private static final Logger logger = LoggerFactory.getLogger(ClaimService.class);
    
    private final ClaimRepository claimRepository;
    private final SurplusPostRepository surplusPostRepository;
    private final BusinessMetricsService businessMetricsService;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationPreferenceService notificationPreferenceService;
    
    public ClaimService(ClaimRepository claimRepository,
                       SurplusPostRepository surplusPostRepository,
                       BusinessMetricsService businessMetricsService,
                       SimpMessagingTemplate messagingTemplate,
                       NotificationPreferenceService notificationPreferenceService) {
        this.claimRepository = claimRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.businessMetricsService = businessMetricsService;
        this.messagingTemplate = messagingTemplate;
        this.notificationPreferenceService = notificationPreferenceService;
    }
                       
    @Transactional
    @Timed(value = "claim.service.create", description = "Time taken to create a claim")
    public ClaimResponse claimSurplusPost(ClaimRequest request, User receiver) {
        Timer.Sample sample = businessMetricsService.startTimer();
        // Fetch and lock the surplus post to prevent concurrent claims
        SurplusPost surplusPost = surplusPostRepository.findById(request.getSurplusPostId())
            .orElseThrow(() -> new RuntimeException("Surplus post not found"));

        if (surplusPost.getStatus() != PostStatus.AVAILABLE &&
            surplusPost.getStatus() != PostStatus.READY_FOR_PICKUP) {
            throw new RuntimeException("This post is no longer available for claiming");
        }

        // Check if already claimed (race condition prevention)
        if (claimRepository.existsBySurplusPostIdAndStatus(
                surplusPost.getId(), ClaimStatus.ACTIVE)) {
            throw new RuntimeException("This post has already been claimed");
        }

        // Prevent donor from claiming their own post
        if (surplusPost.getDonor().getId().equals(receiver.getId())) {
            throw new RuntimeException("You cannot claim your own surplus post");
        }

        // Create the claim
        Claim claim = new Claim(surplusPost, receiver);
        
        // Store the confirmed pickup slot that the receiver selected
        if (request.getPickupSlot() != null) {
            // Inline pickup slot data provided
            claim.setConfirmedPickupDate(request.getPickupSlot().getPickupDate());
            claim.setConfirmedPickupStartTime(request.getPickupSlot().getStartTime());
            claim.setConfirmedPickupEndTime(request.getPickupSlot().getEndTime());
        } else if (request.getPickupSlotId() != null) {
            // Reference to existing pickup slot - find it and copy the data
            PickupSlot selectedSlot = surplusPost.getPickupSlots().stream()
                .filter(slot -> slot.getId().equals(request.getPickupSlotId()))
                .findFirst()
                .orElse(null);
            
            if (selectedSlot != null) {
                claim.setConfirmedPickupDate(selectedSlot.getPickupDate());
                claim.setConfirmedPickupStartTime(selectedSlot.getStartTime());
                claim.setConfirmedPickupEndTime(selectedSlot.getEndTime());
            }
        }
        // If no slot provided, fallback to using the post's default pickup time
        if (claim.getConfirmedPickupDate() == null && surplusPost.getPickupDate() != null) {
            claim.setConfirmedPickupDate(surplusPost.getPickupDate());
            claim.setConfirmedPickupStartTime(surplusPost.getPickupFrom());
            claim.setConfirmedPickupEndTime(surplusPost.getPickupTo());
        }
        
        claim = claimRepository.save(claim);

        // Check if the CONFIRMED pickup time has already started (not the first slot!)
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDate today = now.toLocalDate();
        java.time.LocalTime currentTime = now.toLocalTime();

        boolean pickupTimeStarted = false;
        
        // Use the CONFIRMED pickup slot that receiver selected, not the first slot
        if (claim.getConfirmedPickupDate() != null && claim.getConfirmedPickupStartTime() != null) {
          if (claim.getConfirmedPickupDate().isBefore(today)) {
              pickupTimeStarted = true;
          } else if (claim.getConfirmedPickupDate().isEqual(today)) {
              pickupTimeStarted = !currentTime.isBefore(claim.getConfirmedPickupStartTime());
          }
        }
         
        // Update surplus post status
        if (pickupTimeStarted) {
            surplusPost.setStatus(PostStatus.READY_FOR_PICKUP);
            // Generate OTP code if pickup is ready
            if (surplusPost.getOtpCode() == null || surplusPost.getOtpCode().isEmpty()) {
                surplusPost.setOtpCode(generateOtpCode());
            }
        } else {
            surplusPost.setStatus(PostStatus.CLAIMED);
        }

        surplusPostRepository.save(surplusPost);

        businessMetricsService.incrementClaimCreated();
        businessMetricsService.incrementSurplusPostClaimed();
        businessMetricsService.recordTimer(sample, "claim.service.create", "status", claim.getStatus().toString());

        ClaimResponse response = new ClaimResponse(claim);
        
        // Broadcast websocket event to donor (if they have notifications enabled)
        User donor = surplusPost.getDonor();
        if (notificationPreferenceService.shouldSendNotification(donor, "donationClaimed", "websocket")) {
            try {
                messagingTemplate.convertAndSendToUser(
                    donor.getId().toString(),
                    "/queue/claims",
                    response
                );
                logger.info("Sent claim notification to donor userId={} for surplusPostId={} (type: donationClaimed)", 
                    donor.getId(), surplusPost.getId());
            } catch (Exception e) {
                logger.error("Failed to send websocket notification to donor: {}", e.getMessage());
            }
        } else {
            logger.info("Skipped claim notification to donor userId={} - notification type disabled", donor.getId());
        }
        
        // Broadcast websocket event to receiver
        try {
            messagingTemplate.convertAndSendToUser(
                receiver.getId().toString(),
                "/queue/claims",
                response
            );
            logger.info("Sent claim notification to receiver userId={} for surplusPostId={}", 
                receiver.getId(), surplusPost.getId());
        } catch (Exception e) {
            logger.error("Failed to send websocket notification to receiver: {}", e.getMessage());
        }

        return response;
    }


    private String generateOtpCode() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        int otp = 100000 + random.nextInt(900000); // 6-digit number
        return String.valueOf(otp);
    }
    
    @Transactional(readOnly = true)
    @Timed(value = "claim.service.getReceiverClaims", description = "Time taken to get receiver claims")
    public List<ClaimResponse> getReceiverClaims(User receiver) {
        return claimRepository.findReceiverClaimsWithDetails(
            receiver.getId(), ClaimStatus.ACTIVE)
            .stream()
            .map(ClaimResponse::new)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaimsForSurplusPost(Long surplusPostId) {
        return claimRepository.findBySurplusPostId(surplusPostId)
            .stream()
            .map(ClaimResponse::new)
            .collect(Collectors.toList());
    }
    
    @Transactional
    @Timed(value = "claim.service.cancel", description = "Time taken to cancel a claim")
    public void cancelClaim(Long claimId, User receiver) {
        Timer.Sample sample = businessMetricsService.startTimer();
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found"));
        
        // Verify receiver owns this claim
        if (!claim.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("You can only cancel your own claims");
        }
        
        // Cancel the claim
        claim.setStatus(ClaimStatus.CANCELLED);
        claimRepository.save(claim);
        
        // Make post available again
        SurplusPost post = claim.getSurplusPost();
        post.setStatus(PostStatus.AVAILABLE);
        surplusPostRepository.save(post);

        // Record metrics
        businessMetricsService.incrementClaimCancelled();
        businessMetricsService.recordTimer(sample, "claim.service.cancel", "status", "cancelled");
        
        // Notify donor that the claim was cancelled (if they have notifications enabled)
        User donor = post.getDonor();
        if (notificationPreferenceService.shouldSendNotification(donor, "claimCanceled", "websocket")) {
            try {
                messagingTemplate.convertAndSendToUser(
                    donor.getId().toString(),
                    "/queue/claims/cancelled",
                    new ClaimResponse(claim)
                );
                logger.info("Sent claim cancellation notification to donor userId={} for claimId={} (type: claimCanceled)", 
                    donor.getId(), claimId);
            } catch (Exception e) {
                logger.error("Failed to send claim cancellation notification: {}", e.getMessage());
            }
        } else {
            logger.info("Skipped claim cancellation notification to donor userId={} - claimCanceled disabled", 
                donor.getId());
        }
    }

    @Transactional
    @Timed(value = "claim.service.complete", description = "Time taken to complete a claim")
    public void completeClaim(Long claimId) {
        Timer.Sample sample = businessMetricsService.startTimer();

        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found"));

        claim.setStatus(ClaimStatus.COMPLETED);
        claimRepository.save(claim);

        // Increment completed claim counter
        businessMetricsService.incrementClaimCompleted();

        // Record timer
        businessMetricsService.recordTimer(sample, "claim.service.complete", "status", "completed");
    }
}
