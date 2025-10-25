package com.example.foodflow.service;

import com.example.foodflow.model.dto.ClaimRequest;
import com.example.foodflow.model.dto.ClaimResponse;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClaimService {
    
    private final ClaimRepository claimRepository;
    private final SurplusPostRepository surplusPostRepository;
    
    public ClaimService(ClaimRepository claimRepository,
                       SurplusPostRepository surplusPostRepository) {
        this.claimRepository = claimRepository;
        this.surplusPostRepository = surplusPostRepository;
    }
    
    @Transactional
    public ClaimResponse claimSurplusPost(ClaimRequest request, User receiver) {
        // Fetch and lock the surplus post to prevent concurrent claims
        SurplusPost surplusPost = surplusPostRepository.findById(request.getSurplusPostId())
            .orElseThrow(() -> new RuntimeException("Surplus post not found"));
        
        // Check if post is available
        if (surplusPost.getStatus() != PostStatus.AVAILABLE) {
            throw new RuntimeException("This post is no longer available");
        }
        
        // Check if already claimed (race condition prevention)
        if (claimRepository.existsBySurplusPostIdAndStatus(
                surplusPost.getId(), ClaimStatus.ACTIVE)) {
            throw new RuntimeException("This post has already been claimed");
        }
        
        // Prevent donor from claiming their own post
        if (surplusPost.getDonor().getId().equals(receiver.getId())) {
            throw new RuntimeException("You cannot claim your own surplus post");
        }
        
        // Create the claim
        Claim claim = new Claim(surplusPost, receiver);
        claim = claimRepository.save(claim);
        
        // Update surplus post status
        surplusPost.setStatus(PostStatus.CLAIMED);
        surplusPostRepository.save(surplusPost);
        
        return new ClaimResponse(claim);
    }
    
    @Transactional(readOnly = true)
    public List<ClaimResponse> getReceiverClaims(User receiver) {
        return claimRepository.findReceiverClaimsWithDetails(
            receiver.getId(), ClaimStatus.ACTIVE)
            .stream()
            .map(ClaimResponse::new)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaimsForSurplusPost(Long surplusPostId) {
        return claimRepository.findBySurplusPostId(surplusPostId)
            .stream()
            .map(ClaimResponse::new)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public void cancelClaim(Long claimId, User receiver) {
        Claim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new RuntimeException("Claim not found"));
        
        // Verify receiver owns this claim
        if (!claim.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("You can only cancel your own claims");
        }
        
        // Cancel the claim
        claim.setStatus(ClaimStatus.CANCELLED);
        claimRepository.save(claim);
        
        // Make post available again
        SurplusPost post = claim.getSurplusPost();
        post.setStatus(PostStatus.AVAILABLE);
        surplusPostRepository.save(post);
    }
}
