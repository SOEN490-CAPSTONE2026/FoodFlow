package com.example.foodflow.service;

import com.example.foodflow.helpers.ArrayFilter;
import com.example.foodflow.helpers.BasicFilter;
import com.example.foodflow.helpers.LocationFilter;
import com.example.foodflow.helpers.SpecificationHandler;
import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusFilterRequest;
import com.example.foodflow.model.dto.PickupSlotRequest;
import com.example.foodflow.model.dto.PickupSlotResponse;
import com.example.foodflow.model.dto.SurplusResponse;
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

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SurplusService {
    
    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final PickupSlotValidationService pickupSlotValidationService;
    private final BusinessMetricsService businessMetricsService;
    private final NotificationService notificationService;

    public SurplusService(SurplusPostRepository surplusPostRepository, 
                         ClaimRepository claimRepository,
                         PickupSlotValidationService pickupSlotValidationService,
                         BusinessMetricsService businessMetricsService,
                         NotificationService notificationService) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.pickupSlotValidationService = pickupSlotValidationService;
        this.businessMetricsService = businessMetricsService;
        this.notificationService = notificationService;
    }
    
    /**
     * Creates a new SurplusPost from the request DTO and saves it to the database.
     */
    @Transactional
    @Timed(value = "surplus.service.create", description = "Time taken to create a surplus post")
    public SurplusResponse createSurplusPost(CreateSurplusRequest request, User donor) {
        Timer.Sample sample = businessMetricsService.startTimer();
        SurplusPost post = new SurplusPost();
        
        post.setDonor(donor);
        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setFoodCategories(request.getFoodCategories());
        post.setQuantity(request.getQuantity());
        post.setPickupLocation(request.getPickupLocation());
        post.setExpiryDate(request.getExpiryDate());

        // Handle pickup slots
        List<PickupSlotRequest> slotsToProcess;
        
        if (request.getPickupSlots() != null && !request.getPickupSlots().isEmpty()) {
            // Use provided pickup slots
            slotsToProcess = request.getPickupSlots();
            pickupSlotValidationService.validateSlots(slotsToProcess);
        } else {
            // Backward compatibility: create single slot from legacy fields
            PickupSlotRequest legacySlot = new PickupSlotRequest(
                request.getPickupDate(),
                request.getPickupFrom(),
                request.getPickupTo(),
                null
            );
            slotsToProcess = List.of(legacySlot);
        }

        // Get donor's timezone, fallback to user's timezone or UTC
        String donorTimezone = request.getDonorTimezone();
        if (donorTimezone == null || donorTimezone.trim().isEmpty()) {
            donorTimezone = donor.getTimezone() != null ? donor.getTimezone() : "UTC";
        }

        // Convert first slot times from donor timezone to UTC for legacy fields
        PickupSlotRequest firstSlot = slotsToProcess.get(0);
        LocalDateTime startTimeUTC = TimezoneResolver.convertDateTime(
            firstSlot.getPickupDate(), 
            firstSlot.getStartTime(),
            donorTimezone,
            "UTC"
        );
        LocalDateTime endTimeUTC = TimezoneResolver.convertDateTime(
            firstSlot.getPickupDate(),
            firstSlot.getEndTime(),
            donorTimezone,
            "UTC"
        );
        
        // Set legacy fields with UTC times
        post.setPickupDate(startTimeUTC != null ? startTimeUTC.toLocalDate() : firstSlot.getPickupDate());
        post.setPickupFrom(startTimeUTC != null ? startTimeUTC.toLocalTime() : firstSlot.getStartTime());
        post.setPickupTo(endTimeUTC != null ? endTimeUTC.toLocalTime() : firstSlot.getEndTime());

        // Create pickup slot entities, converting all times to UTC
        List<PickupSlot> pickupSlots = new ArrayList<>();
        for (int i = 0; i < slotsToProcess.size(); i++) {
            PickupSlotRequest slotReq = slotsToProcess.get(i);
            
            // Convert slot times from donor timezone to UTC
            LocalDateTime slotStartUTC = TimezoneResolver.convertDateTime(
                slotReq.getPickupDate(),
                slotReq.getStartTime(),
                donorTimezone,
                "UTC"
            );
            LocalDateTime slotEndUTC = TimezoneResolver.convertDateTime(
                slotReq.getPickupDate(),
                slotReq.getEndTime(),
                donorTimezone,
                "UTC"
            );
            
            PickupSlot slot = new PickupSlot();
            slot.setSurplusPost(post);
            // Store in UTC
            slot.setPickupDate(slotStartUTC != null ? slotStartUTC.toLocalDate() : slotReq.getPickupDate());
            slot.setStartTime(slotStartUTC != null ? slotStartUTC.toLocalTime() : slotReq.getStartTime());
            slot.setEndTime(slotEndUTC != null ? slotEndUTC.toLocalTime() : slotReq.getEndTime());
            slot.setNotes(slotReq.getNotes());
            slot.setSlotOrder(i + 1); // 1-indexed
            pickupSlots.add(slot);
        }
        post.setPickupSlots(pickupSlots);

        // Always set status to AVAILABLE on creation
        // Status will only change to READY_FOR_PICKUP after being claimed
        // and when the confirmed pickup slot time arrives (handled by scheduler)
        post.setStatus(request.getStatus() != null ? request.getStatus() : PostStatus.AVAILABLE);

        SurplusPost savedPost = surplusPostRepository.save(post);

        businessMetricsService.incrementSurplusPostCreated();
        businessMetricsService.recordTimer(sample, "surplus.service.create", "status", savedPost.getStatus().toString());

        // Send notifications to eligible receivers
        try {
            notificationService.sendNewPostNotification(savedPost);
        } catch (Exception e) {
            // Log error but don't fail the post creation
            org.slf4j.LoggerFactory.getLogger(SurplusService.class)
                .error("Failed to send notifications for postId={}: {}", savedPost.getId(), e.getMessage());
        }

        return convertToResponse(savedPost);
    }
    
    /**
     * Retrieves all surplus posts for a given user (donor).
     * Converts times from UTC back to donor's timezone.
     */
    @Timed(value = "surplus.service.getUserPosts", description = "Time taken to get user surplus posts")
    public List<SurplusResponse> getUserSurplusPosts(User user) {
        String donorTimezone = user.getTimezone() != null ? user.getTimezone() : "UTC";
        
        return surplusPostRepository.findByDonorId(user.getId())
                .stream()
                .map(post -> convertToResponseForDonor(post, donorTimezone))
                .collect(Collectors.toList());
    }
    
    /**
     * Converts a SurplusPost entity to the SurplusResponse DTO.
     * Times are kept in UTC (as stored in database).
     */
    private SurplusResponse convertToResponse(SurplusPost post) {
        SurplusResponse response = new SurplusResponse();
        response.setId(post.getId());
        response.setTitle(post.getTitle());
        response.setDescription(post.getDescription());
        response.setFoodCategories(post.getFoodCategories());
        response.setQuantity(post.getQuantity());
        response.setPickupLocation(post.getPickupLocation());
        response.setExpiryDate(post.getExpiryDate());
        response.setPickupDate(post.getPickupDate());
        response.setPickupFrom(post.getPickupFrom());
        response.setPickupTo(post.getPickupTo());
        response.setStatus(post.getStatus());
        response.setOtpCode(post.getOtpCode());
        response.setDonorEmail(post.getDonor().getEmail());
        response.setDonorName(post.getDonor().getOrganization() != null
            ? post.getDonor().getOrganization().getName()
            : null);
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());

        // Convert pickup slots
        if (post.getPickupSlots() != null && !post.getPickupSlots().isEmpty()) {
            List<PickupSlotResponse> slotResponses = post.getPickupSlots().stream()
                .map(PickupSlotResponse::fromEntity)
                .collect(Collectors.toList());
            response.setPickupSlots(slotResponses);
        }

        // Include confirmed pickup slot if post has an active claim
        claimRepository.findBySurplusPostIdAndStatus(post.getId(), ClaimStatus.ACTIVE)
            .ifPresent(claim -> {
                if (claim.getConfirmedPickupDate() != null &&
                    claim.getConfirmedPickupStartTime() != null &&
                    claim.getConfirmedPickupEndTime() != null) {
                    PickupSlotResponse confirmedSlot = new PickupSlotResponse();
                    confirmedSlot.setPickupDate(claim.getConfirmedPickupDate());
                    confirmedSlot.setStartTime(claim.getConfirmedPickupStartTime());
                    confirmedSlot.setEndTime(claim.getConfirmedPickupEndTime());
                    response.setConfirmedPickupSlot(confirmedSlot);
                }
            });

        return response;
    }
    
    /**
     * Converts a SurplusPost entity to the SurplusResponse DTO with times converted to donor's timezone.
     * All UTC times from database are converted back to the donor's local timezone.
     */
    private SurplusResponse convertToResponseForDonor(SurplusPost post, String donorTimezone) {
        // Get the base response (in UTC)
        SurplusResponse response = convertToResponse(post);
        
        // If donor has no timezone, return UTC times
        if (donorTimezone == null || donorTimezone.trim().isEmpty()) {
            return response;
        }
        
        // Convert legacy pickup times from UTC to donor timezone
        if (response.getPickupDate() != null && response.getPickupFrom() != null && response.getPickupTo() != null) {
            LocalDateTime pickupFromDonor = TimezoneResolver.convertDateTime(
                response.getPickupDate(),
                response.getPickupFrom(),
                "UTC",
                donorTimezone
            );
            LocalDateTime pickupToDonor = TimezoneResolver.convertDateTime(
                response.getPickupDate(),
                response.getPickupTo(),
                "UTC",
                donorTimezone
            );
            
            if (pickupFromDonor != null) {
                response.setPickupDate(pickupFromDonor.toLocalDate());
                response.setPickupFrom(pickupFromDonor.toLocalTime());
            }
            if (pickupToDonor != null) {
                response.setPickupTo(pickupToDonor.toLocalTime());
            }
        }
        
        // Convert pickup slots from UTC to donor timezone
        if (response.getPickupSlots() != null && !response.getPickupSlots().isEmpty()) {
            List<PickupSlotResponse> convertedSlots = new ArrayList<>();
            for (PickupSlotResponse slot : response.getPickupSlots()) {
                LocalDateTime slotStartDonor = TimezoneResolver.convertDateTime(
                    slot.getPickupDate(),
                    slot.getStartTime(),
                    "UTC",
                    donorTimezone
                );
                LocalDateTime slotEndDonor = TimezoneResolver.convertDateTime(
                    slot.getPickupDate(),
                    slot.getEndTime(),
                    "UTC",
                    donorTimezone
                );
                
                PickupSlotResponse convertedSlot = new PickupSlotResponse();
                convertedSlot.setId(slot.getId());
                convertedSlot.setPickupDate(slotStartDonor != null ? slotStartDonor.toLocalDate() : slot.getPickupDate());
                convertedSlot.setStartTime(slotStartDonor != null ? slotStartDonor.toLocalTime() : slot.getStartTime());
                convertedSlot.setEndTime(slotEndDonor != null ? slotEndDonor.toLocalTime() : slot.getEndTime());
                convertedSlot.setNotes(slot.getNotes());
                convertedSlot.setSlotOrder(slot.getSlotOrder());
                convertedSlots.add(convertedSlot);
            }
            response.setPickupSlots(convertedSlots);
        }
        
        // Convert confirmed pickup slot from UTC to donor timezone
        if (response.getConfirmedPickupSlot() != null) {
            PickupSlotResponse confirmedSlot = response.getConfirmedPickupSlot();
            LocalDateTime confirmedStartDonor = TimezoneResolver.convertDateTime(
                confirmedSlot.getPickupDate(),
                confirmedSlot.getStartTime(),
                "UTC",
                donorTimezone
            );
            LocalDateTime confirmedEndDonor = TimezoneResolver.convertDateTime(
                confirmedSlot.getPickupDate(),
                confirmedSlot.getEndTime(),
                "UTC",
                donorTimezone
            );
            
            if (confirmedStartDonor != null) {
                confirmedSlot.setPickupDate(confirmedStartDonor.toLocalDate());
                confirmedSlot.setStartTime(confirmedStartDonor.toLocalTime());
            }
            if (confirmedEndDonor != null) {
                confirmedSlot.setEndTime(confirmedEndDonor.toLocalTime());
            }
        }
        
        return response;
    }
    
    /**
     * Converts a SurplusPost entity to the SurplusResponse DTO with times converted to receiver's timezone.
     * All UTC times from database are converted to the receiver's local timezone.
     */
    private SurplusResponse convertToResponseForReceiver(SurplusPost post, String receiverTimezone) {
        // Get the base response (in UTC)
        SurplusResponse response = convertToResponse(post);
        
        // If receiver has no timezone, return UTC times
        if (receiverTimezone == null || receiverTimezone.trim().isEmpty()) {
            return response;
        }
        
        // Convert legacy pickup times from UTC to receiver timezone
        if (response.getPickupDate() != null && response.getPickupFrom() != null && response.getPickupTo() != null) {
            LocalDateTime pickupFromReceiver = TimezoneResolver.convertDateTime(
                response.getPickupDate(),
                response.getPickupFrom(),
                "UTC",
                receiverTimezone
            );
            LocalDateTime pickupToReceiver = TimezoneResolver.convertDateTime(
                response.getPickupDate(),
                response.getPickupTo(),
                "UTC",
                receiverTimezone
            );
            
            if (pickupFromReceiver != null) {
                response.setPickupDate(pickupFromReceiver.toLocalDate());
                response.setPickupFrom(pickupFromReceiver.toLocalTime());
            }
            if (pickupToReceiver != null) {
                response.setPickupTo(pickupToReceiver.toLocalTime());
            }
        }
        
        // Convert pickup slots from UTC to receiver timezone
        if (response.getPickupSlots() != null && !response.getPickupSlots().isEmpty()) {
            List<PickupSlotResponse> convertedSlots = new ArrayList<>();
            for (PickupSlotResponse slot : response.getPickupSlots()) {
                LocalDateTime slotStartReceiver = TimezoneResolver.convertDateTime(
                    slot.getPickupDate(),
                    slot.getStartTime(),
                    "UTC",
                    receiverTimezone
                );
                LocalDateTime slotEndReceiver = TimezoneResolver.convertDateTime(
                    slot.getPickupDate(),
                    slot.getEndTime(),
                    "UTC",
                    receiverTimezone
                );
                
                PickupSlotResponse convertedSlot = new PickupSlotResponse();
                convertedSlot.setId(slot.getId());
                convertedSlot.setPickupDate(slotStartReceiver != null ? slotStartReceiver.toLocalDate() : slot.getPickupDate());
                convertedSlot.setStartTime(slotStartReceiver != null ? slotStartReceiver.toLocalTime() : slot.getStartTime());
                convertedSlot.setEndTime(slotEndReceiver != null ? slotEndReceiver.toLocalTime() : slot.getEndTime());
                convertedSlot.setNotes(slot.getNotes());
                convertedSlot.setSlotOrder(slot.getSlotOrder());
                convertedSlots.add(convertedSlot);
            }
            response.setPickupSlots(convertedSlots);
        }
        
        // Convert confirmed pickup slot from UTC to receiver timezone
        if (response.getConfirmedPickupSlot() != null) {
            PickupSlotResponse confirmedSlot = response.getConfirmedPickupSlot();
            LocalDateTime confirmedStartReceiver = TimezoneResolver.convertDateTime(
                confirmedSlot.getPickupDate(),
                confirmedSlot.getStartTime(),
                "UTC",
                receiverTimezone
            );
            LocalDateTime confirmedEndReceiver = TimezoneResolver.convertDateTime(
                confirmedSlot.getPickupDate(),
                confirmedSlot.getEndTime(),
                "UTC",
                receiverTimezone
            );
            
            if (confirmedStartReceiver != null) {
                confirmedSlot.setPickupDate(confirmedStartReceiver.toLocalDate());
                confirmedSlot.setStartTime(confirmedStartReceiver.toLocalTime());
            }
            if (confirmedEndReceiver != null) {
                confirmedSlot.setEndTime(confirmedEndReceiver.toLocalTime());
            }
        }
        
        return response;
    }

    @Timed(value = "surplus.service.getAllAvailablePosts", description = "Time taken to get all available surplus posts")
    public List<SurplusResponse> getAllAvailableSurplusPosts() {
        List<PostStatus> claimableStatuses = Arrays.asList(
            PostStatus.AVAILABLE,
            PostStatus.READY_FOR_PICKUP
        );
        List<SurplusPost> posts = surplusPostRepository.findByStatusIn(claimableStatuses);

        return posts.stream()
                .filter(post -> !claimRepository.existsBySurplusPostIdAndStatus(post.getId(), ClaimStatus.ACTIVE))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search surplus posts based on filter criteria using our custom filter classes.
     * If no filters are provided, returns all available posts.
     * Times returned in UTC.
     */
    public List<SurplusResponse> searchSurplusPosts(SurplusFilterRequest filterRequest) {
        Specification<SurplusPost> specification = buildSpecificationFromFilter(filterRequest);
        
        List<SurplusPost> posts = surplusPostRepository.findAll(specification);
        
        return posts.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Search surplus posts for a receiver with times converted to their timezone.
     * 
     * @param filterRequest Filter criteria
     * @param receiver The receiver user (for timezone conversion)
     * @return List of surplus posts with times in receiver's timezone
     */
    public List<SurplusResponse> searchSurplusPostsForReceiver(SurplusFilterRequest filterRequest, User receiver) {
        Specification<SurplusPost> specification = buildSpecificationFromFilter(filterRequest);
        
        List<SurplusPost> posts = surplusPostRepository.findAll(specification);
        
        String receiverTimezone = receiver != null && receiver.getTimezone() != null 
            ? receiver.getTimezone() 
            : "UTC";
        
        return posts.stream()
                .map(post -> convertToResponseForReceiver(post, receiverTimezone))
                .collect(Collectors.toList());
    }

    /**
     * Builds a JPA Specification from the filter request using our custom filter classes.
     */
    private Specification<SurplusPost> buildSpecificationFromFilter(SurplusFilterRequest filterRequest) {
        SpecificationHandler.SpecificationBuilder<SurplusPost> builder = SpecificationHandler.<SurplusPost>builder();
    
        // Always filter by status
        if (filterRequest.hasStatus()) {
            builder.and(BasicFilter.equal(filterRequest.getStatus()).toSpecification("status"));
        }
        
        // Filter by food categories
        if (filterRequest.hasFoodCategories()) {
            builder.and(ArrayFilter.containsAny(filterRequest.getFoodCategories()).toSpecification("foodCategories"));
        }
        
        // Filter by expiry date (before) - FIXED
        if (filterRequest.hasExpiryBefore()) {
            builder.and(BasicFilter.lessThanOrEqual(filterRequest.getExpiryBefore()).toSpecification("expiryDate"));
        }
        
        // Filter by expiry date (after)
        if (filterRequest.hasExpiryAfter()) {
            builder.and(BasicFilter.greaterThanOrEqual(filterRequest.getExpiryAfter()).toSpecification("expiryDate"));
        }
        
        // Filter by location
        if (filterRequest.hasLocationFilter()) {
            builder.and(LocationFilter.within(filterRequest.getUserLocation(), filterRequest.getMaxDistanceKm()).toSpecification("pickupLocation"));
        }
        
        return builder.buildOrDefault(SpecificationHandler.alwaysTrue());
    }

    @Transactional
    @Timed(value = "surplus.service.complete", description = "Time taken to complete a surplus post")
    public SurplusResponse completeSurplusPost(Long postId, String otpCode, User donor) {
        Timer.Sample sample = businessMetricsService.startTimer();
        
        SurplusPost post = surplusPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Surplus post not found"));

        if (!post.getDonor().getId().equals(donor.getId())) {
            throw new RuntimeException("You are not authorized to complete this post. Only the post owner can mark it as completed.");
        }

        if (post.getStatus() != PostStatus.READY_FOR_PICKUP) {
            throw new RuntimeException("Post must be in READY_FOR_PICKUP status to be completed. Current status: " + post.getStatus());
        }

        if (post.getOtpCode() == null || !post.getOtpCode().equals(otpCode)) {
            throw new RuntimeException("Invalid OTP code");
        }

        post.setStatus(PostStatus.COMPLETED);
        SurplusPost updatedPost = surplusPostRepository.save(post);

        businessMetricsService.incrementSurplusPostCompleted();
        businessMetricsService.recordTimer(sample, "surplus.service.complete", "status", "complete");

        return convertToResponse(updatedPost);
    }

    private String generateOtpCode() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

   @Transactional
public SurplusResponse confirmPickup(long postId, String otpCode, User donor) {
    
    SurplusPost post = surplusPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Surplus post not found"));

   
    if (!post.getDonor().getId().equals(donor.getId())) {
        throw new RuntimeException("You are not authorized to confirm this pickup.");
    }


    if (post.getOtpCode() == null) {
        throw new RuntimeException("No OTP is set for this donation.");
    }

    if (!post.getOtpCode().equals(otpCode)) {
        throw new RuntimeException("Invalid or expired OTP code.");
    }

    
    if (post.getStatus() != PostStatus.READY_FOR_PICKUP) {
        throw new RuntimeException("Donation is not ready for pickup. Current status: " + post.getStatus());
    }

    Claim claim = claimRepository.findBySurplusPost(post)
        .orElseThrow(() -> new RuntimeException("No active claim found for this post"));

    post.setStatus(PostStatus.COMPLETED);
    post.setOtpCode(null);
    claim.setStatus(ClaimStatus.COMPLETED);

    surplusPostRepository.save(post);
    claimRepository.save(claim);

    return convertToResponse(post);
}

@Transactional
public void deleteSurplusPost(Long postId, User donor) {

    SurplusPost post = surplusPostRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Surplus post not found"));

    if (!post.getDonor().getId().equals(donor.getId())) {
        throw new RuntimeException("You are not authorized to delete this post.");
    }

    if (post.getStatus() == PostStatus.CLAIMED ||
        post.getStatus() == PostStatus.READY_FOR_PICKUP ||
        post.getStatus() == PostStatus.COMPLETED) {

        throw new RuntimeException("You cannot delete a post that has already been claimed or completed.");
    }

    List<Claim> claims = claimRepository.findBySurplusPostId(postId);
    if (!claims.isEmpty()) {
        claimRepository.deleteAll(claims);
    }
    surplusPostRepository.delete(post);
}


}
