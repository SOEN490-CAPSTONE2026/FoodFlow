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
    private final SimpMessagingTemplate messagingTemplate;
    
    public ClaimService(ClaimRepository claimRepository,
                       SurplusPostRepository surplusPostRepository,
                       SimpMessagingTemplate messagingTemplate) {
        this.claimRepository = claimRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.messagingTemplate = messagingTemplate;
    }
    
    @Transactional
    public ClaimResponse claimSurplusPost(ClaimRequest request, User receiver) {
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

        // Check if pickup time has already started
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDate today = now.toLocalDate();
        java.time.LocalTime currentTime = now.toLocalTime();

        boolean pickupTimeStarted = false;

        if (surplusPost.getPickupDate().isBefore(today)) {
            pickupTimeStarted = true;
        } else if (surplusPost.getPickupDate().isEqual(today)) {
            pickupTimeStarted = !currentTime.isBefore(surplusPost.getPickupFrom());
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

        ClaimResponse response = new ClaimResponse(claim);
        
        // Broadcast websocket event to donor
        try {
            messagingTemplate.convertAndSendToUser(
                surplusPost.getDonor().getId().toString(),
                "/queue/claims",
                response
            );
            logger.info("Sent claim notification to donor userId={} for surplusPostId={}", 
                surplusPost.getDonor().getId(), surplusPost.getId());
        } catch (Exception e) {
            logger.error("Failed to send websocket notification to donor: {}", e.getMessage());
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
    public void cancelClaim(Long claimId, User receiver) {
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
        
        // Notify donor that the claim was cancelled
        try {
            messagingTemplate.convertAndSendToUser(
                post.getDonor().getId().toString(),
                "/queue/claims/cancelled",
                new ClaimResponse(claim)
            );
            logger.info("Sent claim cancellation notification to donor userId={} for claimId={}", 
                post.getDonor().getId(), claimId);
        } catch (Exception e) {
            logger.error("Failed to send websocket notification for claim cancellation: {}", e.getMessage());
        }
    }
}
