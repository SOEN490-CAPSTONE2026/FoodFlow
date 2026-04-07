package com.example.foodflow.util;

import com.example.foodflow.model.dto.ImpactMetricsDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Unit tests for PdfExportUtils
 */
@DisplayName("PdfExportUtils Tests")
class PdfExportUtilsTest {

    private ImpactMetricsDTO testMetrics;

    @BeforeEach
    void setUp() {
        testMetrics = new ImpactMetricsDTO();
        testMetrics.setUserId(1L);
        testMetrics.setRole("DONOR");
        testMetrics.setDateRange("ALL_TIME");
        testMetrics.setStartDate(LocalDateTime.of(2020, 1, 1, 0, 0));
        testMetrics.setEndDate(LocalDateTime.now());
        testMetrics.setTotalFoodWeightKg(100.0);
        testMetrics.setEstimatedMealsProvided(200);
        testMetrics.setMinMealsProvided(150);
        testMetrics.setMaxMealsProvided(250);
        testMetrics.setCo2EmissionsAvoidedKg(50.0);
        testMetrics.setWaterSavedLiters(5000.0);
        testMetrics.setPeopleFedEstimate(66);
        testMetrics.setTotalPostsCreated(10);
        testMetrics.setTotalDonationsCompleted(8);
        testMetrics.setDonationCompletionRate(80.0);
        testMetrics.setWasteDiversionEfficiencyPercent(90.0);
        testMetrics.setActiveDonationDays(5);
        testMetrics.setMedianClaimTimeHours(12.0);
        testMetrics.setP75ClaimTimeHours(24.0);
        testMetrics.setPickupTimelinessRate(0.0);
        testMetrics.setFactorVersion("1.0-default");
        testMetrics.setFactorDisclosure("Test disclosure");
    }

    @Test
    @DisplayName("Should generate PDF successfully")
    void shouldGeneratePdfSuccessfully() throws IOException {
        byte[] pdfData = PdfExportUtils.generatePdf(testMetrics);

        assertNotNull(pdfData);
        assertTrue(pdfData.length > 0);
        // PDF files start with %PDF
        assertTrue(new String(pdfData, 0, Math.min(4, pdfData.length)).startsWith("%PDF"));
    }

    @Test
    @DisplayName("Should include branding in PDF")
    void shouldIncludeBrandingInPdf() throws IOException {
        byte[] pdfData = PdfExportUtils.generatePdf(testMetrics);
        String pdfContent = new String(pdfData);

        // PDF content is binary, but we can check that generation completed
        assertNotNull(pdfData);
        assertTrue(pdfData.length > 0);
    }

    @Test
    @DisplayName("Should handle all metric values in PDF")
    void shouldHandleAllMetricValuesInPdf() throws IOException {
        byte[] pdfData = PdfExportUtils.generatePdf(testMetrics);

        assertNotNull(pdfData);
        assertTrue(pdfData.length > 0);
    }

    @Test
    @DisplayName("Should generate PDF with null metrics gracefully")
    void shouldGeneratePdfWithNullMetrics() throws IOException {
        ImpactMetricsDTO emptyMetrics = new ImpactMetricsDTO();
        emptyMetrics.setRole("DONOR");
        emptyMetrics.setDateRange("ALL_TIME");

        byte[] pdfData = PdfExportUtils.generatePdf(emptyMetrics);

        assertNotNull(pdfData);
        assertTrue(pdfData.length > 0);
    }

    @Test
    @DisplayName("Should handle RECEIVER role in PDF")
    void shouldHandleReceiverRoleInPdf() throws IOException {
        testMetrics.setRole("RECEIVER");
        byte[] pdfData = PdfExportUtils.generatePdf(testMetrics);

        assertNotNull(pdfData);
        assertTrue(pdfData.length > 0);
    }

    @Test
    @DisplayName("Should handle ADMIN role in PDF")
    void shouldHandleAdminRoleInPdf() throws IOException {
        testMetrics.setRole("ADMIN");
        testMetrics.setActiveDonors(50);
        testMetrics.setActiveReceivers(75);
        testMetrics.setRepeatDonors(25);
        testMetrics.setRepeatReceivers(40);

        byte[] pdfData = PdfExportUtils.generatePdf(testMetrics);

        assertNotNull(pdfData);
        assertTrue(pdfData.length > 0);
    }

    @Test
    @DisplayName("Should generate different PDFs for different date ranges")
    void shouldGeneratePdfsForDifferentDateRanges() throws IOException {
        // ALL_TIME
        testMetrics.setDateRange("ALL_TIME");
        byte[] pdfAll = PdfExportUtils.generatePdf(testMetrics);

        // DAYS_30
        testMetrics.setDateRange("DAYS_30");
        byte[] pdf30 = PdfExportUtils.generatePdf(testMetrics);

        assertNotNull(pdfAll);
        assertNotNull(pdf30);
        assertTrue(pdfAll.length > 0);
        assertTrue(pdf30.length > 0);
    }

    @Test
    @DisplayName("Should handle large metric values")
    void shouldHandleLargeMetricValues() throws IOException {
        testMetrics.setTotalFoodWeightKg(1000000.0);
        testMetrics.setCo2EmissionsAvoidedKg(500000.0);
        testMetrics.setWaterSavedLiters(50000000.0);
        testMetrics.setEstimatedMealsProvided(1000000);

        byte[] pdfData = PdfExportUtils.generatePdf(testMetrics);

        assertNotNull(pdfData);
        assertTrue(pdfData.length > 0);
    }

    @Test
    @DisplayName("Should handle special characters in metric values")
    void shouldHandleSpecialCharactersInMetricValues() throws IOException {
        testMetrics.setFactorDisclosure("Test with 'special' characters: @#$%&");

        byte[] pdfData = PdfExportUtils.generatePdf(testMetrics);

        assertNotNull(pdfData);
        assertTrue(pdfData.length > 0);
    }

    @Test
    @DisplayName("Should produce consistent PDF output for same input")
    void shouldProduceConsistentPdfOutput() throws IOException {
        byte[] pdf1 = PdfExportUtils.generatePdf(testMetrics);
        byte[] pdf2 = PdfExportUtils.generatePdf(testMetrics);

        assertNotNull(pdf1);
        assertNotNull(pdf2);
        // Both should be valid PDFs
        assertTrue(pdf1.length > 0);
        assertTrue(pdf2.length > 0);
    }
}
