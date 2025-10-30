package com.example.foodflow.service;

import com.example.foodflow.helpers.ArrayFilter;
import com.example.foodflow.helpers.BasicFilter;
import com.example.foodflow.helpers.LocationFilter;
import com.example.foodflow.helpers.SpecificationHandler;
import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusFilterRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.SurplusPostRepository;

import org.springframework.data.jpa.domain.Specification;
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
        post.setStatus(request.getStatus()); // defaults to AVAILABLE if not set
        
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
        response.setDonorEmail(post.getDonor().getEmail());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        return response;
    }
    public List<SurplusResponse> getAllAvailableSurplusPosts() {
    List<SurplusPost> posts = surplusPostRepository.findByStatus(PostStatus.AVAILABLE);
    return posts.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Search surplus posts based on filter criteria using our custom filter classes.
     * If no filters are provided, returns all available posts.
     */
    public List<SurplusResponse> searchSurplusPosts(SurplusFilterRequest filterRequest) {
        Specification<SurplusPost> specification = buildSpecificationFromFilter(filterRequest);
        
        List<SurplusPost> posts = surplusPostRepository.findAll(specification);
        
        return posts.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Builds a JPA Specification from the filter request using our custom filter classes.
     */
    private Specification<SurplusPost> buildSpecificationFromFilter(SurplusFilterRequest filterRequest) {
        SpecificationHandler.SpecificationBuilder<SurplusPost> builder = SpecificationHandler.<SurplusPost>builder();
    
        // Always filter by status
        if (filterRequest.hasStatus()) {
            builder.and(BasicFilter.equal(filterRequest.getStatus()).toSpecification("status"));
        }
        
        // Filter by food categories
        if (filterRequest.hasFoodCategories()) {
            builder.and(ArrayFilter.containsAny(filterRequest.getFoodCategories()).toSpecification("foodCategories"));
        }
        
        // Filter by expiry date (before) - FIXED
        if (filterRequest.hasExpiryBefore()) {
            builder.and(BasicFilter.lessThanOrEqual(filterRequest.getExpiryBefore()).toSpecification("expiryDate"));
        }
        
        // Filter by expiry date (after)
        if (filterRequest.hasExpiryAfter()) {
            builder.and(BasicFilter.greaterThanOrEqual(filterRequest.getExpiryAfter()).toSpecification("expiryDate"));
        }
        
        // Filter by location
        if (filterRequest.hasLocationFilter()) {
            builder.and(LocationFilter.within(filterRequest.getUserLocation(), filterRequest.getMaxDistanceKm()).toSpecification("pickupLocation"));
        }
        
        return builder.buildOrDefault(SpecificationHandler.alwaysTrue());
    }

}
