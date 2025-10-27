package com.example.foodflow.service;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SurplusService {
    
    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;

    public SurplusService(SurplusPostRepository surplusPostRepository, ClaimRepository claimRepository) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
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

        // Check if pickup time has already started - set status immediately
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDate today = now.toLocalDate();
        java.time.LocalTime currentTime = now.toLocalTime();

        boolean pickupTimeStarted = false;
        if (request.getPickupDate().isBefore(today)) {
            pickupTimeStarted = true;
        } else if (request.getPickupDate().isEqual(today)) {
            pickupTimeStarted = !currentTime.isBefore(request.getPickupFrom());
        }

        if (pickupTimeStarted) {
            post.setStatus(PostStatus.READY_FOR_PICKUP);
            // Generate OTP immediately
            post.setOtpCode(generateOtpCode());
        } else {
            post.setStatus(request.getStatus() != null ? request.getStatus() : PostStatus.AVAILABLE);
        }

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
        response.setOtpCode(post.getOtpCode());
        response.setDonorEmail(post.getDonor().getEmail());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
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
