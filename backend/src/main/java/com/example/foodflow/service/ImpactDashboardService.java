package com.example.foodflow.service;

import com.example.foodflow.model.dto.ImpactMetricsDTO;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.annotation.Timed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service for calculating impact dashboard metrics
 */
@Service
public class ImpactDashboardService {

    private static final Logger logger = LoggerFactory.getLogger(ImpactDashboardService.class);

    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final ImpactCalculationService calculationService;
    private final FoodTypeImpactService foodTypeImpactService;
    private final ImpactMetricsEngine impactMetricsEngine;
    private final ObjectMapper objectMapper;

    public ImpactDashboardService(
            SurplusPostRepository surplusPostRepository,
            ClaimRepository claimRepository,
            ImpactCalculationService calculationService,
            FoodTypeImpactService foodTypeImpactService,
            ImpactMetricsEngine impactMetricsEngine,
            ObjectMapper objectMapper) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.calculationService = calculationService;
        this.foodTypeImpactService = foodTypeImpactService;
        this.impactMetricsEngine = impactMetricsEngine;
        this.objectMapper = objectMapper;
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
        LocalDateTime[] previousRangeBounds = calculatePreviousDateRange(startDate, endDate);

        // Get all posts by donor within date range
        List<SurplusPost> donorPosts = surplusPostRepository.findByDonorId(donorId);
        List<SurplusPost> allPosts = donorPosts.stream()
                .filter(post -> isWithinDateRange(post.getCreatedAt(), startDate, endDate))
                .toList();

        // Get completed posts only for impact calculation
        List<SurplusPost> completedPosts = allPosts.stream()
                .filter(post -> post.getStatus() == PostStatus.COMPLETED)
                .toList();

        ImpactMetricsDTO metrics = new ImpactMetricsDTO();
        metrics.setUserId(donorId);
        metrics.setRole("DONOR");
        metrics.setDateRange(dateRange);
        metrics.setStartDate(startDate);
        metrics.setEndDate(endDate);

        Map<Long, Claim> claimByPostId = claimRepository.findAll().stream()
                .filter(claim -> claim.getSurplusPost() != null && claim.getSurplusPost().getDonor() != null)
                .filter(claim -> claim.getSurplusPost().getDonor().getId().equals(donorId))
                .collect(Collectors.toMap(
                        claim -> claim.getSurplusPost().getId(),
                        Function.identity(),
                        (first, second) -> first));

        List<ImpactMetricsEngine.DonationImpactRecord> records = donorPosts.stream()
                .map(post -> toImpactRecord(post, claimByPostId.get(post.getId())))
                .toList();

        ImpactMetricsEngine.ImpactComputationResult impactResult = impactMetricsEngine.computeImpactMetrics(
                records,
                startDate,
                endDate,
                previousRangeBounds[0],
                previousRangeBounds[1]);

        applyImpactMetrics(metrics, impactResult);

        int[] mealRange = calculationService.calculateMealRange(metrics.getTotalFoodWeightKg());
        metrics.setMinMealsProvided(mealRange[0]);
        metrics.setMaxMealsProvided(mealRange[1]);
        metrics.setPeopleFedEstimate(metrics.getEstimatedMealsProvided() / 3); // 3 meals per person per day

        // Activity metrics
        metrics.setTotalPostsCreated(allPosts.size());
        metrics.setTotalDonationsCompleted(completedPosts.size());

        // Calculate completion rate (weight-based efficiency)
        double totalPostedWeight = calculateTotalWeightKg(allPosts);
        double expiredWeight = calculateExpiredWeight(allPosts);
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
        metrics.setFactorVersion(foodTypeImpactService.getFactorVersion());
        metrics.setFactorDisclosure(calculationService.getDisclosureText());

        logger.info("Donor metrics calculated: totalWeight={} kg, meals={}-{}, CO2={} kg",
                metrics.getTotalFoodWeightKg(), mealRange[0], mealRange[1], metrics.getCo2EmissionsAvoidedKg());

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
        LocalDateTime[] previousRangeBounds = calculatePreviousDateRange(startDate, endDate);

        List<Claim> receiverClaims = claimRepository.findAll().stream()
                .filter(claim -> claim.getReceiver().getId().equals(receiverId))
                .toList();

        // Get all claims by receiver within date range
        List<Claim> allClaims = receiverClaims.stream()
                .filter(claim -> isWithinDateRange(claim.getClaimedAt(), startDate, endDate))
                .toList();

        // Get completed claims only
        List<Claim> completedClaims = allClaims.stream()
                .filter(claim -> claim.getStatus() == ClaimStatus.COMPLETED)
                .toList();

