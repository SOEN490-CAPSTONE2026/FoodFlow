package com.example.foodflow.service;

import com.example.foodflow.exception.BusinessException;
import com.example.foodflow.helpers.ArrayFilter;
import com.example.foodflow.helpers.BasicFilter;
import com.example.foodflow.helpers.LocationFilter;
import com.example.foodflow.helpers.SpecificationHandler;
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
import com.example.foodflow.model.entity.ExpiryAuditLog;
import com.example.foodflow.model.types.DietaryMatchMode;
import com.example.foodflow.model.types.DietaryTag;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.DonationTimelineRepository;
import com.example.foodflow.repository.ExpiryAuditLogRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.util.TimezoneResolver;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.Timer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SurplusService {

    private static final Logger logger = LoggerFactory.getLogger(SurplusService.class);

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final PickupSlotValidationService pickupSlotValidationService;
    private final BusinessMetricsService businessMetricsService;
    private final NotificationService notificationService;
    private final ExpiryCalculationService expiryCalculationService;
    private final ExpiryPredictionService expiryPredictionService;
    private final ExpirySuggestionService expirySuggestionService;
    private final ExpiryAuditLogRepository expiryAuditLogRepository;
    private final ObjectMapper objectMapper;
    private final TimelineService timelineService;
    private final DonationTimelineRepository timelineRepository;
    private final FileStorageService fileStorageService;
    private final GamificationService gamificationService;
    private final ClaimService claimService;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final NotificationPreferenceService notificationPreferenceService;
    private final FoodTypeImpactService foodTypeImpactService;

    @Value("${pickup.tolerance.early-minutes:15}")
    private int earlyToleranceMinutes;

    @Value("${pickup.tolerance.late-minutes:15}")
    private int lateToleranceMinutes;

    @Value("${foodflow.expiring-soon-hours:24}")
    private int expiringSoonHours;

    public SurplusService(SurplusPostRepository surplusPostRepository,
            ClaimRepository claimRepository,
            PickupSlotValidationService pickupSlotValidationService,
            BusinessMetricsService businessMetricsService,
            NotificationService notificationService,
            ExpiryCalculationService expiryCalculationService,
            ExpiryPredictionService expiryPredictionService,
            ExpirySuggestionService expirySuggestionService,
            ExpiryAuditLogRepository expiryAuditLogRepository,
            ObjectMapper objectMapper,
            TimelineService timelineService,
            DonationTimelineRepository timelineRepository,
            FileStorageService fileStorageService,
            GamificationService gamificationService,
            ClaimService claimService,
            SimpMessagingTemplate messagingTemplate,
            EmailService emailService,
            NotificationPreferenceService notificationPreferenceService,
            FoodTypeImpactService foodTypeImpactService) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.pickupSlotValidationService = pickupSlotValidationService;
        this.businessMetricsService = businessMetricsService;
        this.notificationService = notificationService;
        this.expiryCalculationService = expiryCalculationService;
        this.expiryPredictionService = expiryPredictionService;
        this.expirySuggestionService = expirySuggestionService;
        this.expiryAuditLogRepository = expiryAuditLogRepository;
        this.objectMapper = objectMapper;
        this.timelineService = timelineService;
        this.timelineRepository = timelineRepository;
        this.fileStorageService = fileStorageService;
        this.gamificationService = gamificationService;
        this.claimService = claimService;
        this.messagingTemplate = messagingTemplate;
        this.emailService = emailService;
        this.notificationPreferenceService = notificationPreferenceService;
        this.foodTypeImpactService = foodTypeImpactService;
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
        post.setFoodType(resolveFoodType(request));
        post.setDietaryTags(toDietaryTagArray(request.getDietaryTags()));

        // Handle optional fabrication/actual expiry dates.
        LocalDate fabricationDate = request.getFabricationDate();
        LocalDate expiryDate = request.getExpiryDate();

        if (fabricationDate != null) {
            if (!expiryCalculationService.isValidFabricationDate(fabricationDate)) {
                throw new IllegalArgumentException("Fabrication date cannot be in the future");
            }
            post.setFabricationDate(fabricationDate);
        }

        if (expiryDate != null && fabricationDate != null &&
                !expiryCalculationService.isValidExpiryDate(fabricationDate, expiryDate)) {
            throw new IllegalArgumentException(
                    "Expiry date must be after fabrication date and within reasonable limits");
        }
        post.setExpiryDate(expiryDate);
        post.setUserProvidedExpiryDate(expiryDate);

        applySubmissionExpirySuggestion(post);

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

        applyExpiryPredictionAndResolution(post, donor, "PREDICTION_RECALCULATED");

        SurplusPost savedPost = surplusPostRepository.save(post);

        // Track food category metrics
        if (savedPost.getFoodCategories() != null) {
            for (FoodCategory category : savedPost.getFoodCategories()) {
                businessMetricsService.incrementFoodCategoryPosts(category.name());
            }
        }

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
        post.setFoodType(resolveFoodType(request));
        post.setDietaryTags(toDietaryTagArray(request.getDietaryTags()));

        // Handle optional fabrication/actual expiry dates.
        LocalDate fabricationDate = request.getFabricationDate();
        LocalDate expiryDate = request.getExpiryDate();

        if (fabricationDate != null) {
            if (!expiryCalculationService.isValidFabricationDate(fabricationDate)) {
                throw new IllegalArgumentException("Fabrication date cannot be in the future");
            }
            post.setFabricationDate(fabricationDate);
        } else {
            post.setFabricationDate(null);
        }

        if (expiryDate != null && fabricationDate != null &&
                !expiryCalculationService.isValidExpiryDate(fabricationDate, expiryDate)) {
            throw new IllegalArgumentException(
                    "Expiry date must be after fabrication date and within reasonable limits");
        }
        post.setExpiryDate(expiryDate);
        post.setUserProvidedExpiryDate(expiryDate);

        applySubmissionExpirySuggestion(post);

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

        applyExpiryPredictionAndResolution(post, donor, "PREDICTION_RECALCULATED");
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
        response.setUserProvidedExpiryDate(post.getUserProvidedExpiryDate());
        response.setSuggestedExpiryDate(post.getSuggestedExpiryDate());
        response.setEligibleAtSubmission(post.getEligibleAtSubmission());
        response.setWarningsAtSubmission(deserializeWarnings(post.getWarningsAtSubmission()));
        response.setExpiryDateActual(post.getExpiryDate() != null
                ? post.getExpiryDate().atTime(23, 59, 59)
                : null);
        response.setExpiryDatePredicted(post.getExpiryDatePredicted());
        response.setExpiryDateEffective(post.getExpiryDateEffective());
        response.setPredictionConfidence(post.getExpiryPredictionConfidence());
        response.setPredictionVersion(post.getExpiryPredictionVersion());
        response.setExpiryOverridden(post.getExpiryOverridden());
        response.setExpired(isExpired(post));
        response.setExpiringSoon(isExpiringSoon(post));
        response.setImpactCo2eKg(post.getImpactCo2eKg());
        response.setImpactWaterL(post.getImpactWaterL());
        response.setImpactFactorVersion(post.getImpactFactorVersion());
        response.setImpactComputedAt(post.getImpactComputedAt());
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
        response.setFoodType(post.getFoodType());
        response.setDietaryTags(fromDietaryTagArray(post.getDietaryTags()));

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

        List<SurplusPost> posts = applyPostFiltersAndSort(surplusPostRepository.findAll(specification), filterRequest);

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

        List<SurplusPost> posts = applyReceiverPrioritization(
                applyPostFiltersAndSort(surplusPostRepository.findAll(specification), filterRequest),
                filterRequest);

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

        // Filter by food types (matches any requested type)
        if (filterRequest.hasFoodTypes()) {
            builder.and((root, query, cb) -> root.get("foodType").in(filterRequest.getFoodTypes()));
        }

        // Filter by expiry date (before), with fallback to legacy expiryDate.
        if (filterRequest.hasExpiryBefore()) {
            LocalDateTime expiryBeforeEndOfDay = filterRequest.getExpiryBefore().atTime(23, 59, 59);
            builder.and((root, query, cb) -> cb.or(
                    cb.and(
                            cb.isNotNull(root.get("expiryDateEffective")),
                            cb.lessThanOrEqualTo(root.get("expiryDateEffective"), expiryBeforeEndOfDay)),
                    cb.and(
                            cb.isNull(root.get("expiryDateEffective")),
                            cb.lessThanOrEqualTo(root.get("expiryDate"), filterRequest.getExpiryBefore()))));
        }

        // Filter by expiry date (after), with fallback to legacy expiryDate.
        if (filterRequest.hasExpiryAfter()) {
            LocalDateTime expiryAfterStartOfDay = filterRequest.getExpiryAfter().atStartOfDay();
            builder.and((root, query, cb) -> cb.or(
                    cb.and(
                            cb.isNotNull(root.get("expiryDateEffective")),
                            cb.greaterThanOrEqualTo(root.get("expiryDateEffective"), expiryAfterStartOfDay)),
                    cb.and(
                            cb.isNull(root.get("expiryDateEffective")),
                            cb.greaterThanOrEqualTo(root.get("expiryDate"), filterRequest.getExpiryAfter()))));
        }

        // Filter by location
        if (filterRequest.hasLocationFilter()) {
            builder.and(LocationFilter.within(filterRequest.getUserLocation(), filterRequest.getMaxDistanceKm())
                    .toSpecification("pickupLocation"));
        }

        return builder.buildOrDefault(SpecificationHandler.alwaysTrue());
    }

    private List<SurplusPost> applyPostFiltersAndSort(List<SurplusPost> posts, SurplusFilterRequest filterRequest) {
        List<SurplusPost> filtered = posts;

        if (filterRequest.hasDietaryTags()) {
            DietaryMatchMode mode = filterRequest.getDietaryMatch() != null
                    ? filterRequest.getDietaryMatch()
                    : DietaryMatchMode.ANY;

            Set<String> requestedTags = filterRequest.getDietaryTags().stream()
                    .map(Enum::name)
                    .collect(Collectors.toSet());

            filtered = filtered.stream()
                    .filter(post -> matchesDietaryTags(post.getDietaryTags(), requestedTags, mode))
                    .collect(Collectors.toList());
        }

        String sort = filterRequest.getSort();
        if (sort != null && !sort.isBlank()) {
            Comparator<SurplusPost> byEffectiveExpiry = Comparator.comparing(
                    this::resolveEffectiveExpiryForSort,
                    Comparator.nullsLast(Comparator.naturalOrder()));

            if ("expiry_desc".equalsIgnoreCase(sort)) {
                filtered = filtered.stream()
                        .sorted(byEffectiveExpiry.reversed())
                        .collect(Collectors.toList());
            } else if ("expiry_asc".equalsIgnoreCase(sort)) {
                filtered = filtered.stream()
                        .sorted(byEffectiveExpiry)
                        .collect(Collectors.toList());
            }
        }

        return filtered;
    }

    private List<SurplusPost> applyReceiverPrioritization(List<SurplusPost> posts, SurplusFilterRequest filterRequest) {
        List<SurplusPost> nonExpired = posts.stream()
                .filter(post -> !isExpired(post))
                .collect(Collectors.toList());

        Comparator<SurplusPost> comparator = Comparator
                .comparing((SurplusPost post) -> isExpiringSoon(post) ? 0 : 1)
                .thenComparing(
                        this::resolveEffectiveExpiryForSort,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(
                        SurplusPost::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder()));

        return nonExpired.stream()
                .sorted(comparator)
                .collect(Collectors.toList());
    }

    private boolean matchesDietaryTags(String[] postDietaryTags, Set<String> requestedTags, DietaryMatchMode mode) {
        if (requestedTags.isEmpty()) {
            return true;
        }

        Set<String> postTags = postDietaryTags == null
                ? Set.of()
                : Arrays.stream(postDietaryTags).collect(Collectors.toSet());

        if (mode == DietaryMatchMode.ALL) {
            return postTags.containsAll(requestedTags);
        }

        return requestedTags.stream().anyMatch(postTags::contains);
    }

    private FoodType resolveFoodType(CreateSurplusRequest request) {
        if (request.getFoodType() != null) {
            return request.getFoodType();
        }

        if (request.getFoodCategories() == null || request.getFoodCategories().isEmpty()) {
            return FoodType.PANTRY;
        }

        FoodCategory category = request.getFoodCategories().iterator().next();
        return mapFoodCategoryToFoodType(category);
    }

    private FoodType mapFoodCategoryToFoodType(FoodCategory category) {
        return switch (category) {
            case PREPARED_MEALS, READY_TO_EAT, SANDWICHES, SALADS, SOUPS, STEWS, CASSEROLES, LEFTOVERS -> FoodType.PREPARED;
            case FRUITS_VEGETABLES, LEAFY_GREENS, ROOT_VEGETABLES, BERRIES, CITRUS_FRUITS, TROPICAL_FRUITS -> FoodType.PRODUCE;
            case BAKERY_PASTRY, BREAD, BAKED_GOODS, BAKERY_ITEMS, CAKES_PASTRIES -> FoodType.BAKERY;
            case DAIRY, DAIRY_COLD, MILK, CHEESE, YOGURT, BUTTER, CREAM, EGGS -> FoodType.DAIRY_EGGS;
            case FRESH_MEAT, GROUND_MEAT, POULTRY -> FoodType.MEAT_POULTRY;
            case SEAFOOD, FISH, FROZEN_SEAFOOD -> FoodType.SEAFOOD;
            case BEVERAGES, WATER, JUICE, SOFT_DRINKS, SPORTS_DRINKS, TEA, COFFEE, HOT_CHOCOLATE, PROTEIN_SHAKES, SMOOTHIES -> FoodType.BEVERAGES;
            default -> FoodType.PANTRY;
        };
    }

    private String[] toDietaryTagArray(List<DietaryTag> dietaryTags) {
        if (dietaryTags == null || dietaryTags.isEmpty()) {
            return new String[0];
        }
        List<String> uniqueTags = new ArrayList<>(
                new LinkedHashSet<>(dietaryTags.stream().map(Enum::name).collect(Collectors.toList())));
        return uniqueTags.toArray(new String[0]);
    }

    private List<DietaryTag> fromDietaryTagArray(String[] dietaryTags) {
        if (dietaryTags == null || dietaryTags.length == 0) {
            return new ArrayList<>();
        }

        List<DietaryTag> result = new ArrayList<>();
        for (String tag : dietaryTags) {
            if (tag == null || tag.isBlank()) {
                continue;
            }
            try {
                result.add(DietaryTag.valueOf(tag));
            } catch (IllegalArgumentException ignored) {
                // Keep response resilient if legacy data has out-of-contract tags.
            }
        }
        return result;
    }

    @Transactional
    public SurplusResponse overrideExpiry(Long postId, String expiryDateRaw, String reason, User actor) {
        SurplusPost post = surplusPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Surplus post not found"));

        if (actor.getRole() != com.example.foodflow.model.entity.UserRole.ADMIN
                && !post.getDonor().getId().equals(actor.getId())) {
            throw new RuntimeException("You are not authorized to override expiry for this post");
        }

        LocalDateTime previousEffective = resolveEffectiveExpiryForSort(post);
        LocalDateTime overrideExpiry = parseExpiryOverride(expiryDateRaw);

        post.setExpiryOverridden(true);
        post.setExpiryOverrideReason(reason);
        post.setExpiryOverriddenAt(LocalDateTime.now(ZoneOffset.UTC));
        post.setExpiryOverriddenBy(actor.getId());
        post.setExpiryDateEffective(overrideExpiry);

        applyExpiryPredictionAndResolution(post, actor, "EXPIRY_OVERRIDDEN");
        SurplusPost saved = surplusPostRepository.save(post);
        logExpiryAudit(saved, actor.getId(), "EXPIRY_OVERRIDDEN", previousEffective, saved.getExpiryDateEffective(),
                Map.of("reason", reason));

        return convertToResponse(saved);
    }

    @Transactional
    public SurplusResponse clearExpiryOverride(Long postId, User actor) {
        SurplusPost post = surplusPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Surplus post not found"));

        if (actor.getRole() != com.example.foodflow.model.entity.UserRole.ADMIN
                && !post.getDonor().getId().equals(actor.getId())) {
            throw new RuntimeException("You are not authorized to clear expiry override for this post");
        }

        LocalDateTime previousEffective = resolveEffectiveExpiryForSort(post);

        post.setExpiryOverridden(false);
        post.setExpiryOverrideReason(null);
        post.setExpiryOverriddenAt(null);
        post.setExpiryOverriddenBy(null);

        applyExpiryPredictionAndResolution(post, actor, "EXPIRY_OVERRIDE_REMOVED");
        SurplusPost saved = surplusPostRepository.save(post);
        logExpiryAudit(saved, actor.getId(), "EXPIRY_OVERRIDE_REMOVED", previousEffective, saved.getExpiryDateEffective(),
                Map.of("reason", "override_removed"));

        return convertToResponse(saved);
    }

    private void applyExpiryPredictionAndResolution(SurplusPost post, User actor, String eventType) {
        ExpiryPredictionService.PredictionResult prediction = expiryPredictionService.predict(post);

        post.setExpiryDatePredicted(LocalDateTime.ofInstant(prediction.predictedExpiry(), ZoneOffset.UTC));
        post.setExpiryPredictionConfidence(prediction.confidence());
        post.setExpiryPredictionVersion(prediction.version());
        post.setExpiryPredictionInputs(serializeJson(prediction.inputs()));

        LocalDateTime previousEffective = post.getExpiryDateEffective();
        LocalDateTime effective = resolveEffectiveExpiry(post);
        post.setExpiryDateEffective(effective);

        Long actorId = actor != null ? actor.getId() : null;
        if (post.getId() != null && !equalsDateTime(previousEffective, effective)) {
            logExpiryAudit(post, actorId, eventType, previousEffective, effective, prediction.inputs());
        }
    }

    private void applySubmissionExpirySuggestion(SurplusPost post) {
        ExpirySuggestionService.SuggestionResult suggestion = expirySuggestionService.computeSuggestedExpiry(
                post.getFoodType(),
                post.getTemperatureCategory(),
                post.getPackagingType(),
                post.getFabricationDate());

        post.setSuggestedExpiryDate(suggestion.suggestedExpiryDate());
        post.setEligibleAtSubmission(suggestion.eligible());
        post.setWarningsAtSubmission(serializeJson(suggestion.warnings()));

        if (!suggestion.eligible()) {
            post.setFlagged(true);
            post.setFlagReason("requires_review: Not eligible at submission (temperature/food-type mismatch)");
        }
    }

    private LocalDateTime resolveEffectiveExpiry(SurplusPost post) {
        if (Boolean.TRUE.equals(post.getExpiryOverridden()) && post.getExpiryDateEffective() != null) {
            return post.getExpiryDateEffective();
        }

        if (post.getExpiryDate() != null) {
            return post.getExpiryDate().atTime(23, 59, 59);
        }

        return post.getExpiryDatePredicted();
    }

    private LocalDateTime resolveEffectiveExpiryForSort(SurplusPost post) {
        if (post.getExpiryDateEffective() != null) {
            return post.getExpiryDateEffective();
        }
        if (post.getExpiryDate() != null) {
            return post.getExpiryDate().atTime(23, 59, 59);
        }
        return post.getExpiryDatePredicted();
    }

    private boolean isExpired(SurplusPost post) {
        LocalDateTime effective = resolveEffectiveExpiryForSort(post);
        return effective != null && !LocalDateTime.now(ZoneOffset.UTC).isBefore(effective);
    }

    private boolean isExpiringSoon(SurplusPost post) {
        LocalDateTime effective = resolveEffectiveExpiryForSort(post);
        if (effective == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        return now.isBefore(effective) && !effective.isAfter(now.plusHours(expiringSoonHours));
    }

    private void logExpiryAudit(SurplusPost post, Long actorId, String eventType, LocalDateTime previousEffective,
            LocalDateTime newEffective, Map<String, Object> metadata) {
        try {
            ExpiryAuditLog logEntry = new ExpiryAuditLog();
            logEntry.setSurplusPost(post);
            logEntry.setActorId(actorId);
            logEntry.setEventType(eventType);
            logEntry.setPreviousEffective(previousEffective);
            logEntry.setNewEffective(newEffective);
            logEntry.setMetadata(serializeJson(metadata));
            expiryAuditLogRepository.save(logEntry);
        } catch (Exception e) {
            logger.warn("Failed to write expiry audit log for postId={}: {}", post.getId(), e.getMessage());
        }
    }

    private String serializeJson(Object payload) {
        if (payload == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{\"serializationError\":true}";
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> deserializeWarnings(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(rawJson, List.class);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private LocalDateTime parseExpiryOverride(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Override expiryDate is required");
        }

        try {
            return LocalDateTime.parse(raw.trim());
        } catch (Exception ignored) {
            try {
                return LocalDate.parse(raw.trim()).atTime(23, 59, 59);
            } catch (Exception ignoredAgain) {
                throw new IllegalArgumentException(
                        "Invalid expiryDate format. Use ISO date-time (e.g. 2026-02-17T15:00:00) or date (YYYY-MM-DD)");
            }
        }
    }

    private boolean equalsDateTime(LocalDateTime first, LocalDateTime second) {
        if (first == null && second == null) {
            return true;
        }
        if (first == null || second == null) {
            return false;
        }
        return first.equals(second);
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
            throw new BusinessException("error.auth.invalid_credentials");
        }

        post.setStatus(PostStatus.COMPLETED);
        foodTypeImpactService.applyImpactSnapshot(post);
        SurplusPost updatedPost = surplusPostRepository.save(post);

        // Also complete the related claim so pickup achievements are updated
        logger.info("Looking for claim associated with postId={}", post.getId());
        claimRepository.findBySurplusPost(post)
                .ifPresentOrElse(
                    claim -> {
                        logger.info("Found claim claimId={} with status={} for postId={}", claim.getId(), claim.getStatus(), post.getId());
                        if (claim.getStatus() != ClaimStatus.COMPLETED) {
                            claimService.completeClaim(claim.getId());
                            
                            User receiver = claim.getReceiver();
                            String receiverName = receiver.getOrganization() != null && receiver.getOrganization().getName() != null
                                ? receiver.getOrganization().getName()
                                : receiver.getFullName();
                            
                            // Send WebSocket notification to receiver that donation was completed (if preference allows)
                            try {
                                logger.info("Checking websocket preference for receiver userId={} for donationCompleted notification", receiver.getId());
                                
                                if (notificationPreferenceService.shouldSendNotification(receiver, "donationCompleted", "websocket")) {
                                    logger.info("Receiver {} has websocket notifications enabled for donationCompleted, sending websocket notification", receiver.getId());
                                    
                                    Map<String, Object> receiverNotification = new HashMap<>();
                                    receiverNotification.put("type", "DONATION_COMPLETED");
                                    receiverNotification.put("donationId", post.getId());
                                    receiverNotification.put("title", post.getTitle());
                                    receiverNotification.put("message", "Donation Completed");
                                    receiverNotification.put("timestamp", System.currentTimeMillis());
                                    
                                    messagingTemplate.convertAndSendToUser(
                                        receiver.getId().toString(),
                                        "/queue/donations/completed",
                                        receiverNotification
                                    );
                                    logger.info("Successfully sent donation completed websocket notification to receiver userId={} for postId={}", receiver.getId(), post.getId());
                                } else {
                                    logger.info("Receiver {} has websocket notifications disabled for donationCompleted, skipping websocket notification", receiver.getId());
                                }
                            } catch (Exception e) {
                                logger.error("Failed to send donation completed websocket notification to receiver: {}", e.getMessage(), e);
                            }
                            
                            // Send email notification to receiver that donation was completed (if preference allows)
                            try {
                                logger.info("Checking email preference for receiver userId={} for donationCompleted notification", receiver.getId());
                                
                                if (notificationPreferenceService.shouldSendNotification(receiver, "donationCompleted", "email")) {
                                    logger.info("Receiver {} has email notifications enabled for donationCompleted, sending email", receiver.getId());
                                    
                                    String donorName = donor.getOrganization() != null && donor.getOrganization().getName() != null 
                                        ? donor.getOrganization().getName() 
                                        : donor.getFullName();
                                    
                                    Map<String, Object> donationData = new HashMap<>();
                                    donationData.put("donationTitle", post.getTitle());
                                    donationData.put("quantity", post.getQuantity().getValue() + " " + post.getQuantity().getUnit().getLabel());
                                    donationData.put("donorName", donorName);
                                    
                                    emailService.sendDonationCompletedNotification(
                                        receiver.getEmail(),
                                        receiverName,
                                        donationData
                                    );
                                    
                                    logger.info("Successfully sent donation completed email to receiver userId={} email={}", receiver.getId(), receiver.getEmail());
                                } else {
                                    logger.info("Receiver {} has email notifications disabled for donationCompleted or email globally disabled, skipping email", receiver.getId());
                                }
                            } catch (Exception e) {
                                logger.error("Failed to send donation completed email notification to receiver: {}", e.getMessage(), e);
                                // Don't throw - email is secondary to main functionality
                            }
                            
                            // Send email notification to donor that donation was picked up (with preference checking)
                            try {
                                logger.info("Checking email preference for donor userId={} for donationPickedUp notification", donor.getId());
                                
                                if (notificationPreferenceService.shouldSendNotification(donor, "donationPickedUp", "email")) {
                                    logger.info("Donor {} has email notifications enabled for donationPickedUp, sending email", donor.getId());
                                    
                                    // Prepare notification data
                                    String donorName = donor.getOrganization() != null && donor.getOrganization().getName() != null 
                                        ? donor.getOrganization().getName() 
                                        : donor.getFullName();
                                    
                                    Map<String, Object> donationData = new HashMap<>();
                                    donationData.put("donationTitle", post.getTitle());
                                    donationData.put("quantity", post.getQuantity().getValue() + " " + post.getQuantity().getUnit().getLabel());
                                    donationData.put("receiverName", receiverName);
                                    
                                    emailService.sendDonationPickedUpNotification(
                                        donor.getEmail(),
                                        donorName,
                                        donationData
                                    );
                                    
                                    logger.info("Successfully sent donation picked up email to donor userId={} email={}", donor.getId(), donor.getEmail());
                                } else {
                                    logger.info("Donor {} has email notifications disabled for donationPickedUp or email globally disabled, skipping email", donor.getId());
                                }
                            } catch (Exception e) {
                                logger.error("Failed to send donation picked up email notification to donor: {}", e.getMessage(), e);
                            }
                        } else {
                            logger.info("Claim claimId={} already completed, skipping notification", claim.getId());
                        }
                    },
                    () -> logger.warn("No claim found for postId={}, skipping receiver notification", post.getId())
                );



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

        // Validate pickup time with tolerance
        LocalDate confirmedDate = claim.getConfirmedPickupDate();
        LocalTime confirmedStartTime = claim.getConfirmedPickupStartTime();
        LocalTime confirmedEndTime = claim.getConfirmedPickupEndTime();

        if (confirmedDate != null && confirmedStartTime != null && confirmedEndTime != null) {
            ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));
            LocalDate today = nowUtc.toLocalDate();
            LocalTime currentTime = nowUtc.toLocalTime();

            // Apply tolerance: early tolerance for start, late tolerance for end
            LocalTime adjustedStartTime = confirmedStartTime.minusMinutes(earlyToleranceMinutes);
            LocalTime adjustedEndTime = confirmedEndTime.plusMinutes(lateToleranceMinutes);

            boolean isTooEarly = confirmedDate.isAfter(today) ||
                    (confirmedDate.isEqual(today) && currentTime.isBefore(adjustedStartTime));
            boolean isTooLate = confirmedDate.isBefore(today) ||
                    (confirmedDate.isEqual(today) && currentTime.isAfter(adjustedEndTime));

            if (isTooEarly) {
                throw new RuntimeException("Pickup cannot be confirmed yet. The pickup window starts at "
                        + confirmedStartTime + " (you can arrive up to " + earlyToleranceMinutes + " minutes early).");
            }

            if (isTooLate) {
                throw new RuntimeException("Pickup window has expired. The window ended at "
                        + confirmedEndTime + " (with " + lateToleranceMinutes + " minutes grace period).");
            }
        }

        post.setStatus(PostStatus.COMPLETED);
        post.setOtpCode(null);
        foodTypeImpactService.applyImpactSnapshot(post);

        surplusPostRepository.save(post);

        // Complete the claim - this awards points and checks achievements for the
        // receiver
        claimService.completeClaim(claim.getId());

        // Create timeline event for pickup confirmation
        timelineService.createTimelineEvent(
                post,
                "PICKUP_CONFIRMED",
                "donor",
                donor.getId(),
                PostStatus.READY_FOR_PICKUP,
                PostStatus.COMPLETED,
                "Pickup confirmed with OTP code",
                true);

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
