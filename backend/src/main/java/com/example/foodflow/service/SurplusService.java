package com.example.foodflow.service;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.PickupSlotRequest;
import com.example.foodflow.model.dto.PickupSlotResponse;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.PickupSlot;
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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SurplusService {
    
    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final PickupSlotValidationService pickupSlotValidationService;
    private final BusinessMetricsService businessMetricsService;

    public SurplusService(SurplusPostRepository surplusPostRepository, 
                         ClaimRepository claimRepository,
                         PickupSlotValidationService pickupSlotValidationService,
                         BusinessMetricsService businessMetricsService) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.pickupSlotValidationService = pickupSlotValidationService;
        this.businessMetricsService = businessMetricsService;
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

        // Set legacy fields from first slot (for backward compatibility)
        PickupSlotRequest firstSlot = slotsToProcess.get(0);
        post.setPickupDate(firstSlot.getPickupDate());
        post.setPickupFrom(firstSlot.getStartTime());
        post.setPickupTo(firstSlot.getEndTime());

        // Create pickup slot entities
        List<PickupSlot> pickupSlots = new ArrayList<>();
        for (int i = 0; i < slotsToProcess.size(); i++) {
            PickupSlotRequest slotReq = slotsToProcess.get(i);
            PickupSlot slot = new PickupSlot();
            slot.setSurplusPost(post);
            slot.setPickupDate(slotReq.getPickupDate());
            slot.setStartTime(slotReq.getStartTime());
            slot.setEndTime(slotReq.getEndTime());
            slot.setNotes(slotReq.getNotes());
            slot.setSlotOrder(i + 1); // 1-indexed
            pickupSlots.add(slot);
        }
        post.setPickupSlots(pickupSlots);

        // Check if pickup time has already started - set status immediately
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDate today = now.toLocalDate();
        java.time.LocalTime currentTime = now.toLocalTime();

        boolean pickupTimeStarted = false;
        if (firstSlot.getPickupDate().isBefore(today)) {
            pickupTimeStarted = true;
        } else if (firstSlot.getPickupDate().isEqual(today)) {
            pickupTimeStarted = !currentTime.isBefore(firstSlot.getStartTime());
        }

        if (pickupTimeStarted) {
            post.setStatus(PostStatus.READY_FOR_PICKUP);
            // Generate OTP immediately
            post.setOtpCode(generateOtpCode());
        } else {
            post.setStatus(request.getStatus() != null ? request.getStatus() : PostStatus.AVAILABLE);
        }

        SurplusPost savedPost = surplusPostRepository.save(post);

        businessMetricsService.incrementSurplusPostCreated();
        businessMetricsService.recordTimer(sample, "surplus.service.create", "status", savedPost.getStatus().toString());

        return convertToResponse(savedPost);
    }
    
    /**
     * Retrieves all surplus posts for a given user.
     */
    @Timed(value = "surplus.service.getUserPosts", description = "Time taken to get user surplus posts")
    public List<SurplusResponse> getUserSurplusPosts(User user) {
        return surplusPostRepository.findByDonorId(user.getId())
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Converts a SurplusPost entity to the SurplusResponse DTO.
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
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        
        // Convert pickup slots
        if (post.getPickupSlots() != null && !post.getPickupSlots().isEmpty()) {
            List<PickupSlotResponse> slotResponses = post.getPickupSlots().stream()
                .map(PickupSlotResponse::fromEntity)
                .collect(Collectors.toList());
            response.setPickupSlots(slotResponses);
        }
        
        return response;
    }
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

    @Transactional
    @Timed(value = "surplus.service.complete", description = "Time taken to complete a surplus post")
    public SurplusResponse completeSurplusPost(Long postId, String otpCode, User donor) {
        Timer.Sample sample = businessMetricsService.startTimer();
        // Fetch the surplus post
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

        // Mark as completed
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
}