        // Extract surplus posts from completed claims
        List<SurplusPost> claimedPosts = completedClaims.stream()
                .map(Claim::getSurplusPost)
                .toList();

        ImpactMetricsDTO metrics = new ImpactMetricsDTO();
        metrics.setUserId(receiverId);
        metrics.setRole("RECEIVER");
        metrics.setDateRange(dateRange);
        metrics.setStartDate(startDate);
        metrics.setEndDate(endDate);

        List<ImpactMetricsEngine.DonationImpactRecord> records = receiverClaims.stream()
                .map(claim -> toImpactRecord(claim.getSurplusPost(), claim))
                .toList();

        ImpactMetricsEngine.ImpactComputationResult impactResult = impactMetricsEngine.computeImpactMetrics(
                records,
                startDate,
                endDate,
                previousRangeBounds[0],
                previousRangeBounds[1]);

        applyImpactMetrics(metrics, impactResult);

        int[] mealRange = calculationService.calculateMealRange(metrics.getTotalFoodWeightKg());
        metrics.setMinMealsProvided(mealRange[0]);
        metrics.setMaxMealsProvided(mealRange[1]);
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
        metrics.setFactorVersion(foodTypeImpactService.getFactorVersion());
        metrics.setFactorDisclosure(calculationService.getDisclosureText());

        logger.info("Receiver metrics calculated: totalWeight={} kg, meals={}-{}, claims={}",
                metrics.getTotalFoodWeightKg(), mealRange[0], mealRange[1], allClaims.size());

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
        LocalDateTime[] previousRangeBounds = calculatePreviousDateRange(startDate, endDate);

        // Get all posts within date range
        List<SurplusPost> allPosts = surplusPostRepository.findAll().stream()
                .filter(post -> isWithinDateRange(post.getCreatedAt(), startDate, endDate))
                .collect(Collectors.toList());

        List<SurplusPost> completedPosts = allPosts.stream()
                .filter(post -> post.getStatus() == PostStatus.COMPLETED)
                .toList();

        // Get all claims within date range
        List<Claim> allClaims = claimRepository.findAll().stream()
                .filter(claim -> isWithinDateRange(claim.getClaimedAt(), startDate, endDate))
                .toList();

        List<Claim> completedClaims = allClaims.stream()
                .filter(claim -> claim.getStatus() == ClaimStatus.COMPLETED)
                .toList();

        ImpactMetricsDTO metrics = new ImpactMetricsDTO();
        metrics.setRole("ADMIN");
        metrics.setDateRange(dateRange);
        metrics.setStartDate(startDate);
        metrics.setEndDate(endDate);

        Map<Long, Claim> claimByPostId = claimRepository.findAll().stream()
                .filter(claim -> claim.getSurplusPost() != null)
                .collect(Collectors.toMap(
                        claim -> claim.getSurplusPost().getId(),
                        Function.identity(),
                        (first, second) -> first));

        List<ImpactMetricsEngine.DonationImpactRecord> records = surplusPostRepository.findAll().stream()
                .map(post -> toImpactRecord(post, claimByPostId.get(post.getId())))
                .toList();

        ImpactMetricsEngine.ImpactComputationResult impactResult = impactMetricsEngine.computeImpactMetrics(
                records,
                startDate,
                endDate,
                previousRangeBounds[0],
                previousRangeBounds[1]);

        applyImpactMetrics(metrics, impactResult);

        int[] mealRange = calculationService.calculateMealRange(metrics.getTotalFoodWeightKg());
        metrics.setMinMealsProvided(mealRange[0]);
        metrics.setMaxMealsProvided(mealRange[1]);
        metrics.setPeopleFedEstimate(metrics.getEstimatedMealsProvided() / 3);

        // Activity metrics
        metrics.setTotalPostsCreated(allPosts.size());
        metrics.setTotalDonationsCompleted(completedPosts.size());
        metrics.setTotalClaimsMade(allClaims.size());

        // Calculate completion rate and waste diversion
        double totalPostedWeight = calculateTotalWeightKg(allPosts);
        double expiredWeight = calculateExpiredWeight(allPosts);
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
        metrics.setFactorVersion(foodTypeImpactService.getFactorVersion());
        metrics.setFactorDisclosure(calculationService.getDisclosureText());

        logger.info("Admin metrics calculated: totalWeight={} kg, meals={}-{}, activeDonors={}, activeReceivers={}",
                metrics.getTotalFoodWeightKg(), mealRange[0], mealRange[1], activeDonors, activeReceivers);

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

