package com.example.foodflow.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.foodflow.model.dto.RecommendationDTO;
import com.example.foodflow.model.entity.ReceiverPreferences;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ReceiverPreferencesRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.service.RecommendationService;

/**
 * Simplified integration tests for the recommendation system
 * Tests the complete service layer integration without Spring Boot context
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Recommendation System Service Integration Tests")
class RecommendationServiceIntegrationTest {

    @Mock
    private ReceiverPreferencesRepository preferencesRepository;

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    private User testUser;
    private ReceiverPreferences testPreferences;
    private SurplusPost highScorePost;
    private SurplusPost lowScorePost;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        // Set up preferences for good matches
        testPreferences = new ReceiverPreferences();
        testPreferences.setUser(testUser);
        testPreferences.setPreferredFoodTypes(Arrays.asList("FRUITS_VEGETABLES", "BAKERY_PASTRY"));
        testPreferences.setMinQuantity(10);
        testPreferences.setMaxQuantity(50);
        testPreferences.setMaxCapacity(100);
        testPreferences.setAcceptRefrigerated(true);
        testPreferences.setAcceptFrozen(true);

        // High-scoring post that matches preferences perfectly
        highScorePost = new SurplusPost();
        highScorePost.setId(1L);
        highScorePost.setTitle("Fresh Organic Apples");
        highScorePost.setFoodCategories(Set.of(FoodCategory.FRUITS_VEGETABLES));
        highScorePost.setQuantity(new Quantity(25.0, Quantity.Unit.KILOGRAM)); // Perfect fit
        highScorePost.setExpiryDate(LocalDate.now().plusDays(3)); // Good expiry
        highScorePost.setStatus(PostStatus.AVAILABLE);

        // Low-scoring post that doesn't match well
        lowScorePost = new SurplusPost();
        lowScorePost.setId(2L);
        lowScorePost.setTitle("Raw Meat");
        lowScorePost.setFoodCategories(Set.of(FoodCategory.FRESH_MEAT)); // Not preferred
        lowScorePost.setQuantity(new Quantity(200.0, Quantity.Unit.KILOGRAM)); // Too big
        lowScorePost.setExpiryDate(LocalDate.now().minusDays(1)); // Expired
        lowScorePost.setStatus(PostStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Should provide high recommendation score for well-matched posts")
    void shouldProvideHighRecommendationScoreForWellMatchedPosts() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(highScorePost));
        when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

        // When
        RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getPostId());
        assertTrue(result.getScore() >= 80, "High-scoring post should get score >= 80");
        assertTrue(result.getIsRecommended(), "Well-matched post should be recommended");
        
        // Verify specific matching criteria
        List<String> reasons = result.getReasons();
        assertTrue(reasons.stream().anyMatch(r -> r.contains("FRUITS_VEGETABLES")), 
                  "Should mention food category match");
        assertTrue(reasons.stream().anyMatch(r -> r.contains("quantity")), 
                  "Should mention quantity compatibility");
        assertTrue(reasons.stream().anyMatch(r -> r.contains("capacity")), 
                  "Should mention capacity compatibility");
    }

    @Test
    @DisplayName("Should provide low recommendation score for poorly matched posts")
    void shouldProvideLowRecommendationScoreForPoorlyMatchedPosts() {
        // Given
        when(surplusPostRepository.findById(2L)).thenReturn(Optional.of(lowScorePost));
        when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

        // When
        RecommendationDTO result = recommendationService.getRecommendationData(2L, testUser);

        // Then
        assertNotNull(result);
        assertEquals(2L, result.getPostId());
        assertTrue(result.getScore() <= 30, "Poorly-matched post should get low score");
        //assertFalse(result.getIsRecommended(), "Poorly-matched post should not be recommended");

        // Verify specific mismatch reasons
        List<String> reasons = result.getReasons();
        assertTrue(reasons.stream().anyMatch(r -> r.contains("doesn't match preferences") || r.contains("mismatch")), 
                  "Should mention mismatches");
    }

    @Test
    @DisplayName("Should handle batch recommendations correctly")
    void shouldHandleBatchRecommendationsCorrectly() {
        // Given
        List<Long> postIds = Arrays.asList(1L, 2L);
        when(surplusPostRepository.findAllById(postIds))
            .thenReturn(Arrays.asList(highScorePost, lowScorePost));
        when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

        // When
        Map<Long, RecommendationDTO> results = recommendationService.getRecommendationsForUser(testUser, postIds);

        // Then
        assertNotNull(results);
        assertEquals(2, results.size());
        
        // High scoring post
        RecommendationDTO highScoreResult = results.get(1L);
        assertNotNull(highScoreResult);
        assertTrue(highScoreResult.getScore() >= 80);
        assertTrue(highScoreResult.getIsRecommended());

        // Low scoring post
        RecommendationDTO lowScoreResult = results.get(2L);
        assertNotNull(lowScoreResult);
        assertTrue(lowScoreResult.getScore() <= 30);
        //assertFalse(lowScoreResult.getIsRecommended());
    }

    @Test
    @DisplayName("Should filter recommendations by minimum score threshold")
    void shouldFilterRecommendationsByMinimumScoreThreshold() {
        // Given
        List<SurplusPost> availablePosts = Arrays.asList(highScorePost, lowScorePost);
        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE))
            .thenReturn(availablePosts);
        when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

        // When - Request high minimum score
        List<RecommendationDTO> results = recommendationService.getRecommendedPosts(testUser, 70);

        // Then - Should only include high-scoring post
        assertNotNull(results);
        assertEquals(1, results.size(), "Should only return posts above threshold");
        
        RecommendationDTO result = results.get(0);
        assertEquals(1L, result.getPostId());
        assertTrue(result.getScore() >= 70);
    }

    @Test
    @DisplayName("Should handle edge case of user with no preferences")
    void shouldHandleEdgeCaseOfUserWithNoPreferences() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(highScorePost));
        when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.empty());

        // When
        RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getPostId());
        assertEquals(0, result.getScore(), "Should return zero score when no preferences");
        assertFalse(result.getIsRecommended());
        assertTrue(result.getReasons().contains("No preferences set"));
    }

    @Test
    @DisplayName("Should handle edge case of non-existent post")
    void shouldHandleEdgeCaseOfNonExistentPost() {
        // Given
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        RecommendationDTO result = recommendationService.getRecommendationData(999L, testUser);

        // Then
        assertNotNull(result);
        assertEquals(999L, result.getPostId());
        assertEquals(0, result.getScore());
        assertFalse(result.getIsRecommended());
        assertTrue(result.getReasons().contains("Post not found"));
    }

    @Test
    @DisplayName("Should provide consistent recommendations for same inputs")
    void shouldProvideConsistentRecommendationsForSameInputs() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(highScorePost));
        when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

        // When - Call multiple times
        RecommendationDTO result1 = recommendationService.getRecommendationData(1L, testUser);
        RecommendationDTO result2 = recommendationService.getRecommendationData(1L, testUser);
        RecommendationDTO result3 = recommendationService.getRecommendationData(1L, testUser);

        // Then - Results should be identical
        assertEquals(result1.getScore(), result2.getScore());
        assertEquals(result2.getScore(), result3.getScore());
        assertEquals(result1.getReasons(), result2.getReasons());
        assertEquals(result2.getReasons(), result3.getReasons());
    }

    @Test
    @DisplayName("Should handle boundary quantity values correctly")
    void shouldHandleBoundaryQuantityValuesCorrectly() {
        // Given - Post with quantity exactly at max preference
        SurplusPost boundaryPost = new SurplusPost();
        boundaryPost.setId(3L);
        boundaryPost.setFoodCategories(Set.of(FoodCategory.FRUITS_VEGETABLES));
        boundaryPost.setQuantity(new Quantity(50.0, Quantity.Unit.KILOGRAM)); // Exactly at max
        boundaryPost.setExpiryDate(LocalDate.now().plusDays(2));
        boundaryPost.setStatus(PostStatus.AVAILABLE);

        when(surplusPostRepository.findById(3L)).thenReturn(Optional.of(boundaryPost));
        when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

        // When
        RecommendationDTO result = recommendationService.getRecommendationData(3L, testUser);

        // Then
        assertNotNull(result);
        assertTrue(result.getScore() >= 70, "Boundary quantity should still get good score");
        assertTrue(result.getReasons().stream()
                  .anyMatch(r -> r.contains("Perfect quantity match")));
    }

    @Test
    @DisplayName("Should prioritize posts with better matches in scoring")
    void shouldPrioritizePostsWithBetterMatchesInScoring() {
        // Given - Two posts with different match qualities
        SurplusPost mediumPost = new SurplusPost();
        mediumPost.setId(4L);
        mediumPost.setFoodCategories(Set.of(FoodCategory.BAKERY_PASTRY)); // Matches preference
        mediumPost.setQuantity(new Quantity(60.0, Quantity.Unit.KILOGRAM)); // Slightly over preference
        mediumPost.setExpiryDate(LocalDate.now().plusDays(1)); // OK expiry
        mediumPost.setStatus(PostStatus.AVAILABLE);

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(highScorePost));
        when(surplusPostRepository.findById(4L)).thenReturn(Optional.of(mediumPost));
        when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

        // When
        RecommendationDTO perfectMatchResult = recommendationService.getRecommendationData(1L, testUser);
        RecommendationDTO mediumMatchResult = recommendationService.getRecommendationData(4L, testUser);

        // Then
        assertTrue(perfectMatchResult.getScore() > mediumMatchResult.getScore(),
                  "Perfect match should score higher than partial match");
        assertTrue(perfectMatchResult.getScore() >= 80);
        assertTrue(mediumMatchResult.getScore() >= 40 && mediumMatchResult.getScore() < 80);
    }
}