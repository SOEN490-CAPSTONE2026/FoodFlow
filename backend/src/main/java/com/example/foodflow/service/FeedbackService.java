package com.example.foodflow.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.foodflow.model.dto.FeedbackRequestDTO;
import com.example.foodflow.model.dto.FeedbackResponseDTO;
import com.example.foodflow.model.dto.UserRatingDTO;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.Feedback;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.FeedbackRepository;

/**
 * Service for managing feedback operations
 */
@Service
@Transactional
public class FeedbackService {
    
    @Autowired
    private FeedbackRepository feedbackRepository;
    
    @Autowired
    private ClaimRepository claimRepository;
    
    /**
     * Submit feedback for a completed donation
     */
    public FeedbackResponseDTO submitFeedback(FeedbackRequestDTO requestDTO, User reviewer) {
        // Find the claim
        Claim claim = claimRepository.findById(requestDTO.getClaimId())
            .orElseThrow(() -> new IllegalArgumentException("Claim not found"));
        
        // Validate claim is completed
        if (claim.getStatus() != ClaimStatus.COMPLETED) {
            throw new IllegalStateException("Can only provide feedback for completed claims");
        }
        
        // Validate reviewer is part of this claim
        User donor = claim.getSurplusPost().getDonor();
        User receiver = claim.getReceiver();
        
        if (!reviewer.getId().equals(donor.getId()) && !reviewer.getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("You can only provide feedback for your own donations");
        }
        
        // Check if feedback already exists
        if (feedbackRepository.existsByClaimAndReviewer(claim, reviewer)) {
            throw new IllegalStateException("You have already provided feedback for this donation");
        }
        
        // Determine reviewee (the other party)
        User reviewee = reviewer.getId().equals(donor.getId()) ? receiver : donor;
        
        // Create and save feedback
        Feedback feedback = new Feedback(claim, reviewer, reviewee, requestDTO.getRating(), requestDTO.getReviewText());
        feedback = feedbackRepository.save(feedback);
        
        return convertToResponseDTO(feedback);
    }
    
    /**
     * Get feedback for a specific claim
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponseDTO> getFeedbackForClaim(Long claimId, User user) {
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new IllegalArgumentException("Claim not found"));
        
        // Validate user is part of this claim
        if (!user.getId().equals(claim.getSurplusPost().getDonor().getId()) && 
            !user.getId().equals(claim.getReceiver().getId())) {
            throw new IllegalArgumentException("You can only view feedback for your own donations");
        }
        
        List<Feedback> feedbackList = feedbackRepository.findByClaim(claim);
        return feedbackList.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all feedback received by a user
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponseDTO> getFeedbackForUser(User user) {
        List<Feedback> feedbackList = feedbackRepository.findByRevieweeOrderByCreatedAtDesc(user);
        return feedbackList.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get user rating summary with aggregated data
     */
    @Transactional(readOnly = true)
    public UserRatingDTO getUserRating(User user) {
        UserRatingDTO userRating = new UserRatingDTO();
        userRating.setUserId(user.getId());
        userRating.setUserName(getUserDisplayName(user));
        
        // Get average rating and total reviews
        Double averageRating = feedbackRepository.getAverageRatingForUser(user);
        Long totalReviews = feedbackRepository.getTotalReviewsForUser(user);
        
        userRating.setAverageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0);
        userRating.setTotalReviews(totalReviews != null ? totalReviews.intValue() : 0);
        
        // Get rating distribution
        List<Object[]> distribution = feedbackRepository.getRatingDistributionForUser(user);
        Map<Integer, Integer> ratingCounts = new HashMap<>();
        
        for (Object[] row : distribution) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            ratingCounts.put(rating, count.intValue());
        }
        
        userRating.setFiveStarCount(ratingCounts.getOrDefault(5, 0));
        userRating.setFourStarCount(ratingCounts.getOrDefault(4, 0));
        userRating.setThreeStarCount(ratingCounts.getOrDefault(3, 0));
        userRating.setTwoStarCount(ratingCounts.getOrDefault(2, 0));
        userRating.setOneStarCount(ratingCounts.getOrDefault(1, 0));
        
        return userRating;
    }
    
    /**
     * Check if user can provide feedback for a claim
     */
    @Transactional(readOnly = true)
    public boolean canProvideFeedback(Long claimId, User user) {
        Optional<Claim> claimOpt = claimRepository.findById(claimId);
        if (claimOpt.isEmpty()) {
            return false;
        }
        
        Claim claim = claimOpt.get();
        
        // Check if claim is completed
        if (claim.getStatus() != ClaimStatus.COMPLETED) {
            return false;
        }
        
        // Check if user is part of this claim
        if (!user.getId().equals(claim.getSurplusPost().getDonor().getId()) && 
            !user.getId().equals(claim.getReceiver().getId())) {
            return false;
        }
        
        // Check if user hasn't already provided feedback
        return !feedbackRepository.existsByClaimAndReviewer(claim, user);
    }
    
    /**
     * Get claims that need feedback from the user
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsNeedingFeedback(User user) {
        // Find completed claims where user is either donor or receiver but hasn't given feedback
        return claimRepository.findCompletedClaimsForUser(user).stream()
                .filter(claim -> !feedbackRepository.existsByClaimAndReviewer(claim, user))
                .collect(Collectors.toList());
    }
    
    /**
     * Get recent feedback for a user (for displaying on profile)
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponseDTO> getRecentFeedback(User user, int limit) {
        List<Feedback> recentFeedback = feedbackRepository.findRecentFeedbackForUser(
            user, PageRequest.of(0, limit));
        
        return recentFeedback.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Check if both parties have provided feedback for a claim
     */
    @Transactional(readOnly = true)
    public boolean isFeedbackComplete(Long claimId) {
        Optional<Claim> claimOpt = claimRepository.findById(claimId);
        if (claimOpt.isEmpty()) {
            return false;
        }
        
        Long feedbackCount = feedbackRepository.countFeedbackForClaim(claimOpt.get());
        return feedbackCount >= 2; // Both donor and receiver have provided feedback
    }
    
    /**
     * Convert Feedback entity to response DTO
     */
    private FeedbackResponseDTO convertToResponseDTO(Feedback feedback) {
        return new FeedbackResponseDTO(
            feedback.getId(),
            feedback.getClaim().getId(),
            feedback.getReviewer().getId(),
            getUserDisplayName(feedback.getReviewer()),
            feedback.getReviewee().getId(),
            getUserDisplayName(feedback.getReviewee()),
            feedback.getRating(),
            feedback.getReviewText(),
            feedback.getCreatedAt()
        );
    }
    
    /**
     * Get display name for user (organization name if available, otherwise email)
     */
    private String getUserDisplayName(User user) {
        if (user.getOrganization() != null && user.getOrganization().getName() != null) {
            return user.getOrganization().getName();
        }
        return user.getEmail();
    }
}