package com.example.foodflow.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.FeedbackService;

import jakarta.validation.Valid;

/**
 * REST controller for feedback operations
 */
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {
    
    @Autowired
    private FeedbackService feedbackService;
    
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
     * Get user rating summary
     * GET /api/feedback/rating/{userId}
     */
    @GetMapping("/rating/{userId}")
    public ResponseEntity<UserRatingDTO> getUserRating(@PathVariable Long userId) {
        // Note: This would need UserService to get user by ID
        // For now, assuming we have a way to get user
        User user = getUserById(userId); // You'll need to implement this
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        UserRatingDTO rating = feedbackService.getUserRating(user);
        return ResponseEntity.ok(rating);
    }
    
    /**
     * Get current user's rating summary
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
        
        User targetUser = userId != null ? getUserById(userId) : currentUser;
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
    
    // Helper method - you'll need to implement this based on your UserService
    private User getUserById(Long userId) {
        // TODO: Implement user lookup through UserService or UserRepository
        // return userService.findById(userId);
        return null; // Placeholder
    }
}