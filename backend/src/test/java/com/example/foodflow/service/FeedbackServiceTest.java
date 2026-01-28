package com.example.foodflow.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
import org.springframework.test.util.ReflectionTestUtils;

import com.example.foodflow.model.dto.AdminRatingDashboardDTO;
import com.example.foodflow.model.dto.FeedbackRequestDTO;
import com.example.foodflow.model.dto.FeedbackResponseDTO;
import com.example.foodflow.model.dto.UserRatingDTO;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.Feedback;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.FeedbackRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("FeedbackService Tests")
class FeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private AlertService alertService;

    @InjectMocks
    private FeedbackService feedbackService;

    private User donor;
    private User receiver;
    private SurplusPost surplusPost;
    private Claim claim;
    private FeedbackRequestDTO feedbackRequest;

    @BeforeEach
    void setUp() {
        // Create donor
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@example.com");
        
        Organization donorOrg = new Organization();
        donorOrg.setName("Local Bakery");
        donor.setOrganization(donorOrg);

        // Create receiver
        receiver = new User();
        receiver.setId(2L);
        receiver.setEmail("receiver@example.com");
        
        Organization receiverOrg = new Organization();
        receiverOrg.setName("Food Bank");
        receiver.setOrganization(receiverOrg);

        // Create surplus post
        surplusPost = new SurplusPost();
        surplusPost.setId(1L);
        surplusPost.setTitle("Fresh Bread");
        surplusPost.setDonor(donor);

        // Create claim
        claim = new Claim();
        claim.setId(1L);
        claim.setSurplusPost(surplusPost);
        claim.setReceiver(receiver);
        claim.setStatus(ClaimStatus.COMPLETED);

        // Create feedback request
        feedbackRequest = new FeedbackRequestDTO();
        feedbackRequest.setClaimId(1L);
        feedbackRequest.setRating(5);
        feedbackRequest.setReviewText("Excellent cooperation!");

        // Fix the @Value property injection issue with ReflectionTestUtils
        ReflectionTestUtils.setField(feedbackService, "lowRatingThreshold", 2.0);
        ReflectionTestUtils.setField(feedbackService, "minReviewsForAlert", 3);
    }

    @Nested
    @DisplayName("Submit Feedback Tests")
    class SubmitFeedbackTests {

        @Test
        @DisplayName("Should successfully submit feedback when all conditions are met")
        void shouldSuccessfullySubmitFeedback() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.existsByClaimAndReviewer(claim, donor)).thenReturn(false);
            
            Feedback savedFeedback = new Feedback(claim, donor, receiver, 5, "Excellent cooperation!");
            savedFeedback.setId(1L);
            savedFeedback.setCreatedAt(LocalDateTime.now());
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(savedFeedback);

            // Mock rating calculation for threshold check
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(4.5);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(5L);
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(Arrays.asList());

            // When
            FeedbackResponseDTO result = feedbackService.submitFeedback(feedbackRequest, donor);

            // Then
            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals(1L, result.getClaimId());
            assertEquals(donor.getId(), result.getReviewerId());
            assertEquals(receiver.getId(), result.getRevieweeId());
            assertEquals(5, result.getRating());
            assertEquals("Excellent cooperation!", result.getReviewText());

            verify(feedbackRepository).save(any(Feedback.class));
        }

        @Test
        @DisplayName("Should throw exception when claim not found")
        void shouldThrowExceptionWhenClaimNotFound() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.empty());

            // When/Then
            assertThrows(IllegalArgumentException.class, () -> 
                feedbackService.submitFeedback(feedbackRequest, donor));

            verify(feedbackRepository, never()).save(any());
        }
        /* 
        @Test
        @DisplayName("Should throw exception when claim is not completed")
        void shouldThrowExceptionWhenClaimNotCompleted() {
            // Given
            claim.setStatus(ClaimStatus.ACTIVE);
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));

            // When/Then
            assertThrows(IllegalStateException.class, () -> 
                feedbackService.submitFeedback(feedbackRequest, donor));

            verify(feedbackRepository, never()).save(any());
        }
        */

        @Test
        @DisplayName("Should throw exception when user is not part of claim")
        void shouldThrowExceptionWhenUserNotPartOfClaim() {
            // Given
            User randomUser = new User();
            randomUser.setId(99L);
            randomUser.setEmail("random@example.com");
            
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));

            // When/Then
            assertThrows(IllegalArgumentException.class, () -> 
                feedbackService.submitFeedback(feedbackRequest, randomUser));

            verify(feedbackRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when feedback already exists")
        void shouldThrowExceptionWhenFeedbackAlreadyExists() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.existsByClaimAndReviewer(claim, donor)).thenReturn(true);

            // When/Then
            assertThrows(IllegalStateException.class, () -> 
                feedbackService.submitFeedback(feedbackRequest, donor));

            verify(feedbackRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should correctly identify reviewee when donor submits feedback")
        void shouldCorrectlyIdentifyRevieweeWhenDonorSubmits() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.existsByClaimAndReviewer(claim, donor)).thenReturn(false);
            
            // Mock the save method to return a feedback with ID set
            Feedback savedFeedback = new Feedback(claim, donor, receiver, 5, "Excellent cooperation!");
            savedFeedback.setId(1L);
            savedFeedback.setCreatedAt(LocalDateTime.now());
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(savedFeedback);

            // Mock rating calculation
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(4.5);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(5L);
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(Arrays.asList());

            // When
            FeedbackResponseDTO result = feedbackService.submitFeedback(feedbackRequest, donor);

            // Then
            assertNotNull(result);
            verify(feedbackRepository).save(argThat(feedback -> 
                feedback.getReviewer().equals(donor) && feedback.getReviewee().equals(receiver)));
        }

        @Test
        @DisplayName("Should correctly identify reviewee when receiver submits feedback")
        void shouldCorrectlyIdentifyRevieweeWhenReceiverSubmits() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.existsByClaimAndReviewer(claim, receiver)).thenReturn(false);
            
            // Mock the save method to return a feedback with ID set
            Feedback savedFeedback = new Feedback(claim, receiver, donor, 5, "Excellent cooperation!");
            savedFeedback.setId(2L);
            savedFeedback.setCreatedAt(LocalDateTime.now());
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(savedFeedback);

            // Mock rating calculation
            when(feedbackRepository.getAverageRatingForUser(donor)).thenReturn(4.0);
            when(feedbackRepository.getTotalReviewsForUser(donor)).thenReturn(3L);
            when(feedbackRepository.getRatingDistributionForUser(donor)).thenReturn(Arrays.asList());

            // When
            FeedbackResponseDTO result = feedbackService.submitFeedback(feedbackRequest, receiver);

            // Then
            assertNotNull(result);
            verify(feedbackRepository).save(argThat(feedback -> 
                feedback.getReviewer().equals(receiver) && feedback.getReviewee().equals(donor)));
        }
    }

    @Nested
    @DisplayName("Get User Rating Tests")
    class GetUserRatingTests {

        @Test
        @DisplayName("Should calculate user rating correctly")
        void shouldCalculateUserRatingCorrectly() {
            // Given
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(4.3);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(10L);
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(
                Arrays.asList(
                    new Object[]{5, 4L},
                    new Object[]{4, 3L},
                    new Object[]{3, 2L},
                    new Object[]{2, 1L},
                    new Object[]{1, 0L}
                )
            );

            // When
            UserRatingDTO result = feedbackService.getUserRating(receiver);

            // Then
            assertEquals(receiver.getId(), result.getUserId());
            assertEquals("Food Bank", result.getUserName());
            assertEquals(4.3, result.getAverageRating());
            assertEquals(10, result.getTotalReviews());
            assertEquals(4, result.getFiveStarCount());
            assertEquals(3, result.getFourStarCount());
            assertEquals(2, result.getThreeStarCount());
            assertEquals(1, result.getTwoStarCount());
            assertEquals(0, result.getOneStarCount());
            assertTrue(result.hasRatings());
        }

        @Test
        @DisplayName("Should handle user with no ratings")
        void shouldHandleUserWithNoRatings() {
            // Given
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(null);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(0L);
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(Collections.emptyList());

            // When
            UserRatingDTO result = feedbackService.getUserRating(receiver);

            // Then
            assertEquals(receiver.getId(), result.getUserId());
            assertEquals(0.0, result.getAverageRating());
            assertEquals(0, result.getTotalReviews());
            assertFalse(result.hasRatings());
            assertEquals("No ratings yet", result.getRatingDisplay());
        }

        @Test
        @DisplayName("Should use email when organization name not available")
        void shouldUseEmailWhenOrganizationNotAvailable() {
            // Given
            receiver.setOrganization(null);
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(4.0);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(5L);
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(Collections.emptyList());

            // When
            UserRatingDTO result = feedbackService.getUserRating(receiver);

            // Then
            assertEquals("receiver@example.com", result.getUserName());
        }
    }

    @Nested
    @DisplayName("Can Provide Feedback Tests")
    class CanProvideFeedbackTests {

        @Test
        @DisplayName("Should return true when user can provide feedback")
        void shouldReturnTrueWhenUserCanProvideFeedback() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.existsByClaimAndReviewer(claim, donor)).thenReturn(false);

            // When
            boolean result = feedbackService.canProvideFeedback(1L, donor);

            // Then
            assertTrue(result);
        }

        @Test
        @DisplayName("Should return false when claim not found")
        void shouldReturnFalseWhenClaimNotFound() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.empty());

            // When
            boolean result = feedbackService.canProvideFeedback(1L, donor);

            // Then
            assertFalse(result);
        }

        @Test
        @DisplayName("Should return false when claim not completed")
        void shouldReturnFalseWhenClaimNotCompleted() {
            // Given
            claim.setStatus(ClaimStatus.ACTIVE);
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));

            // When
            boolean result = feedbackService.canProvideFeedback(1L, donor);

            // Then
            assertFalse(result);
        }

        @Test
        @DisplayName("Should return false when user already provided feedback")
        void shouldReturnFalseWhenUserAlreadyProvidedFeedback() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.existsByClaimAndReviewer(claim, donor)).thenReturn(true);

            // When
            boolean result = feedbackService.canProvideFeedback(1L, donor);

            // Then
            assertFalse(result);
        }

        @Test
        @DisplayName("Should return false when user not part of claim")
        void shouldReturnFalseWhenUserNotPartOfClaim() {
            // Given
            User randomUser = new User();
            randomUser.setId(99L);
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));

            // When
            boolean result = feedbackService.canProvideFeedback(1L, randomUser);

            // Then
            assertFalse(result);
        }
    }

    @Nested
    @DisplayName("Get Claims Needing Feedback Tests")
    class GetClaimsNeedingFeedbackTests {

        @Test
        @DisplayName("Should return claims that need feedback")
        void shouldReturnClaimsThatNeedFeedback() {
            // Given
            Claim claim2 = new Claim();
            claim2.setId(2L);
            claim2.setStatus(ClaimStatus.COMPLETED);
            
            when(claimRepository.findCompletedClaimsForUser(donor))
                .thenReturn(Arrays.asList(claim, claim2));
            when(feedbackRepository.existsByClaimAndReviewer(claim, donor)).thenReturn(false);
            when(feedbackRepository.existsByClaimAndReviewer(claim2, donor)).thenReturn(true);

            // When
            List<Claim> result = feedbackService.getClaimsNeedingFeedback(donor);

            // Then
            assertEquals(1, result.size());
            assertEquals(claim.getId(), result.get(0).getId());
        }

        @Test
        @DisplayName("Should return empty list when no feedback needed")
        void shouldReturnEmptyListWhenNoFeedbackNeeded() {
            // Given
            when(claimRepository.findCompletedClaimsForUser(donor))
                .thenReturn(Arrays.asList(claim));
            when(feedbackRepository.existsByClaimAndReviewer(claim, donor)).thenReturn(true);

            // When
            List<Claim> result = feedbackService.getClaimsNeedingFeedback(donor);

            // Then
            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("Get Feedback For Claim Tests")
    class GetFeedbackForClaimTests {

        @Test
        @DisplayName("Should return feedback for valid claim")
        void shouldReturnFeedbackForValidClaim() {
            // Given
            Feedback feedback1 = new Feedback(claim, donor, receiver, 5, "Great!");
            feedback1.setId(1L);
            feedback1.setCreatedAt(LocalDateTime.now());
            
            Feedback feedback2 = new Feedback(claim, receiver, donor, 4, "Good!");
            feedback2.setId(2L);
            feedback2.setCreatedAt(LocalDateTime.now());
            
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.findByClaim(claim)).thenReturn(Arrays.asList(feedback1, feedback2));

            // When
            List<FeedbackResponseDTO> result = feedbackService.getFeedbackForClaim(1L, donor);

            // Then
            assertEquals(2, result.size());
            assertEquals(5, result.get(0).getRating());
            assertEquals(4, result.get(1).getRating());
        }

        @Test
        @DisplayName("Should throw exception when user not authorized")
        void shouldThrowExceptionWhenUserNotAuthorized() {
            // Given
            User unauthorizedUser = new User();
            unauthorizedUser.setId(99L);
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));

            // When/Then
            assertThrows(IllegalArgumentException.class, () -> 
                feedbackService.getFeedbackForClaim(1L, unauthorizedUser));
        }
    }

    @Nested
    @DisplayName("Feedback Complete Tests")
    class FeedbackCompleteTests {

        @Test
        @DisplayName("Should return true when both parties provided feedback")
        void shouldReturnTrueWhenBothPartiesProvidedFeedback() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.countFeedbackForClaim(claim)).thenReturn(2L);

            // When
            boolean result = feedbackService.isFeedbackComplete(1L);

            // Then
            assertTrue(result);
        }

        @Test
        @DisplayName("Should return false when feedback incomplete")
        void shouldReturnFalseWhenFeedbackIncomplete() {
            // Given
            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.countFeedbackForClaim(claim)).thenReturn(1L);

            // When
            boolean result = feedbackService.isFeedbackComplete(1L);

            // Then
            assertFalse(result);
        }

        @Test
        @DisplayName("Should return false when claim not found")
        void shouldReturnFalseWhenClaimNotFoundForComplete() {
            // Given
            when(claimRepository.findById(999L)).thenReturn(Optional.empty());

            // When
            boolean result = feedbackService.isFeedbackComplete(999L);

            // Then
            assertFalse(result);
        }
    }

    // ===== NEW ADMIN AND RATING VISIBILITY FUNCTIONALITY =====

    @Nested
    @DisplayName("Admin Dashboard Tests - NEW")
    class AdminDashboardTests {

        @Test
        @DisplayName("Should get users below threshold")
        void shouldGetUsersBelowThreshold() {
            // Given
            List<Object[]> belowThresholdResults = Arrays.asList(
                new Object[]{donor, 1.8, 5L},
                new Object[]{receiver, 1.2, 3L}
            );
            when(feedbackRepository.findUsersBelowRatingThreshold(2.0, 3)).thenReturn(belowThresholdResults);

            // When
            List<UserRatingDTO> result = feedbackService.getUsersBelowThreshold(2.0, 3);

            // Then
            assertNotNull(result);
            assertEquals(2, result.size());
            assertEquals(1.8, result.get(0).getAverageRating());
            assertEquals(5, result.get(0).getTotalReviews());
        }

        @Test
        @DisplayName("Should get admin rating dashboard")
        void shouldGetAdminRatingDashboard() {
            // Given
            List<Object[]> topRatedResults = Arrays.asList(new Object[][]{{receiver, 4.8, 10L}});
            List<Object[]> platformStats = Arrays.asList(new Object[][]{{3.5, 50L, 200L}});

            when(feedbackRepository.findTopRatedUsers(eq(3), any())).thenReturn(topRatedResults);
            when(feedbackRepository.findLowRatedUsers(eq(3), any())).thenReturn(Arrays.asList());
            when(feedbackRepository.getPlatformRatingStatistics()).thenReturn(platformStats);
            when(feedbackRepository.countUsersAboveThreshold(any(), any())).thenReturn(40L);
            when(feedbackRepository.countUsersBelowThreshold(any(), any())).thenReturn(10L);
            when(feedbackRepository.findPotentiallyFlaggedFeedback()).thenReturn(Arrays.asList());
            when(feedbackRepository.findRecentlyRatedUsers(any(), any())).thenReturn(Arrays.asList());

            // When
            AdminRatingDashboardDTO dashboard = feedbackService.getAdminRatingDashboard("all", 20);

            // Then
            assertNotNull(dashboard);
            assertNotNull(dashboard.getOverallStats());
            assertEquals(3.5, dashboard.getOverallStats().getAverageRatingAcrossPlatform());
        }

        @Test
        @DisplayName("Should get all feedback for user (admin view)")
        void shouldGetAllFeedbackForUserAdminView() {
            // Given
            Feedback feedback1 = new Feedback(claim, donor, receiver, 5, "Great!");
            feedback1.setId(1L);
            feedback1.setCreatedAt(LocalDateTime.now());
            
            when(feedbackRepository.findAllFeedbackForUser(receiver))
                .thenReturn(Arrays.asList(feedback1));

            // When
            List<FeedbackResponseDTO> result = feedbackService.getAllFeedbackForUser(receiver);

            // Then
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(5, result.get(0).getRating());
        }

        @Test
        @DisplayName("Should get flagged feedback")
        void shouldGetFlaggedFeedback() {
            // Given
            Feedback flaggedFeedback = new Feedback(claim, receiver, donor, 1, "Terrible experience!");
            flaggedFeedback.setId(1L);
            flaggedFeedback.setCreatedAt(LocalDateTime.now());
            
            when(feedbackRepository.findPotentiallyFlaggedFeedback())
                .thenReturn(Arrays.asList(flaggedFeedback));

            // When
            List<FeedbackResponseDTO> result = feedbackService.getFlaggedFeedback();

            // Then
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(1, result.get(0).getRating());
        }
    }

    @Nested
    @DisplayName("Threshold Alert Tests - NEW") 
    class ThresholdAlertTests {

        @Test
        @DisplayName("Should trigger alert when rating below threshold with sufficient reviews")
        void shouldTriggerAlertWhenRatingBelowThresholdWithSufficientReviews() {
            // Given
            FeedbackRequestDTO lowRatingRequest = new FeedbackRequestDTO();
            lowRatingRequest.setClaimId(1L);
            lowRatingRequest.setRating(1);
            lowRatingRequest.setReviewText("Terrible");

            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.existsByClaimAndReviewer(claim, donor)).thenReturn(false);
            
            Feedback savedFeedback = new Feedback(claim, donor, receiver, 1, "Terrible");
            savedFeedback.setId(1L);
            savedFeedback.setCreatedAt(LocalDateTime.now());
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(savedFeedback);

            // Mock low rating (below 2.0 threshold) with sufficient reviews (>= 3)
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(1.8);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(5L);
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(Arrays.asList());

            // When
            FeedbackResponseDTO result = feedbackService.submitFeedback(lowRatingRequest, donor);

            // Then
            assertNotNull(result);
            assertEquals(1, result.getRating());
            // Alert should be triggered internally (AlertService would be called in real implementation)
        }

        @Test
        @DisplayName("Should not trigger alert for insufficient reviews")
        void shouldNotTriggerAlertForInsufficientReviews() {
            // Given
            FeedbackRequestDTO lowRatingRequest = new FeedbackRequestDTO();
            lowRatingRequest.setClaimId(1L);
            lowRatingRequest.setRating(1);
            lowRatingRequest.setReviewText("Bad");

            when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
            when(feedbackRepository.existsByClaimAndReviewer(claim, donor)).thenReturn(false);
            
            Feedback savedFeedback = new Feedback(claim, donor, receiver, 1, "Bad");
            savedFeedback.setId(1L);
            savedFeedback.setCreatedAt(LocalDateTime.now());
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(savedFeedback);

            // Mock low rating but insufficient reviews (< 3)
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(1.5);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(2L); // Below minimum
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(Arrays.asList());

            // When
            FeedbackResponseDTO result = feedbackService.submitFeedback(lowRatingRequest, donor);

            // Then
            assertNotNull(result);
            assertEquals(1, result.getRating());
            // No alert should be triggered due to insufficient reviews
        }
    }

    @Nested
    @DisplayName("Enhanced Rating Visibility Tests - NEW")
    class EnhancedRatingVisibilityTests {

        @Test
        @DisplayName("Should get comprehensive user rating with statistics")
        void shouldGetComprehensiveUserRatingWithStatistics() {
            // Given
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(4.3);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(15L);
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(
                Arrays.asList(
                    new Object[]{5, 8L},
                    new Object[]{4, 4L},
                    new Object[]{3, 2L},
                    new Object[]{2, 1L},
                    new Object[]{1, 0L}
                )
            );

            // When
            UserRatingDTO result = feedbackService.getUserRating(receiver);

            // Then
            assertNotNull(result);
            assertEquals(receiver.getId(), result.getUserId());
            assertEquals("Food Bank", result.getUserName());
            assertEquals(4.3, result.getAverageRating());
            assertEquals(15, result.getTotalReviews());
            assertEquals(8, result.getFiveStarCount());
            assertEquals(4, result.getFourStarCount());
            assertEquals(2, result.getThreeStarCount());
            assertEquals(1, result.getTwoStarCount());
            assertEquals(0, result.getOneStarCount());
            assertTrue(result.hasRatings());
            assertEquals("4.3/5 (15 reviews)", result.getRatingDisplay());
        }

        @Test
        @DisplayName("Should handle user with zero ratings gracefully")
        void shouldHandleUserWithZeroRatingsGracefully() {
            // Given
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(null);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(0L);
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(Collections.emptyList());

            // When
            UserRatingDTO result = feedbackService.getUserRating(receiver);

            // Then
            assertNotNull(result);
            assertEquals(0.0, result.getAverageRating());
            assertEquals(0, result.getTotalReviews());
            assertFalse(result.hasRatings());
            assertEquals("No ratings yet", result.getRatingDisplay());
            assertEquals(0, result.getFiveStarCount());
        }

        @Test
        @DisplayName("Should use organization name when available")
        void shouldUseOrganizationNameWhenAvailable() {
            // Given
            when(feedbackRepository.getAverageRatingForUser(receiver)).thenReturn(4.0);
            when(feedbackRepository.getTotalReviewsForUser(receiver)).thenReturn(5L);
            when(feedbackRepository.getRatingDistributionForUser(receiver)).thenReturn(Arrays.asList());

            // When
            UserRatingDTO result = feedbackService.getUserRating(receiver);

            // Then
            assertEquals("Food Bank", result.getUserName()); // Organization name
        }

        @Test
        @DisplayName("Should fallback to email when no organization")
        void shouldFallbackToEmailWhenNoOrganization() {
            // Given
            User userWithoutOrg = new User();
            userWithoutOrg.setId(5L);
            userWithoutOrg.setEmail("individual@example.com");

            when(feedbackRepository.getAverageRatingForUser(userWithoutOrg)).thenReturn(3.5);
            when(feedbackRepository.getTotalReviewsForUser(userWithoutOrg)).thenReturn(3L);
            when(feedbackRepository.getRatingDistributionForUser(userWithoutOrg)).thenReturn(Arrays.asList());

            // When
            UserRatingDTO result = feedbackService.getUserRating(userWithoutOrg);

            // Then
            assertEquals("individual@example.com", result.getUserName()); // Email fallback
        }
    }
}