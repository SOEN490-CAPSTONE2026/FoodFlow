package com.example.foodflow.util;

import com.example.foodflow.model.dto.ImpactMetricsDTO;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for generating professional PDF exports with FoodFlow branding.
 */
public class PdfExportUtils {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter
            .ofPattern("MMM d yyyy 'at' h:mm a");

    private static final Color PRIMARY_COLOR = new DeviceRgb(52, 152, 219);
    private static final Color DARK_GRAY = new DeviceRgb(51, 65, 85);
    private static final Color LIGHT_GRAY = new DeviceRgb(241, 245, 249);
    private static final Color WHITE = new DeviceRgb(255, 255, 255);
    private static final Color SUCCESS_COLOR = new DeviceRgb(34, 197, 94);

    private PdfExportUtils() {}

    public static byte[] generatePdf(ImpactMetricsDTO metrics) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);
        document.setMargins(36, 36, 36, 36);

        try {
            PdfFont regularFont = PdfFontFactory.createFont();

            addHeader(document, metrics);
            addMetadata(document, metrics);
            addEnvironmentalImpactSection(document, metrics);
            addOperationalEfficiencySection(document, metrics);
            addTimeLogisticsSection(document, metrics);
            addEngagementSection(document, metrics);

            if ("ADMIN".equals(metrics.getRole())) {
                addUserEngagementSection(document, metrics);
            }

            addMethodologySection(document, metrics);
            addFooter(document, regularFont);

            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            document.close();
            throw new IOException("Failed to generate PDF", e);
        }
    }

    private static void addHeader(Document document, ImpactMetricsDTO metrics) throws IOException {
        Paragraph brand = new Paragraph("FoodFlow");
        brand.setFont(PdfFontFactory.createFont());
        brand.setFontSize(28);
        brand.setFontColor(PRIMARY_COLOR);
        brand.setBold();
        brand.setMarginBottom(2);
        document.add(brand);

        Paragraph title = new Paragraph(generateReportTitle(metrics.getRole()));
        title.setFont(PdfFontFactory.createFont());
        title.setFontSize(18);
        title.setFontColor(DARK_GRAY);
        title.setBold();
        title.setMarginBottom(12);
        document.add(title);

        document.add(new Paragraph("").setMarginBottom(8));
    }

    private static void addMetadata(Document document, ImpactMetricsDTO metrics) {
        String dateRange = CsvExportUtils.formatDateRangeLabel(
                metrics.getDateRange(), metrics.getStartDate(), metrics.getEndDate());

        Table metadataTable = new Table(2);
        metadataTable.setWidth(UnitValue.createPercentValue(100));
        metadataTable.setMarginBottom(20);

        addMetadataRow(metadataTable, "Report Generated:", CsvExportUtils.formatDateTime(LocalDateTime.now()));
        addMetadataRow(metadataTable, "Viewer Role:", CsvExportUtils.formatRole(metrics.getRole()));
        addMetadataRow(metadataTable, "Reporting Period:", dateRange);

        document.add(metadataTable);
        document.add(new Paragraph("").setMarginBottom(12));
    }

    private static void addMetadataRow(Table table, String key, String value) {
        Cell keyCell = new Cell().add(new Paragraph(key).setBold());
        keyCell.setBackgroundColor(LIGHT_GRAY);
        keyCell.setPadding(8);
        keyCell.setWidth(UnitValue.createPercentValue(30));

        Cell valueCell = new Cell().add(new Paragraph(value));
        valueCell.setPadding(8);
        valueCell.setWidth(UnitValue.createPercentValue(70));

        table.addCell(keyCell);
        table.addCell(valueCell);
    }

    private static void addEnvironmentalImpactSection(Document document, ImpactMetricsDTO metrics) {
        addSectionHeader(document, "Environmental Impact");
        Table table = createMetricsTable();

        if (metrics.getTotalFoodWeightKg() != null) {
            addMetricRow(table, "Total Food Saved",
                    CsvExportUtils.formatNumber(metrics.getTotalFoodWeightKg()) + " kg");
        }
        if (metrics.getMinMealsProvided() != null && metrics.getMaxMealsProvided() != null) {
            addMetricRow(table, "Estimated Meals Provided (Range)",
                    metrics.getMinMealsProvided() + " - " + metrics.getMaxMealsProvided() + " meals");
        }
        if (metrics.getEstimatedMealsProvided() != null) {
            addMetricRow(table, "Estimated Meals Provided (Best Estimate)",
                    metrics.getEstimatedMealsProvided() + " meals");
        }
        if (metrics.getCo2EmissionsAvoidedKg() != null) {
            addMetricRow(table, "CO2 Emissions Avoided",
                    CsvExportUtils.formatNumber(metrics.getCo2EmissionsAvoidedKg()) + " kg");
        }
        if (metrics.getWaterSavedLiters() != null) {
            addMetricRow(table, "Water Conserved",
                    CsvExportUtils.formatNumber(metrics.getWaterSavedLiters()) + " liters");
        }
        if (metrics.getPeopleFedEstimate() != null) {
            addMetricRow(table, "Estimated People Fed", metrics.getPeopleFedEstimate() + " people");
        }

        document.add(table);
        document.add(new Paragraph("").setMarginBottom(12));
    }

    private static void addOperationalEfficiencySection(Document document, ImpactMetricsDTO metrics) {
        addSectionHeader(document, "Operational Efficiency");
        Table table = createMetricsTable();

        if (metrics.getTotalPostsCreated() != null) {
            addMetricRow(table, "Total Posts Created", metrics.getTotalPostsCreated().toString());
        }
        if (metrics.getTotalDonationsCompleted() != null) {
            addMetricRow(table, "Total Donations Completed", metrics.getTotalDonationsCompleted().toString());
        }
        if (metrics.getTotalClaimsMade() != null) {
            addMetricRow(table, "Total Claims Made", metrics.getTotalClaimsMade().toString());
        }
        if (metrics.getDonationCompletionRate() != null) {
            addMetricRow(table, "Donation Completion Rate",
                    String.format("%.1f%%", metrics.getDonationCompletionRate()));
        }
        if (metrics.getWasteDiversionEfficiencyPercent() != null) {
            addMetricRow(table, "Waste Diversion Efficiency",
                    String.format("%.1f%%", metrics.getWasteDiversionEfficiencyPercent()));
        }

        document.add(table);
        document.add(new Paragraph("").setMarginBottom(12));
    }

    private static void addTimeLogisticsSection(Document document, ImpactMetricsDTO metrics) {
        addSectionHeader(document, "Time & Logistics");
        Table table = createMetricsTable();

        if (metrics.getMedianClaimTimeHours() != null) {
            addMetricRow(table, "Median Time to Claim",
                    CsvExportUtils.formatNumber(metrics.getMedianClaimTimeHours()) + " hours");
        }
        if (metrics.getP75ClaimTimeHours() != null) {
            addMetricRow(table, "75th Percentile Time to Claim",
                    CsvExportUtils.formatNumber(metrics.getP75ClaimTimeHours()) + " hours");
        }
        if (metrics.getPickupTimelinessRate() != null) {
            addMetricRow(table, "Pickup Timeliness Rate",
                    String.format("%.1f%%", metrics.getPickupTimelinessRate() * 100));
        }

        document.add(table);
        document.add(new Paragraph("").setMarginBottom(12));
    }

    private static void addEngagementSection(Document document, ImpactMetricsDTO metrics) {
        if (metrics.getActiveDonationDays() != null) {
            addSectionHeader(document, "Engagement");
            Table table = createMetricsTable();
            addMetricRow(table, "Active Days with Donations", metrics.getActiveDonationDays() + " days");
            document.add(table);
            document.add(new Paragraph("").setMarginBottom(12));
        }
    }

    private static void addUserEngagementSection(Document document, ImpactMetricsDTO metrics) {
        addSectionHeader(document, "User Engagement (Platform-wide)");
        Table table = createMetricsTable();

        if (metrics.getActiveDonors() != null) {
            addMetricRow(table, "Active Donors", metrics.getActiveDonors().toString());
        }
        if (metrics.getActiveReceivers() != null) {
            addMetricRow(table, "Active Receivers", metrics.getActiveReceivers().toString());
        }
        if (metrics.getRepeatDonors() != null) {
            addMetricRow(table, "Repeat Donors", metrics.getRepeatDonors().toString());
        }
        if (metrics.getRepeatReceivers() != null) {
            addMetricRow(table, "Repeat Receivers", metrics.getRepeatReceivers().toString());
        }

        document.add(table);
        document.add(new Paragraph("").setMarginBottom(12));
    }

    private static void addMethodologySection(Document document, ImpactMetricsDTO metrics) {
        addSectionHeader(document, "Calculation Methodology");
        Table table = createMetricsTable();

        if (metrics.getFactorVersion() != null) {
            addMetricRow(table, "Factor Version", metrics.getFactorVersion());
        }
        if (metrics.getFactorDisclosure() != null) {
            addMetricRow(table, "Methodology", metrics.getFactorDisclosure());
        }

        document.add(table);
        document.add(new Paragraph("").setMarginBottom(12));
    }

    private static void addFooter(Document document, PdfFont font) {
        document.add(new Paragraph("").setMarginBottom(20));

        Paragraph footer = new Paragraph("Generated by FoodFlow");
        footer.setFontSize(9);
        footer.setFontColor(new DeviceRgb(148, 163, 184));
        footer.setTextAlignment(TextAlignment.CENTER);
        document.add(footer);
    }

    private static Table createMetricsTable() {
        Table table = new Table(2);
        table.setWidth(UnitValue.createPercentValue(100));
        table.setMarginBottom(16);

        Cell headerMetric = new Cell().add(new Paragraph("Metric").setBold());
        headerMetric.setBackgroundColor(PRIMARY_COLOR);
        headerMetric.setFontColor(WHITE);
        headerMetric.setPadding(10);
        headerMetric.setWidth(UnitValue.createPercentValue(50));

        Cell headerValue = new Cell().add(new Paragraph("Value").setBold());
        headerValue.setBackgroundColor(PRIMARY_COLOR);
        headerValue.setFontColor(WHITE);
        headerValue.setPadding(10);
        headerValue.setWidth(UnitValue.createPercentValue(50));

        table.addCell(headerMetric);
        table.addCell(headerValue);

        return table;
    }

    private static void addMetricRow(Table table, String metric, String value) {
        Cell metricCell = new Cell().add(new Paragraph(metric));
        metricCell.setPadding(8);
        metricCell.setBackgroundColor(LIGHT_GRAY);

        Cell valueCell = new Cell().add(new Paragraph(value).setBold());
        valueCell.setPadding(8);
        valueCell.setFontColor(SUCCESS_COLOR);
        valueCell.setTextAlignment(TextAlignment.RIGHT);

        table.addCell(metricCell);
        table.addCell(valueCell);
    }

    private static void addSectionHeader(Document document, String sectionName) {
        Paragraph header = new Paragraph(sectionName);
        header.setFontSize(14);
        header.setBold();
        header.setFontColor(DARK_GRAY);
        header.setMarginTop(12);
        header.setMarginBottom(8);
        document.add(header);
    }

    private static String generateReportTitle(String role) {
        if (role == null) {
            return "FoodFlow - Impact Report";
        }

        switch (role) {
            case "DONOR":
                return "FoodFlow - Impact Report: Donor Impact Report";
            case "RECEIVER":
                return "FoodFlow - Impact Report: Receiver Impact Report";
            case "ADMIN":
                return "FoodFlow - Impact Report: Platform-wide Impact Report";
            default:
                return "FoodFlow - Impact Report";
        }
    }
}
