package com.example.foodflow.service;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.SurplusPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SurplusService {
    
    private final SurplusPostRepository surplusPostRepository;
    
    public SurplusService(SurplusPostRepository surplusPostRepository) {
        this.surplusPostRepository = surplusPostRepository;
    }
    
    @Transactional
    public SurplusResponse createSurplusPost(CreateSurplusRequest request, User donor) {
        // Create new surplus post
        SurplusPost surplusPost = new SurplusPost();
        surplusPost.setType(request.getType());
        surplusPost.setQuantity(request.getQuantity());
        surplusPost.setExpiryDate(request.getExpiryDate());
        surplusPost.setPickupTime(request.getPickupTime());
        surplusPost.setLocation(request.getLocation());
        surplusPost.setDonor(donor);
        
        // Save to database
        SurplusPost savedPost = surplusPostRepository.save(surplusPost);
        
        // Convert to response DTO
        return convertToResponse(savedPost);
    }
    
    public List<SurplusResponse> getUserSurplusPosts(User user) {
        List<SurplusPost> posts = surplusPostRepository.findByDonorId(user.getId());
        return posts.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    private SurplusResponse convertToResponse(SurplusPost post) {
        return new SurplusResponse(
            post.getId(),
            post.getType(),
            post.getQuantity(),
            post.getExpiryDate(),
            post.getPickupTime(),
            post.getLocation(),
            post.getDonor().getEmail(),
            post.getCreatedAt()
        );
    }
}
