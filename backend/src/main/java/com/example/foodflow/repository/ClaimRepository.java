package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    
    // Find active claim for a specific post
    Optional<Claim> findBySurplusPostIdAndStatus(Long surplusPostId, ClaimStatus status);
    
    // Find all claims by receiver
    List<Claim> findByReceiverIdAndStatus(Long receiverId, ClaimStatus status);
    
     // find one claim by SurplusPost (used by SurplusService)
    Optional<Claim> findBySurplusPost(SurplusPost post);

    // used by ClaimService to list all claims
    List<Claim> findBySurplusPostId(Long surplusPostId);

    
    // Check if post already has active claim
    boolean existsBySurplusPostIdAndStatus(Long surplusPostId, ClaimStatus status);
    
    // Get receiver's claims with surplus post details
    @Query("SELECT c FROM Claim c " +
           "JOIN FETCH c.surplusPost sp " +
           "JOIN FETCH sp.donor " +
           "WHERE c.receiver.id = :receiverId " +
           "AND c.status IN :statuses " +
           "ORDER BY c.claimedAt DESC")
    List<Claim> findReceiverClaimsWithDetails(
        @Param("receiverId") Long receiverId,
        @Param("statuses") List<ClaimStatus> statuses
    );

    long countByStatus(ClaimStatus status);
    long countByReceiverId(Long receiverId);

    /**
     * Find completed claims for a user (either as donor or receiver)
     */
    @Query("SELECT c FROM Claim c WHERE " +
        "c.status = com.example.foodflow.model.types.ClaimStatus.COMPLETED AND " +
        "(c.surplusPost.donor = :user OR c.receiver = :user)")
    List<Claim> findCompletedClaimsForUser(@Param("user") User user);
    
    /**
     * Find all active/upcoming claims for a user (either as donor or receiver)
     */
    @Query("SELECT c FROM Claim c " +
           "JOIN FETCH c.surplusPost sp " +
           "JOIN FETCH sp.donor " +
           "JOIN FETCH c.receiver " +
           "WHERE c.status = com.example.foodflow.model.types.ClaimStatus.ACTIVE " +
           "AND (sp.donor = :user OR c.receiver = :user) " +
           "ORDER BY c.confirmedPickupDate ASC, c.confirmedPickupStartTime ASC")
    List<Claim> findActiveClaimsForUser(@Param("user") User user);
}
