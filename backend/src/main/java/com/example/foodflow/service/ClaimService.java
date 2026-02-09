package com.example.foodflow.service;

import com.example.foodflow.exception.BusinessException;
import com.example.foodflow.exception.ResourceNotFoundException;
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
import com.example.foodflow.util.TimezoneResolver;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.Timer;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
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
    private final TimelineService timelineService;
    private final EmailService emailService;
    private final GamificationService gamificationService;
    
    public ClaimService(ClaimRepository claimRepository,
                       SurplusPostRepository surplusPostRepository,
                       BusinessMetricsService businessMetricsService,
                       SimpMessagingTemplate messagingTemplate,
                       NotificationPreferenceService notificationPreferenceService,
                       TimelineService timelineService,
                       EmailService emailService,
                       GamificationService gamificationService) {
        this.claimRepository = claimRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.businessMetricsService = businessMetricsService;
        this.messagingTemplate = messagingTemplate;
        this.notificationPreferenceService = notificationPreferenceService;
        this.timelineService = timelineService;
        this.emailService = emailService;
        this.gamificationService = gamificationService;
    }
                       
    @Transactional
    @Timed(value = "claim.service.create", description = "Time taken to create a claim")
    public ClaimResponse claimSurplusPost(ClaimRequest request, User receiver) {
        Timer.Sample sample = businessMetricsService.startTimer();
        // Fetch and lock the surplus post to prevent concurrent claims
        SurplusPost surplusPost = surplusPostRepository.findById(request.getSurplusPostId())
            .orElseThrow(() -> new ResourceNotFoundException("error.resource.not_found"));

        // Check if post has expired
        if (surplusPost.getExpiryDate() != null &&
            surplusPost.getExpiryDate().isBefore(java.time.LocalDate.now())) {
            throw new RuntimeException("This donation has expired and cannot be claimed");
        }

        // Check if post status is EXPIRED
        if (surplusPost.getStatus() == PostStatus.EXPIRED) {
            throw new RuntimeException("This donation has expired and cannot be claimed");
        }

        if (surplusPost.getStatus() != PostStatus.AVAILABLE &&
            surplusPost.getStatus() != PostStatus.READY_FOR_PICKUP) {
            throw new BusinessException("error.claim.not_available");
        }

        // Check if already claimed (race condition prevention)
        if (claimRepository.existsBySurplusPostIdAndStatus(
                surplusPost.getId(), ClaimStatus.ACTIVE)) {
            throw new BusinessException("error.claim.already_claimed");
        }

        // Prevent donor from claiming their own post
        if (surplusPost.getDonor().getId().equals(receiver.getId())) {
            throw new BusinessException("error.claim.own_post");
        }

        // Create the claim
        Claim claim = new Claim(surplusPost, receiver);
        
        // Get receiver's timezone for conversion (default to UTC if not set)
        String receiverTimezone = receiver.getTimezone() != null ? receiver.getTimezone() : "UTC";
        // Get donor's timezone for verification
        String donorTimezone = surplusPost.getDonor().getTimezone() != null ? surplusPost.getDonor().getTimezone() : "UTC";
        
        logger.info("=== CLAIM CREATION DEBUG ===");
        logger.info("Post ID: {}, Receiver: {}, ReceiverTZ: {}, DonorTZ: {}", 
            surplusPost.getId(), receiver.getEmail(), receiverTimezone, donorTimezone);
        logger.info("Request has pickupSlot: {}, pickupSlotId: {}", 
            request.getPickupSlot() != null, request.getPickupSlotId());
        
        // Store the confirmed pickup slot that the receiver selected
        // CRITICAL: ALL times MUST be converted to UTC for storage to work with the scheduler
        if (request.getPickupSlot() != null) {
            // SCENARIO 1: Inline pickup slot data provided (times in receiver's timezone)
            logger.info("SCENARIO 1: Inline slot data - Converting from receiver TZ ({}) to UTC", receiverTimezone);
            logger.info("Received times - Date: {}, Start: {}, End: {}", 
                request.getPickupSlot().getPickupDate(), 
                request.getPickupSlot().getStartTime(), 
                request.getPickupSlot().getEndTime());
            
            LocalDateTime startTimeUTC = TimezoneResolver.convertDateTime(
                request.getPickupSlot().getPickupDate(),
                request.getPickupSlot().getStartTime(),
                receiverTimezone,
                "UTC"
            );
            LocalDateTime endTimeUTC = TimezoneResolver.convertDateTime(
                request.getPickupSlot().getPickupDate(),
                request.getPickupSlot().getEndTime(),
                receiverTimezone,
                "UTC"
            );
            
            claim.setConfirmedPickupDate(startTimeUTC != null ? startTimeUTC.toLocalDate() : request.getPickupSlot().getPickupDate());
            claim.setConfirmedPickupStartTime(startTimeUTC != null ? startTimeUTC.toLocalTime() : request.getPickupSlot().getStartTime());
            claim.setConfirmedPickupEndTime(endTimeUTC != null ? endTimeUTC.toLocalTime() : request.getPickupSlot().getEndTime());
            
            logger.info("✓ Stored in UTC - Date: {}, Start: {}, End: {}", 
                claim.getConfirmedPickupDate(), claim.getConfirmedPickupStartTime(), claim.getConfirmedPickupEndTime());
                
        } else if (request.getPickupSlotId() != null) {
            // SCENARIO 2: Reference to existing pickup slot by ID
            // These times SHOULD already be in UTC from when the donor created the post
            // BUT we need to verify this and handle edge cases
            logger.info("SCENARIO 2: Slot ID reference - Looking up slot ID {}", request.getPickupSlotId());
            
            PickupSlot selectedSlot = surplusPost.getPickupSlots().stream()
                .filter(slot -> slot.getId().equals(request.getPickupSlotId()))
                .findFirst()
                .orElse(null);
            
            if (selectedSlot != null) {
                logger.info("Found slot - Date: {}, Start: {}, End: {}", 
                    selectedSlot.getPickupDate(), selectedSlot.getStartTime(), selectedSlot.getEndTime());
                
                // DEFENSIVE: These times should already be in UTC, but let's verify
                // by checking if they make sense (end time should be after start time)
                java.time.LocalDateTime slotStart = java.time.LocalDateTime.of(
                    selectedSlot.getPickupDate(), selectedSlot.getStartTime());
                java.time.LocalDateTime slotEnd = java.time.LocalDateTime.of(
                    selectedSlot.getPickupDate(), selectedSlot.getEndTime());
                
                if (slotEnd.isBefore(slotStart)) {
                    logger.warn("⚠ SUSPICIOUS: Slot end time is before start time! This might indicate timezone issues.");
                    logger.warn("Start: {}, End: {}", slotStart, slotEnd);
                }
                
                // Copy the times directly (they should be UTC from post creation)
                claim.setConfirmedPickupDate(selectedSlot.getPickupDate());
                claim.setConfirmedPickupStartTime(selectedSlot.getStartTime());
                claim.setConfirmedPickupEndTime(selectedSlot.getEndTime());
                
                logger.info("✓ Copied from slot (assumed UTC) - Date: {}, Start: {}, End: {}", 
                    claim.getConfirmedPickupDate(), claim.getConfirmedPickupStartTime(), claim.getConfirmedPickupEndTime());
            } else {
                logger.error("✗ Slot ID {} not found in post's pickup slots!", request.getPickupSlotId());
            }
        }
        
        // SCENARIO 3: Fallback to post's default pickup time
        if (claim.getConfirmedPickupDate() == null && surplusPost.getPickupDate() != null) {
            logger.info("SCENARIO 3: Using post defaults (assumed UTC)");
            logger.info("Post default times - Date: {}, From: {}, To: {}", 
                surplusPost.getPickupDate(), surplusPost.getPickupFrom(), surplusPost.getPickupTo());
            
            claim.setConfirmedPickupDate(surplusPost.getPickupDate());
            claim.setConfirmedPickupStartTime(surplusPost.getPickupFrom());
            claim.setConfirmedPickupEndTime(surplusPost.getPickupTo());
            
            logger.info("✓ Stored from defaults - Date: {}, Start: {}, End: {}", 
                claim.getConfirmedPickupDate(), claim.getConfirmedPickupStartTime(), claim.getConfirmedPickupEndTime());
        }
        
        claim = claimRepository.save(claim);

        // Check if the CONFIRMED pickup time has already started
        // CRITICAL: Use UTC for comparison since confirmed pickup times MUST be in UTC
        java.time.ZonedDateTime nowUtc = java.time.ZonedDateTime.now(java.time.ZoneId.of("UTC"));
        java.time.LocalDate today = nowUtc.toLocalDate();
        java.time.LocalTime currentTime = nowUtc.toLocalTime();

        boolean pickupTimeStarted = false;
        
        logger.info("=== PICKUP TIME EVALUATION ===");
        logger.info("Current UTC: {} {}", today, currentTime);
        logger.info("Confirmed pickup (UTC): {} {} to {}", 
            claim.getConfirmedPickupDate(), claim.getConfirmedPickupStartTime(), claim.getConfirmedPickupEndTime());
        
        // Use the CONFIRMED pickup slot that receiver selected (must be in UTC)
        if (claim.getConfirmedPickupDate() != null && claim.getConfirmedPickupStartTime() != null) {
          if (claim.getConfirmedPickupDate().isBefore(today)) {
              pickupTimeStarted = true;
              logger.info("✓ Pickup date is in the past - marking as started");
          } else if (claim.getConfirmedPickupDate().isEqual(today)) {
              pickupTimeStarted = !currentTime.isBefore(claim.getConfirmedPickupStartTime());
              logger.info("{} Pickup is today - current: {}, start: {}, started: {}", 
                  pickupTimeStarted ? "✓" : "✗", currentTime, claim.getConfirmedPickupStartTime(), pickupTimeStarted);
          } else {
              logger.info("✗ Pickup date is in the future - not started yet");
          }
        }
        
        logger.info("=== END CLAIM DEBUG ===");
         
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

        // Create timeline event for donation being claimed
        String receiverName = receiver.getOrganization() != null 
            ? receiver.getOrganization().getName() 
            : receiver.getEmail();
        timelineService.createTimelineEvent(
            surplusPost,
            "DONATION_CLAIMED",
            "receiver",
            receiver.getId(),
            PostStatus.AVAILABLE,
            surplusPost.getStatus(),
            "Claimed by " + receiverName,
            true
        );

        businessMetricsService.incrementClaimCreated();
        businessMetricsService.incrementSurplusPostClaimed();
        businessMetricsService.recordTimer(sample, "claim.service.create", "status", claim.getStatus().toString());

        // Award gamification points for claiming donation
        try {
            gamificationService.awardPoints(receiver.getId(), 5, "Claimed donation: " + surplusPost.getTitle());
            gamificationService.checkAndUnlockAchievements(receiver.getId());
        } catch (Exception e) {
            logger.error("Failed to award gamification points for claimId={}: {}", claim.getId(), e.getMessage());
        }

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
        
        // Send email notification to donor if enabled
        if (notificationPreferenceService.shouldSendNotification(donor, "donationClaimed", "email")) {
            try {
                String donorName = getDonorName(donor);
                java.util.Map<String, Object> claimData = new java.util.HashMap<>();
                claimData.put("title", surplusPost.getTitle());
                claimData.put("receiverName", receiverName);
                claimData.put("quantity", surplusPost.getQuantity() != null ? 
                    surplusPost.getQuantity().getValue().intValue() : "N/A");
                
                emailService.sendDonationClaimedNotification(donor.getEmail(), donorName, claimData);
                logger.info("Sent donation claimed email to donor userId={}", donor.getId());
            } catch (Exception e) {
                logger.error("Failed to send email notification to donor userId={}: {}", donor.getId(), e.getMessage());
            }
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
            receiver.getId(),
            java.util.List.of(
                ClaimStatus.ACTIVE,
                ClaimStatus.COMPLETED,
                ClaimStatus.NOT_COMPLETED,
                ClaimStatus.EXPIRED
            )
        )
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
            .orElseThrow(() -> new ResourceNotFoundException("error.resource.not_found"));

        // Verify receiver owns this claim
        if (!claim.getReceiver().getId().equals(receiver.getId())) {
            throw new BusinessException("error.claim.unauthorized_cancel");
        }
        
        // Cancel the claim
        claim.setStatus(ClaimStatus.CANCELLED);
        claimRepository.save(claim);
        
        // Make post available again
        SurplusPost post = claim.getSurplusPost();
        PostStatus oldStatus = post.getStatus();
        post.setStatus(PostStatus.AVAILABLE);
        surplusPostRepository.save(post);

        // Create timeline event for claim cancellation
        String receiverName = receiver.getOrganization() != null 
            ? receiver.getOrganization().getName() 
            : receiver.getEmail();
        timelineService.createTimelineEvent(
            post,
            "CLAIM_CANCELLED",
            "receiver",
            receiver.getId(),
            oldStatus,
            PostStatus.AVAILABLE,
            "Claim cancelled by " + receiverName,
            true
        );

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
        
        // Send email notification to donor if enabled
        if (notificationPreferenceService.shouldSendNotification(donor, "claimCanceled", "email")) {
            try {
                String donorName = getDonorName(donor);
                java.util.Map<String, Object> claimData = new java.util.HashMap<>();
                claimData.put("title", post.getTitle());
                claimData.put("reason", "The receiver canceled their claim");
                
                emailService.sendClaimCanceledNotification(donor.getEmail(), donorName, claimData);
                logger.info("Sent claim canceled email to donor userId={}", donor.getId());
            } catch (Exception e) {
                logger.error("Failed to send email notification to donor userId={}: {}", donor.getId(), e.getMessage());
            }
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

        // Award gamification points for completing pickup
        try {
            gamificationService.awardPoints(
                claim.getReceiver().getId(), 
                15, 
                "Completed pickup for: " + claim.getSurplusPost().getTitle()
            );
            gamificationService.checkAndUnlockAchievements(claim.getReceiver().getId());
        } catch (Exception e) {
            logger.error("Failed to award pickup completion points for claimId={}: {}", claimId, e.getMessage());
        }

        // Increment completed claim counter
        businessMetricsService.incrementClaimCompleted();

        // Record timer
        businessMetricsService.recordTimer(sample, "claim.service.complete", "status", "completed");
    }
    
    /**
     * Get donor name from organization
     */
    private String getDonorName(User donor) {
        if (donor.getOrganization() != null && donor.getOrganization().getName() != null) {
            return donor.getOrganization().getName();
        }
        return "Donor";
    }
    
    /**
     * Get receiver name from organization
     */
    private String getReceiverName(User receiver) {
        if (receiver.getOrganization() != null && receiver.getOrganization().getName() != null) {
            return receiver.getOrganization().getName();
        }
        return "Receiver";
    }
}
