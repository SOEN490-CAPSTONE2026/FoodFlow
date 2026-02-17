package com.example.foodflow.service;

import com.example.foodflow.model.dto.ImpactMetricsDTO;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Comprehensive unit tests for ImpactDashboardService
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ImpactDashboardService Tests")
class ImpactDashboardServiceTest {

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ImpactCalculationService calculationService;

    @Mock
    private FoodTypeImpactService foodTypeImpactService;

    @Mock
    private ImpactMetricsEngine impactMetricsEngine;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ImpactDashboardService service;

    private User donor;
    private User receiver;
    private SurplusPost completedPost;
    private SurplusPost pendingPost;
    private SurplusPost expiredPost;
    private Claim completedClaim;

    // Helper methods to set private fields via reflection for testing
    private void setCreatedAt(SurplusPost post, LocalDateTime dateTime) {
        try {
            Field field = SurplusPost.class.getDeclaredField("createdAt");
            field.setAccessible(true);
            field.set(post, dateTime);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set createdAt", e);
        }
    }

    private void setClaimedAt(Claim claim, LocalDateTime dateTime) {
        try {
            Field field = Claim.class.getDeclaredField("claimedAt");
            field.setAccessible(true);
            field.set(claim, dateTime);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set claimedAt", e);
        }
    }

    @BeforeEach
    void setUp() {
        // Setup donor
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);

        // Setup receiver
        receiver = new User();
        receiver.setId(2L);
        receiver.setEmail("receiver@test.com");
        receiver.setRole(UserRole.RECEIVER);

        // Setup completed post
        completedPost = new SurplusPost();
        completedPost.setId(1L);
        completedPost.setTitle("Fresh Bread");
        completedPost.setDonor(donor);
        completedPost.setStatus(PostStatus.COMPLETED);
        setCreatedAt(completedPost, LocalDateTime.now().minusDays(5));
        completedPost.setExpiryDate(LocalDate.now().plusDays(5));

        Quantity quantity = new Quantity();
        quantity.setValue(10.0);
        quantity.setUnit(Quantity.Unit.KILOGRAM);
        completedPost.setQuantity(quantity);

        Set<FoodCategory> categories = new HashSet<>();
        categories.add(FoodCategory.BREAD);
        completedPost.setFoodCategories(categories);

        // Setup pending post
        pendingPost = new SurplusPost();
        pendingPost.setId(2L);
        pendingPost.setTitle("Vegetables");
        pendingPost.setDonor(donor);
        pendingPost.setStatus(PostStatus.AVAILABLE);
        setCreatedAt(pendingPost, LocalDateTime.now().minusDays(2));
        pendingPost.setExpiryDate(LocalDate.now().plusDays(3));

        Quantity quantity2 = new Quantity();
        quantity2.setValue(5.0);
        quantity2.setUnit(Quantity.Unit.KILOGRAM);
        pendingPost.setQuantity(quantity2);

        Set<FoodCategory> categories2 = new HashSet<>();
        categories2.add(FoodCategory.FRUITS_VEGETABLES);
        pendingPost.setFoodCategories(categories2);

        // Setup expired post
        expiredPost = new SurplusPost();
        expiredPost.setId(3L);
        expiredPost.setTitle("Expired Dairy");
        expiredPost.setDonor(donor);
        expiredPost.setStatus(PostStatus.EXPIRED);
        setCreatedAt(expiredPost, LocalDateTime.now().minusDays(10));
        expiredPost.setExpiryDate(LocalDate.now().minusDays(1));

        Quantity quantity3 = new Quantity();
        quantity3.setValue(2.0);
        quantity3.setUnit(Quantity.Unit.KILOGRAM);
        expiredPost.setQuantity(quantity3);

        Set<FoodCategory> categories3 = new HashSet<>();
        categories3.add(FoodCategory.DAIRY);
        expiredPost.setFoodCategories(categories3);

        // Setup completed claim
        completedClaim = new Claim();
        completedClaim.setId(1L);
        completedClaim.setSurplusPost(completedPost);
        completedClaim.setReceiver(receiver);
        completedClaim.setStatus(ClaimStatus.COMPLETED);
        setClaimedAt(completedClaim, LocalDateTime.now().minusDays(4));

