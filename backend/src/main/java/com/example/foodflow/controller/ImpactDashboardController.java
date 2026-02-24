package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ImpactMetricsDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.ImpactDashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

/**
 * REST controller for impact dashboard metrics
 */
@RestController
@RequestMapping("/api/impact-dashboard")
@CrossOrigin(origins = "${spring.web.cors.allowed-origins}")
public class ImpactDashboardController {

    private static final Logger logger = LoggerFactory.getLogger(ImpactDashboardController.class);

    private final ImpactDashboardService impactDashboardService;

    public ImpactDashboardController(ImpactDashboardService impactDashboardService) {
        this.impactDashboardService = impactDashboardService;
    }

    /**
     * Get impact metrics for current user based on their role
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyAuthority('DONOR', 'RECEIVER', 'ADMIN')")
    public ResponseEntity<ImpactMetricsDTO> getMetrics(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "ALL_TIME") String dateRange) {

        logger.info("GET /api/impact-dashboard/metrics - userId={}, role={}, dateRange={}",
                currentUser.getId(), currentUser.getRole(), dateRange);

        ImpactMetricsDTO metrics;

        switch (currentUser.getRole()) {
            case DONOR:
                metrics = impactDashboardService.getDonorMetrics(currentUser.getId(), dateRange);
                break;
            case RECEIVER:
                metrics = impactDashboardService.getReceiverMetrics(currentUser.getId(), dateRange);
                break;
            case ADMIN:
                metrics = impactDashboardService.getAdminMetrics(dateRange);
                break;
            default:
                return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(metrics);
    }

    /**
     * Export impact metrics as CSV
     */
    @GetMapping("/export")
    @PreAuthorize("hasAnyAuthority('DONOR', 'RECEIVER', 'ADMIN')")
    public ResponseEntity<byte[]> exportMetrics(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "ALL_TIME") String dateRange) {

        logger.info("GET /api/impact-dashboard/export - userId={}, role={}, dateRange={}",
                currentUser.getId(), currentUser.getRole(), dateRange);

        ImpactMetricsDTO metrics;

        switch (currentUser.getRole()) {
            case DONOR:
                metrics = impactDashboardService.getDonorMetrics(currentUser.getId(), dateRange);
                break;
            case RECEIVER:
                metrics = impactDashboardService.getReceiverMetrics(currentUser.getId(), dateRange);
                break;
            case ADMIN:
                metrics = impactDashboardService.getAdminMetrics(dateRange);
                break;
            default:
                return ResponseEntity.badRequest().build();
        }

        try {
            byte[] csvData = generateCsv(metrics);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment",
                    "impact-metrics-" + dateRange.toLowerCase() + ".csv");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(csvData);

        } catch (Exception e) {
            logger.error("Error generating CSV export", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Generate CSV content from metrics
     */
    private byte[] generateCsv(ImpactMetricsDTO metrics) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(outputStream, true, StandardCharsets.UTF_8);

        // Write header
        writer.println("Metric,Value");

        // Write metrics
        writer.println("Role," + metrics.getRole());
        writer.println("Date Range," + metrics.getDateRange());
        writer.println("Start Date," + (metrics.getStartDate() != null ? metrics.getStartDate() : "N/A"));
        writer.println("End Date," + (metrics.getEndDate() != null ? metrics.getEndDate() : "N/A"));
        writer.println();

        writer.println("Environmental Impact");
        writer.println("Total Food Weight (kg)," + (metrics.getTotalFoodWeightKg() != null ?
                String.format("%.2f", metrics.getTotalFoodWeightKg()) : "0.00"));

        // Bounded meal estimates
        if (metrics.getMinMealsProvided() != null && metrics.getMaxMealsProvided() != null) {
            writer.println("Estimated Meals Provided (Range)," +
                    metrics.getMinMealsProvided() + "-" + metrics.getMaxMealsProvided());
        }
        writer.println("Estimated Meals Provided (Midpoint)," + (metrics.getEstimatedMealsProvided() != null ?
                metrics.getEstimatedMealsProvided() : "0"));

        writer.println("CO2 Emissions Avoided (kg)," + (metrics.getCo2EmissionsAvoidedKg() != null ?
                String.format("%.2f", metrics.getCo2EmissionsAvoidedKg()) : "0.00"));
        writer.println("Water Saved (liters)," + (metrics.getWaterSavedLiters() != null ?
                String.format("%.2f", metrics.getWaterSavedLiters()) : "0.00"));
        writer.println("People Fed (estimate)," + (metrics.getPeopleFedEstimate() != null ?
                metrics.getPeopleFedEstimate() : "0"));
        writer.println();

        writer.println("Operational Efficiency");
        if (metrics.getTotalPostsCreated() != null) {
            writer.println("Total Posts Created," + metrics.getTotalPostsCreated());
        }
        if (metrics.getTotalDonationsCompleted() != null) {
            writer.println("Total Donations Completed," + metrics.getTotalDonationsCompleted());
        }
        if (metrics.getTotalClaimsMade() != null) {
            writer.println("Total Claims Made," + metrics.getTotalClaimsMade());
        }
        if (metrics.getDonationCompletionRate() != null) {
            writer.println("Donation Completion Rate (%)," +
                    String.format("%.1f", metrics.getDonationCompletionRate()));
        }
        if (metrics.getWasteDiversionEfficiencyPercent() != null) {
            writer.println("Waste Diversion Efficiency (%)," +
                    String.format("%.1f", metrics.getWasteDiversionEfficiencyPercent()));
        }
        writer.println();

        writer.println("Time & Logistics");
        if (metrics.getMedianClaimTimeHours() != null) {
            writer.println("Median Time to Claim (hours)," +
                    String.format("%.1f", metrics.getMedianClaimTimeHours()));
        }
        if (metrics.getP75ClaimTimeHours() != null) {
            writer.println("75th Percentile Time to Claim (hours)," +
                    String.format("%.1f", metrics.getP75ClaimTimeHours()));
        }
        if (metrics.getPickupTimelinessRate() != null) {
            writer.println("Pickup Timeliness Rate (%)," +
                    String.format("%.1f", metrics.getPickupTimelinessRate()));
        }
        writer.println();

        writer.println("Engagement");
        if (metrics.getActiveDonationDays() != null) {
            writer.println("Active Days with Donations," + metrics.getActiveDonationDays());
        }

        // Admin-only metrics
        if ("ADMIN".equals(metrics.getRole())) {
            writer.println();
            writer.println("User Engagement");
            writer.println("Active Donors," + (metrics.getActiveDonors() != null ?
                    metrics.getActiveDonors() : "0"));
            writer.println("Active Receivers," + (metrics.getActiveReceivers() != null ?
                    metrics.getActiveReceivers() : "0"));
            writer.println("Repeat Donors," + (metrics.getRepeatDonors() != null ?
                    metrics.getRepeatDonors() : "0"));
            writer.println("Repeat Receivers," + (metrics.getRepeatReceivers() != null ?
                    metrics.getRepeatReceivers() : "0"));
        }

        // Factor metadata for transparency
        writer.println();
        writer.println("Calculation Metadata");
        writer.println("Factor Version," + (metrics.getFactorVersion() != null ?
                metrics.getFactorVersion() : "N/A"));
        writer.println("Disclosure,\"" + (metrics.getFactorDisclosure() != null ?
                metrics.getFactorDisclosure() : "N/A") + "\"");

        writer.flush();
        return outputStream.toByteArray();
    }
}
