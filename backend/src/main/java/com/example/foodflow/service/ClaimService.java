package com.example.foodflow.service;

import com.example.foodflow.exception.BusinessException;
import com.example.foodflow.exception.ResourceNotFoundException;
import com.example.foodflow.model.dto.ClaimRequest;
import com.example.foodflow.model.dto.ClaimResponse;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.SyncedCalendarEventRepository;
import com.example.foodflow.service.calendar.CalendarEventService;
import com.example.foodflow.service.calendar.CalendarIntegrationService;
import com.example.foodflow.service.calendar.CalendarSyncService;
import com.example.foodflow.util.TimezoneResolver;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.Timer;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
    private final SmsService smsService;
    private final CalendarEventService calendarEventService;
    private final CalendarIntegrationService calendarIntegrationService;
    private final CalendarSyncService calendarSyncService;
    private final CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;
    private final SyncedCalendarEventRepository syncedCalendarEventRepository;
    
    public ClaimService(ClaimRepository claimRepository,
                       SurplusPostRepository surplusPostRepository,
                       BusinessMetricsService businessMetricsService,
                       SimpMessagingTemplate messagingTemplate,
                       NotificationPreferenceService notificationPreferenceService,
                       TimelineService timelineService,
                       EmailService emailService,
                       GamificationService gamificationService,
                       SmsService smsService,
                       CalendarEventService calendarEventService,
                       CalendarIntegrationService calendarIntegrationService,
                       CalendarSyncService calendarSyncService,
                       CalendarSyncPreferenceRepository calendarSyncPreferenceRepository,
                       SyncedCalendarEventRepository syncedCalendarEventRepository) {
        this.claimRepository = claimRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.businessMetricsService = businessMetricsService;
        this.messagingTemplate = messagingTemplate;
        this.notificationPreferenceService = notificationPreferenceService;
        this.timelineService = timelineService;
        this.emailService = emailService;
        this.gamificationService = gamificationService;
        this.smsService = smsService;
        this.calendarEventService = calendarEventService;
        this.calendarIntegrationService = calendarIntegrationService;
        this.calendarSyncService = calendarSyncService;
        this.calendarSyncPreferenceRepository = calendarSyncPreferenceRepository;
        this.syncedCalendarEventRepository = syncedCalendarEventRepository;
    }
                       
    @Transactional
    @Timed(value = "claim.service.create", description = "Time taken to create a claim")
    public ClaimResponse claimSurplusPost(ClaimRequest request, User receiver) {
        Timer.Sample sample = businessMetricsService.startTimer();
        // Fetch and lock the surplus post to prevent concurrent claims
        SurplusPost surplusPost = surplusPostRepository.findById(request.getSurplusPostId())
            .orElseThrow(() -> new ResourceNotFoundException("error.resource.not_found"));

        // Check if post has expired based on effective expiry first, fallback to legacy expiry date.
        LocalDateTime effectiveExpiry = surplusPost.getExpiryDateEffective();
        if (effectiveExpiry == null && surplusPost.getExpiryDate() != null) {
            effectiveExpiry = surplusPost.getExpiryDate().atTime(23, 59, 59);
        }
        if (effectiveExpiry != null &&
                !LocalDateTime.now(java.time.ZoneOffset.UTC).isBefore(effectiveExpiry)) {
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
        
        // Send SMS notification to donor if enabled
        if (notificationPreferenceService.shouldSendNotification(donor, "donationClaimed", "sms")) {
            if (hasValidPhoneNumber(donor)) {
                try {
                    String donorName = getDonorName(donor);
                    java.util.Map<String, Object> claimData = new java.util.HashMap<>();
                    claimData.put("donationTitle", surplusPost.getTitle());
                    claimData.put("receiverName", receiverName);
                    claimData.put("pickupCode", surplusPost.getOtpCode());
                    
                    boolean smsSent = smsService.sendDonationClaimedNotification(donor.getPhone(), donorName, claimData);
                    if (smsSent) {
                        logger.info("Sent donation claimed SMS to donor userId={}", donor.getId());
                    } else {
                        logger.warn("SMS notification failed for donor userId={}", donor.getId());
                    }
                } catch (Exception e) {
                    logger.error("Failed to send SMS notification to donor userId={}: {}", donor.getId(), e.getMessage());
                }
            } else {
                logger.warn("Cannot send SMS to donor userId={} - no valid phone number", donor.getId());
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

        // Create calendar events for BOTH users if they have calendar enabled
        logger.info("=== ATTEMPTING TO CREATE CALENDAR EVENTS FOR CLAIM {} ===", claim.getId());
        logger.info("Receiver: {}, Donor: {}", receiver.getId(), donor.getId());
        try {
            createCalendarEventForPickup(claim, receiver, false); // Receiver's event
            createCalendarEventForPickup(claim, donor, true);     // Donor's event
            logger.info("✅ Calendar event creation calls completed for claim {}", claim.getId());
            
            // Trigger async sync immediately for both users if they have calendar integrated
            triggerCalendarSyncIfEnabled(receiver);
            triggerCalendarSyncIfEnabled(donor);
            
        } catch (Exception e) {
            // Log but don't fail the claim if calendar sync fails
            logger.error("❌ Failed to create calendar events for claim {}: {}", 
                         claim.getId(), e.getMessage(), e);
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
        
        // Delete calendar events for both users
        try {
            deleteCalendarEventsForClaim(claimId);
        } catch (Exception e) {
            // Log but don't fail the cancellation if calendar deletion fails
            logger.error("Failed to delete calendar events for claim {}: {}", 
                         claimId, e.getMessage());
        }
        
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
        
        // Send SMS notification to donor if enabled
        if (notificationPreferenceService.shouldSendNotification(donor, "claimCanceled", "sms")) {
            if (hasValidPhoneNumber(donor)) {
                try {
                    String donorName = getDonorName(donor);
                    java.util.Map<String, Object> claimData = new java.util.HashMap<>();
                    claimData.put("donationTitle", post.getTitle());
                    
                    boolean smsSent = smsService.sendClaimCanceledNotification(donor.getPhone(), donorName, claimData);
                    if (smsSent) {
                        logger.info("Sent claim canceled SMS to donor userId={}", donor.getId());
                    } else {
                        logger.warn("SMS notification failed for donor userId={}", donor.getId());
                    }
                } catch (Exception e) {
                    logger.error("Failed to send SMS notification to donor userId={}: {}", donor.getId(), e.getMessage());
                }
            } else {
                logger.warn("Cannot send SMS to donor userId={} - no valid phone number", donor.getId());
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
    
    /**
     * Check if user has a valid phone number for SMS notifications
     */
    private boolean hasValidPhoneNumber(User user) {
        if (user == null || user.getPhone() == null || user.getPhone().trim().isEmpty()) {
            return false;
        }
        
        String phone = user.getPhone().trim();
        
        // E.164 format validation: +[country code][number] (e.g., +12345678901)
        // Must start with +, followed by 1-15 digits
        return phone.matches("^\\+[1-9]\\d{1,14}$");
    }
    
    /**
     * Create a calendar event for a pickup claim
     * Creates a separate event for donor or receiver based on their preferences
     */
    private void createCalendarEventForPickup(Claim claim, User user, boolean isDonor) {
        logger.info("🔍 createCalendarEventForPickup called - userId={}, isDonor={}, claimId={}", 
                   user.getId(), isDonor, claim.getId());
        try {
            // 1. Check if user has calendar connected
            if (!calendarIntegrationService.isCalendarConnected(user, "GOOGLE")) {
                logger.info("⚠️ User {} does not have Google Calendar connected, skipping event creation", user.getId());
                return;
            }
            logger.info("✓ User {} has Google Calendar connected", user.getId());
            logger.info("✓ User {} has Google Calendar connected", user.getId());
            
            // 2. Load user's calendar sync preferences
            Optional<CalendarSyncPreference> prefsOpt = calendarSyncPreferenceRepository.findByUserId(user.getId());
            if (!prefsOpt.isPresent()) {
                logger.info("⚠️ User {} has no calendar sync preferences, skipping event creation", user.getId());
                return;
            }
            
            CalendarSyncPreference prefs = prefsOpt.get();
            logger.info("✓ User {} preferences found - syncEnabled={}, syncClaimEvents={}", 
                       user.getId(), prefs.getSyncEnabled(), prefs.getSyncClaimEvents());
            
            // 3. Check if sync is enabled and claim events are enabled
            if (!prefs.getSyncEnabled() || !prefs.getSyncClaimEvents()) {
                logger.info("⚠️ User {} has calendar sync disabled for claim events (syncEnabled={}, syncClaimEvents={})", 
                           user.getId(), prefs.getSyncEnabled(), prefs.getSyncClaimEvents());
                return;
            }
            logger.info("✓ User {} has claim event sync enabled", user.getId());
            
            // 4. Get pickup time details (stored in UTC in database)
            if (claim.getConfirmedPickupDate() == null || claim.getConfirmedPickupStartTime() == null) {
                logger.warn("Claim {} has no confirmed pickup time, cannot create calendar event", claim.getId());
                return;
            }
            
            java.time.LocalDate pickupDateUTC = claim.getConfirmedPickupDate();
            java.time.LocalTime startTimeUTC = claim.getConfirmedPickupStartTime();
            java.time.LocalTime endTimeUTC = claim.getConfirmedPickupEndTime();
            
            // 5. Convert UTC times to user's timezone for display in calendar
            String userTimezone = user.getTimezone() != null ? user.getTimezone() : "UTC";
            LocalDateTime startInUserTz = TimezoneResolver.convertDateTime(
                pickupDateUTC, startTimeUTC, "UTC", userTimezone
            );
            
            LocalDateTime endInUserTz;
            if (endTimeUTC != null) {
                endInUserTz = TimezoneResolver.convertDateTime(
                    pickupDateUTC, endTimeUTC, "UTC", userTimezone
                );
            } else {
                // Fallback: use event duration preference
                endInUserTz = startInUserTz.plusMinutes(prefs.getEventDuration());
            }
            
            // 6. Build event title and description
            SurplusPost post = claim.getSurplusPost();
            String eventTitle = buildEventTitle(post, isDonor);
            String eventDescription = buildEventDescription(claim, user, isDonor);
            
            logger.info("📅 Calling CalendarEventService to create event for user {}: '{}' ({} to {})", 
                       user.getId(), eventTitle, startInUserTz, endInUserTz);
            
            // 7. Create the synced calendar event record
            SyncedCalendarEvent event = calendarEventService.createCalendarEvent(
                user,
                "CLAIM", // event type
                eventTitle,
                eventDescription,
                startInUserTz,
                endInUserTz,
                userTimezone
            );
            
            logger.info("✅ CalendarEventService returned event with ID: {}", event.getId());
            
            // 8. Link event to claim
            calendarEventService.linkEventToClaim(event, claim);
            
            logger.info("Created calendar event {} for user {} (isDonor={}) for claim {}", 
                       event.getId(), user.getId(), isDonor, claim.getId());
                       
        } catch (Exception e) {
            logger.error("Error creating calendar event for user {} claim {}: {}", 
                        user.getId(), claim.getId(), e.getMessage(), e);
            throw e; // Re-throw to be caught by calling method
        }
    }
    
    /**
     * Delete calendar events for a cancelled claim
     */
    private void deleteCalendarEventsForClaim(Long claimId) {
        try {
            // Find all synced events for this claim
            List<SyncedCalendarEvent> events = syncedCalendarEventRepository.findByClaimId(claimId);
            
            if (events.isEmpty()) {
                logger.info("No calendar events found for claim {}", claimId);
                return;
            }
            
            // Track unique users who need sync
            Set<Long> userIdsToSync = new HashSet<>();
            
            // Mark each event as deleted (soft delete)
            for (SyncedCalendarEvent event : events) {
                calendarEventService.deleteCalendarEvent(event);
                userIdsToSync.add(event.getUser().getId());
                logger.info("Marked calendar event {} as deleted for claim {}", event.getId(), claimId);
            }
            
            logger.info("Deleted {} calendar events for claim {}", events.size(), claimId);
            
            // Trigger async sync for each affected user to actually delete from Google Calendar
            for (Long userId : userIdsToSync) {
                User user = events.stream()
                    .filter(e -> e.getUser().getId().equals(userId))
                    .findFirst()
                    .map(SyncedCalendarEvent::getUser)
                    .orElse(null);
                    
                if (user != null) {
                    logger.info("Triggering sync to delete calendar event from Google for user {}", userId);
                    triggerCalendarSyncIfEnabled(user);
                }
            }
            
        } catch (Exception e) {
            logger.error("Error deleting calendar events for claim {}: {}", claimId, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Build event title based on user role
     */
    private String buildEventTitle(SurplusPost post, boolean isDonor) {
        String foodTitle = post.getTitle();
        if (isDonor) {
            return "📦 Donation Pickup - " + foodTitle;
        } else {
            return "🍽️ Pickup Appointment - " + foodTitle;
        }
    }
    
    /**
     * Build detailed event description
     */
    private String buildEventDescription(Claim claim, User user, boolean isDonor) {
        SurplusPost post = claim.getSurplusPost();
        User donor = post.getDonor();
        User receiver = claim.getReceiver();
        
        StringBuilder desc = new StringBuilder();
        desc.append("🍽️ FoodFlow Pickup Event\n\n");
        desc.append("📦 Food: ").append(post.getTitle()).append("\n");
        
        if (post.getQuantity() != null) {
            desc.append("📊 Quantity: ")
                .append(post.getQuantity().getValue())
                .append(" ")
                .append(post.getQuantity().getUnit())
                .append("\n");
        }
        
        desc.append("\n");
        
        if (isDonor) {
            // Donor's view
            String receiverName = getReceiverName(receiver);
            desc.append("👤 Receiver: ").append(receiverName).append("\n");
            if (receiver.getEmail() != null) {
                desc.append("📧 Contact: ").append(receiver.getEmail()).append("\n");
            }
            if (receiver.getPhone() != null) {
                desc.append("📱 Phone: ").append(receiver.getPhone()).append("\n");
            }
        } else {
            // Receiver's view
            String donorName = getDonorName(donor);
            desc.append("👤 Donor: ").append(donorName).append("\n");
            
            if (post.getPickupLocation() != null && post.getPickupLocation().getAddress() != null) {
                desc.append("📍 Location: ").append(post.getPickupLocation().getAddress()).append("\n");
            }
            
            if (donor.getEmail() != null) {
                desc.append("📧 Contact: ").append(donor.getEmail()).append("\n");
            }
            if (donor.getPhone() != null) {
                desc.append("📱 Phone: ").append(donor.getPhone()).append("\n");
            }
        }
        
        if (post.getOtpCode() != null && !post.getOtpCode().isEmpty()) {
            desc.append("\n🔐 Confirmation Code: ").append(post.getOtpCode()).append("\n");
        }
        
        desc.append("\n⏰ Please arrive on time. Contact the other party if there are any issues.");
        
        return desc.toString();
    }
    
    /**
     * Trigger async calendar sync for a user if they have calendar integrated and sync enabled
     * Uses TransactionSynchronization to ensure sync happens AFTER transaction commits
     */
    private void triggerCalendarSyncIfEnabled(User user) {
        try {
            // Check if user has calendar connected
            if (!calendarIntegrationService.isCalendarConnected(user, "GOOGLE")) {
                logger.debug("User {} does not have calendar connected, skipping async sync", user.getId());
                return;
            }
            
            // Check if sync is enabled in preferences
            Optional<CalendarSyncPreference> prefsOpt = calendarSyncPreferenceRepository.findByUserId(user.getId());
            if (!prefsOpt.isPresent() || !prefsOpt.get().getSyncEnabled()) {
                logger.debug("User {} has sync disabled, skipping async sync", user.getId());
                return;
            }
            
            // Register callback to trigger async sync AFTER transaction commits
            // This fixes the bug where @Async threads query before the transaction commits
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                logger.info("📌 Registering post-commit sync callback for user {}", user.getId());
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        logger.info("🚀 [POST-COMMIT] Triggering async calendar sync for user {}", user.getId());
                        calendarSyncService.syncUserPendingEventsAsync(user);
                    }
                });
            } else {
                // Fallback: trigger immediately if no transaction is active
                logger.info("🚀 Triggering async calendar sync for user {} (no active transaction)", user.getId());
                calendarSyncService.syncUserPendingEventsAsync(user);
            }
            
        } catch (Exception e) {
            logger.error("Error triggering calendar sync for user {}: {}", user.getId(), e.getMessage());
        }
    }
}
