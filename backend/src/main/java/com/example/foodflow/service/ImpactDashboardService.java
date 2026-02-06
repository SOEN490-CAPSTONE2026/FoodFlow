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

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for calculating impact dashboard metrics
 */
@Service
public class ImpactDashboardService {

    private static final Logger logger = LoggerFactory.getLogger(ImpactDashboardService.class);

    // Environmental impact conversion factors
    private static final double KG_TO_MEALS = 2.5; // 1 kg food = ~2.5 meals
    private static final double KG_TO_CO2 = 2.5; // 1 kg food saved = ~2.5 kg CO2 avoided
    private static final double KG_TO_WATER = 500; // 1 kg food saved = ~500 liters water saved
    private static final double MEAL_SIZE_KG = 0.4; // Average meal size

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;

    public ImpactDashboardService(
            SurplusPostRepository surplusPostRepository,
            ClaimRepository claimRepository,
            UserRepository userRepository) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
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

        ImpactMetricsDTO metrics = new ImpactMetricsDTO();
        metrics.setUserId(donorId);
        metrics.setRole("DONOR");
        metrics.setDateRange(dateRange);
        metrics.setStartDate(startDate);
        metrics.setEndDate(endDate);

        // Calculate food weight saved
        double totalWeightKg = calculateTotalWeightKg(completedPosts);
        metrics.setTotalFoodWeightKg(totalWeightKg);

        // Calculate environmental impact
        metrics.setEstimatedMealsProvided((int) (totalWeightKg * KG_TO_MEALS));
        metrics.setCo2EmissionsAvoidedKg(totalWeightKg * KG_TO_CO2);
        metrics.setWaterSavedLiters(totalWeightKg * KG_TO_WATER);
        metrics.setPeopleFedEstimate(metrics.getEstimatedMealsProvided() / 3); // 3 meals per person per day

        // Activity metrics
        metrics.setTotalPostsCreated(allPosts.size());
        metrics.setTotalDonationsCompleted(completedPosts.size());

        // Calculate completion rate
        if (!allPosts.isEmpty()) {
            double completionRate = (double) completedPosts.size() / allPosts.size() * 100;
            metrics.setDonationCompletionRate(Math.round(completionRate * 10.0) / 10.0);
        } else {
            metrics.setDonationCompletionRate(0.0);
        }

        logger.info("Donor metrics calculated: totalWeight={} kg, meals={}, CO2={} kg",
                totalWeightKg, metrics.getEstimatedMealsProvided(), metrics.getCo2EmissionsAvoidedKg());

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

        // Calculate environmental impact
        metrics.setEstimatedMealsProvided((int) (totalWeightKg * KG_TO_MEALS));
        metrics.setCo2EmissionsAvoidedKg(totalWeightKg * KG_TO_CO2);
        metrics.setWaterSavedLiters(totalWeightKg * KG_TO_WATER);
        metrics.setPeopleFedEstimate(metrics.getEstimatedMealsProvided() / 3);

        // Activity metrics
        metrics.setTotalClaimsMade(allClaims.size());
        metrics.setTotalDonationsCompleted(completedClaims.size());

        logger.info("Receiver metrics calculated: totalWeight={} kg, meals={}, claims={}",
                totalWeightKg, metrics.getEstimatedMealsProvided(), allClaims.size());

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

        // Calculate environmental impact
        metrics.setEstimatedMealsProvided((int) (totalWeightKg * KG_TO_MEALS));
        metrics.setCo2EmissionsAvoidedKg(totalWeightKg * KG_TO_CO2);
        metrics.setWaterSavedLiters(totalWeightKg * KG_TO_WATER);
        metrics.setPeopleFedEstimate(metrics.getEstimatedMealsProvided() / 3);

        // Activity metrics
        metrics.setTotalPostsCreated(allPosts.size());
        metrics.setTotalDonationsCompleted(completedPosts.size());
        metrics.setTotalClaimsMade(allClaims.size());

        // Calculate completion rate
        if (!allPosts.isEmpty()) {
            double completionRate = (double) completedPosts.size() / allPosts.size() * 100;
            metrics.setDonationCompletionRate(Math.round(completionRate * 10.0) / 10.0);
        } else {
            metrics.setDonationCompletionRate(0.0);
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

        logger.info("Admin metrics calculated: totalWeight={} kg, meals={}, activeDonors={}, activeReceivers={}",
                totalWeightKg, metrics.getEstimatedMealsProvided(), activeDonors, activeReceivers);

        return metrics;
    }

    /**
     * Calculate total food weight in kg from posts
     */
    private double calculateTotalWeightKg(List<SurplusPost> posts) {
        return posts.stream()
                .map(SurplusPost::getQuantity)
                .filter(quantity -> quantity != null)
                .mapToDouble(this::convertToKg)
                .sum();
    }

    /**
     * Convert any quantity to kg
     */
    private double convertToKg(Quantity quantity) {
        if (quantity == null || quantity.getValue() == null) {
            return 0.0;
        }

        double value = quantity.getValue();
        Quantity.Unit unit = quantity.getUnit();

        switch (unit) {
            case KILOGRAM:
                return value;
            case GRAM:
                return value / 1000.0;
            case POUND:
                return value * 0.453592;
            case OUNCE:
                return value * 0.0283495;
            case TON:
                return value * 1000.0;
            case LITER:
                return value; // Approximate: 1L ≈ 1kg for food
            case MILLILITER:
                return value / 1000.0;
            case GALLON:
                return value * 3.78541;
            // For count-based units, estimate based on average meal size
            case PIECE:
            case ITEM:
            case UNIT:
            case SERVING:
            case PORTION:
                return value * MEAL_SIZE_KG;
            case BOX:
            case PACKAGE:
            case BAG:
            case CONTAINER:
                return value * 2.0; // Estimate 2kg per container
            case CASE:
            case CARTON:
                return value * 10.0; // Estimate 10kg per case
            default:
                return value * MEAL_SIZE_KG; // Default estimate
        }
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
