package com.example.foodflow.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import io.micrometer.core.annotation.Timed;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.foodflow.model.dto.RecommendationDTO;
import com.example.foodflow.helpers.BasicFilter;
import com.example.foodflow.model.entity.PickupSlot;
import com.example.foodflow.model.entity.ReceiverPreferences;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.TemperatureCategory;
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

    @Autowired
    private BusinessMetricsService businessMetricsService;

    /**
     * Get recommendation data for a specific post and user
     */
    @Timed(value = "recommendation.service.getRecommendationData", description = "Time taken to get recommendation data")
    public RecommendationDTO getRecommendationData(Long postId, User user) {
        businessMetricsService.incrementRecommendationsCalculated();
        
        SurplusPost post = surplusPostRepository.findById(postId).orElse(null);
        if (post == null) {
            return new RecommendationDTO(postId, 0, List.of("Post not found"));
        }

        ReceiverPreferences preferences = preferencesRepository.findByUser(user).orElse(null);
        if (preferences == null) {
            return new RecommendationDTO(postId, 0, List.of("No preferences set"));
        }

        RecommendationDTO result = calculateRecommendation(post, preferences);
        
        // Track high-scoring recommendations
        if (result.getScore() > 80) {
            businessMetricsService.incrementRecommendationsHighScore();
        }
        
        return result;
    }

    /**
     * Get recommendation data for multiple posts for a user
     */
    @Timed(value = "recommendation.service.getRecommendationsForUser", description = "Time taken to get recommendations for user")
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
            post -> {
                businessMetricsService.incrementRecommendationsCalculated();
                RecommendationDTO result = calculateRecommendation(post, preferences);
                if (result.getScore() > 80) {
                    businessMetricsService.incrementRecommendationsHighScore();
                }
                return result;
            }
        ));
    }

    /**
     * Get all recommended posts for a user above a certain threshold
     */
    @Timed(value = "recommendation.service.getRecommendedPosts", description = "Time taken to get recommended posts")
    public Map<Long, RecommendationDTO> getRecommendedPosts(User user, List<Long> postIds, int minScore) {
        ReceiverPreferences preferences = preferencesRepository.findByUser(user).orElse(null);
        if (preferences == null) {
            return Map.of();
        }

        List<SurplusPost> posts = (postIds != null && !postIds.isEmpty())? 
                                    surplusPostRepository.findAllById(postIds): 
                                    surplusPostRepository.findByStatus(com.example.foodflow.model.types.PostStatus.AVAILABLE);
    return posts.stream()
        .collect(Collectors.toMap(
            SurplusPost::getId,
            post -> {
                businessMetricsService.incrementRecommendationsCalculated();
                RecommendationDTO result = calculateRecommendation(post, preferences);
                if (result.getScore() > 80) {
                    businessMetricsService.incrementRecommendationsHighScore();
                }
                return result;
            }
        ))
        .entrySet().stream()
        .filter(entry -> entry.getValue().getScore() >= minScore )
        .collect(Collectors.toMap(
            Map.Entry::getKey,
            Map.Entry::getValue
        ));
    }

    /**
     * Get all recommended posts above threshold (convenience method for backward compatibility)
     */
    public Map<Long, RecommendationDTO> getRecommendedPosts(User user, int minScore) {
        return getRecommendedPosts(user, null, minScore);
    }

    /**
     * Calculate recommendation based on user-configurable preferences
     */
    private RecommendationDTO calculateRecommendation(SurplusPost post, ReceiverPreferences preferences) {
        List<String> reasons = new ArrayList<>();
        int score = 0;

        // 1. Food Category Matching (35 points) - Most important user setting
        score += calculateFoodCategoryScore(post, preferences, reasons);

        // 2. Donation Size Matching (25 points) - User sets SMALL/MEDIUM/LARGE/BULK preferences  
        score += calculateDonationSizeScore(post, preferences, reasons);

        // 3. Pickup Window Matching (20 points) - User sets MORNING/AFTERNOON/EVENING availability
        score += calculatePickupWindowScore(post, preferences, reasons);

        // 4. Storage Requirements (10 points) - User sets refrigerated/frozen acceptance
        score += calculateStorageScore(post, preferences, reasons);

        // 5. Expiry/Freshness (10 points) - Always relevant
        score += calculateExpiryScore(post, preferences, reasons);

        // Limit to 4 reasons max
        List<String> limitedReasons = reasons.stream().limit(4).collect(Collectors.toList());

        return new RecommendationDTO(post.getId(), score, limitedReasons);
    }

    /**
     * Food category matching - checks if user wants this type or has "no strict preferences"
     */
    private int calculateFoodCategoryScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        List<String> preferredTypes = preferences.getPreferredFoodTypes();
        
        // If empty list = "no strict preferences" (accepts all)
        if (preferredTypes == null || preferredTypes.isEmpty()) {
            reasons.add("Accepts all food types");
            return 30; // High score for flexibility
        }

        // Check if post categories match user preferences
        List<String> postCategories = post.getFoodCategories().stream()
            .map(FoodCategory::name)
            .collect(Collectors.toList());

        List<String> matches = postCategories.stream()
            .filter(preferredTypes::contains)
            .collect(Collectors.toList());
            
        if (!matches.isEmpty()) {
            if (matches.size() > 1) {
                reasons.add("Matches " + matches.size() + " preferred categories");
                return 35; // Perfect match
            } else {
                String categoryName = matches.get(0).replace("_", " ").toLowerCase();
                reasons.add("Matches preference: " + categoryName);
                return 30; // Good match
            }
        } else {
            return 5; // Very low score for type mismatch
        }
    }

    /**
     * Donation size matching based on user's size preferences (SMALL/MEDIUM/LARGE/BULK)
     */
    private int calculateDonationSizeScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        List<String> preferredSizes = preferences.getPreferredDonationSizes();
        
        // If no size preferences set, give neutral score
        if (preferredSizes == null || preferredSizes.isEmpty()) {
            return 12; // Neutral - don't add reason
        }

        // Determine post size based on quantity (rough estimation)
        String postSize = determinePostSize(post);
        
        if (preferredSizes.contains(postSize)) {
            reasons.add("Preferred size: " + postSize.toLowerCase() + " donation");
            return 25; // Perfect size match
        } else {
            // Check for adjacent sizes (e.g., if they want MEDIUM, SMALL is OK)
            if (isAdjacentSize(postSize, preferredSizes)) {
                reasons.add("Size close to preference");
                return 15; // Close match
            } else {
                return 0; // Size mismatch
            }
        }
    }

    /**
     * Determine donation size category from post quantity
     */
    private String determinePostSize(SurplusPost post) {
        if (post.getQuantity() == null) {
            return "MEDIUM"; // Default assumption
        }

        Quantity.Unit unit = post.getQuantity().getUnit();
        double quantity = post.getQuantity().getValue();
        
        // Based on frontend size definitions:
        // SMALL: 1-5 portions OR <3kg
        // MEDIUM: 5-20 portions OR 3-10kg  
        // LARGE: 20-50 portions OR 10-25kg
        // BULK: 50+ portions OR >25kg
        
        switch(unit){
            case KILOGRAM, LITER, POUND, FLUID_OUNCE, GALLON, PINT, OUNCE -> {
                if (quantity < 3) {
                    return "SMALL";
                } else if (quantity < 10) {
                    return "MEDIUM";
                } else if (quantity < 25) {
                    return "LARGE";
                } else {
                    return "BULK";
                }
            }

            case GRAM, MILLILITER -> {
                if (quantity < 3000) {
                    return "SMALL";
                } else if (quantity < 10000) {
                    return "MEDIUM";
                } else if (quantity < 25000) {
                    return "LARGE";
                } else {
                    return "BULK";
                }
            }

            case PORTION, CASE, ITEM, PIECE, BOTTLE, BAG, BOX, LOAF, JAR, CONTAINER, PACKAGE, CAN, HEAD, BUNCH,
            SERVING, CUP, CARTON, UNIT-> {
                if (quantity < 5) {
                    return "SMALL";
                } else if (quantity < 20) {
                    return "MEDIUM";
                } else if (quantity < 50) {
                    return "LARGE";
                } else {
                    return "BULK";
                }
            }

            default -> {
                return "MEDIUM";
            }


        }
    }                       

    /**
     * Check if post size is adjacent to preferred sizes
     */
    private boolean isAdjacentSize(String postSize, List<String> preferredSizes) {
        // Adjacent size relationships
        if (postSize.equals("SMALL") && (preferredSizes.contains("MEDIUM"))) return true;
        if (postSize.equals("MEDIUM") && (preferredSizes.contains("SMALL") || preferredSizes.contains("LARGE"))) return true;
        if (postSize.equals("LARGE") && (preferredSizes.contains("MEDIUM") || preferredSizes.contains("BULK"))) return true;
        if (postSize.equals("BULK") && preferredSizes.contains("LARGE")) return true;
        return false;
    }

    /**
     * Pickup window matching based on user's availability (MORNING/AFTERNOON/EVENING)
     */
    private int calculatePickupWindowScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        List<String> userAvailability = preferences.getPreferredPickupWindows();
        
        // If no pickup preferences set, assume flexible (neutral score)
        if (userAvailability == null || userAvailability.isEmpty()) {
            return 10; // Neutral - don't add reason
        }

        // Check if ANY pickup slot matches user's availability
        if (post.getPickupSlots() == null || post.getPickupSlots().isEmpty()) {
            return 5; // No pickup info available
        }
        
        boolean hasMatchingSlot = false;
        List<String> availableWindows = new ArrayList<>();
        
        for (PickupSlot slot : post.getPickupSlots()) {
            LocalTime startTime = slot.getStartTime();
            if (startTime == null) continue;
            
            String slotWindow;
            if (startTime.isBefore(LocalTime.of(12, 0))) {
                slotWindow = "MORNING";
            } else if (startTime.isBefore(LocalTime.of(19, 0))) {
                slotWindow = "AFTERNOON"; 
            } else {
                slotWindow = "EVENING";
            }
            
            if (!availableWindows.contains(slotWindow)) {
                availableWindows.add(slotWindow);
            }
            
            if (userAvailability.contains(slotWindow)) {
                hasMatchingSlot = true;
            }
        }
        
        if (hasMatchingSlot) {
            // Find which window(s) match
            List<String> matchingWindows = availableWindows.stream()
                .filter(userAvailability::contains)
                .collect(Collectors.toList());
                
            if (matchingWindows.size() > 1) {
                reasons.add("Multiple pickup windows available");
                return 20; // Perfect flexibility
            } else {
                String windowLabel = getPickupWindowLabel(matchingWindows.get(0));
                reasons.add("Available for " + windowLabel.toLowerCase() + " pickup");
                return 20; // Perfect timing match
            }
        } else if (userAvailability.size() >= 2) {
            // User is flexible but no slots match
            return 5; // Some flexibility points
        } else {
            // Single window preference that doesn't match
            return 0; // Complete timing conflict
        }
    }

    /**
     * Get user-friendly pickup window label
     */
    private String getPickupWindowLabel(String window) {
        switch (window) {
            case "MORNING": return "Morning";
            case "AFTERNOON": return "Afternoon"; 
            case "EVENING": return "Evening";
            default: return window;
        }
    }

    /**
     * Expiry date scoring - explicit about timeframe
     */
    private int calculateExpiryScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        LocalDate expiryDate = post.getExpiryDate();
        if (expiryDate == null) {
            return 5; // Neutral score
        }
        
        LocalDate today = LocalDate.now();
        long daysUntilExpiry = ChronoUnit.DAYS.between(today, expiryDate);
        
        if (daysUntilExpiry >= 7) {
            reasons.add("Fresh - expires in " + daysUntilExpiry + " days");
            return 10;
        } else if (daysUntilExpiry >= 3) {
            reasons.add("Good freshness - " + daysUntilExpiry + " days left");
            return 8;
        } else if (daysUntilExpiry >= 1) {
            reasons.add("Use within " + daysUntilExpiry + " days");
            return 5;
        } else if (daysUntilExpiry == 0) {
            return 2;
        } else {
            return 0;
        }
    }

    /**
     * Storage requirements based on post's temperature category vs user's storage acceptance
     */
    private int calculateStorageScore(SurplusPost post, ReceiverPreferences preferences, List<String> reasons) {
        boolean acceptsRefrigerated = preferences.getAcceptRefrigerated() != null ? preferences.getAcceptRefrigerated() : true;
        boolean acceptsFrozen = preferences.getAcceptFrozen() != null ? preferences.getAcceptFrozen() : true;
        
        // Check post's actual temperature requirements
        TemperatureCategory postTemp = post.getTemperatureCategory();
        
        if (postTemp == null) {
            // No specific temperature requirements - assume room temperature/flexible
            return 5; // Neutral score
        }
        
        switch (postTemp) {
            case FROZEN:
                if (acceptsFrozen) {
                    reasons.add("Accepts frozen storage");
                    return 10; // Perfect match
                } else {
                    return 0; // Cannot handle frozen
                }
                
            case REFRIGERATED:
                if (acceptsRefrigerated) {
                    reasons.add("Accepts refrigerated storage");
                    return 10; // Perfect match
                } else {
                    return 0; // Cannot handle refrigerated
                }
                
            default:
                // Room temperature or other - most users can handle this
                return 5; // Good compatibility
        }
    }
}