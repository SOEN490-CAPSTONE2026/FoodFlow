package com.example.foodflow.service;

import com.example.foodflow.helpers.ArrayFilter;
import com.example.foodflow.helpers.BasicFilter;
import com.example.foodflow.helpers.LocationFilter;
import com.example.foodflow.helpers.SpecificationHandler;
import com.example.foodflow.config.PickupTimeToleranceConfig;
import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.DonationTimelineDTO;
import com.example.foodflow.model.dto.SurplusFilterRequest;
import com.example.foodflow.model.dto.PickupSlotRequest;
import com.example.foodflow.model.dto.PickupSlotResponse;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.dto.UploadEvidenceResponse;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.DonationTimeline;
import com.example.foodflow.model.entity.PickupSlot;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.DonationTimelineRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.util.TimezoneResolver;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.Timer;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SurplusService {

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final PickupSlotValidationService pickupSlotValidationService;
    private final BusinessMetricsService businessMetricsService;
    private final NotificationService notificationService;
    private final ExpiryCalculationService expiryCalculationService;
    private final TimelineService timelineService;
    private final DonationTimelineRepository timelineRepository;
    private final FileStorageService fileStorageService;
    private final PickupTimeToleranceConfig pickupTimeToleranceConfig;
    private final GamificationService gamificationService;
    private final ClaimService claimService;

    public SurplusService(SurplusPostRepository surplusPostRepository,
            ClaimRepository claimRepository,
            PickupSlotValidationService pickupSlotValidationService,
            BusinessMetricsService businessMetricsService,
            NotificationService notificationService,
            ExpiryCalculationService expiryCalculationService,
            TimelineService timelineService,
            DonationTimelineRepository timelineRepository,
            FileStorageService fileStorageService,
            PickupTimeToleranceConfig pickupTimeToleranceConfig,
            GamificationService gamificationService,
            ClaimService claimService) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.pickupSlotValidationService = pickupSlotValidationService;
        this.businessMetricsService = businessMetricsService;
        this.notificationService = notificationService;
        this.expiryCalculationService = expiryCalculationService;
        this.timelineService = timelineService;
        this.timelineRepository = timelineRepository;
        this.fileStorageService = fileStorageService;
        this.pickupTimeToleranceConfig = pickupTimeToleranceConfig;
        this.gamificationService = gamificationService;
        this.claimService = claimService;
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
        post.setTemperatureCategory(request.getTemperatureCategory());
        post.setPackagingType(request.getPackagingType());

        // Handle fabrication date and expiry date calculation
        LocalDate fabricationDate = request.getFabricationDate();
        LocalDate expiryDate = request.getExpiryDate();

        if (fabricationDate != null) {
            // Validate fabrication date is not in the future
            if (!expiryCalculationService.isValidFabricationDate(fabricationDate)) {
                throw new IllegalArgumentException("Fabrication date cannot be in the future");
            }
            post.setFabricationDate(fabricationDate);

            // If expiry date not provided, calculate it automatically
            if (expiryDate == null) {
                expiryDate = expiryCalculationService.calculateExpiryDate(
                        fabricationDate,
                        request.getFoodCategories());
            } else {
                // Validate provided expiry date makes sense
                if (!expiryCalculationService.isValidExpiryDate(fabricationDate, expiryDate)) {
                    throw new IllegalArgumentException(
                            "Expiry date must be after fabrication date and within reasonable limits");
                }
            }
        }

        // Ensure expiry date is set (either provided or calculated)
        if (expiryDate == null) {
            throw new IllegalArgumentException("Expiry date is required");
        }
        post.setExpiryDate(expiryDate);

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
                    null);
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
                "UTC");
        LocalDateTime endTimeUTC = TimezoneResolver.convertDateTime(
                firstSlot.getPickupDate(),
                firstSlot.getEndTime(),
                donorTimezone,
                "UTC");

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
                    "UTC");
            LocalDateTime slotEndUTC = TimezoneResolver.convertDateTime(
                    slotReq.getPickupDate(),
                    slotReq.getEndTime(),
                    donorTimezone,
                    "UTC");

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

        // Create timeline event for donation posting
        timelineService.createTimelineEvent(
                savedPost,
                "DONATION_POSTED",
                "donor",
                donor.getId(),
                null,
                PostStatus.AVAILABLE,
                "Donation posted by "
                        + (donor.getOrganization() != null ? donor.getOrganization().getName() : donor.getEmail()),
                true);

        businessMetricsService.incrementSurplusPostCreated();
        businessMetricsService.recordTimer(sample, "surplus.service.create", "status",
                savedPost.getStatus().toString());

        // Award gamification points for donation creation
        try {
            gamificationService.awardPoints(donor.getId(), 10, "Created donation: " + savedPost.getTitle());
            gamificationService.checkAndUnlockAchievements(donor.getId());
        } catch (Exception e) {
            // Log error but don't fail the post creation
            org.slf4j.LoggerFactory.getLogger(SurplusService.class)
                    .error("Failed to award gamification points for postId={}: {}", savedPost.getId(), e.getMessage());
        }

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
     * Retrieves a single surplus post by ID for the donor.
     * Validates that the requesting user is the owner of the post.
     * Converts times from UTC back to donor's timezone.
     */
    @Timed(value = "surplus.service.getById", description = "Time taken to get surplus post by ID")
    public SurplusResponse getSurplusPostByIdForDonor(Long postId, User donor) {
        SurplusPost post = surplusPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Surplus post not found"));

        // Verify the requesting user is the owner
        if (!post.getDonor().getId().equals(donor.getId())) {
            throw new RuntimeException("You are not authorized to view this post");
        }

        String donorTimezone = donor.getTimezone() != null ? donor.getTimezone() : "UTC";
        return convertToResponseForDonor(post, donorTimezone);
    }

    /**
     * Updates an existing surplus post.
     * Only allows updates if the post is in AVAILABLE status (not yet claimed).
     */
    @Transactional
    @Timed(value = "surplus.service.update", description = "Time taken to update a surplus post")
    public SurplusResponse updateSurplusPost(Long postId, CreateSurplusRequest request, User donor) {
        Timer.Sample sample = businessMetricsService.startTimer();

        SurplusPost post = surplusPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Surplus post not found"));

        // Verify the requesting user is the owner
        if (!post.getDonor().getId().equals(donor.getId())) {
            throw new RuntimeException("You are not authorized to update this post");
        }

        // Only allow updates for AVAILABLE posts
        if (post.getStatus() != PostStatus.AVAILABLE) {
            throw new RuntimeException(
                    "Cannot edit a post that has been claimed or completed. Current status: " + post.getStatus());
        }

        // Update basic fields
        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setFoodCategories(request.getFoodCategories());
        post.setQuantity(request.getQuantity());
        post.setPickupLocation(request.getPickupLocation());
        post.setTemperatureCategory(request.getTemperatureCategory());
        post.setPackagingType(request.getPackagingType());

        // Handle fabrication date and expiry date
        LocalDate fabricationDate = request.getFabricationDate();
        LocalDate expiryDate = request.getExpiryDate();

        if (fabricationDate != null) {
            if (!expiryCalculationService.isValidFabricationDate(fabricationDate)) {
                throw new IllegalArgumentException("Fabrication date cannot be in the future");
            }
            post.setFabricationDate(fabricationDate);

            if (expiryDate == null) {
                expiryDate = expiryCalculationService.calculateExpiryDate(
                        fabricationDate,
                        request.getFoodCategories());
            } else {
                if (!expiryCalculationService.isValidExpiryDate(fabricationDate, expiryDate)) {
                    throw new IllegalArgumentException(
                            "Expiry date must be after fabrication date and within reasonable limits");
                }
            }
        }

        if (expiryDate == null) {
            throw new IllegalArgumentException("Expiry date is required");
        }
        post.setExpiryDate(expiryDate);

        // Handle pickup slots update
        List<PickupSlotRequest> slotsToProcess;

        if (request.getPickupSlots() != null && !request.getPickupSlots().isEmpty()) {
            slotsToProcess = request.getPickupSlots();
            pickupSlotValidationService.validateSlots(slotsToProcess);
        } else {
            // Backward compatibility: create single slot from legacy fields
            PickupSlotRequest legacySlot = new PickupSlotRequest(
                    request.getPickupDate(),
                    request.getPickupFrom(),
                    request.getPickupTo(),
                    null);
            slotsToProcess = List.of(legacySlot);
        }

        // Get donor's timezone
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
                "UTC");
        LocalDateTime endTimeUTC = TimezoneResolver.convertDateTime(
                firstSlot.getPickupDate(),
                firstSlot.getEndTime(),
                donorTimezone,
                "UTC");

        // Update legacy fields with UTC times
        post.setPickupDate(startTimeUTC != null ? startTimeUTC.toLocalDate() : firstSlot.getPickupDate());
        post.setPickupFrom(startTimeUTC != null ? startTimeUTC.toLocalTime() : firstSlot.getStartTime());
        post.setPickupTo(endTimeUTC != null ? endTimeUTC.toLocalTime() : firstSlot.getEndTime());

        // Update pickup slots - properly handle the bidirectional relationship
        // Remove old slots by nullifying the parent reference first
        List<PickupSlot> oldSlots = new ArrayList<>(post.getPickupSlots());
        post.getPickupSlots().clear();

        // Save to trigger orphan removal
        surplusPostRepository.saveAndFlush(post);

        // Now add new slots
        for (int i = 0; i < slotsToProcess.size(); i++) {
            PickupSlotRequest slotReq = slotsToProcess.get(i);

            // Convert slot times from donor timezone to UTC
            LocalDateTime slotStartUTC = TimezoneResolver.convertDateTime(
                    slotReq.getPickupDate(),
                    slotReq.getStartTime(),
                    donorTimezone,
                    "UTC");
            LocalDateTime slotEndUTC = TimezoneResolver.convertDateTime(
                    slotReq.getPickupDate(),
                    slotReq.getEndTime(),
                    donorTimezone,
                    "UTC");

            PickupSlot slot = new PickupSlot();
            slot.setSurplusPost(post);
            slot.setPickupDate(slotStartUTC != null ? slotStartUTC.toLocalDate() : slotReq.getPickupDate());
            slot.setStartTime(slotStartUTC != null ? slotStartUTC.toLocalTime() : slotReq.getStartTime());
            slot.setEndTime(slotEndUTC != null ? slotEndUTC.toLocalTime() : slotReq.getEndTime());
            slot.setNotes(slotReq.getNotes());
            slot.setSlotOrder(i + 1);
            post.getPickupSlots().add(slot);
        }

        SurplusPost updatedPost = surplusPostRepository.saveAndFlush(post);

        // Create timeline event for donation update
        timelineService.createTimelineEvent(
                updatedPost,
                "DONATION_UPDATED",
                "donor",
                donor.getId(),
                null,
                PostStatus.AVAILABLE,
                "Donation details updated by "
                        + (donor.getOrganization() != null ? donor.getOrganization().getName() : donor.getEmail()),
                true);

        businessMetricsService.recordTimer(sample, "surplus.service.update", "status", "success");

        return convertToResponseForDonor(updatedPost, donorTimezone);
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
        response.setFabricationDate(post.getFabricationDate());
        response.setExpiryDate(post.getExpiryDate());
        response.setPickupDate(post.getPickupDate());
        response.setPickupFrom(post.getPickupFrom());
        response.setPickupTo(post.getPickupTo());
        response.setStatus(post.getStatus());
        response.setOtpCode(post.getOtpCode());
        response.setDonorId(post.getDonor().getId());
        response.setDonorEmail(post.getDonor().getEmail());
        response.setDonorName(post.getDonor().getOrganization() != null
                ? post.getDonor().getOrganization().getName()
                : null);
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        response.setTemperatureCategory(post.getTemperatureCategory());
        response.setPackagingType(post.getPackagingType());

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
     * Converts a SurplusPost entity to the SurplusResponse DTO with times converted
     * to donor's timezone.
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
                    donorTimezone);
            LocalDateTime pickupToDonor = TimezoneResolver.convertDateTime(
                    response.getPickupDate(),
                    response.getPickupTo(),
                    "UTC",
                    donorTimezone);

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
                        donorTimezone);
                LocalDateTime slotEndDonor = TimezoneResolver.convertDateTime(
                        slot.getPickupDate(),
                        slot.getEndTime(),
                        "UTC",
                        donorTimezone);

                PickupSlotResponse convertedSlot = new PickupSlotResponse();
                convertedSlot.setId(slot.getId());
                convertedSlot
                        .setPickupDate(slotStartDonor != null ? slotStartDonor.toLocalDate() : slot.getPickupDate());
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
                    donorTimezone);
            LocalDateTime confirmedEndDonor = TimezoneResolver.convertDateTime(
                    confirmedSlot.getPickupDate(),
                    confirmedSlot.getEndTime(),
                    "UTC",
                    donorTimezone);

            if (confirmedStartDonor != null) {
                confirmedSlot.setPickupDate(confirmedStartDonor.toLocalDate());
                confirmedSlot.setStartTime(confirmedStartDonor.toLocalTime());
            }
            if (confirmedEndDonor != null) {
                confirmedSlot.setEndTime(confirmedEndDonor.toLocalTime());
            }
        }

        // Add receiver/claimant information if the post is claimed
        // Get the most recent claim regardless of status (ACTIVE, COMPLETED,
        // NOT_COMPLETED)
        List<Claim> claims = claimRepository.findBySurplusPostId(post.getId());
        if (!claims.isEmpty()) {
            // Get the most recent claim (they should only have one anyway)
            Claim claim = claims.get(0);
            User receiver = claim.getReceiver();

            String receiverName = receiver.getOrganization() != null
                    ? receiver.getOrganization().getContactPerson()
                    : receiver.getEmail();
            response.setReceiverName(receiverName);
            response.setReceiverEmail(receiver.getEmail());
            if (receiver.getOrganization() != null) {
                response.setReceiverOrganization(receiver.getOrganization().getName());
            }
        }

        return response;
    }

    /**
     * Converts a SurplusPost entity to the SurplusResponse DTO with times converted
     * to receiver's timezone.
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
                    receiverTimezone);
            LocalDateTime pickupToReceiver = TimezoneResolver.convertDateTime(
                    response.getPickupDate(),
                    response.getPickupTo(),
                    "UTC",
                    receiverTimezone);

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
                        receiverTimezone);
                LocalDateTime slotEndReceiver = TimezoneResolver.convertDateTime(
                        slot.getPickupDate(),
                        slot.getEndTime(),
                        "UTC",
                        receiverTimezone);

                PickupSlotResponse convertedSlot = new PickupSlotResponse();
                convertedSlot.setId(slot.getId());
                convertedSlot.setPickupDate(
                        slotStartReceiver != null ? slotStartReceiver.toLocalDate() : slot.getPickupDate());
                convertedSlot.setStartTime(
                        slotStartReceiver != null ? slotStartReceiver.toLocalTime() : slot.getStartTime());
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
                    receiverTimezone);
            LocalDateTime confirmedEndReceiver = TimezoneResolver.convertDateTime(
                    confirmedSlot.getPickupDate(),
                    confirmedSlot.getEndTime(),
                    "UTC",
                    receiverTimezone);

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
                PostStatus.READY_FOR_PICKUP);
        List<SurplusPost> posts = surplusPostRepository.findByStatusIn(claimableStatuses);

        return posts.stream()
                .filter(post -> !claimRepository.existsBySurplusPostIdAndStatus(post.getId(), ClaimStatus.ACTIVE))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search surplus posts based on filter criteria using our custom filter
     * classes.
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
     * @param receiver      The receiver user (for timezone conversion)
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
     * Builds a JPA Specification from the filter request using our custom filter
     * classes.
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
            builder.and(LocationFilter.within(filterRequest.getUserLocation(), filterRequest.getMaxDistanceKm())
                    .toSpecification("pickupLocation"));
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
            throw new RuntimeException(
                    "You are not authorized to complete this post. Only the post owner can mark it as completed.");
        }

        if (post.getStatus() != PostStatus.READY_FOR_PICKUP) {
            throw new RuntimeException(
                    "Post must be in READY_FOR_PICKUP status to be completed. Current status: " + post.getStatus());
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

        // Validate pickup time is within tolerance window
        String pickupTimingStatus = validateAndGetPickupTiming(claim);

        post.setStatus(PostStatus.COMPLETED);
        post.setOtpCode(null);

        surplusPostRepository.save(post);
        
        // Complete the claim - this awards points and checks achievements for the receiver
        claimService.completeClaim(claim.getId());

        // Create timeline event for pickup confirmation with timing status
        String details = String.format("Pickup confirmed with OTP code (%s)", pickupTimingStatus);
        timelineService.createTimelineEvent(
                post,
                "PICKUP_CONFIRMED",
                "donor",
                donor.getId(),
                PostStatus.READY_FOR_PICKUP,
                PostStatus.COMPLETED,
                details,
                true);

        return convertToResponse(post);
    }

    /**
     * Validates if the current time is within the allowed pickup window and returns
     * the timing status.
     * The allowed window is: (confirmedStartTime - earlyTolerance) to
     * (confirmedEndTime + lateTolerance)
     * 
     * @param claim The claim with confirmed pickup slot
     * @return Timing status: "EARLY", "ON_TIME", or "LATE"
     * @throws RuntimeException if pickup is attempted outside the tolerance window
     */
    private String validateAndGetPickupTiming(Claim claim) {
        LocalDate confirmedDate = claim.getConfirmedPickupDate();
        java.time.LocalTime confirmedStartTime = claim.getConfirmedPickupStartTime();
        java.time.LocalTime confirmedEndTime = claim.getConfirmedPickupEndTime();

        // If no confirmed pickup slot, allow confirmation (backward compatibility)
        if (confirmedDate == null || confirmedStartTime == null || confirmedEndTime == null) {
            return "ON_TIME";
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = LocalDateTime.of(confirmedDate, confirmedStartTime);
        LocalDateTime windowEnd = LocalDateTime.of(confirmedDate, confirmedEndTime);

        // Apply tolerance
        int earlyToleranceMinutes = pickupTimeToleranceConfig.getEarlyToleranceMinutes();
        int lateToleranceMinutes = pickupTimeToleranceConfig.getLateToleranceMinutes();

        LocalDateTime allowedStart = windowStart.minusMinutes(earlyToleranceMinutes);
        LocalDateTime allowedEnd = windowEnd.plusMinutes(lateToleranceMinutes);

        // Check if too early
        if (now.isBefore(allowedStart)) {
            long minutesUntilAllowed = java.time.Duration.between(now, allowedStart).toMinutes();
            throw new RuntimeException(String.format(
                    "Pickup cannot be confirmed yet. Please wait %d more minute(s). " +
                            "Confirmation is allowed starting %d minutes before the scheduled pickup time.",
                    minutesUntilAllowed, earlyToleranceMinutes));
        }

        // Check if too late
        if (now.isAfter(allowedEnd)) {
            long minutesPastWindow = java.time.Duration.between(allowedEnd, now).toMinutes();
            throw new RuntimeException(String.format(
                    "Pickup window has expired. The window ended %d minute(s) ago. " +
                            "Confirmation was allowed up to %d minutes after the scheduled end time.",
                    minutesPastWindow, lateToleranceMinutes));
        }

        // Determine timing status
        if (now.isBefore(windowStart)) {
            return "EARLY";
        } else if (now.isAfter(windowEnd)) {
            return "LATE";
        } else {
            return "ON_TIME";
        }
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

    /**
     * Get timeline events for a donation post.
     * Verifies that the requesting user is either the donor or a receiver who has
     * claimed the post.
     * Returns only events visible to users (visibleToUsers=true).
     */
    @Transactional(readOnly = true)
    @Timed(value = "surplus.service.getTimeline", description = "Time taken to get timeline for a post")
    public List<DonationTimelineDTO> getTimelineForPost(Long postId, User user) {
        // Fetch the post
        SurplusPost post = surplusPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Surplus post not found"));

        // Authorization check: user must be the donor or a receiver with an
        // active/completed claim
        boolean isDonor = post.getDonor().getId().equals(user.getId());
        boolean isReceiver = false;

        if (!isDonor) {
            // Check if user is a receiver with an active or completed claim on this post
            Optional<Claim> activeClaim = claimRepository.findBySurplusPostIdAndStatus(postId, ClaimStatus.ACTIVE);
            if (activeClaim.isPresent() && activeClaim.get().getReceiver().getId().equals(user.getId())) {
                isReceiver = true;
            } else {
                // Also check for completed claims
                Optional<Claim> completedClaim = claimRepository.findBySurplusPostIdAndStatus(postId,
                        ClaimStatus.COMPLETED);
                if (completedClaim.isPresent() && completedClaim.get().getReceiver().getId().equals(user.getId())) {
                    isReceiver = true;
                }
            }
        }

        if (!isDonor && !isReceiver) {
            throw new RuntimeException("You are not authorized to view this timeline");
        }

        // Fetch timeline events that are visible to users
        List<DonationTimeline> timeline = timelineRepository
                .findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(postId, true);

        // Map to DTOs
        return timeline.stream()
                .map(this::mapToTimelineDTO)
                .collect(Collectors.toList());
    }

    /**
     * Map DonationTimeline entity to DTO
     */
    private DonationTimelineDTO mapToTimelineDTO(DonationTimeline timeline) {
        DonationTimelineDTO dto = new DonationTimelineDTO();
        dto.setId(timeline.getId());
        dto.setEventType(timeline.getEventType());
        dto.setTimestamp(timeline.getTimestamp());
        dto.setActor(timeline.getActor());
        dto.setActorUserId(timeline.getActorUserId());
        dto.setOldStatus(timeline.getOldStatus());
        dto.setNewStatus(timeline.getNewStatus());
        dto.setDetails(timeline.getDetails());
        dto.setVisibleToUsers(timeline.getVisibleToUsers());
        dto.setTemperature(timeline.getTemperature());
        dto.setPackagingCondition(timeline.getPackagingCondition());
        dto.setPickupEvidenceUrl(timeline.getPickupEvidenceUrl());
        return dto;
    }

    /**
     * Upload pickup evidence photo for a donation.
     * Only the donor who owns this donation can upload evidence.
     * Creates a timeline event to track the evidence upload.
     */
    @Transactional
    public UploadEvidenceResponse uploadPickupEvidence(Long postId, MultipartFile file, User donor) throws IOException {
        // Find the surplus post
        SurplusPost post = surplusPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Donation not found"));

        // Verify the donor owns this post
        if (!post.getDonor().getId().equals(donor.getId())) {
            throw new IllegalArgumentException("You are not authorized to upload evidence for this donation");
        }

        // Check that the donation is in a valid status for evidence upload (CLAIMED or
        // READY_FOR_PICKUP)
        PostStatus status = post.getStatus();
        if (status != PostStatus.CLAIMED && status != PostStatus.READY_FOR_PICKUP && status != PostStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Evidence can only be uploaded for claimed, ready for pickup, or completed donations");
        }

        // Store the file
        String fileUrl = fileStorageService.storePickupEvidence(file, postId);

        // Create a timeline event for the evidence upload
        DonationTimeline evidenceEvent = new DonationTimeline();
        evidenceEvent.setSurplusPost(post);
        evidenceEvent.setEventType("PICKUP_EVIDENCE_UPLOADED");
        evidenceEvent.setActor("donor");
        evidenceEvent.setActorUserId(donor.getId());
        evidenceEvent.setPickupEvidenceUrl(fileUrl);
        evidenceEvent.setDetails("Pickup evidence photo uploaded");
        evidenceEvent.setVisibleToUsers(true); // Visible to donor and admin
        evidenceEvent.setTimestamp(LocalDateTime.now());

        timelineRepository.save(evidenceEvent);

        return new UploadEvidenceResponse(fileUrl, "Evidence uploaded successfully", true);
    }

}
