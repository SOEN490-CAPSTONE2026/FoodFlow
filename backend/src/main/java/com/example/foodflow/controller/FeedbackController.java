package com.example.foodflow.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.foodflow.model.dto.FeedbackRequestDTO;
import com.example.foodflow.model.dto.FeedbackResponseDTO;
import com.example.foodflow.model.dto.UserRatingDTO;
import com.example.foodflow.model.dto.AdminRatingDashboardDTO;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.FeedbackService;
import com.example.foodflow.repository.UserRepository;

import jakarta.validation.Valid;

/**
 * REST controller for feedback operations
 */
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {
    
    @Autowired
    private FeedbackService feedbackService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Submit feedback for a completed donation
     * POST /api/feedback
     */
    @PostMapping
    public ResponseEntity<FeedbackResponseDTO> submitFeedback(
            @Valid @RequestBody FeedbackRequestDTO requestDTO,
            @AuthenticationPrincipal User currentUser) {
        
        try {
            FeedbackResponseDTO response = feedbackService.submitFeedback(requestDTO, currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }
    
    /**
     * Get feedback for a specific claim
     * GET /api/feedback/claim/{claimId}
     */
    @GetMapping("/claim/{claimId}")
    public ResponseEntity<List<FeedbackResponseDTO>> getFeedbackForClaim(
            @PathVariable Long claimId,
            @AuthenticationPrincipal User currentUser) {
        
        try {
            List<FeedbackResponseDTO> feedback = feedbackService.getFeedbackForClaim(claimId, currentUser);
            return ResponseEntity.ok(feedback);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get all feedback received by the current user
     * GET /api/feedback/my-reviews
     */
    @GetMapping("/my-reviews")
    public ResponseEntity<List<FeedbackResponseDTO>> getMyFeedback(
            @AuthenticationPrincipal User currentUser) {
        
        List<FeedbackResponseDTO> feedback = feedbackService.getFeedbackForUser(currentUser);
        return ResponseEntity.ok(feedback);
    }
    
    /**
     * Get user rating summary - For story: "users see only their own rating summary"
     * GET /api/feedback/rating/{userId}
     */
    @GetMapping("/rating/{userId}")
    public ResponseEntity<UserRatingDTO> getUserRating(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        
        try {
            User targetUser = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
            
            // Users can only see their own ratings, unless they're admin
            if (!currentUser.getId().equals(userId) && !isAdmin(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            UserRatingDTO rating = feedbackService.getUserRating(targetUser);
            return ResponseEntity.ok(rating);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get current user's rating summary - For story: "visible average rating shown on profile"
     * GET /api/feedback/my-rating
     */
    @GetMapping("/my-rating")
    public ResponseEntity<UserRatingDTO> getMyRating(
            @AuthenticationPrincipal User currentUser) {
        
        UserRatingDTO rating = feedbackService.getUserRating(currentUser);
        return ResponseEntity.ok(rating);
    }
    
    /**
     * Check if user can provide feedback for a claim
     * GET /api/feedback/can-review/{claimId}
     */
    @GetMapping("/can-review/{claimId}")
    public ResponseEntity<Boolean> canProvideFeedback(
            @PathVariable Long claimId,
            @AuthenticationPrincipal User currentUser) {
        
        boolean canReview = feedbackService.canProvideFeedback(claimId, currentUser);
        return ResponseEntity.ok(canReview);
    }
    
    /**
     * Get claims that need feedback from the current user
     * GET /api/feedback/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Claim>> getClaimsNeedingFeedback(
            @AuthenticationPrincipal User currentUser) {
        
        List<Claim> claims = feedbackService.getClaimsNeedingFeedback(currentUser);
        return ResponseEntity.ok(claims);
    }
    
    /**
     * Get recent feedback for a user (for profile display)
     * GET /api/feedback/recent?userId=123&limit=5
     */
    @GetMapping("/recent")
    public ResponseEntity<List<FeedbackResponseDTO>> getRecentFeedback(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "5") int limit,
            @AuthenticationPrincipal User currentUser) {
        
        User targetUser = currentUser;
        
        if (userId != null){  
            targetUser = userRepository.findById(userId) .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        }

        if (targetUser == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<FeedbackResponseDTO> recentFeedback = feedbackService.getRecentFeedback(targetUser, limit);
        return ResponseEntity.ok(recentFeedback);
    }
    
    /**
     * Check if feedback is complete for a claim (both parties reviewed)
     * GET /api/feedback/complete/{claimId}
     */
    @GetMapping("/complete/{claimId}")
    public ResponseEntity<Boolean> isFeedbackComplete(@PathVariable Long claimId) {
        boolean isComplete = feedbackService.isFeedbackComplete(claimId);
        return ResponseEntity.ok(isComplete);
    }
    
    // ====== NEW ADMIN ENDPOINTS FOR THIS STORY ======
    
    /**
     * ADMIN: Get full rating history for any user - For story: "Admin sees every user's full rating history"
     * GET /admin/users/{userId}/ratings
     */
    @GetMapping("/admin/users/{userId}/ratings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackResponseDTO>> getAdminUserRatings(
            @PathVariable Long userId) {
        
        try {
            User targetUser = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

            List<FeedbackResponseDTO> allFeedback = feedbackService.getAllFeedbackForUser(targetUser);
            return ResponseEntity.ok(allFeedback);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * ADMIN: Get rating dashboard with filters - For story: "Admin dashboard filter with ratings"
     * GET /admin/ratings/dashboard?filter=top-rated|low-rated|flagged
     */
    @GetMapping("/admin/ratings/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminRatingDashboardDTO> getAdminRatingDashboard(
            @RequestParam(required = false) String filter,
            @RequestParam(defaultValue = "20") int limit) {
        
        AdminRatingDashboardDTO dashboard = feedbackService.getAdminRatingDashboard(filter, limit);
        return ResponseEntity.ok(dashboard);
    }
    
    /**
     * ADMIN: Get users below rating threshold - For story: "Low-rating thresholds trigger automatic admin alert"
     * GET /admin/ratings/below-threshold
     */
    @GetMapping("/admin/ratings/below-threshold")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserRatingDTO>> getUsersBelowThreshold(
            @RequestParam(defaultValue = "2.0") Double threshold,
            @RequestParam(defaultValue = "3") Integer minReviews) {
        
        List<UserRatingDTO> lowRatedUsers = feedbackService.getUsersBelowThreshold(threshold, minReviews);
        return ResponseEntity.ok(lowRatedUsers);
    }
    
    /**
     * ADMIN: Get flagged/problematic ratings - For story: "Flags or reports associated with low ratings"
     * GET /admin/ratings/flagged
     */
    @GetMapping("/admin/ratings/flagged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackResponseDTO>> getFlaggedRatings() {
        
        List<FeedbackResponseDTO> flaggedFeedback = feedbackService.getFlaggedFeedback();
        return ResponseEntity.ok(flaggedFeedback);
    }
    
    // Helper method to check admin status
    private boolean isAdmin(User user) {
        return user != null && user.getRole() != null && 
               "ADMIN".equals(user.getRole().toString());
    }
}