package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ImpactMetricsDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.ImpactDashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ImpactDashboardController.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ImpactDashboardController Tests")
class ImpactDashboardControllerTest {

    @Mock
    private ImpactDashboardService impactDashboardService;

    @InjectMocks
    private ImpactDashboardController controller;

    private User donorUser;
    private User receiverUser;
    private User adminUser;
    private ImpactMetricsDTO testMetrics;

    @BeforeEach
    void setUp() {
        donorUser = new User();
        donorUser.setId(1L);
        donorUser.setEmail("donor@test.com");
        donorUser.setRole(UserRole.DONOR);

        receiverUser = new User();
        receiverUser.setId(2L);
        receiverUser.setEmail("receiver@test.com");
        receiverUser.setRole(UserRole.RECEIVER);

        adminUser = new User();
        adminUser.setId(3L);
        adminUser.setEmail("admin@test.com");
        adminUser.setRole(UserRole.ADMIN);

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

    @Nested
    @DisplayName("GET /api/impact-dashboard/metrics Tests")
    class GetMetricsTests {
        @Test
        @DisplayName("Should return donor metrics successfully")
        void shouldReturnDonorMetrics() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<ImpactMetricsDTO> response = controller.getMetrics(donorUser, "ALL_TIME");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("DONOR", response.getBody().getRole());
            assertEquals(1L, response.getBody().getUserId());
            assertEquals(100.0, response.getBody().getTotalFoodWeightKg());
            assertEquals(200, response.getBody().getEstimatedMealsProvided());
            assertEquals(50.0, response.getBody().getCo2EmissionsAvoidedKg());
            verify(impactDashboardService, times(1)).getDonorMetrics(1L, "ALL_TIME");
        }

        @Test
        @DisplayName("Should return receiver metrics successfully")
        void shouldReturnReceiverMetrics() {
            ImpactMetricsDTO receiverMetrics = new ImpactMetricsDTO();
            receiverMetrics.setUserId(2L);
            receiverMetrics.setRole("RECEIVER");
            receiverMetrics.setTotalFoodWeightKg(50.0);
            receiverMetrics.setTotalClaimsMade(5);
            receiverMetrics.setTotalDonationsCompleted(5);

            when(impactDashboardService.getReceiverMetrics(eq(2L), eq("MONTHLY")))
                    .thenReturn(receiverMetrics);

            ResponseEntity<ImpactMetricsDTO> response = controller.getMetrics(receiverUser, "MONTHLY");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("RECEIVER", response.getBody().getRole());
            assertEquals(2L, response.getBody().getUserId());
            assertEquals(50.0, response.getBody().getTotalFoodWeightKg());
            assertEquals(5, response.getBody().getTotalClaimsMade());
            verify(impactDashboardService, times(1)).getReceiverMetrics(2L, "MONTHLY");
        }

        @Test
        @DisplayName("Should return admin platform-wide metrics successfully")
        void shouldReturnAdminMetrics() {
            ImpactMetricsDTO adminMetrics = new ImpactMetricsDTO();
            adminMetrics.setRole("ADMIN");
            adminMetrics.setTotalFoodWeightKg(1000.0);
            adminMetrics.setActiveDonors(50);
            adminMetrics.setActiveReceivers(40);
            adminMetrics.setRepeatDonors(20);
            adminMetrics.setRepeatReceivers(15);

            when(impactDashboardService.getAdminMetrics(eq("WEEKLY")))
                    .thenReturn(adminMetrics);

            ResponseEntity<ImpactMetricsDTO> response = controller.getMetrics(adminUser, "WEEKLY");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("ADMIN", response.getBody().getRole());
            assertEquals(1000.0, response.getBody().getTotalFoodWeightKg());
            assertEquals(50, response.getBody().getActiveDonors());
            assertEquals(40, response.getBody().getActiveReceivers());
            verify(impactDashboardService, times(1)).getAdminMetrics("WEEKLY");
        }

        @Test
        @DisplayName("Should handle default date range parameter")
        void shouldHandleDefaultDateRange() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<ImpactMetricsDTO> response = controller.getMetrics(donorUser, "ALL_TIME");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(impactDashboardService, times(1)).getDonorMetrics(1L, "ALL_TIME");
        }