    private double calculateExpiredWeight(List<SurplusPost> posts) {
        LocalDateTime now = LocalDateTime.now();
        return posts.stream()
                .filter(post -> post.getStatus() != PostStatus.COMPLETED)
                .filter(post -> {
                    LocalDateTime expiryTime = resolveExpiryTime(post);
                    return expiryTime != null && expiryTime.isBefore(now);
                })
                .map(SurplusPost::getQuantity)
                .filter(quantity -> quantity != null)
                .mapToDouble(calculationService::convertToKg)
                .sum();
    }

    private void applyImpactMetrics(
            ImpactMetricsDTO metrics,
            ImpactMetricsEngine.ImpactComputationResult impactResult) {

        ImpactMetricsEngine.ImpactTotals current = impactResult.current();
        ImpactMetricsEngine.ImpactDelta deltas = impactResult.deltas();

        metrics.setTotalFoodWeightKg(current.weightKg());
        metrics.setCo2EmissionsAvoidedKg(current.co2Kg());
        metrics.setWaterSavedLiters(current.waterLiters());
        metrics.setEstimatedMealsProvided(current.meals());

        metrics.setWeightVsPreviousAbs(deltas.weightAbs());
        metrics.setCo2VsPreviousAbs(deltas.co2Abs());
        metrics.setMealsVsPreviousAbs(deltas.mealsAbs());
        metrics.setWaterVsPreviousAbs(deltas.waterAbs());

        metrics.setWeightVsPreviousPct(deltas.weightPct());
        metrics.setCo2VsPreviousPct(deltas.co2Pct());
        metrics.setMealsVsPreviousPct(deltas.mealsPct());
        metrics.setWaterVsPreviousPct(deltas.waterPct());

        metrics.setImpactAuditJson(serializeAudit(impactResult.audit()));
    }

    private String serializeAudit(ImpactMetricsEngine.ImpactAudit audit) {
        try {
            return objectMapper.writeValueAsString(audit);
        } catch (JsonProcessingException e) {
            return "{\"serializationError\":true}";
        }
    }

    private ImpactMetricsEngine.DonationImpactRecord toImpactRecord(SurplusPost post, Claim claim) {
        double weightKg = calculationService.convertToKg(post.getQuantity());
        String status = resolveStatus(post, claim);
        LocalDateTime pickupTime = resolvePickupTime(post, claim);
        LocalDateTime expirationTime = resolveExpiryTime(post);
        LocalDateTime eventTime = pickupTime != null ? pickupTime : post.getCreatedAt();

        return new ImpactMetricsEngine.DonationImpactRecord(
                String.valueOf(post.getId()),
                status,
                post.getFoodType(),
                weightKg,
                pickupTime,
                expirationTime,
                eventTime);
    }

    private String resolveStatus(SurplusPost post, Claim claim) {
        if (claim != null && claim.getStatus() == ClaimStatus.COMPLETED) {
            return "picked_up";
        }
        if (post.getStatus() == PostStatus.COMPLETED) {
            return "picked_up";
        }
        return post.getStatus().name().toLowerCase();
    }

    private LocalDateTime resolvePickupTime(SurplusPost post, Claim claim) {
        if (claim != null) {
            LocalDateTime fromClaim = toDateTime(claim.getConfirmedPickupDate(), claim.getConfirmedPickupEndTime())
                    .orElseGet(() -> toDateTime(claim.getConfirmedPickupDate(), claim.getConfirmedPickupStartTime())
                            .orElse(null));
            if (fromClaim != null) {
                return fromClaim;
            }
        }
        if (post.getStatus() == PostStatus.COMPLETED) {
            return post.getUpdatedAt();
        }
        return null;
    }

    private Optional<LocalDateTime> toDateTime(java.time.LocalDate date, LocalTime time) {
        if (date == null || time == null) {
            return Optional.empty();
        }
        return Optional.of(LocalDateTime.of(date, time));
    }

    private LocalDateTime resolveExpiryTime(SurplusPost post) {
        if (post.getExpiryDateEffective() != null) {
            return post.getExpiryDateEffective();
        }
        if (post.getExpiryDate() != null) {
            return post.getExpiryDate().atTime(23, 59, 59);
        }
        return null;
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

    private LocalDateTime[] calculatePreviousDateRange(LocalDateTime currentStart, LocalDateTime currentEnd) {
        long seconds = ChronoUnit.SECONDS.between(currentStart, currentEnd);
        if (seconds <= 0) {
            return new LocalDateTime[]{currentStart.minusDays(1), currentStart};
        }
        return new LocalDateTime[]{currentStart.minusSeconds(seconds), currentStart};
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
