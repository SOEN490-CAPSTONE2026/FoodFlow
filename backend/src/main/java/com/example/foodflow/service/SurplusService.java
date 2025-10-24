package com.example.foodflow.service;

import com.example.foodflow.audit.AuditLogger;
import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.PickupConfirmationResponse;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.AuditLog;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.SurplusPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
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
    
    /**
     * Creates a new SurplusPost from the request DTO and saves it to the database.
     */
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
    
    /**
     * Retrieves all surplus posts for a given user.
     */
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

    PostStatus oldStatus = post.getStatus();
    post.setStatus(PostStatus.PICKED_UP);
    post.setPickupTimestamp(LocalDateTime.now());
    surplusPostRepository.save(post);

    recordAudit(
        post.getDonor().getEmail(),
        "PICKUP_CONFIRMED",
        "SurplusPost",
        String.valueOf(postId),
        oldStatus.name(),
        "Status changed to PICKED_UP at " + post.getPickupTimestamp()
    );

    return new PickupConfirmationResponse(true, "Pickup confirmed successfully.");
}


    }
