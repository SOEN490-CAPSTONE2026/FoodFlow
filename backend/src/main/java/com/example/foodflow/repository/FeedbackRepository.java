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
    
    // ====== NEW ADMIN QUERIES FOR THE STORY ======
    
    /**
     * Find users with average rating below threshold and minimum number of reviews
     */
    @Query("SELECT f.reviewee, AVG(f.rating) as avgRating, COUNT(f) as reviewCount " +
           "FROM Feedback f " +
           "GROUP BY f.reviewee " +
           "HAVING COUNT(f) >= :minReviews AND AVG(f.rating) < :threshold " +
           "ORDER BY AVG(f.rating) ASC")
    List<Object[]> findUsersBelowRatingThreshold(@Param("threshold") Double threshold, 
                                                @Param("minReviews") Integer minReviews);
    
    /**
     * Find top-rated users with minimum number of reviews
     */
    @Query("SELECT f.reviewee, AVG(f.rating) as avgRating, COUNT(f) as reviewCount " +
           "FROM Feedback f " +
           "GROUP BY f.reviewee " +
           "HAVING COUNT(f) >= :minReviews " +
           "ORDER BY AVG(f.rating) DESC")
    List<Object[]> findTopRatedUsers(@Param("minReviews") Integer minReviews, 
                                    org.springframework.data.domain.Pageable pageable);
    
    /**
     * Find low-rated users (bottom percentile)
     */
    @Query("SELECT f.reviewee, AVG(f.rating) as avgRating, COUNT(f) as reviewCount " +
           "FROM Feedback f " +
           "GROUP BY f.reviewee " +
           "HAVING COUNT(f) >= :minReviews " +
           "ORDER BY AVG(f.rating) ASC")
    List<Object[]> findLowRatedUsers(@Param("minReviews") Integer minReviews, 
                                    org.springframework.data.domain.Pageable pageable);
    
    /**
     * Get overall platform statistics
     */
    @Query("SELECT AVG(f.rating), COUNT(DISTINCT f.reviewee), COUNT(f) FROM Feedback f")
    List<Object[]> getPlatformRatingStatistics();
    
    /**
     * Find feedback that might be flagged (very low ratings with negative keywords)
     */
    @Query("SELECT f FROM Feedback f WHERE f.rating <= 2 AND " +
           "(LOWER(f.reviewText) LIKE '%terrible%' OR " +
           "LOWER(f.reviewText) LIKE '%awful%' OR " +
           "LOWER(f.reviewText) LIKE '%scam%' OR " +
           "LOWER(f.reviewText) LIKE '%fraud%' OR " +
           "LOWER(f.reviewText) LIKE '%never again%' OR " +
           "LOWER(f.reviewText) LIKE '%worst%') " +
           "ORDER BY f.createdAt DESC")
    List<Feedback> findPotentiallyFlaggedFeedback();
    
    /**
     * Find all feedback for a user (both given and received) - for admin view
     */
    @Query("SELECT f FROM Feedback f WHERE f.reviewee = :user OR f.reviewer = :user ORDER BY f.createdAt DESC")
    List<Feedback> findAllFeedbackForUser(@Param("user") User user);
    
    /**
     * Find recently submitted feedback across the platform
     */
    @Query("SELECT f.reviewee, AVG(f.rating), COUNT(f) " +
           "FROM Feedback f " +
           "WHERE f.createdAt >= :since " +
           "GROUP BY f.reviewee " +
           "ORDER BY f.createdAt DESC")
    List<Object[]> findRecentlyRatedUsers(@Param("since") java.time.LocalDateTime since, 
                                         org.springframework.data.domain.Pageable pageable);
    
    /**
     * Count users above threshold
     */
    @Query("SELECT COUNT(DISTINCT f.reviewee) " +
           "FROM Feedback f " +
           "GROUP BY f.reviewee " +
           "HAVING COUNT(f) >= :minReviews AND AVG(f.rating) >= :threshold")
    Long countUsersAboveThreshold(@Param("threshold") Double threshold, @Param("minReviews") Integer minReviews);
    
    /**
     * Count users below threshold  
     */
    @Query("SELECT COUNT(DISTINCT f.reviewee) " +
           "FROM Feedback f " +
           "GROUP BY f.reviewee " +
           "HAVING COUNT(f) >= :minReviews AND AVG(f.rating) < :threshold")
    Long countUsersBelowThreshold(@Param("threshold") Double threshold, @Param("minReviews") Integer minReviews);
}