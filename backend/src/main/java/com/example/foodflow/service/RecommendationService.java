package com.example.foodflow.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.foodflow.model.dto.RecommendationDTO;
import com.example.foodflow.helpers.ArrayFilter;
import com.example.foodflow.helpers.BasicFilter;
import com.example.foodflow.model.entity.ReceiverPreferences;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.repository.ReceiverPreferencesRepository;
import com.example.foodflow.repository.SurplusPostRepository;

/**
 * Service for generating food donation recommendations based on receiver preferences
 */
@Service
public class RecommendationService {

    @Autowired
    private ReceiverPreferencesRepository preferencesRepository;

    @Autowired 
    private SurplusPostRepository surplusPostRepository;

    /**
     * Get recommendation data for a specific post and user
     */
    public RecommendationDTO getRecommendationData(Long postId, User user) {
        SurplusPost post = surplusPostRepository.findById(postId).orElse(null);
        if (post == null) {
            return new RecommendationDTO(postId, 0, List.of("Post not found"));
        }

        ReceiverPreferences preferences = preferencesRepository.findByUser(user).orElse(null);
        if (preferences == null) {
            return new RecommendationDTO(postId, 0, List.of("No preferences set"));
        }

        return calculateRecommendation(post, preferences);
    }

    /**
     * Get recommendation data for multiple posts for a user
     */
    public Map<Long, RecommendationDTO> getRecommendationsForUser(User user, List<Long> postIds) {
        ReceiverPreferences preferences = preferencesRepository.findByUser(user).orElse(null);
        if (preferences == null) {
            return postIds.stream().collect(Collectors.toMap(
                id -> id,
                id -> new RecommendationDTO(id, 0, List.of("No preferences set"))
            ));
        }

        List<SurplusPost> posts = surplusPostRepository.findAllById(postIds);
        return posts.stream().collect(Collectors.toMap(
            SurplusPost::getId,
            post -> calculateRecommendation(post, preferences)
        ));
    }

    /**
     * Get all recommended posts for a user above a certain threshold
     */
    public List<RecommendationDTO> getRecommendedPosts(User user, int minScore) {
        ReceiverPreferences preferences = preferencesRepository.findByUser(user).orElse(null);
        if (preferences == null) {
            return List.of();
        }

        List<SurplusPost> availablePosts = surplusPostRepository.findByStatus(
            com.example.foodflow.model.types.PostStatus.AVAILABLE
        );

        return availablePosts.stream()
            .map(post -> calculateRecommendation(post, preferences))
            .filter(rec -> rec.getScore() >= minScore)
            .collect(Collectors.toList());
    }

    /**
     * Core recommendation calculation logic
     */
    private RecommendationDTO calculateRecommendation(SurplusPost post, ReceiverPreferences preferences) {
        List<String> reasons = new ArrayList<>();
        int score = 0;

        // 1. Food Category Matching (30 points max)
        score += calculateFoodCategoryScore(post, preferences, reasons);

        // 2. Quantity Matching (25 points max)  
        score += calculateQuantityScore(post, preferences, reasons);

        // 3. Capacity Check (20 points max)
        score += calculateCapacityScore(post, preferences, reasons);

        // 4. Expiry Date Relevance (15 points max)
        score += calculateExpiryScore(post, preferences, reasons);

        // 5. Food Storage Requirements (10 points max)
        score += calculateStorageScore(post, preferences, reasons);

        return new RecommendationDTO(post.getId(), score, reasons);
    }

    /**
     * Calculate food category matching score using ArrayFilter logic
     */
    private int calculateFoodCategoryScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        List<String> preferredTypes = preferences.getPreferredFoodTypes();
        
        // If no preferences set, give moderate score for flexibility
        if (preferredTypes == null || preferredTypes.isEmpty()) {
            reasons.add("No food type restrictions - accepts all categories");
            return 20; // Moderate score for flexibility
        }

        // Convert enum set to string set for comparison
        List<String> postCategories = post.getFoodCategories().stream()
            .map(FoodCategory::name)
            .collect(Collectors.toList());

        // Use ArrayFilter logic to check containment
        ArrayFilter<String> preferredFilter = ArrayFilter.containsAny(preferredTypes);
        
