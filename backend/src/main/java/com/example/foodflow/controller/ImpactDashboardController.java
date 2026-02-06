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
        writer.println("Estimated Meals Provided," + (metrics.getEstimatedMealsProvided() != null ?
                metrics.getEstimatedMealsProvided() : "0"));
        writer.println("CO2 Emissions Avoided (kg)," + (metrics.getCo2EmissionsAvoidedKg() != null ?
                String.format("%.2f", metrics.getCo2EmissionsAvoidedKg()) : "0.00"));
        writer.println("Water Saved (liters)," + (metrics.getWaterSavedLiters() != null ?
                String.format("%.2f", metrics.getWaterSavedLiters()) : "0.00"));
        writer.println("People Fed (estimate)," + (metrics.getPeopleFedEstimate() != null ?
                metrics.getPeopleFedEstimate() : "0"));
        writer.println();

        writer.println("Activity Metrics");
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

        writer.flush();
        return outputStream.toByteArray();
    }
}
