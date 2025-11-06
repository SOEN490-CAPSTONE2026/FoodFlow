package com.example.foodflow.service;

import com.example.foodflow.model.dto.ClaimRequest;
import com.example.foodflow.model.dto.ClaimResponse;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClaimService {
    
    private final ClaimRepository claimRepository;
    private final SurplusPostRepository surplusPostRepository;
    private final BusinessMetricsService businessMetricsService;
    
    public ClaimService(ClaimRepository claimRepository,
                       SurplusPostRepository surplusPostRepository,
                       BusinessMetricsService businessMetricsService) {
        this.claimRepository = claimRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.businessMetricsService = businessMetricsService;
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

        businessMetricsService.incrementClaimCreated();
        businessMetricsService.incrementSurplusPostClaimed();
        businessMetricsService.recordTimer(sample, "claim.service.create", "status", claim.getStatus().toString());

        return new ClaimResponse(claim);
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
