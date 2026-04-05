package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ImpactMetricsDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.ImpactDashboardService;
import com.example.foodflow.util.CsvExportUtils;
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
import java.time.LocalDateTime;

/**
 * REST controller for impact dashboard metrics
 */
@RestController
@RequestMapping("/api/impact-dashboard")
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
     * Generate professional CSV content from metrics with FoodFlow branding
     */
    private byte[] generateCsv(ImpactMetricsDTO metrics) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(outputStream, true, StandardCharsets.UTF_8);

        // Generate report title based on role
        String reportTitle = generateReportTitle(metrics.getRole());
        String dateRangeLabel = CsvExportUtils.formatDateRangeLabel(
                metrics.getDateRange(), metrics.getStartDate(), metrics.getEndDate());

        // Write professional header with branding
        CsvExportUtils.writeHeader(writer, reportTitle, LocalDateTime.now(),
                metrics.getRole(), dateRangeLabel);

        // Environmental Impact Section
        CsvExportUtils.writeSectionHeader(writer, "Environmental Impact");
        CsvExportUtils.writeNumericMetric(writer, "Total Food Saved",
                metrics.getTotalFoodWeightKg(), "kg");
        CsvExportUtils.writeRangeMetric(writer, "Estimated Meals Provided (Range)",
                metrics.getMinMealsProvided(), metrics.getMaxMealsProvided());
        CsvExportUtils.writeNumericMetric(writer, "Estimated Meals Provided (Best Estimate)",
                metrics.getEstimatedMealsProvided(), "meals");
        CsvExportUtils.writeNumericMetric(writer, "CO2 Emissions Avoided",
                metrics.getCo2EmissionsAvoidedKg(), "kg");
        CsvExportUtils.writeNumericMetric(writer, "Water Conserved",
                metrics.getWaterSavedLiters(), "liters");
        CsvExportUtils.writeNumericMetric(writer, "Estimated People Fed",
                metrics.getPeopleFedEstimate(), "people");

        // Operational Efficiency Section
        CsvExportUtils.writeSectionHeader(writer, "Operational Efficiency");
        if (metrics.getTotalPostsCreated() != null) {
            CsvExportUtils.writeNumericMetric(writer, "Total Posts Created",
                    metrics.getTotalPostsCreated(), "");
        }
        if (metrics.getTotalDonationsCompleted() != null) {
            CsvExportUtils.writeNumericMetric(writer, "Total Donations Completed",
                    metrics.getTotalDonationsCompleted(), "");
        }
        if (metrics.getTotalClaimsMade() != null) {
            CsvExportUtils.writeNumericMetric(writer, "Total Claims Made",
                    metrics.getTotalClaimsMade(), "");
        }
        if (metrics.getDonationCompletionRate() != null) {
            CsvExportUtils.writePercentageMetric(writer, "Donation Completion Rate",
                    metrics.getDonationCompletionRate());
        }
        if (metrics.getWasteDiversionEfficiencyPercent() != null) {
            CsvExportUtils.writePercentageMetric(writer, "Waste Diversion Efficiency",
                    metrics.getWasteDiversionEfficiencyPercent());
        }

        // Time & Logistics Section
        CsvExportUtils.writeSectionHeader(writer, "Time & Logistics");
        if (metrics.getMedianClaimTimeHours() != null) {
            CsvExportUtils.writeNumericMetric(writer, "Median Time to Claim",
                    metrics.getMedianClaimTimeHours(), "hours");
        }
        if (metrics.getP75ClaimTimeHours() != null) {
            CsvExportUtils.writeNumericMetric(writer, "75th Percentile Time to Claim",
                    metrics.getP75ClaimTimeHours(), "hours");
        }
        if (metrics.getPickupTimelinessRate() != null) {
            CsvExportUtils.writePercentageMetric(writer, "Pickup Timeliness Rate",
                    metrics.getPickupTimelinessRate());
        }

        // Engagement Section
        CsvExportUtils.writeSectionHeader(writer, "Engagement");
        if (metrics.getActiveDonationDays() != null) {
            CsvExportUtils.writeNumericMetric(writer, "Active Days with Donations",
                    metrics.getActiveDonationDays(), "days");
        }

        // Admin-only User Engagement Section
        if ("ADMIN".equals(metrics.getRole())) {
            CsvExportUtils.writeSectionHeader(writer, "User Engagement (Platform-wide)");
            CsvExportUtils.writeNumericMetric(writer, "Active Donors",
                    metrics.getActiveDonors(), "");
            CsvExportUtils.writeNumericMetric(writer, "Active Receivers",
                    metrics.getActiveReceivers(), "");
            CsvExportUtils.writeNumericMetric(writer, "Repeat Donors",
                    metrics.getRepeatDonors(), "");
            CsvExportUtils.writeNumericMetric(writer, "Repeat Receivers",
                    metrics.getRepeatReceivers(), "");
        }

        // Calculation Methodology Section
        CsvExportUtils.writeMetadataDisclosure(writer,
                metrics.getFactorVersion(), metrics.getFactorDisclosure());

        // Footer
        CsvExportUtils.writeFooter(writer);

        writer.flush();
        return outputStream.toByteArray();
    }

    /**
     * Generate a descriptive report title based on user role
     */
    private String generateReportTitle(String role) {
        if (role == null) {
            return "FoodFlow Impact Report";
        }

        switch (role) {
            case "DONOR":
                return "Donor Impact Report";
            case "RECEIVER":
                return "Receiver Impact Report";
            case "ADMIN":
                return "Platform-wide Impact Report";
            default:
                return "FoodFlow Impact Report";
        }
    }
}
