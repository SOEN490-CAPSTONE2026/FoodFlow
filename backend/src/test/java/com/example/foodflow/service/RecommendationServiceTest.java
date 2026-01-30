package com.example.foodflow.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("RecommendationService Tests")
class RecommendationServiceTest {

    @Mock
    private ReceiverPreferencesRepository preferencesRepository;

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock
    private BusinessMetricsService businessMetricsService;

    @InjectMocks
    private RecommendationService recommendationService;

    private User testUser;
    private ReceiverPreferences testPreferences;
    private SurplusPost testPost;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);

        testPreferences = new ReceiverPreferences();
        testPreferences.setId(1L);
        testPreferences.setUser(testUser);
        testPreferences.setPreferredFoodTypes(Arrays.asList("FRUITS_VEGETABLES", "BAKERY_PASTRY"));
        testPreferences.setMinQuantity(5);
        testPreferences.setMaxQuantity(50);
        testPreferences.setMaxCapacity(100);
        testPreferences.setAcceptRefrigerated(true);
        testPreferences.setAcceptFrozen(true);
        testPreferences.setPreferredDonationSizes(List.of("BULK"));

        testPost = new SurplusPost();
        testPost.setId(1L);
        testPost.setTitle("Test Post");
        testPost.setFoodCategories(Set.of(FoodCategory.FRUITS_VEGETABLES));
        testPost.setQuantity(new Quantity(25.0, Quantity.Unit.KILOGRAM));
        testPost.setExpiryDate(LocalDate.now().plusDays(3));
        testPost.setStatus(PostStatus.AVAILABLE);
    }

    @Nested
    @DisplayName("getRecommendationData Tests")
    class GetRecommendationDataTests {

        @Test
        @DisplayName("Should return zero score when post not found")
        void shouldReturnZeroScoreWhenPostNotFound() {
            // Given
            when(surplusPostRepository.findById(99L)).thenReturn(Optional.empty());

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(99L, testUser);

            // Then
            assertNotNull(result);
            assertEquals(99L, result.getPostId());
            assertEquals(0, result.getScore());
            assertTrue(result.getReasons().contains("Post not found"));
        }

        @Test
        @DisplayName("Should return zero score when no preferences set")
        void shouldReturnZeroScoreWhenNoPreferences() {
            // Given
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.empty());

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertNotNull(result);
            assertEquals(1L, result.getPostId());
            assertEquals(0, result.getScore());
            assertTrue(result.getReasons().contains("No preferences set"));
        }

        @Test
        @DisplayName("Should calculate high score for perfect match")
        void shouldCalculateHighScoreForPerfectMatch() {
            // Given
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertNotNull(result);
            assertEquals(1L, result.getPostId());
            assertTrue(result.getScore() >= 60, "Score should be high for perfect match");
            assertTrue(result.getReasons().stream()
                .anyMatch(reason -> reason.contains("Matches preference: fruits vegetables")));
        }
    }

    @Nested
    @DisplayName("Food Category Scoring Tests")
    class FoodCategoryScoringTests {

        @Test
        @DisplayName("Should give high score for exact food category match")
        void shouldGiveHighScoreForExactMatch() {
            // Given
            testPost.setFoodCategories(Set.of(FoodCategory.FRUITS_VEGETABLES));
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertTrue(result.getScore() > 60);
            assertTrue(result.getReasons().stream()
                .anyMatch(reason -> reason.contains("Matches preference: fruits vegetables")));
        }

        @Test
        @DisplayName("Should give zero score for no food category match")
        void shouldGiveZeroScoreForNoMatch() {
            // Given
            testPost.setFoodCategories(Set.of(FoodCategory.FRESH_MEAT));
            testPreferences.setPreferredFoodTypes(Arrays.asList("FRUITS_VEGETABLES"));
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertTrue(result.getScore() < 60);
        }

        @Test
        @DisplayName("Should give moderate score when no food preferences set")
        void shouldGiveModeateScoreWhenNoFoodPreferences() {
            // Given
            testPreferences.setPreferredFoodTypes(new ArrayList<>());
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertTrue(result.getReasons().stream()
                .anyMatch(reason -> reason.contains("Accepts all food types")));
        }

        @Test
        @DisplayName("Should handle multiple category matches")
        void shouldHandleMultipleCategoryMatches() {
            // Given
            testPost.setFoodCategories(Set.of(FoodCategory.FRUITS_VEGETABLES, FoodCategory.BAKERY_PASTRY));
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertTrue(result.getScore() >= 70); // Should get maximum food category score
            assertTrue(result.getReasons().stream()
                .anyMatch(reason -> reason.contains("Matches 2 preferred categories")));
        }
    }

    @Nested
    @DisplayName("Quantity Scoring Tests")
    class QuantityScoringTests {

        @Test
        @DisplayName("Should give perfect score for quantity within range")
        void shouldGivePerfectScoreForQuantityWithinRange() {
            // Given
            testPost.setQuantity(new Quantity(25.0, Quantity.Unit.KILOGRAM)); // Within 5-50 range
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertTrue(result.getReasons().stream()
                .anyMatch(reason -> reason.contains("Preferred size: bulk donation")));
        }

        @Test
        @DisplayName("Should give lower score for quantity outside range")
        void shouldGiveLowerScoreForQuantityOutsideRange() {
            // Given
            testPost.setQuantity(new Quantity(2.0, Quantity.Unit.KILOGRAM)); // Above max of 50
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertTrue(result.getScore() < 60);
        }

        @Test
        @DisplayName("Should handle null quantity gracefully")
        void shouldHandleNullQuantityGracefully() {
            // Given
            testPost.setQuantity(null);
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertNotNull(result);
            // Should not throw exception and should handle gracefully
        }
    }

    @Nested
    @DisplayName("Expiry Date Scoring Tests")
    class ExpiryDateScoringTests {

        @Test
        @DisplayName("Should give high score for good expiry window")
        void shouldGiveHighScoreForGoodExpiryWindow() {
            // Given
            testPost.setExpiryDate(LocalDate.now().plusDays(5));
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertTrue(result.getReasons().stream()
                .anyMatch(reason -> reason.contains("Good freshness - 5 days left")));
        }

        @Test
        @DisplayName("Should give lower score for soon expiring items")
        void shouldGiveLowerScoreForSoonExpiringItems() {
            // Given
            testPost.setExpiryDate(LocalDate.now().plusDays(1));
            when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));

            // When
            RecommendationDTO result = recommendationService.getRecommendationData(1L, testUser);

            // Then
            assertTrue(result.getScore() < 75);
        }
    }

    @Nested
    @DisplayName("getRecommendationsForUser Tests")
    class GetRecommendationsForUserTests {

        @Test
        @DisplayName("Should return recommendations for multiple posts")
        void shouldReturnRecommendationsForMultiplePosts() {
            // Given
            List<Long> postIds = Arrays.asList(1L, 2L, 3L);
            SurplusPost post2 = new SurplusPost();
            post2.setId(2L);
            post2.setFoodCategories(Set.of(FoodCategory.BAKERY_PASTRY));
            post2.setQuantity(new Quantity(15.0, Quantity.Unit.KILOGRAM));
            post2.setExpiryDate(LocalDate.now().plusDays(2));
            post2.setStatus(PostStatus.AVAILABLE);

            List<SurplusPost> posts = Arrays.asList(testPost, post2);
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));
            when(surplusPostRepository.findAllById(postIds)).thenReturn(posts);

            // When
            Map<Long, RecommendationDTO> result = recommendationService.getRecommendationsForUser(testUser, postIds);

            // Then
            assertNotNull(result);
            assertEquals(2, result.size());
            assertTrue(result.containsKey(1L));
            assertTrue(result.containsKey(2L));
        }

        @Test
        @DisplayName("Should handle empty post list")
        void shouldHandleEmptyPostList() {
            // Given
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));
            when(surplusPostRepository.findAllById(any())).thenReturn(Collections.emptyList());

            // When
            Map<Long, RecommendationDTO> result = recommendationService.getRecommendationsForUser(testUser, Collections.emptyList());

            // Then
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("getRecommendedPosts Tests")
    class GetRecommendedPostsTests {

        @Test
        @DisplayName("Should return posts above minimum score threshold")
        void shouldReturnPostsAboveMinimumScore() {
            // Given
            List<SurplusPost> availablePosts = Arrays.asList(testPost);
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));
            when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE)).thenReturn(availablePosts);

            // When
            Map<Long, RecommendationDTO> result = recommendationService.getRecommendedPosts(testUser, 50);

            // Then
            assertNotNull(result);
            assertFalse(result.isEmpty());
            assertTrue(result.get(1L).getScore() >= 50);
        }

        @Test
        @DisplayName("Should return empty list when no preferences")
        void shouldReturnEmptyListWhenNoPreferences() {
            // Given
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.empty());

            // When
            Map<Long, RecommendationDTO> result = recommendationService.getRecommendedPosts(testUser, 50);

            // Then
            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should filter out posts below minimum score")
        void shouldFilterOutPostsBelowMinimumScore() {
            // Given
            SurplusPost lowScorePost = new SurplusPost();
            lowScorePost.setId(2L);
            lowScorePost.setFoodCategories(Set.of(FoodCategory.FRESH_MEAT)); // Not in preferences
            lowScorePost.setQuantity(new Quantity(200.0, Quantity.Unit.KILOGRAM)); // Above capacity
            lowScorePost.setExpiryDate(LocalDate.now().minusDays(1)); // Expired
            lowScorePost.setStatus(PostStatus.AVAILABLE);

            List<SurplusPost> availablePosts = Arrays.asList(testPost, lowScorePost);
            when(preferencesRepository.findByUser(testUser)).thenReturn(Optional.of(testPreferences));
            when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE)).thenReturn(availablePosts);

            // When
            Map<Long, RecommendationDTO> result = recommendationService.getRecommendedPosts(testUser, 70);

            // Then
            assertNotNull(result);
            // Should only contain high-scoring posts
            assertTrue(result.entrySet().stream().allMatch(entry -> entry.getValue().getScore() >= 70));
        }
    }

}