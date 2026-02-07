package com.example.foodflow.service;

import com.example.foodflow.model.dto.ImpactMetricsDTO;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import io.micrometer.core.annotation.Timed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for calculating impact dashboard metrics
 */
@Service
public class ImpactDashboardService {

    private static final Logger logger = LoggerFactory.getLogger(ImpactDashboardService.class);

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final ImpactCalculationService calculationService;

    public ImpactDashboardService(
            SurplusPostRepository surplusPostRepository,
            ClaimRepository claimRepository,
            UserRepository userRepository,
            ImpactCalculationService calculationService) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.calculationService = calculationService;
    }

    /**
     * Get impact metrics for a donor
     */
    @Transactional(readOnly = true)
    @Timed(value = "impact.dashboard.getDonorMetrics", description = "Time taken to calculate donor impact metrics")
    public ImpactMetricsDTO getDonorMetrics(Long donorId, String dateRange) {
        logger.info("Calculating donor impact metrics for userId={}, dateRange={}", donorId, dateRange);

        LocalDateTime[] dateRangeBounds = calculateDateRange(dateRange);
        LocalDateTime startDate = dateRangeBounds[0];
        LocalDateTime endDate = dateRangeBounds[1];

        // Get all posts by donor within date range
        List<SurplusPost> allPosts = surplusPostRepository.findByDonorId(donorId).stream()
                .filter(post -> isWithinDateRange(post.getCreatedAt(), startDate, endDate))
                .collect(Collectors.toList());

        // Get completed posts only for impact calculation
        List<SurplusPost> completedPosts = allPosts.stream()
                .filter(post -> post.getStatus() == PostStatus.COMPLETED)
                .collect(Collectors.toList());

        // Get expired posts (for waste efficiency calculation)
        List<SurplusPost> expiredPosts = allPosts.stream()
                .filter(post -> post.getExpiryDate() != null && post.getExpiryDate().isBefore(LocalDate.now()))
                .filter(post -> post.getStatus() != PostStatus.COMPLETED)
                .collect(Collectors.toList());

        ImpactMetricsDTO metrics = new ImpactMetricsDTO();
        metrics.setUserId(donorId);
        metrics.setRole("DONOR");
        metrics.setDateRange(dateRange);
        metrics.setStartDate(startDate);
        metrics.setEndDate(endDate);

        // Calculate food weight saved using enhanced conversion
        double totalWeightKg = calculateTotalWeightKg(completedPosts);
        metrics.setTotalFoodWeightKg(totalWeightKg);

        // Calculate category-weighted environmental impact
        double co2Avoided = calculateCategoryWeightedCO2(completedPosts);
        double waterSaved = calculateCategoryWeightedWater(completedPosts);
        metrics.setCo2EmissionsAvoidedKg(co2Avoided);
        metrics.setWaterSavedLiters(waterSaved);

        // Calculate bounded meal estimates
        int[] mealRange = calculationService.calculateMealRange(totalWeightKg);
        metrics.setMinMealsProvided(mealRange[0]);
        metrics.setMaxMealsProvided(mealRange[1]);
        metrics.setEstimatedMealsProvided((mealRange[0] + mealRange[1]) / 2);
        metrics.setPeopleFedEstimate(metrics.getEstimatedMealsProvided() / 3); // 3 meals per person per day

        // Activity metrics
        metrics.setTotalPostsCreated(allPosts.size());
        metrics.setTotalDonationsCompleted(completedPosts.size());

        // Calculate completion rate (weight-based efficiency)
        double totalPostedWeight = calculateTotalWeightKg(allPosts);
        double expiredWeight = calculateTotalWeightKg(expiredPosts);
        if (totalPostedWeight > 0) {
            double completionRate = (double) completedPosts.size() / allPosts.size() * 100;
            metrics.setDonationCompletionRate(Math.round(completionRate * 10.0) / 10.0);

            // Waste diversion efficiency
            double wasteDiversion = (1.0 - (expiredWeight / totalPostedWeight)) * 100;
            metrics.setWasteDiversionEfficiencyPercent(Math.max(0, Math.round(wasteDiversion * 10.0) / 10.0));
        } else {
            metrics.setDonationCompletionRate(0.0);
            metrics.setWasteDiversionEfficiencyPercent(0.0);
        }

        // Calculate active donation days
        long activeDays = allPosts.stream()
                .map(post -> post.getCreatedAt().toLocalDate())
                .distinct()
                .count();
        metrics.setActiveDonationDays((int) activeDays);

        // Time-based metrics (for completed donations with claims)
        calculateTimeMetrics(completedPosts, metrics);

        // Add factor metadata
        metrics.setFactorVersion(calculationService.getCurrentVersion());
        metrics.setFactorDisclosure(calculationService.getDisclosureText());

        logger.info("Donor metrics calculated: totalWeight={} kg, meals={}-{}, CO2={} kg",
                totalWeightKg, mealRange[0], mealRange[1], co2Avoided);

        return metrics;
    }

    /**
     * Get impact metrics for a receiver
     */
    @Transactional(readOnly = true)
    @Timed(value = "impact.dashboard.getReceiverMetrics", description = "Time taken to calculate receiver impact metrics")
    public ImpactMetricsDTO getReceiverMetrics(Long receiverId, String dateRange) {
        logger.info("Calculating receiver impact metrics for userId={}, dateRange={}", receiverId, dateRange);

        LocalDateTime[] dateRangeBounds = calculateDateRange(dateRange);
        LocalDateTime startDate = dateRangeBounds[0];
        LocalDateTime endDate = dateRangeBounds[1];

        // Get all claims by receiver within date range
        List<Claim> allClaims = claimRepository.findAll().stream()
                .filter(claim -> claim.getReceiver().getId().equals(receiverId))
                .filter(claim -> isWithinDateRange(claim.getClaimedAt(), startDate, endDate))
                .collect(Collectors.toList());

        // Get completed claims only
        List<Claim> completedClaims = allClaims.stream()
                .filter(claim -> claim.getStatus() == ClaimStatus.COMPLETED)
                .collect(Collectors.toList());

        // Extract surplus posts from completed claims
        List<SurplusPost> claimedPosts = completedClaims.stream()
                .map(Claim::getSurplusPost)
                .collect(Collectors.toList());

        ImpactMetricsDTO metrics = new ImpactMetricsDTO();
        metrics.setUserId(receiverId);
        metrics.setRole("RECEIVER");
        metrics.setDateRange(dateRange);
        metrics.setStartDate(startDate);
        metrics.setEndDate(endDate);

        // Calculate food weight received
        double totalWeightKg = calculateTotalWeightKg(claimedPosts);
        metrics.setTotalFoodWeightKg(totalWeightKg);

        // Calculate category-weighted environmental impact
        double co2Avoided = calculateCategoryWeightedCO2(claimedPosts);
        double waterSaved = calculateCategoryWeightedWater(claimedPosts);
        metrics.setCo2EmissionsAvoidedKg(co2Avoided);
        metrics.setWaterSavedLiters(waterSaved);

        // Calculate bounded meal estimates
        int[] mealRange = calculationService.calculateMealRange(totalWeightKg);
        metrics.setMinMealsProvided(mealRange[0]);
        metrics.setMaxMealsProvided(mealRange[1]);
        metrics.setEstimatedMealsProvided((mealRange[0] + mealRange[1]) / 2);
        metrics.setPeopleFedEstimate(metrics.getEstimatedMealsProvided() / 3);

        // Activity metrics
        metrics.setTotalClaimsMade(allClaims.size());
        metrics.setTotalDonationsCompleted(completedClaims.size());

        // Calculate active claim days
        long activeDays = allClaims.stream()
                .map(claim -> claim.getClaimedAt().toLocalDate())
                .distinct()
                .count();
        metrics.setActiveDonationDays((int) activeDays);

        // Time-based metrics
        calculateTimeMetricsFromClaims(completedClaims, metrics);

        // Add factor metadata
        metrics.setFactorVersion(calculationService.getCurrentVersion());
        metrics.setFactorDisclosure(calculationService.getDisclosureText());

        logger.info("Receiver metrics calculated: totalWeight={} kg, meals={}-{}, claims={}",
                totalWeightKg, mealRange[0], mealRange[1], allClaims.size());

        return metrics;
    }

    /**
     * Get platform-wide impact metrics for admin
     */
    @Transactional(readOnly = true)
    @Timed(value = "impact.dashboard.getAdminMetrics", description = "Time taken to calculate admin impact metrics")
    public ImpactMetricsDTO getAdminMetrics(String dateRange) {
        logger.info("Calculating platform-wide impact metrics for dateRange={}", dateRange);

        LocalDateTime[] dateRangeBounds = calculateDateRange(dateRange);
        LocalDateTime startDate = dateRangeBounds[0];
        LocalDateTime endDate = dateRangeBounds[1];

        // Get all posts within date range
        List<SurplusPost> allPosts = surplusPostRepository.findAll().stream()
                .filter(post -> isWithinDateRange(post.getCreatedAt(), startDate, endDate))
                .collect(Collectors.toList());

        List<SurplusPost> completedPosts = allPosts.stream()
                .filter(post -> post.getStatus() == PostStatus.COMPLETED)
                .collect(Collectors.toList());

        List<SurplusPost> expiredPosts = allPosts.stream()
                .filter(post -> post.getExpiryDate() != null && post.getExpiryDate().isBefore(LocalDate.now()))
                .filter(post -> post.getStatus() != PostStatus.COMPLETED)
                .collect(Collectors.toList());

        // Get all claims within date range
        List<Claim> allClaims = claimRepository.findAll().stream()
                .filter(claim -> isWithinDateRange(claim.getClaimedAt(), startDate, endDate))
                .collect(Collectors.toList());

        List<Claim> completedClaims = allClaims.stream()
                .filter(claim -> claim.getStatus() == ClaimStatus.COMPLETED)
                .collect(Collectors.toList());

        ImpactMetricsDTO metrics = new ImpactMetricsDTO();
        metrics.setRole("ADMIN");
        metrics.setDateRange(dateRange);
        metrics.setStartDate(startDate);
        metrics.setEndDate(endDate);

        // Calculate food weight saved platform-wide
        double totalWeightKg = calculateTotalWeightKg(completedPosts);
        metrics.setTotalFoodWeightKg(totalWeightKg);

        // Calculate category-weighted environmental impact
        double co2Avoided = calculateCategoryWeightedCO2(completedPosts);
        double waterSaved = calculateCategoryWeightedWater(completedPosts);
        metrics.setCo2EmissionsAvoidedKg(co2Avoided);
        metrics.setWaterSavedLiters(waterSaved);

        // Calculate bounded meal estimates
        int[] mealRange = calculationService.calculateMealRange(totalWeightKg);
        metrics.setMinMealsProvided(mealRange[0]);
        metrics.setMaxMealsProvided(mealRange[1]);
        metrics.setEstimatedMealsProvided((mealRange[0] + mealRange[1]) / 2);
        metrics.setPeopleFedEstimate(metrics.getEstimatedMealsProvided() / 3);

        // Activity metrics
        metrics.setTotalPostsCreated(allPosts.size());
        metrics.setTotalDonationsCompleted(completedPosts.size());
        metrics.setTotalClaimsMade(allClaims.size());

        // Calculate completion rate and waste diversion
        double totalPostedWeight = calculateTotalWeightKg(allPosts);
        double expiredWeight = calculateTotalWeightKg(expiredPosts);
        if (!allPosts.isEmpty()) {
            double completionRate = (double) completedPosts.size() / allPosts.size() * 100;
            metrics.setDonationCompletionRate(Math.round(completionRate * 10.0) / 10.0);

            if (totalPostedWeight > 0) {
                double wasteDiversion = (1.0 - (expiredWeight / totalPostedWeight)) * 100;
                metrics.setWasteDiversionEfficiencyPercent(Math.max(0, Math.round(wasteDiversion * 10.0) / 10.0));
            }
        } else {
            metrics.setDonationCompletionRate(0.0);
            metrics.setWasteDiversionEfficiencyPercent(0.0);
        }

        // User engagement metrics
        long activeDonors = completedPosts.stream()
                .map(SurplusPost::getDonor)
                .distinct()
                .count();
        metrics.setActiveDonors((int) activeDonors);

        long activeReceivers = completedClaims.stream()
                .map(Claim::getReceiver)
                .distinct()
                .count();
        metrics.setActiveReceivers((int) activeReceivers);

        // Calculate repeat users (users with more than 1 completed donation/claim)
        long repeatDonors = completedPosts.stream()
                .collect(Collectors.groupingBy(SurplusPost::getDonor, Collectors.counting()))
                .values().stream()
                .filter(count -> count > 1)
                .count();
        metrics.setRepeatDonors((int) repeatDonors);

        long repeatReceivers = completedClaims.stream()
                .collect(Collectors.groupingBy(Claim::getReceiver, Collectors.counting()))
                .values().stream()
                .filter(count -> count > 1)
                .count();
        metrics.setRepeatReceivers((int) repeatReceivers);

        // Time-based metrics
        calculateTimeMetricsFromClaims(completedClaims, metrics);

        // Add factor metadata
        metrics.setFactorVersion(calculationService.getCurrentVersion());
        metrics.setFactorDisclosure(calculationService.getDisclosureText());

        logger.info("Admin metrics calculated: totalWeight={} kg, meals={}-{}, activeDonors={}, activeReceivers={}",
                totalWeightKg, mealRange[0], mealRange[1], activeDonors, activeReceivers);

        return metrics;
    }

    /**
     * Calculate total food weight in kg from posts
     */
    private double calculateTotalWeightKg(List<SurplusPost> posts) {
        return posts.stream()
                .map(SurplusPost::getQuantity)
                .filter(quantity -> quantity != null)
                .mapToDouble(calculationService::convertToKg)
                .sum();
    }

    /**
     * Calculate category-weighted CO2 emissions avoided
     */
    private double calculateCategoryWeightedCO2(List<SurplusPost> posts) {
        return posts.stream()
                .mapToDouble(post -> {
                    double weightKg = calculationService.convertToKg(post.getQuantity());
                    return calculationService.calculateCO2Avoided(post, weightKg);
                })
                .sum();
    }

    /**
     * Calculate category-weighted water saved
     */
    private double calculateCategoryWeightedWater(List<SurplusPost> posts) {
        return posts.stream()
                .mapToDouble(post -> {
                    double weightKg = calculationService.convertToKg(post.getQuantity());
                    return calculationService.calculateWaterSaved(post, weightKg);
                })
                .sum();
    }

    /**
     * Calculate time-based metrics for completed donations with claims
     */
    private void calculateTimeMetrics(List<SurplusPost> completedPosts, ImpactMetricsDTO metrics) {
        List<Double> claimTimeHours = new ArrayList<>();
        int onTimePickups = 0;
        int totalPickups = 0;

        for (SurplusPost post : completedPosts) {
            // Find associated claim
            claimRepository.findBySurplusPost(post).ifPresent(claim -> {
                // Calculate time to claim (post creation to claim time)
                if (claim.getClaimedAt() != null) {
                    long hoursToClaim = ChronoUnit.HOURS.between(post.getCreatedAt(), claim.getClaimedAt());
                    claimTimeHours.add((double) hoursToClaim);
                }
            });
        }

        // Calculate percentiles for time to claim
        if (!claimTimeHours.isEmpty()) {
            Collections.sort(claimTimeHours);
            int p50Index = claimTimeHours.size() / 2;
            int p75Index = (int) (claimTimeHours.size() * 0.75);

            metrics.setMedianClaimTimeHours(claimTimeHours.get(p50Index));
            metrics.setP75ClaimTimeHours(claimTimeHours.get(p75Index));
        }

        // Calculate pickup timeliness (placeholder - requires pickup time data)
        metrics.setPickupTimelinessRate(0.0); // Will be enhanced when pickup time tracking is added
    }

    /**
     * Calculate time-based metrics from claims directly
     */
    private void calculateTimeMetricsFromClaims(List<Claim> completedClaims, ImpactMetricsDTO metrics) {
        List<Double> claimTimeHours = new ArrayList<>();

        for (Claim claim : completedClaims) {
            if (claim.getClaimedAt() != null && claim.getSurplusPost() != null) {
                long hoursToClaim = ChronoUnit.HOURS.between(
                    claim.getSurplusPost().getCreatedAt(),
                    claim.getClaimedAt()
                );
                claimTimeHours.add((double) hoursToClaim);
            }
        }

        // Calculate percentiles
        if (!claimTimeHours.isEmpty()) {
            Collections.sort(claimTimeHours);
            int p50Index = claimTimeHours.size() / 2;
            int p75Index = (int) (claimTimeHours.size() * 0.75);

            metrics.setMedianClaimTimeHours(claimTimeHours.get(p50Index));
            metrics.setP75ClaimTimeHours(claimTimeHours.get(p75Index));
        }

        metrics.setPickupTimelinessRate(0.0); // Placeholder
    }
    /**
     * Calculate date range boundaries based on range type
     */
    private LocalDateTime[] calculateDateRange(String dateRange) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate;

        switch (dateRange.toUpperCase()) {
            case "WEEKLY":
                startDate = endDate.minus(7, ChronoUnit.DAYS);
                break;
            case "MONTHLY":
                startDate = endDate.minus(30, ChronoUnit.DAYS);
                break;
            case "ALL_TIME":
            default:
                startDate = LocalDateTime.of(2020, 1, 1, 0, 0); // Platform inception
                break;
        }

        return new LocalDateTime[]{startDate, endDate};
    }

    /**
     * Check if datetime is within range
     */
    private boolean isWithinDateRange(LocalDateTime dateTime, LocalDateTime start, LocalDateTime end) {
        if (dateTime == null) {
            return false;
        }
        return !dateTime.isBefore(start) && !dateTime.isAfter(end);
    }
}
