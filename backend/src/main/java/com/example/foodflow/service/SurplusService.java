package com.example.foodflow.service;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.SurplusPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SurplusService {
    
    private final SurplusPostRepository surplusPostRepository;
    
    public SurplusService(SurplusPostRepository surplusPostRepository) {
        this.surplusPostRepository = surplusPostRepository;
    }
    
    @Transactional
    public SurplusResponse createSurplusPost(CreateSurplusRequest request, User donor) {
        SurplusPost post = new SurplusPost();
        post.setDonor(donor);
        post.setFoodName(request.getFoodName());
        post.setFoodType(request.getFoodType());
        post.setQuantity(request.getQuantity());
        post.setUnit(request.getUnit());
        post.setExpiryDate(request.getExpiryDate());
        post.setPickupFrom(request.getPickupFrom());
        post.setPickupTo(request.getPickupTo());
        post.setLocation(request.getLocation());
        post.setNotes(request.getNotes());
        
        SurplusPost savedPost = surplusPostRepository.save(post);
        
        return convertToResponse(savedPost);
    }
    
    private SurplusResponse convertToResponse(SurplusPost post) {
        SurplusResponse response = new SurplusResponse();
        response.setId(post.getId());
        response.setFoodName(post.getFoodName());
        response.setFoodType(post.getFoodType());
        response.setQuantity(post.getQuantity());
        response.setUnit(post.getUnit());
        response.setExpiryDate(post.getExpiryDate());
        response.setPickupFrom(post.getPickupFrom());
        response.setPickupTo(post.getPickupTo());
        response.setLocation(post.getLocation());
        response.setNotes(post.getNotes());
        response.setDonorEmail(post.getDonor().getEmail());
        response.setCreatedAt(post.getCreatedAt());
        return response;
    }
}