        if (preferredFilter.check(postCategories)) {
            // Find matching categories for specific reason
            List<String> matches = postCategories.stream()
                .filter(preferredTypes::contains)
                .collect(Collectors.toList());
            
            if (matches.size() > 1) {
                reasons.add("Matches multiple preferred categories: " + String.join(", ", matches));
                return 30; // Perfect match
            } else {
                reasons.add("Matches preferred category: " + matches.get(0));
                return 25; // Good match
            }
        } else {
            reasons.add("Food category doesn't match preferences");
            return 0; // No match
        }
    }

    /**
     * Calculate quantity matching score using BasicFilter logic
     */
    private int calculateQuantityScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        Integer postQuantity = (int) (post.getQuantity() != null ? post.getQuantity().getValue() : 0);
        Integer minQuantity = preferences.getMinQuantity();
        Integer maxQuantity = preferences.getMaxQuantity();

        // Use BasicFilter logic for range checking
        BasicFilter<Integer> minFilter = BasicFilter.greaterThanOrEqual(minQuantity);
        BasicFilter<Integer> maxFilter = BasicFilter.lessThanOrEqual(maxQuantity);

        boolean withinMin = minFilter.check(postQuantity);
        boolean withinMax = maxFilter.check(postQuantity);

        if (withinMin && withinMax) {
            reasons.add(String.format("Perfect quantity match (%d within %d-%d range)", 
                                    postQuantity, minQuantity, maxQuantity));
            return 25;
        } else if (withinMin && postQuantity <= maxQuantity * 1.2) {
            reasons.add(String.format("Slightly above preferred range (%d vs max %d)", 
                                    postQuantity, maxQuantity));
            return 15; // Close enough
        } else if (withinMax && postQuantity >= minQuantity * 0.8) {
            reasons.add(String.format("Slightly below preferred range (%d vs min %d)", 
                                    postQuantity, minQuantity));
            return 15; // Close enough
        } else {
            reasons.add(String.format("Quantity mismatch (%d outside %d-%d range)", 
                                    postQuantity, minQuantity, maxQuantity));
            return 0;
        }
    }

    /**
     * Calculate capacity compatibility score
     */
    private int calculateCapacityScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        Integer postQuantity = (int) (post.getQuantity() != null ? post.getQuantity().getValue() : 0);
        Integer maxCapacity = preferences.getMaxCapacity();

        BasicFilter<Integer> capacityFilter = BasicFilter.lessThanOrEqual(maxCapacity);
        
        if (capacityFilter.check(postQuantity)) {
            double utilizationPercentage = (double) postQuantity / maxCapacity * 100;
            
            if (utilizationPercentage >= 70) {
                reasons.add(String.format("Excellent capacity utilization (%.0f%%)", utilizationPercentage));
                return 20;
            } else if (utilizationPercentage >= 40) {
                reasons.add(String.format("Good capacity utilization (%.0f%%)", utilizationPercentage));
                return 15;
            } else {
                reasons.add("Fits within capacity but low utilization");
                return 10;
            }
        } else {
            reasons.add(String.format("Exceeds storage capacity (%d > %d)", postQuantity, maxCapacity));
            return 0;
        }
    }

    /**
     * Calculate expiry date relevance score
     */
    private int calculateExpiryScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        LocalDate expiryDate = post.getExpiryDate();
        LocalDate today = LocalDate.now();
        
        long daysUntilExpiry = ChronoUnit.DAYS.between(today, expiryDate);
        
        if (daysUntilExpiry >= 3) {
            reasons.add("Excellent shelf life remaining");
            return 15;
        } else if (daysUntilExpiry >= 1) {
            reasons.add("Good timing - use within few days");
            return 10;
        } else if (daysUntilExpiry == 0) {
            reasons.add("Expires today - immediate use needed");
            return 5;
        } else {
            reasons.add("Past expiry date");
            return 0;
        }
    }

    /**
     * Calculate food storage requirements compatibility
     */
    private int calculateStorageScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        // This would need food storage type info in SurplusPost
        // For now, give default score if accepts all storage types
        if (preferences.getAcceptRefrigerated() && preferences.getAcceptFrozen()) {
            reasons.add("Accepts all storage types");
            return 10;
        } else {
            reasons.add("Limited storage acceptance");
            return 5;
        }
    }
}