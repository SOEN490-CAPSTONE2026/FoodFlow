package com.example.foodflow.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.Feedback;
import com.example.foodflow.model.entity.User;

/**
 * Repository interface for Feedback entity operations
 */
@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    
    /**
     * Find feedback by claim and reviewer (to prevent duplicate reviews)
     */
    Optional<Feedback> findByClaimAndReviewer(Claim claim, User reviewer);
    
    /**
     * Check if feedback exists for a claim and reviewer
     */
    boolean existsByClaimAndReviewer(Claim claim, User reviewer);
    
    /**
     * Find all feedback for a specific claim
     */
    List<Feedback> findByClaim(Claim claim);
    
    /**
     * Find all feedback received by a user (where they are the reviewee)
     */
    List<Feedback> findByRevieweeOrderByCreatedAtDesc(User reviewee);
    
    /**
     * Find all feedback given by a user (where they are the reviewer)
     */
    List<Feedback> findByReviewerOrderByCreatedAtDesc(User reviewer);
    
    /**
     * Get average rating for a user
     */
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.reviewee = :user")
    Double getAverageRatingForUser(@Param("user") User user);
    
    /**
     * Get total number of reviews for a user
     */
    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.reviewee = :user")
    Long getTotalReviewsForUser(@Param("user") User user);
    
    /**
     * Get rating distribution for a user
     */
    @Query("SELECT f.rating, COUNT(f) FROM Feedback f WHERE f.reviewee = :user GROUP BY f.rating ORDER BY f.rating DESC")
    List<Object[]> getRatingDistributionForUser(@Param("user") User user);
    
    /**
     * Find feedback between two users in any direction
     */
    @Query("SELECT f FROM Feedback f WHERE " +
           "(f.reviewer = :user1 AND f.reviewee = :user2) OR " +
           "(f.reviewer = :user2 AND f.reviewee = :user1)")
    List<Feedback> findFeedbackBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    /**
     * Get recent feedback for a user (last 10 reviews)
     */
    @Query("SELECT f FROM Feedback f WHERE f.reviewee = :user ORDER BY f.createdAt DESC")
    List<Feedback> findRecentFeedbackForUser(@Param("user") User user, 
                                           org.springframework.data.domain.Pageable pageable);
    
    /**
     * Find all feedback for completed claims
     */
    @Query("SELECT f FROM Feedback f WHERE f.claim.status = com.example.foodflow.model.types.ClaimStatus.COMPLETED")
    List<Feedback> findAllFeedbackForCompletedClaims();
    
    /**
     * Check if both parties have provided feedback for a claim
     */
    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.claim = :claim")
    Long countFeedbackForClaim(@Param("claim") Claim claim);
    
    /**
     * Find claims that need feedback prompt (completed but missing feedback)
     */
    @Query("SELECT DISTINCT f.claim FROM Feedback f WHERE f.claim.status = com.example.foodflow.model.types.ClaimStatus.COMPLETED " +
           "AND (SELECT COUNT(feedback) FROM Feedback feedback WHERE feedback.claim = f.claim) < 2")
    List<Claim> findClaimsNeedingFeedback();
}