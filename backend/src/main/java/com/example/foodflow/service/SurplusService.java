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
import com.example.foodflow.model.entity.AuditLog;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SurplusService {

    private final SurplusPostRepository surplusPostRepository;
    private static final Logger log = LoggerFactory.getLogger(SurplusService.class);
    private final AuditLogger auditLogger;
    
    public SurplusService(SurplusPostRepository surplusPostRepository, AuditLogger auditLogger) {
        this.surplusPostRepository = surplusPostRepository;
        this.auditLogger = auditLogger;
    }

    @Transactional
    public SurplusResponse createSurplusPost(CreateSurplusRequest request, User donor) {
        SurplusPost post = new SurplusPost();
        post.setDonor(donor);
        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setFoodCategories(request.getFoodCategories());
        post.setQuantity(request.getQuantity());
        post.setPickupLocation(request.getPickupLocation());
        post.setExpiryDate(request.getExpiryDate());
        post.setPickupDate(request.getPickupDate());
        post.setPickupFrom(request.getPickupFrom());
        post.setPickupTo(request.getPickupTo());
        post.setStatus(request.getStatus()); // defaults to AVAILABLE if not set
        
        SurplusPost savedPost = surplusPostRepository.save(post);
        return convertToResponse(savedPost);
    }

    public List<SurplusResponse> getUserSurplusPosts(User user) {
        return surplusPostRepository.findByDonorId(user.getId())
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

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
        return response;
    }

    public List<SurplusResponse> getAllAvailableSurplusPosts() {
    List<SurplusPost> posts = surplusPostRepository.findByStatus(PostStatus.CLAIMED);
    return posts.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }  
    
    private void recordAudit(String username, String action, String entityType,
                         String entityId, String oldValue, String newValue) {
    try {
        AuditLog entry = new AuditLog();
        entry.setUsername(username);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setTimestamp(LocalDateTime.now());
        entry.setOldValue(oldValue);
        entry.setNewValue(newValue);

        auditLogger.logAction(entry);
    } catch (Exception e) {
        log.error("Failed to record audit log for {}: {}", action, e.getMessage());
    }
}
    @Transactional
public void generatePickupCode(SurplusPost post) {
    String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));

    post.setPickupCode(otp);
    post.setPickupCodeExpiration(LocalDateTime.now().plusMinutes(30)); // 30-min validity
    surplusPostRepository.save(post);

    recordAudit(
        post.getDonor().getEmail(),
        "PICKUP_CODE_GENERATED",
        "SurplusPost",
        String.valueOf(post.getId()),
        null,
        "OTP generated (expires at " + post.getPickupCodeExpiration() + ")"
    );
}

@Transactional
public PickupConfirmationResponse confirmPickup(Long postId, String otp) {
    
    SurplusPost post = surplusPostRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));

    if (post.getPickupCode() == null) {
        log.warn("No pickup code found for post ID: {}", postId);
        return new PickupConfirmationResponse(false, "No pickup code found for this post.");
    }

    if (post.getPickupCodeExpiration() == null ||
        post.getPickupCodeExpiration().isBefore(LocalDateTime.now())) {

        log.warn("Expired OTP attempt for post ID: {}", postId);
        recordAudit(
            post.getDonor().getEmail(),
            "PICKUP_CODE_EXPIRED",
            "SurplusPost",
            String.valueOf(postId),
            null,
            "Expired OTP used for post"
        );
        return new PickupConfirmationResponse(false, "Pickup code has expired.");
    }

    if (!post.getPickupCode().equals(otp)) {
        log.warn("Invalid OTP '{}' entered for post ID: {}", otp, postId);
        recordAudit(
            post.getDonor().getEmail(),
            "PICKUP_CODE_INVALID",
            "SurplusPost",
            String.valueOf(postId),
            null,
            "Invalid OTP attempt: " + otp
        );
        return new PickupConfirmationResponse(false, "Invalid pickup code.");
    }

    /**
     * Search surplus posts based on filter criteria using our custom filter classes.
     * If no filters are provided, returns all available posts.
     */
    public List<SurplusResponse> searchSurplusPosts(SurplusFilterRequest filterRequest) {
        Specification<SurplusPost> specification = buildSpecificationFromFilter(filterRequest);
        
        List<SurplusPost> posts = surplusPostRepository.findAll(specification);
        
        return posts.stream()
                .map(this::convertToResponse)
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
    public SurplusResponse completeSurplusPost(Long postId, String otpCode, User donor) {
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

        return convertToResponse(updatedPost);
    }

    private String generateOtpCode() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
    }
