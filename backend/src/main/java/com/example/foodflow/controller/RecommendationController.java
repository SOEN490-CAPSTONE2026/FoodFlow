package com.example.foodflow.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.foodflow.model.dto.RecommendationDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.RecommendationService;

/**
 * REST controller for food donation recommendations
 */
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    /**
     * Get recommendation data for a specific post
     * Frontend usage: /api/recommendations/post/123
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<RecommendationDTO> getRecommendationForPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser) {
        
        RecommendationDTO recommendation = recommendationService.getRecommendationData(postId, currentUser);
        return ResponseEntity.ok(recommendation);
    }

    /**
     * Get recommendations for multiple posts
     * Frontend usage: /api/recommendations/posts?postIds=1,2,3,4
     */
    @GetMapping("/posts")
    public ResponseEntity<Map<Long, RecommendationDTO>> getRecommendationsForPosts(
            @RequestParam List<Long> postIds,
            @AuthenticationPrincipal User currentUser) {
        
        Map<Long, RecommendationDTO> recommendations = 
            recommendationService.getRecommendationsForUser(currentUser, postIds);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get all highly recommended posts above a threshold
     * Frontend usage: /api/recommendations/top?minScore=70
     */
    @GetMapping("/top")
    public ResponseEntity<Map<String, RecommendationDTO>> getTopRecommendations(
            @RequestParam List<Long> postIds,
            @RequestParam(defaultValue = "50") int minScore,
            @AuthenticationPrincipal User currentUser) {
        
        Map<Long, RecommendationDTO> recommendations = 
            recommendationService.getRecommendedPosts(currentUser, postIds, minScore);

        // Convert Long keys to String for frontend compatibility
        Map<String, RecommendationDTO> stringKeyMap = recommendations.entrySet().stream()
            .collect(java.util.stream.Collectors.toMap(
                entry -> entry.getKey().toString(),
                Map.Entry::getValue
            ));

        return ResponseEntity.ok(stringKeyMap);
    }

    /**
     * Get recommendation data for all posts on the browse page
     * This is the main endpoint the frontend's getRecommendationData function should call
     * Frontend usage: /api/recommendations/browse?postIds=1,2,3,4
     */
    @GetMapping("/browse") 
    public ResponseEntity<Map<String, RecommendationDTO>> getBrowseRecommendations(
            @RequestParam List<Long> postIds,
            @AuthenticationPrincipal User currentUser) {
        
        Map<Long, RecommendationDTO> recommendations = 
            recommendationService.getRecommendationsForUser(currentUser, postIds);
        
        // Convert Long keys to String for frontend compatibility
        Map<String, RecommendationDTO> stringKeyMap = recommendations.entrySet().stream()
            .collect(java.util.stream.Collectors.toMap(
                entry -> entry.getKey().toString(),
                Map.Entry::getValue
            ));
        
        return ResponseEntity.ok(stringKeyMap);
    }
}