        @Test
        @DisplayName("Should handle different date ranges")
        void shouldHandleDifferentDateRanges() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("WEEKLY")))
                    .thenReturn(testMetrics);
            ResponseEntity<ImpactMetricsDTO> weeklyResponse = controller.getMetrics(donorUser, "WEEKLY");
            assertEquals(HttpStatus.OK, weeklyResponse.getStatusCode());

            when(impactDashboardService.getDonorMetrics(eq(1L), eq("MONTHLY")))
                    .thenReturn(testMetrics);
            ResponseEntity<ImpactMetricsDTO> monthlyResponse = controller.getMetrics(donorUser, "MONTHLY");
            assertEquals(HttpStatus.OK, monthlyResponse.getStatusCode());

            verify(impactDashboardService, times(1)).getDonorMetrics(1L, "WEEKLY");
            verify(impactDashboardService, times(1)).getDonorMetrics(1L, "MONTHLY");
        }
    }

    @Nested
    @DisplayName("GET /api/impact-dashboard/export Tests")
    class ExportMetricsTests {
        @Test
        @DisplayName("Should export donor metrics as CSV successfully")
        void shouldExportDonorMetricsAsCsv() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "ALL_TIME");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().length > 0);
            assertEquals(MediaType.parseMediaType("text/csv"), response.getHeaders().getContentType());
            assertTrue(response.getHeaders().getContentDisposition().toString()
                    .matches(".*FoodFlow_Impact_Report_\\d{4}-\\d{2}-\\d{2}\\.csv.*"));
            verify(impactDashboardService, times(1)).getDonorMetrics(1L, "ALL_TIME");
        }

        @Test
        @DisplayName("Should export receiver metrics as CSV successfully")
        void shouldExportReceiverMetricsAsCsv() {
            ImpactMetricsDTO receiverMetrics = new ImpactMetricsDTO();
            receiverMetrics.setRole("RECEIVER");
            receiverMetrics.setUserId(2L);
            receiverMetrics.setTotalFoodWeightKg(50.0);

            when(impactDashboardService.getReceiverMetrics(eq(2L), eq("MONTHLY")))
                    .thenReturn(receiverMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(receiverUser, "MONTHLY");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().length > 0);
            assertTrue(response.getHeaders().getContentDisposition().toString()
                    .matches(".*FoodFlow_Impact_Report_\\d{4}-\\d{2}-\\d{2}\\.csv.*"));
        }

        @Test
        @DisplayName("Should export admin metrics with engagement data as CSV")
        void shouldExportAdminMetricsWithEngagement() {
            ImpactMetricsDTO adminMetrics = new ImpactMetricsDTO();
            adminMetrics.setRole("ADMIN");
            adminMetrics.setTotalFoodWeightKg(1000.0);
            adminMetrics.setActiveDonors(50);
            adminMetrics.setActiveReceivers(40);
            adminMetrics.setRepeatDonors(20);
            adminMetrics.setRepeatReceivers(15);

            when(impactDashboardService.getAdminMetrics(eq("WEEKLY")))
                    .thenReturn(adminMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(adminUser, "WEEKLY");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            String csvContent = new String(response.getBody());
            assertTrue(csvContent.contains("Active Donors"));
            assertTrue(csvContent.contains("Active Receivers"));
            assertTrue(csvContent.contains("Repeat Donors"));
            assertTrue(csvContent.contains("Repeat Receivers"));
        }

        @Test
        @DisplayName("Should include all key metrics in CSV export")
        void shouldIncludeAllKeyMetricsInCsv() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "ALL_TIME");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            String csvContent = new String(response.getBody());
            assertTrue(csvContent.contains("FoodFlow - Impact Report"));
            assertTrue(csvContent.contains("Donor Impact Report"));
            assertTrue(csvContent.contains("Total Food Saved"));
            assertTrue(csvContent.contains("CO2 Emissions Avoided"));
            assertTrue(csvContent.contains("Water Conserved"));
            assertTrue(csvContent.contains("Estimated Meals Provided"));
            assertTrue(csvContent.contains("Donation Completion Rate"));
            assertTrue(csvContent.contains("Waste Diversion Efficiency"));
            assertTrue(csvContent.contains("Factor Version"));
            assertTrue(csvContent.contains("kg"));
            assertTrue(csvContent.contains("meals"));
            assertTrue(csvContent.contains("liters"));
            assertTrue(csvContent.contains("%"));
        }

        @Test
        @DisplayName("Should handle CSV export with bounded meal estimates")
        void shouldHandleBoundedMealEstimatesInCsv() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "ALL_TIME");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            String csvContent = new String(response.getBody());
            assertTrue(csvContent.contains("150-250"));
            assertTrue(csvContent.contains("Estimated Meals Provided (Range)"));
        }

        @Test
        @DisplayName("Should include FoodFlow branding and metadata in CSV export")
        void shouldIncludeBrandingAndMetadata() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("DAYS_30")))
                    .thenReturn(testMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "DAYS_30");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            String csvContent = new String(response.getBody());
            assertTrue(csvContent.contains("Donor Impact Report"));
            assertTrue(csvContent.contains("Report Generated"));
            assertTrue(csvContent.contains("Report Type"));
            assertTrue(csvContent.contains("Viewer Role"));
            assertTrue(csvContent.contains("Reporting Period"));
            assertTrue(csvContent.contains("Food Donor"));
            assertTrue(csvContent.contains("Environmental Impact"));
            assertTrue(csvContent.contains("Operational Efficiency"));
            assertTrue(csvContent.contains("Time & Logistics"));
            assertTrue(csvContent.contains("Engagement"));
            assertTrue(csvContent.contains("Calculation Methodology"));
        }

        @Test
        @DisplayName("Should include admin-specific metrics in CSV for admin role")
        void shouldIncludeAdminMetricsInCsvForAdminRole() {
            ImpactMetricsDTO adminMetrics = new ImpactMetricsDTO();
            adminMetrics.setRole("ADMIN");
            adminMetrics.setDateRange("DAYS_30");
            adminMetrics.setStartDate(LocalDateTime.of(2026, 3, 6, 0, 0));
            adminMetrics.setEndDate(LocalDateTime.of(2026, 4, 5, 23, 59));
            adminMetrics.setTotalFoodWeightKg(1000.0);
            adminMetrics.setActiveDonors(50);
            adminMetrics.setActiveReceivers(40);
            adminMetrics.setRepeatDonors(20);
            adminMetrics.setRepeatReceivers(15);
            adminMetrics.setFactorVersion("1.2.0");
            adminMetrics.setFactorDisclosure("Sample disclosure");

            when(impactDashboardService.getAdminMetrics(eq("DAYS_30")))
                    .thenReturn(adminMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(adminUser, "DAYS_30");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            String csvContent = new String(response.getBody());
            assertTrue(csvContent.contains("Platform-wide Impact Report"));
            assertTrue(csvContent.contains("Administrator"));
            assertTrue(csvContent.contains("User Engagement (Platform-wide)"));
            assertTrue(csvContent.contains("Active Donors"));
            assertTrue(csvContent.contains("Active Receivers"));
            assertTrue(csvContent.contains("Repeat Donors"));
            assertTrue(csvContent.contains("Repeat Receivers"));
        }
    }

    @Nested
    @DisplayName("Error Handling Tests")
    class ErrorHandlingTests {
        @Test
        @DisplayName("Should handle service exceptions gracefully for metrics")
        void shouldHandleServiceExceptionForMetrics() {
            when(impactDashboardService.getDonorMetrics(anyLong(), anyString()))
                    .thenThrow(new RuntimeException("Service error"));

            assertThrows(RuntimeException.class, () -> controller.getMetrics(donorUser, "ALL_TIME"));
        }

        @Test
        @DisplayName("Should return 500 on CSV generation error")
        void shouldReturn500OnCsvGenerationError() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenThrow(new RuntimeException("Database error"));

            assertThrows(RuntimeException.class, () -> controller.exportMetrics(donorUser, "ALL_TIME"));
        }
    }

    @Nested
    @DisplayName("CSV Content Validation Tests")
    class CsvContentValidationTests {
        @Test
        @DisplayName("Should format numeric values correctly in CSV")
        void shouldFormatNumericValuesCorrectly() {
            testMetrics.setTotalFoodWeightKg(123.456);
            testMetrics.setCo2EmissionsAvoidedKg(78.901);
            testMetrics.setWaterSavedLiters(12345.67);

            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "ALL_TIME");

            String csvContent = new String(response.getBody());
            assertTrue(csvContent.contains("123.46"));
            assertTrue(csvContent.contains("78.90"));
        }

        @Test
        @DisplayName("Should handle null values in CSV export")
        void shouldHandleNullValuesInCsv() {
            ImpactMetricsDTO sparseMetrics = new ImpactMetricsDTO();
            sparseMetrics.setRole("DONOR");
            sparseMetrics.setDateRange("ALL_TIME");

            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(sparseMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "ALL_TIME");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            String csvContent = new String(response.getBody());
            assertTrue(csvContent.contains("0.00") || csvContent.contains("0"));
        }

        @Test
        @DisplayName("Should include CSV headers")
        void shouldIncludeCsvHeaders() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "ALL_TIME");

            String csvContent = new String(response.getBody());
            assertTrue(csvContent.startsWith("Metric,Value"));
        }

        @Test
        @DisplayName("Should export metrics as PDF when format=pdf parameter is provided")
        void shouldExportMetricsAsPdf() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "ALL_TIME", "pdf");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().length > 0);
            assertEquals(MediaType.parseMediaType("application/pdf"), response.getHeaders().getContentType());
            assertTrue(response.getHeaders().getContentDisposition().toString()
                    .matches(".*FoodFlow_Impact_Report_\\d{4}-\\d{2}-\\d{2}\\.pdf.*"));
            assertTrue(new String(response.getBody(), 0, Math.min(4, response.getBody().length)).startsWith("%PDF"));
        }

        @Test
        @DisplayName("Should export receiver metrics as PDF successfully")
        void shouldExportReceiverMetricsAsPdf() {
            ImpactMetricsDTO receiverMetrics = new ImpactMetricsDTO();
            receiverMetrics.setRole("RECEIVER");
            receiverMetrics.setUserId(2L);
            receiverMetrics.setTotalFoodWeightKg(50.0);

            when(impactDashboardService.getReceiverMetrics(eq(2L), eq("MONTHLY")))
                    .thenReturn(receiverMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(receiverUser, "MONTHLY", "pdf");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().length > 0);
            assertEquals(MediaType.parseMediaType("application/pdf"), response.getHeaders().getContentType());
        }

        @Test
        @DisplayName("Should default to CSV format when no format parameter provided")
        void shouldDefaultToCsvFormat() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "ALL_TIME");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(MediaType.parseMediaType("text/csv"), response.getHeaders().getContentType());
            String csvContent = new String(response.getBody());
            assertTrue(csvContent.startsWith("Metric,Value"));
        }

        @Test
        @DisplayName("Should handle invalid format parameter gracefully (defaults to CSV)")
        void shouldHandleInvalidFormatParameter() {
            when(impactDashboardService.getDonorMetrics(eq(1L), eq("ALL_TIME")))
                    .thenReturn(testMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(donorUser, "ALL_TIME", "xlsx");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(MediaType.parseMediaType("text/csv"), response.getHeaders().getContentType());
        }

        @Test
        @DisplayName("Should export admin metrics as PDF with user engagement data")
        void shouldExportAdminMetricsAsPdfWithEngagement() {
            ImpactMetricsDTO adminMetrics = new ImpactMetricsDTO();
            adminMetrics.setRole("ADMIN");
            adminMetrics.setTotalFoodWeightKg(1000.0);
            adminMetrics.setActiveDonors(50);
            adminMetrics.setActiveReceivers(40);
            adminMetrics.setRepeatDonors(20);
            adminMetrics.setRepeatReceivers(15);

            when(impactDashboardService.getAdminMetrics(eq("WEEKLY")))
                    .thenReturn(adminMetrics);

            ResponseEntity<byte[]> response = controller.exportMetrics(adminUser, "WEEKLY", "pdf");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().length > 0);
            assertEquals(MediaType.parseMediaType("application/pdf"), response.getHeaders().getContentType());
        }
    }
}