        // Mock calculation service with lenient() to avoid UnnecessaryStubbingException
        lenient().when(calculationService.convertToKg(any(Quantity.class))).thenAnswer(invocation -> {
            Quantity q = invocation.getArgument(0);
            if (q == null) return 0.0;
            return q.getValue(); // Simple mock - assumes kg
        });

        lenient().when(calculationService.calculateCO2Avoided(any(SurplusPost.class), anyDouble()))
            .thenAnswer(invocation -> {
                double weightKg = invocation.getArgument(1, Double.class);
                return weightKg * 0.8; // Mock factor
            });

        lenient().when(calculationService.calculateWaterSaved(any(SurplusPost.class), anyDouble()))
            .thenAnswer(invocation -> {
                double weightKg = invocation.getArgument(1, Double.class);
                return weightKg * 800.0; // Mock factor
            });

        lenient().when(calculationService.calculateMealRange(anyDouble()))
            .thenAnswer(invocation -> {
                double weightKg = invocation.getArgument(0, Double.class);
                int min = (int) (weightKg / 0.6);
                int max = (int) (weightKg / 0.4);
                return new int[]{min, max};
            });

        when(foodTypeImpactService.getFactorVersion()).thenReturn("impact_v1");
        when(calculationService.getDisclosureText()).thenReturn("Test disclosure text");
        try {
            lenient().doReturn("{}").when(objectMapper).writeValueAsString(any());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        lenient().when(impactMetricsEngine.computeImpactMetrics(anyList(), any(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    @SuppressWarnings("unchecked")
                    List<ImpactMetricsEngine.DonationImpactRecord> records = invocation.getArgument(0);
                    LocalDateTime currentStart = invocation.getArgument(1, LocalDateTime.class);
                    LocalDateTime currentEnd = invocation.getArgument(2, LocalDateTime.class);
                    double totalWeight = records.stream()
                            .filter(record -> record.eventTime() != null)
                            .filter(record -> !record.eventTime().isBefore(currentStart) && !record.eventTime().isAfter(currentEnd))
                            .filter(record -> "picked_up".equalsIgnoreCase(record.status()))
                            .filter(record -> record.weightKg() > 0d)
                            .mapToDouble(ImpactMetricsEngine.DonationImpactRecord::weightKg)
                            .sum();
                    int meals = (int) Math.round(totalWeight / 0.544d);
                    return new ImpactMetricsEngine.ImpactComputationResult(
                            new ImpactMetricsEngine.ImpactTotals(totalWeight, totalWeight * 0.8d, meals, totalWeight * 800d, List.of()),
                            new ImpactMetricsEngine.ImpactTotals(0d, 0d, 0, 0d, List.of()),
                            new ImpactMetricsEngine.ImpactDelta(totalWeight, totalWeight * 0.8d, meals, totalWeight * 800d, null, null, null, null),
                            new ImpactMetricsEngine.ImpactAudit(
                                    List.of(),
                                    List.of(),
                                    new ImpactMetricsEngine.FactorSet(Map.of(), Map.of(), 0.544d)));
                });
    }

    @Nested
    @DisplayName("getDonorMetrics Tests")
    class GetDonorMetricsTests {

        @Test
        @DisplayName("Should calculate donor metrics for ALL_TIME")
        void shouldCalculateDonorMetricsForAllTime() {
            // Given
            List<SurplusPost> posts = Arrays.asList(completedPost, pendingPost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);
            when(claimRepository.findBySurplusPost(completedPost)).thenReturn(Optional.of(completedClaim));

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then
            assertNotNull(metrics);
            assertEquals("DONOR", metrics.getRole());
            assertEquals(1L, metrics.getUserId());
            assertEquals("ALL_TIME", metrics.getDateRange());
            assertNotNull(metrics.getStartDate());
            assertNotNull(metrics.getEndDate());

            // Should count all posts
            assertEquals(2, metrics.getTotalPostsCreated());

            // Should count only completed donations
            assertEquals(1, metrics.getTotalDonationsCompleted());

            // Should calculate food weight (10 kg from completed post)
            assertEquals(10.0, metrics.getTotalFoodWeightKg());

            // Should calculate CO2 avoided (10 * 0.8 = 8.0)
            assertEquals(8.0, metrics.getCo2EmissionsAvoidedKg());

            // Should calculate water saved (10 * 800 = 8000)
            assertEquals(8000.0, metrics.getWaterSavedLiters());

            // Should calculate meal range
            assertNotNull(metrics.getMinMealsProvided());
            assertNotNull(metrics.getMaxMealsProvided());
            assertTrue(metrics.getMinMealsProvided() < metrics.getMaxMealsProvided());

            // Should calculate completion rate (1 completed / 2 total = 50%)
            assertEquals(50.0, metrics.getDonationCompletionRate());

            // Should have factor metadata
            assertEquals("impact_v1", metrics.getFactorVersion());
            assertEquals("Test disclosure text", metrics.getFactorDisclosure());
        }

        @Test
        @DisplayName("Should calculate donor metrics for WEEKLY date range")
        void shouldCalculateDonorMetricsForWeekly() {
            // Given
            List<SurplusPost> posts = Arrays.asList(completedPost, pendingPost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "WEEKLY");

            // Then
            assertNotNull(metrics);
            assertEquals("WEEKLY", metrics.getDateRange());
            assertNotNull(metrics.getStartDate());
            assertNotNull(metrics.getEndDate());

            // Verify date range is approximately 7 days
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(
                metrics.getStartDate(), metrics.getEndDate());
            assertTrue(daysBetween >= 6 && daysBetween <= 8);
        }

        @Test
        @DisplayName("Should calculate donor metrics for MONTHLY date range")
        void shouldCalculateDonorMetricsForMonthly() {
            // Given
            List<SurplusPost> posts = Arrays.asList(completedPost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "MONTHLY");

            // Then
            assertNotNull(metrics);
            assertEquals("MONTHLY", metrics.getDateRange());

            // Verify date range is approximately 30 days
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(
                metrics.getStartDate(), metrics.getEndDate());
            assertTrue(daysBetween >= 29 && daysBetween <= 31);
        }

        @Test
        @DisplayName("Should handle donor with no posts")
        void shouldHandleDonorWithNoPosts() {
            // Given
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(Collections.emptyList());

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then
            assertNotNull(metrics);
            assertEquals(0, metrics.getTotalPostsCreated());
            assertEquals(0, metrics.getTotalDonationsCompleted());
            assertEquals(0.0, metrics.getTotalFoodWeightKg());
            assertEquals(0.0, metrics.getDonationCompletionRate());
            assertEquals(0.0, metrics.getWasteDiversionEfficiencyPercent());
        }

        @Test
        @DisplayName("Should calculate waste diversion efficiency")
        void shouldCalculateWasteDiversionEfficiency() {
            // Given
            List<SurplusPost> posts = Arrays.asList(completedPost, pendingPost, expiredPost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then
            assertNotNull(metrics.getWasteDiversionEfficiencyPercent());
            // With expired post (2kg) out of total (17kg), efficiency should be calculated
            assertTrue(metrics.getWasteDiversionEfficiencyPercent() >= 0);
            assertTrue(metrics.getWasteDiversionEfficiencyPercent() <= 100);
        }

        @Test
        @DisplayName("Should calculate active donation days")
        void shouldCalculateActiveDonationDays() {
            // Given
            List<SurplusPost> posts = Arrays.asList(completedPost, pendingPost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then
            assertNotNull(metrics.getActiveDonationDays());
            // Should count distinct days (completedPost: 5 days ago, pendingPost: 2 days ago)
            assertEquals(2, metrics.getActiveDonationDays());
        }

        @Test
        @DisplayName("Should calculate time-based metrics")
        void shouldCalculateTimeBasedMetrics() {
            // Given
            List<SurplusPost> posts = Arrays.asList(completedPost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);
            when(claimRepository.findBySurplusPost(completedPost)).thenReturn(Optional.of(completedClaim));

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then
            assertNotNull(metrics.getMedianClaimTimeHours());
            // Time between post creation (5 days ago) and claim (4 days ago) = ~24 hours
            assertTrue(metrics.getMedianClaimTimeHours() >= 0);
        }

        @Test
        @DisplayName("Should calculate people fed estimate")
        void shouldCalculatePeopleFedEstimate() {
            // Given
            List<SurplusPost> posts = Arrays.asList(completedPost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then
            assertNotNull(metrics.getPeopleFedEstimate());
            // Should be estimated meals / 3
            assertEquals(metrics.getEstimatedMealsProvided() / 3, metrics.getPeopleFedEstimate());
        }
    }

    @Nested
    @DisplayName("getReceiverMetrics Tests")
    class GetReceiverMetricsTests {

        @Test
        @DisplayName("Should calculate receiver metrics for ALL_TIME")
        void shouldCalculateReceiverMetricsForAllTime() {
            // Given
            List<Claim> claims = Arrays.asList(completedClaim);
            when(claimRepository.findAll()).thenReturn(claims);

            // When
            ImpactMetricsDTO metrics = service.getReceiverMetrics(2L, "ALL_TIME");

            // Then
            assertNotNull(metrics);
            assertEquals("RECEIVER", metrics.getRole());
            assertEquals(2L, metrics.getUserId());
            assertEquals("ALL_TIME", metrics.getDateRange());

            // Should count claims
            assertEquals(1, metrics.getTotalClaimsMade());
            assertEquals(1, metrics.getTotalDonationsCompleted());

            // Should calculate food weight received (10 kg)
            assertEquals(10.0, metrics.getTotalFoodWeightKg());

            // Should calculate environmental impact
            assertEquals(8.0, metrics.getCo2EmissionsAvoidedKg());
            assertEquals(8000.0, metrics.getWaterSavedLiters());

            // Should have meal estimates
            assertNotNull(metrics.getMinMealsProvided());
            assertNotNull(metrics.getMaxMealsProvided());
            assertNotNull(metrics.getEstimatedMealsProvided());
        }

        @Test
        @DisplayName("Should handle receiver with no claims")
        void shouldHandleReceiverWithNoClaims() {
            // Given
            when(claimRepository.findAll()).thenReturn(Collections.emptyList());

            // When
            ImpactMetricsDTO metrics = service.getReceiverMetrics(2L, "ALL_TIME");

            // Then
            assertNotNull(metrics);
            assertEquals(0, metrics.getTotalClaimsMade());
            assertEquals(0, metrics.getTotalDonationsCompleted());
            assertEquals(0.0, metrics.getTotalFoodWeightKg());
        }

        @Test
        @DisplayName("Should filter claims by date range")
        void shouldFilterClaimsByDateRange() {
            // Given
            Claim oldClaim = new Claim();
            oldClaim.setId(2L);
            oldClaim.setSurplusPost(completedPost);
            oldClaim.setReceiver(receiver);
            setClaimedAt(oldClaim, LocalDateTime.now().minusMonths(2)); // Old claim
            oldClaim.setStatus(ClaimStatus.COMPLETED);

            List<Claim> claims = Arrays.asList(completedClaim, oldClaim);
            when(claimRepository.findAll()).thenReturn(claims);

            // When
            ImpactMetricsDTO metrics = service.getReceiverMetrics(2L, "MONTHLY");

            // Then
            assertNotNull(metrics);
            // Should only count recent claim within 30 days
            assertEquals(1, metrics.getTotalClaimsMade());
        }

        @Test
        @DisplayName("Should calculate active claim days")
        void shouldCalculateActiveClaimDays() {
            // Given
            Claim claim2 = new Claim();
            claim2.setId(2L);
            claim2.setSurplusPost(pendingPost);
            claim2.setReceiver(receiver);
            setClaimedAt(claim2, LocalDateTime.now().minusDays(1));
            claim2.setStatus(ClaimStatus.COMPLETED);

            List<Claim> claims = Arrays.asList(completedClaim, claim2);
            when(claimRepository.findAll()).thenReturn(claims);

            // When
            ImpactMetricsDTO metrics = service.getReceiverMetrics(2L, "ALL_TIME");

            // Then
            assertNotNull(metrics.getActiveDonationDays());
            // Should count distinct days
            assertEquals(2, metrics.getActiveDonationDays());
        }
    }

    @Nested
    @DisplayName("getAdminMetrics Tests")
    class GetAdminMetricsTests {

        @Test
        @DisplayName("Should calculate platform-wide metrics for admin")
        void shouldCalculatePlatformWideMetrics() {
            // Given
            User donor2 = new User();
            donor2.setId(3L);
            donor2.setEmail("donor2@test.com");

            SurplusPost post2 = new SurplusPost();
            post2.setId(4L);
            post2.setDonor(donor2);
            post2.setStatus(PostStatus.COMPLETED);
            setCreatedAt(post2, LocalDateTime.now().minusDays(3));

            Quantity q = new Quantity();
            q.setValue(15.0);
            q.setUnit(Quantity.Unit.KILOGRAM);
            post2.setQuantity(q);

            List<SurplusPost> allPosts = Arrays.asList(completedPost, pendingPost, post2);
            when(surplusPostRepository.findAll()).thenReturn(allPosts);

            Claim claim2 = new Claim();
            claim2.setId(2L);
            claim2.setSurplusPost(post2);
            claim2.setReceiver(receiver);
            claim2.setStatus(ClaimStatus.COMPLETED);
            setClaimedAt(claim2, LocalDateTime.now().minusDays(2));

            List<Claim> allClaims = Arrays.asList(completedClaim, claim2);
            when(claimRepository.findAll()).thenReturn(allClaims);

            // When
            ImpactMetricsDTO metrics = service.getAdminMetrics("ALL_TIME");

            // Then
            assertNotNull(metrics);
            assertEquals("ADMIN", metrics.getRole());
            assertNull(metrics.getUserId());

            // Should count all posts
            assertEquals(3, metrics.getTotalPostsCreated());

            // Should count completed posts (2)
            assertEquals(2, metrics.getTotalDonationsCompleted());

            // Should count all claims
            assertEquals(2, metrics.getTotalClaimsMade());

            // Should calculate total weight from completed posts (10 + 15 = 25 kg)
            assertEquals(25.0, metrics.getTotalFoodWeightKg());

            // Should calculate platform-wide environmental impact
            assertEquals(20.0, metrics.getCo2EmissionsAvoidedKg()); // 25 * 0.8
            assertEquals(20000.0, metrics.getWaterSavedLiters()); // 25 * 800
        }

        @Test
        @DisplayName("Should calculate user engagement metrics")
        void shouldCalculateUserEngagementMetrics() {
            // Given
            User donor2 = new User();
            donor2.setId(3L);

            SurplusPost post2 = new SurplusPost();
            post2.setId(4L);
            post2.setDonor(donor2);
            post2.setStatus(PostStatus.COMPLETED);
            setCreatedAt(post2, LocalDateTime.now().minusDays(1));

            Quantity q = new Quantity();
            q.setValue(5.0);
            q.setUnit(Quantity.Unit.KILOGRAM);
            post2.setQuantity(q);

            List<SurplusPost> posts = Arrays.asList(completedPost, post2);
            when(surplusPostRepository.findAll()).thenReturn(posts);

            User receiver2 = new User();
            receiver2.setId(4L);

            Claim claim2 = new Claim();
            claim2.setId(2L);
            claim2.setSurplusPost(post2);
            claim2.setReceiver(receiver2);
            claim2.setStatus(ClaimStatus.COMPLETED);
            setClaimedAt(claim2, LocalDateTime.now());

            List<Claim> claims = Arrays.asList(completedClaim, claim2);
            when(claimRepository.findAll()).thenReturn(claims);

            // When
            ImpactMetricsDTO metrics = service.getAdminMetrics("ALL_TIME");

            // Then
            assertNotNull(metrics.getActiveDonors());
            assertNotNull(metrics.getActiveReceivers());

            // Should count distinct donors (2)
            assertEquals(2, metrics.getActiveDonors());

            // Should count distinct receivers (2)
            assertEquals(2, metrics.getActiveReceivers());
        }

        @Test
        @DisplayName("Should calculate repeat user metrics")
        void shouldCalculateRepeatUserMetrics() {
            // Given - Create multiple posts from same donor
            SurplusPost post2 = new SurplusPost();
            post2.setId(4L);
            post2.setDonor(donor); // Same donor
            post2.setStatus(PostStatus.COMPLETED);
            setCreatedAt(post2, LocalDateTime.now().minusDays(1));

            Quantity q = new Quantity();
            q.setValue(5.0);
            q.setUnit(Quantity.Unit.KILOGRAM);
            post2.setQuantity(q);

            List<SurplusPost> posts = Arrays.asList(completedPost, post2);
            when(surplusPostRepository.findAll()).thenReturn(posts);

            // Create multiple claims from same receiver
            Claim claim2 = new Claim();
            claim2.setId(2L);
            claim2.setSurplusPost(post2);
            claim2.setReceiver(receiver); // Same receiver
            claim2.setStatus(ClaimStatus.COMPLETED);
            setClaimedAt(claim2, LocalDateTime.now());

            List<Claim> claims = Arrays.asList(completedClaim, claim2);
            when(claimRepository.findAll()).thenReturn(claims);

            // When
            ImpactMetricsDTO metrics = service.getAdminMetrics("ALL_TIME");

            // Then
            assertNotNull(metrics.getRepeatDonors());
            assertNotNull(metrics.getRepeatReceivers());

            // Donor has 2 completed posts - should be counted as repeat
            assertEquals(1, metrics.getRepeatDonors());

            // Receiver has 2 completed claims - should be counted as repeat
            assertEquals(1, metrics.getRepeatReceivers());
        }

        @Test
        @DisplayName("Should calculate completion rate platform-wide")
        void shouldCalculateCompletionRatePlatformWide() {
            // Given
            List<SurplusPost> posts = Arrays.asList(
                completedPost,  // COMPLETED
                pendingPost,    // AVAILABLE
                expiredPost     // EXPIRED
            );
            when(surplusPostRepository.findAll()).thenReturn(posts);
            when(claimRepository.findAll()).thenReturn(Collections.emptyList());

            // When
            ImpactMetricsDTO metrics = service.getAdminMetrics("ALL_TIME");

            // Then
            assertNotNull(metrics.getDonationCompletionRate());
            // 1 completed out of 3 total = 33.3%
            assertTrue(metrics.getDonationCompletionRate() >= 33.0);
            assertTrue(metrics.getDonationCompletionRate() <= 34.0);
        }

        @Test
        @DisplayName("Should handle empty platform")
        void shouldHandleEmptyPlatform() {
            // Given
            when(surplusPostRepository.findAll()).thenReturn(Collections.emptyList());
            when(claimRepository.findAll()).thenReturn(Collections.emptyList());

            // When
            ImpactMetricsDTO metrics = service.getAdminMetrics("ALL_TIME");

            // Then
            assertNotNull(metrics);
            assertEquals(0, metrics.getTotalPostsCreated());
            assertEquals(0, metrics.getTotalDonationsCompleted());
            assertEquals(0, metrics.getActiveDonors());
            assertEquals(0, metrics.getActiveReceivers());
            assertEquals(0.0, metrics.getTotalFoodWeightKg());
        }
    }

    @Nested
    @DisplayName("Date Range Filtering Tests")
    class DateRangeFilteringTests {

        @Test
        @DisplayName("Should filter posts outside date range")
        void shouldFilterPostsOutsideDateRange() {
            // Given
            SurplusPost oldPost = new SurplusPost();
            oldPost.setId(10L);
            oldPost.setDonor(donor);
            oldPost.setStatus(PostStatus.COMPLETED);
            setCreatedAt(oldPost, LocalDateTime.now().minusYears(1)); // Very old

            Quantity q = new Quantity();
            q.setValue(100.0);
            q.setUnit(Quantity.Unit.KILOGRAM);
            oldPost.setQuantity(q);

            List<SurplusPost> posts = Arrays.asList(completedPost, oldPost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);

            // When - Query for WEEKLY range
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "WEEKLY");

            // Then - Should only include recent post
            assertEquals(1, metrics.getTotalPostsCreated());
            assertEquals(10.0, metrics.getTotalFoodWeightKg()); // Only recent post
        }

        @Test
        @DisplayName("Should handle posts with null dates")
        void shouldHandlePostsWithNullDates() {
            // Given
            SurplusPost postWithNullDate = new SurplusPost();
            postWithNullDate.setId(10L);
            postWithNullDate.setDonor(donor);
            postWithNullDate.setStatus(PostStatus.COMPLETED);
            setCreatedAt(postWithNullDate, null); // Explicitly null date

            Quantity q = new Quantity();
            q.setValue(5.0);
            q.setUnit(Quantity.Unit.KILOGRAM);
            postWithNullDate.setQuantity(q);

            List<SurplusPost> posts = Arrays.asList(completedPost, postWithNullDate);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then - Should not crash, should exclude null date post
            assertNotNull(metrics);
            assertEquals(1, metrics.getTotalPostsCreated());
        }
    }

    @Nested
    @DisplayName("Edge Cases and Boundary Tests")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle posts with null quantity")
        void shouldHandlePostsWithNullQuantity() {
            // Given
            SurplusPost postWithNullQuantity = new SurplusPost();
            postWithNullQuantity.setId(10L);
            postWithNullQuantity.setDonor(donor);
            postWithNullQuantity.setStatus(PostStatus.COMPLETED);
            setCreatedAt(postWithNullQuantity, LocalDateTime.now());
            postWithNullQuantity.setQuantity(null);

            List<SurplusPost> posts = Arrays.asList(postWithNullQuantity);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);
            when(calculationService.convertToKg(null)).thenReturn(0.0);

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then
            assertNotNull(metrics);
            assertEquals(0.0, metrics.getTotalFoodWeightKg());
        }

        @Test
        @DisplayName("Should handle very large numbers")
        void shouldHandleVeryLargeNumbers() {
            // Given
            SurplusPost massivePost = new SurplusPost();
            massivePost.setId(10L);
            massivePost.setDonor(donor);
            massivePost.setStatus(PostStatus.COMPLETED);
            setCreatedAt(massivePost, LocalDateTime.now());

            Quantity hugeQuantity = new Quantity();
            hugeQuantity.setValue(10000.0);
            hugeQuantity.setUnit(Quantity.Unit.KILOGRAM);
            massivePost.setQuantity(hugeQuantity);

            List<SurplusPost> posts = Arrays.asList(massivePost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then
            assertNotNull(metrics);
            assertEquals(10000.0, metrics.getTotalFoodWeightKg());
            assertEquals(8000.0, metrics.getCo2EmissionsAvoidedKg()); // 10000 * 0.8
            assertEquals(8000000.0, metrics.getWaterSavedLiters()); // 10000 * 800
        }

        @Test
        @DisplayName("Should round completion rate correctly")
        void shouldRoundCompletionRateCorrectly() {
            // Given - 2 completed out of 3 total = 66.666...%
            SurplusPost post2 = new SurplusPost();
            post2.setId(10L);
            post2.setDonor(donor);
            post2.setStatus(PostStatus.COMPLETED);
            setCreatedAt(post2, LocalDateTime.now().minusDays(1));

            Quantity q = new Quantity();
            q.setValue(5.0);
            q.setUnit(Quantity.Unit.KILOGRAM);
            post2.setQuantity(q);

            List<SurplusPost> posts = Arrays.asList(completedPost, post2, pendingPost);
            when(surplusPostRepository.findByDonorId(1L)).thenReturn(posts);

            // When
            ImpactMetricsDTO metrics = service.getDonorMetrics(1L, "ALL_TIME");

            // Then
            assertNotNull(metrics.getDonationCompletionRate());
            // Should be rounded to 1 decimal: 66.7%
            assertEquals(66.7, metrics.getDonationCompletionRate(), 0.1);
        }
    }
}
