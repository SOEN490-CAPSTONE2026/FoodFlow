package com.example.foodflow.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.example.foodflow.model.dto.RecommendationDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.RecommendationService;

/**
 * Unit tests for RecommendationController without Spring context
 * Tests controller logic directly without web layer complexity
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RecommendationController Unit Tests")
class RecommendationControllerTest {

    @Mock
    private RecommendationService recommendationService;

    @InjectMocks
    private RecommendationController recommendationController;

    private User testUser;
    private RecommendationDTO testRecommendation;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testRecommendation = new RecommendationDTO(
            1L, 
            85, 
            Arrays.asList("Perfect match!", "Great quantity", "Good location")
        );
    }

    @Nested
    @DisplayName("getRecommendationForPost Tests")
    class GetRecommendationForPostTests {

        @Test
        @DisplayName("Should return recommendation for valid post ID")
        void shouldReturnRecommendationForValidPostId() {
            // Given
            when(recommendationService.getRecommendationData(1L, testUser))
                .thenReturn(testRecommendation);

            // When
            ResponseEntity<RecommendationDTO> response = 
                recommendationController.getRecommendationForPost(1L, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1L, response.getBody().getPostId());
            assertEquals(85, response.getBody().getScore());
            assertTrue(response.getBody().getIsRecommended());
            assertEquals(3, response.getBody().getReasons().size());

            verify(recommendationService).getRecommendationData(1L, testUser);
        }

        @Test
        @DisplayName("Should return zero score recommendation for non-existent post")
        void shouldReturnZeroScoreForNonExistentPost() {
            // Given
            RecommendationDTO zeroScoreRecommendation = new RecommendationDTO(
                999L, 0, Arrays.asList("Post not found")
            );
            when(recommendationService.getRecommendationData(999L, testUser))
                .thenReturn(zeroScoreRecommendation);

            // When
            ResponseEntity<RecommendationDTO> response = 
                recommendationController.getRecommendationForPost(999L, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(999L, response.getBody().getPostId());
            assertEquals(0, response.getBody().getScore());
            assertFalse(response.getBody().getIsRecommended());
            assertTrue(response.getBody().getReasons().contains("Post not found"));

            verify(recommendationService).getRecommendationData(999L, testUser);
        }

        @Test
        @DisplayName("Should handle service exception gracefully")
        void shouldHandleServiceExceptionGracefully() {
            // Given
            when(recommendationService.getRecommendationData(1L, testUser))
                .thenThrow(new RuntimeException("Service error"));

            // When/Then
            assertThrows(RuntimeException.class, () -> {
                recommendationController.getRecommendationForPost(1L, testUser);
            });

            verify(recommendationService).getRecommendationData(1L, testUser);
        }
    }

    @Nested
    @DisplayName("getRecommendationsForPosts Tests")
    class GetRecommendationsForPostsTests {

        @Test
        @DisplayName("Should return recommendations for multiple post IDs")
        void shouldReturnRecommendationsForMultiplePostIds() {
            // Given
            List<Long> postIds = Arrays.asList(1L, 2L);
            Map<Long, RecommendationDTO> recommendations = Map.of(
                1L, new RecommendationDTO(1L, 85, Arrays.asList("Great match!")),
                2L, new RecommendationDTO(2L, 70, Arrays.asList("Good match!"))
            );
            when(recommendationService.getRecommendationsForUser(testUser, postIds))
                .thenReturn(recommendations);

            // When
            ResponseEntity<Map<Long, RecommendationDTO>> response = 
                recommendationController.getRecommendationsForPosts(postIds, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(2, response.getBody().size());
            assertTrue(response.getBody().containsKey(1L));
            assertTrue(response.getBody().containsKey(2L));
            assertEquals(85, response.getBody().get(1L).getScore());
            assertEquals(70, response.getBody().get(2L).getScore());

            verify(recommendationService).getRecommendationsForUser(testUser, postIds);
        }

        @Test
        @DisplayName("Should handle empty post IDs list")
        void shouldHandleEmptyPostIdsList() {
            // Given
            List<Long> emptyList = Collections.emptyList();
            when(recommendationService.getRecommendationsForUser(testUser, emptyList))
                .thenReturn(Collections.emptyMap());

            // When
            ResponseEntity<Map<Long, RecommendationDTO>> response = 
                recommendationController.getRecommendationsForPosts(emptyList, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isEmpty());

            verify(recommendationService).getRecommendationsForUser(testUser, emptyList);
        }

        @Test
        @DisplayName("Should handle single post ID")
        void shouldHandleSinglePostId() {
            // Given
            List<Long> singlePostId = Arrays.asList(1L);
            Map<Long, RecommendationDTO> recommendations = Map.of(
                1L, testRecommendation
            );
            when(recommendationService.getRecommendationsForUser(testUser, singlePostId))
                .thenReturn(recommendations);

            // When
            ResponseEntity<Map<Long, RecommendationDTO>> response = 
                recommendationController.getRecommendationsForPosts(singlePostId, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(1, response.getBody().size());
            assertEquals(85, response.getBody().get(1L).getScore());

            verify(recommendationService).getRecommendationsForUser(testUser, singlePostId);
        }
    }

    @Nested
    @DisplayName("getTopRecommendations Tests")
    class GetTopRecommendationsTests {

        @Test
        @DisplayName("Should return top recommendations with default minimum score")
        void shouldReturnTopRecommendationsWithDefaultMinScore() {
            // Given
            List<RecommendationDTO> topRecommendations = Arrays.asList(
                new RecommendationDTO(1L, 90, Arrays.asList("Excellent match!")),
                new RecommendationDTO(2L, 80, Arrays.asList("Very good match!"))
            );
            when(recommendationService.getRecommendedPosts(testUser, 50))
                .thenReturn(topRecommendations);

            // When
            ResponseEntity<List<RecommendationDTO>> response = 
                recommendationController.getTopRecommendations(50, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(2, response.getBody().size());
            assertEquals(1L, response.getBody().get(0).getPostId());
            assertEquals(90, response.getBody().get(0).getScore());
            assertEquals(2L, response.getBody().get(1).getPostId());
            assertEquals(80, response.getBody().get(1).getScore());

            verify(recommendationService).getRecommendedPosts(testUser, 50);
        }

        @Test
        @DisplayName("Should return top recommendations with custom minimum score")
        void shouldReturnTopRecommendationsWithCustomMinScore() {
            // Given
            List<RecommendationDTO> topRecommendations = Arrays.asList(
                new RecommendationDTO(1L, 95, Arrays.asList("Perfect match!"))
            );
            when(recommendationService.getRecommendedPosts(testUser, 80))
                .thenReturn(topRecommendations);

            // When
            ResponseEntity<List<RecommendationDTO>> response = 
                recommendationController.getTopRecommendations(80, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(1, response.getBody().size());
            assertEquals(95, response.getBody().get(0).getScore());

            verify(recommendationService).getRecommendedPosts(testUser, 80);
        }

        @Test
        @DisplayName("Should return empty list when no recommendations meet threshold")
        void shouldReturnEmptyListWhenNoRecommendationsMeetThreshold() {
            // Given
            when(recommendationService.getRecommendedPosts(testUser, 90))
                .thenReturn(Collections.emptyList());

            // When
            ResponseEntity<List<RecommendationDTO>> response = 
                recommendationController.getTopRecommendations(90, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody().isEmpty());

            verify(recommendationService).getRecommendedPosts(testUser, 90);
        }
    }

    @Nested
    @DisplayName("getBrowseRecommendations Tests")
    class GetBrowseRecommendationsTests {

        @Test
        @DisplayName("Should return browse recommendations with string keys")
        void shouldReturnBrowseRecommendationsWithStringKeys() {
            // Given
            List<Long> postIds = Arrays.asList(1L, 2L);
            Map<Long, RecommendationDTO> serviceResponse = Map.of(
                1L, new RecommendationDTO(1L, 85, Arrays.asList("Great match!")),
                2L, new RecommendationDTO(2L, 70, Arrays.asList("Good match!"))
            );
            when(recommendationService.getRecommendationsForUser(testUser, postIds))
                .thenReturn(serviceResponse);

            // When
            ResponseEntity<Map<String, RecommendationDTO>> response = 
                recommendationController.getBrowseRecommendations(postIds, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(2, response.getBody().size());
            assertTrue(response.getBody().containsKey("1"));
            assertTrue(response.getBody().containsKey("2"));
            assertEquals(1L, response.getBody().get("1").getPostId());
            assertEquals(85, response.getBody().get("1").getScore());
            assertEquals(2L, response.getBody().get("2").getPostId());
            assertEquals(70, response.getBody().get("2").getScore());

            verify(recommendationService).getRecommendationsForUser(testUser, postIds);
        }

        @Test
        @DisplayName("Should handle large number of post IDs")
        void shouldHandleLargeNumberOfPostIds() {
            // Given
            List<Long> postIds = Arrays.asList(1L, 2L, 3L, 4L, 5L);
            Map<Long, RecommendationDTO> serviceResponse = new HashMap<>();
            for (Long id : postIds) {
                serviceResponse.put(id, new RecommendationDTO(id, 75, Arrays.asList("Match for " + id)));
            }
            when(recommendationService.getRecommendationsForUser(testUser, postIds))
                .thenReturn(serviceResponse);

            // When
            ResponseEntity<Map<String, RecommendationDTO>> response = 
                recommendationController.getBrowseRecommendations(postIds, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(5, response.getBody().size());
            for (int i = 1; i <= 5; i++) {
                assertTrue(response.getBody().containsKey(String.valueOf(i)));
                assertEquals(75, response.getBody().get(String.valueOf(i)).getScore());
            }

            verify(recommendationService).getRecommendationsForUser(testUser, postIds);
        }

        @Test
        @DisplayName("Should handle empty response from service")
        void shouldHandleEmptyResponseFromService() {
            // Given
            List<Long> postIds = Arrays.asList(1L, 2L);
            when(recommendationService.getRecommendationsForUser(testUser, postIds))
                .thenReturn(Collections.emptyMap());

            // When
            ResponseEntity<Map<String, RecommendationDTO>> response = 
                recommendationController.getBrowseRecommendations(postIds, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody().isEmpty());

            verify(recommendationService).getRecommendationsForUser(testUser, postIds);
        }
    }

    @Nested
    @DisplayName("Error Handling Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should propagate service exceptions")
        void shouldPropagateServiceExceptions() {
            // Given
            when(recommendationService.getRecommendationData(1L, testUser))
                .thenThrow(new RuntimeException("Database connection failed"));

            // When/Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                recommendationController.getRecommendationForPost(1L, testUser);
            });

            assertEquals("Database connection failed", exception.getMessage());
            verify(recommendationService).getRecommendationData(1L, testUser);
        }
    }

    @Nested
    @DisplayName("Performance Tests")
    class PerformanceTests {

        @Test
        @DisplayName("Should handle multiple sequential requests efficiently")
        void shouldHandleMultipleSequentialRequestsEfficiently() {
            // Given
            when(recommendationService.getRecommendationData(anyLong(), eq(testUser)))
                .thenReturn(testRecommendation);

            // When - Make multiple requests
            for (int i = 1; i <= 10; i++) {
                ResponseEntity<RecommendationDTO> response = 
                    recommendationController.getRecommendationForPost((long) i, testUser);
                
                // Then - Each should succeed
                assertEquals(HttpStatus.OK, response.getStatusCode());
                assertEquals(85, response.getBody().getScore());
            }

            verify(recommendationService, times(10)).getRecommendationData(anyLong(), eq(testUser));
        }

        @Test
        @DisplayName("Should handle bulk recommendations efficiently")
        void shouldHandleBulkRecommendationsEfficiently() {
            // Given - Large list of post IDs
            List<Long> largePostIdList = new ArrayList<>();
            Map<Long, RecommendationDTO> largeResponse = new HashMap<>();
            for (long i = 1; i <= 100; i++) {
                largePostIdList.add(i);
                largeResponse.put(i, new RecommendationDTO(i, 75, Arrays.asList("Match " + i)));
            }
            
            when(recommendationService.getRecommendationsForUser(testUser, largePostIdList))
                .thenReturn(largeResponse);

            // When
            ResponseEntity<Map<Long, RecommendationDTO>> response = 
                recommendationController.getRecommendationsForPosts(largePostIdList, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(100, response.getBody().size());

            verify(recommendationService, times(1)).getRecommendationsForUser(testUser, largePostIdList);
        }
    }

    @Nested
    @DisplayName("Data Validation Tests")
    class DataValidationTests {

        @Test
        @DisplayName("Should preserve recommendation data integrity")
        void shouldPreserveRecommendationDataIntegrity() {
            // Given
            RecommendationDTO complexRecommendation = new RecommendationDTO(
                123L, 
                77, 
                Arrays.asList("Complex reason 1", "Complex reason 2", "Complex reason 3")
            );
            when(recommendationService.getRecommendationData(123L, testUser))
                .thenReturn(complexRecommendation);

            // When
            ResponseEntity<RecommendationDTO> response = 
                recommendationController.getRecommendationForPost(123L, testUser);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            RecommendationDTO result = response.getBody();
            assertEquals(123L, result.getPostId());
            assertEquals(77, result.getScore());
            assertEquals(3, result.getReasons().size());
            assertTrue(result.getReasons().contains("Complex reason 1"));
            assertTrue(result.getReasons().contains("Complex reason 2"));
            assertTrue(result.getReasons().contains("Complex reason 3"));
        }

        @Test
        @DisplayName("Should handle edge case scores correctly")
        void shouldHandleEdgeCaseScoresCorrectly() {
            // Given
            RecommendationDTO zeroScoreRecommendation = new RecommendationDTO(
                999L, 0, Arrays.asList("No match found")
            );
            RecommendationDTO maxScoreRecommendation = new RecommendationDTO(
                1000L, 100, Arrays.asList("Perfect match")
            );
            
            when(recommendationService.getRecommendationData(999L, testUser))
                .thenReturn(zeroScoreRecommendation);
            when(recommendationService.getRecommendationData(1000L, testUser))
                .thenReturn(maxScoreRecommendation);

            // When
            ResponseEntity<RecommendationDTO> zeroResponse = 
                recommendationController.getRecommendationForPost(999L, testUser);
            ResponseEntity<RecommendationDTO> maxResponse = 
                recommendationController.getRecommendationForPost(1000L, testUser);

            // Then
            assertEquals(0, zeroResponse.getBody().getScore());
            assertFalse(zeroResponse.getBody().getIsRecommended());
            
            assertEquals(100, maxResponse.getBody().getScore());
            assertTrue(maxResponse.getBody().getIsRecommended());
        }
    }
}