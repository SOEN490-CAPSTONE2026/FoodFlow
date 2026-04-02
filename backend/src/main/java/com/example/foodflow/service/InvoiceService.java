package com.example.foodflow.service;

import com.example.foodflow.model.dto.InvoiceResponse;
import com.example.foodflow.model.entity.Invoice;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.Refund;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.InvoiceStatus;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.RefundStatus;
import com.example.foodflow.repository.InvoiceRepository;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.RefundRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;

    @Transactional
    public InvoiceResponse generateInvoice(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        Invoice invoice = invoiceRepository.findByPaymentId(paymentId).orElseGet(() -> {
            Invoice createdInvoice = new Invoice();
            createdInvoice.setPayment(payment);
            createdInvoice.setInvoiceNumber(generateInvoiceNumber());
            createdInvoice.setIssuedDate(LocalDate.now());
            createdInvoice.setDueDate(LocalDate.now().plusDays(30));
            return createdInvoice;
        });

        invoice = syncInvoiceFields(invoice, payment);
        invoice = invoiceRepository.save(invoice);

        log.info("Invoice generated/synced: {} for payment: {}", invoice.getInvoiceNumber(), paymentId);

        return toInvoiceResponse(invoice);
    }

    public InvoiceResponse getInvoiceByPaymentId(Long paymentId) {
        return invoiceRepository.findByPaymentId(paymentId)
                .map(this::toInvoiceResponse)
                .orElse(null);
    }

    public InvoiceResponse getInvoiceById(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        return toInvoiceResponse(invoice);
    }

    @Transactional
    public InvoiceResponse generateInvoiceForUser(Long paymentId, User user) {
        getOwnedPayment(paymentId, user);
        return generateInvoice(paymentId);
    }

    public InvoiceResponse getInvoiceByPaymentIdForUser(Long paymentId, User user) {
        getOwnedPayment(paymentId, user);
        InvoiceResponse invoice = getInvoiceByPaymentId(paymentId);
        if (invoice == null) {
            throw new RuntimeException("Invoice not found");
        }
        return invoice;
    }

    public InvoiceResponse getInvoiceByIdForUser(Long invoiceId, User user) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        verifyOwnership(invoice.getPayment(), user);
        return toInvoiceResponse(invoice);
    }

    public Page<InvoiceResponse> getInvoicesForUser(User user, Pageable pageable) {
        return invoiceRepository.findByOrganizationId(user.getOrganization().getId(), pageable)
                .map(this::toInvoiceResponse);
    }

    public byte[] downloadInvoice(Long invoiceId, User user) {
        InvoiceResponse invoice = getInvoiceByIdForUser(invoiceId, user);
        String paymentAmount = invoice.getSubtotalAmount() != null ? invoice.getSubtotalAmount().toPlainString()
                : "0.00";
        String refundedAmount = invoice.getRefundedAmount() != null ? invoice.getRefundedAmount().toPlainString()
                : "0.00";
        String netAmount = invoice.getNetAmount() != null ? invoice.getNetAmount().toPlainString() : "0.00";
        return buildInvoicePdf(
                invoice.getInvoiceNumber(),
                invoice.getPaymentId(),
                invoice.getIssuedDate(),
                invoice.getDueDate(),
                paymentAmount,
                refundedAmount,
                netAmount,
                invoice.getStatus() != null ? invoice.getStatus().name() : "UNKNOWN");
    }

    @Transactional
    public InvoiceResponse syncInvoiceForPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        Invoice invoice = invoiceRepository.findByPaymentId(paymentId).orElseGet(() -> {
            Invoice createdInvoice = new Invoice();
            createdInvoice.setPayment(payment);
            createdInvoice.setInvoiceNumber(generateInvoiceNumber());
            createdInvoice.setIssuedDate(LocalDate.now());
            createdInvoice.setDueDate(LocalDate.now().plusDays(30));
            return createdInvoice;
        });

        invoice = syncInvoiceFields(invoice, payment);
        return toInvoiceResponse(invoiceRepository.save(invoice));
    }

    private String generateInvoiceNumber() {
        return "INV-" + System.currentTimeMillis();
    }

    private byte[] buildInvoicePdf(
            String invoiceNumber,
            Long paymentId,
            LocalDate issuedDate,
            LocalDate dueDate,
            String paymentAmount,
            String refundedAmount,
            String netAmount,
            String status) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);

            // Set document margins
            document.setMargins(40, 40, 40, 40);

            // Brand colors
            DeviceRgb primaryColor = new DeviceRgb(62, 180, 205); // FoodFlow teal
            DeviceRgb accentColor = new DeviceRgb(230, 126, 34); // Warm orange
            DeviceRgb darkGray = new DeviceRgb(52, 73, 94); // Dark text
            DeviceRgb lightGray = new DeviceRgb(236, 240, 241); // Light background

            // ===== HEADER SECTION =====
            Table headerTable = new Table(new float[] { 1, 1 }).setWidth(UnitValue.createPercentValue(100));

            // Logo/Brand name cell
            Cell brandCell = new Cell()
                    .add(new Paragraph("🍽️ FoodFlow")
                            .setBold()
                            .setFontSize(24)
                            .setFontColor(primaryColor))
                    .add(new Paragraph("Donation Receipt")
                            .setFontSize(11)
                            .setFontColor(darkGray))
                    .setBorder(Border.NO_BORDER)
                    .setPadding(0);

            // Invoice details cell
            Cell invoiceDetailsCell = new Cell()
                    .add(new Paragraph("Invoice #" + valueOrFallback(invoiceNumber, "N/A"))
                            .setBold()
                            .setFontSize(12)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .add(new Paragraph("Status: " + formatStatus(status))
                            .setFontSize(10)
                            .setFontColor(getStatusColor(status))
                            .setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(Border.NO_BORDER)
                    .setPadding(0);

            headerTable.addCell(brandCell);
            headerTable.addCell(invoiceDetailsCell);
            document.add(headerTable);

            // Add spacing
            document.add(new Paragraph("\n"));

            // ===== COMPANY INFO & INVOICE DATES =====
            Table companyInfoTable = new Table(new float[] { 1, 1 }).setWidth(UnitValue.createPercentValue(100));

            // Company info
            Cell companyInfo = new Cell()
                    .add(createSectionTitle("From", primaryColor))
                    .add(new Paragraph("FoodFlow")
                            .setBold()
                            .setFontSize(11))
                    .add(new Paragraph("Connecting Donors & Receivers")
                            .setFontSize(10)
                            .setFontColor(darkGray))
                    .add(new Paragraph("Email: foodflow.group@gmail.com")
                            .setFontSize(9))
                    .setBorder(Border.NO_BORDER)
                    .setPadding(10);

            // Invoice dates
            Cell invoiceDates = new Cell()
                    .add(createSectionTitle("Invoice Details", primaryColor))
                    .add(new Paragraph("Invoice Date: " + formatDate(issuedDate))
                            .setFontSize(10))
                    .add(new Paragraph("Due Date: " + formatDate(dueDate))
                            .setFontSize(10))
                    .add(new Paragraph("Payment ID: " + (paymentId != null ? paymentId : "N/A"))
                            .setFontSize(9)
                            .setFontColor(darkGray))
                    .setBorder(Border.NO_BORDER)
                    .setPadding(10)
                    .setTextAlignment(TextAlignment.RIGHT);

            companyInfoTable.addCell(companyInfo);
            companyInfoTable.addCell(invoiceDates);
            document.add(companyInfoTable);

            document.add(new Paragraph("\n"));

            // ===== FINANCIAL SUMMARY TABLE =====
            Table summaryTable = new Table(new float[] { 1, 1 }).setWidth(UnitValue.createPercentValue(100));
            summaryTable.setBackgroundColor(lightGray);

            // Donation Amount
            Cell donationLabelCell = new Cell()
                    .add(new Paragraph("Donation Amount")
                            .setBold()
                            .setFontSize(11))
                    .setBorder(new SolidBorder(lightGray, 1))
                    .setPadding(12)
                    .setBackgroundColor(lightGray);

            Cell donationValueCell = new Cell()
                    .add(new Paragraph("CAD $" + valueOrFallback(paymentAmount, "0.00"))
                            .setBold()
                            .setFontSize(12)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(new SolidBorder(lightGray, 1))
                    .setPadding(12)
                    .setBackgroundColor(lightGray);

            summaryTable.addCell(donationLabelCell);
            summaryTable.addCell(donationValueCell);

            // Refunded Amount (if any)
            if (refundedAmount != null && !refundedAmount.equals("0.00")) {
                Cell refundLabelCell = new Cell()
                        .add(new Paragraph("Refunded Amount")
                                .setBold()
                                .setFontSize(11))
                        .setBorder(new SolidBorder(lightGray, 1))
                        .setPadding(12)
                        .setBackgroundColor(lightGray);

                Cell refundValueCell = new Cell()
                        .add(new Paragraph("- CAD $" + refundedAmount)
                                .setFontSize(11)
                                .setTextAlignment(TextAlignment.RIGHT)
                                .setFontColor(accentColor))
                        .setBorder(new SolidBorder(lightGray, 1))
                        .setPadding(12)
                        .setBackgroundColor(lightGray);

                summaryTable.addCell(refundLabelCell);
                summaryTable.addCell(refundValueCell);
            }

            // Net Amount
            Cell netLabelCell = new Cell()
                    .add(new Paragraph("Net Amount")
                            .setBold()
                            .setFontSize(12)
                            .setFontColor(ColorConstants.WHITE))
                    .setBorder(new SolidBorder(primaryColor, 1))
                    .setPadding(14)
                    .setBackgroundColor(primaryColor);

            Cell netValueCell = new Cell()
                    .add(new Paragraph("CAD $" + valueOrFallback(netAmount, "0.00"))
                            .setBold()
                            .setFontSize(13)
                            .setTextAlignment(TextAlignment.RIGHT)
                            .setFontColor(ColorConstants.WHITE))
                    .setBorder(new SolidBorder(primaryColor, 1))
                    .setPadding(14)
                    .setBackgroundColor(primaryColor);

            summaryTable.addCell(netLabelCell);
            summaryTable.addCell(netValueCell);

            document.add(summaryTable);

            document.add(new Paragraph("\n"));

            // ===== FOOTER SECTION =====
            Table footerTable = new Table(new float[] { 1 }).setWidth(UnitValue.createPercentValue(100));

            Cell footerCell = new Cell()
                    .add(new Paragraph("Thank You for Your Donation!")
                            .setBold()
                            .setFontSize(11)
                            .setFontColor(primaryColor)
                            .setTextAlignment(TextAlignment.CENTER))
                    .add(new Paragraph("Your contribution helps fight food waste and food insecurity in our community.")
                            .setFontSize(10)
                            .setTextAlignment(TextAlignment.CENTER)
                            .setMarginTop(6))
                    .add(new Paragraph("\n"))
                    .add(new Paragraph(
                            "For questions or support, contact us:\nEmail: foodflow.group@gmail.com | Web: foodflow-app.com")
                            .setFontSize(9)
                            .setFontColor(darkGray)
                            .setTextAlignment(TextAlignment.CENTER))
                    .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1))
                    .setPadding(15)
                    .setBackgroundColor(lightGray);

            footerTable.addCell(footerCell);
            document.add(footerTable);

            // Legal notice
            document.add(new Paragraph("\n"));
            document.add(new Paragraph(
                    "This is an automated receipt. FoodFlow is a registered non-profit helping to redistribute surplus food.")
                    .setFontSize(8)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER));

            document.close();

            return outputStream.toByteArray();
        } catch (Exception exception) {
            log.error("Failed to generate invoice PDF", exception);
            throw new RuntimeException("Failed to generate invoice PDF", exception);
        }
    }

    private Paragraph createSectionTitle(String title, DeviceRgb color) {
        return new Paragraph(title.toUpperCase())
                .setBold()
                .setFontSize(10)
                .setFontColor(color)
                .setMarginBottom(6);
    }

    private String formatDate(LocalDate date) {
        if (date == null)
            return "N/A";
        return date.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"));
    }

    private String formatStatus(String status) {
        if (status == null)
            return "UNKNOWN";
        return status.charAt(0) + status.substring(1).toLowerCase();
    }

    private DeviceRgb getStatusColor(String status) {
        if (status == null)
            return new DeviceRgb(128, 128, 128); // gray
        return switch (status.toUpperCase()) {
            case "PAID" -> new DeviceRgb(62, 180, 205); // teal
            case "PENDING" -> new DeviceRgb(230, 126, 34); // orange
            case "VOID" -> new DeviceRgb(128, 128, 128); // gray
            default -> new DeviceRgb(128, 128, 128); // gray
        };
    }

    private static class UnitValue {
        static com.itextpdf.layout.properties.UnitValue createPercentValue(float percent) {
            return com.itextpdf.layout.properties.UnitValue.createPercentValue(percent);
        }
    }

    private String valueOrFallback(Object value, String fallback) {
        return value != null ? value.toString() : fallback;
    }

    private Payment getOwnedPayment(Long paymentId, User user) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        verifyOwnership(payment, user);
        return payment;
    }

    private Invoice syncInvoiceFields(Invoice invoice, Payment payment) {
        BigDecimal refundedAmount = calculateApprovedRefundTotal(payment.getId());
        BigDecimal netAmount = payment.getAmount().subtract(refundedAmount).max(BigDecimal.ZERO);

        invoice.setStatus(resolveInvoiceStatus(payment, refundedAmount));
        invoice.setIssuedDate(invoice.getIssuedDate() != null ? invoice.getIssuedDate() : LocalDate.now());
        invoice.setDueDate(invoice.getDueDate() != null ? invoice.getDueDate() : LocalDate.now().plusDays(30));
        invoice.setSubtotalAmount(payment.getAmount());
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setTotalAmount(netAmount);
        return invoice;
    }

    private BigDecimal calculateApprovedRefundTotal(Long paymentId) {
        return refundRepository.findByPaymentId(paymentId).stream()
                .filter(refund -> refund.getStatus() == RefundStatus.PROCESSING
                        || refund.getStatus() == RefundStatus.SUCCEEDED)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private InvoiceStatus resolveInvoiceStatus(Payment payment, BigDecimal refundedAmount) {
        if (refundedAmount.compareTo(payment.getAmount()) >= 0) {
            return InvoiceStatus.VOID;
        }
        if (payment.getStatus() == PaymentStatus.SUCCEEDED || payment.getStatus() == PaymentStatus.REFUNDED) {
            return InvoiceStatus.PAID;
        }
        return InvoiceStatus.DRAFT;
    }

    private void verifyOwnership(Payment payment, User user) {
        if (!payment.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to invoice");
        }
    }

    private InvoiceResponse toInvoiceResponse(Invoice invoice) {
        BigDecimal refundedAmount = calculateApprovedRefundTotal(invoice.getPayment().getId());
        BigDecimal netAmount = invoice.getSubtotalAmount() != null
                ? invoice.getSubtotalAmount().subtract(refundedAmount).max(BigDecimal.ZERO)
                : invoice.getTotalAmount();
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .paymentId(invoice.getPayment().getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .pdfUrl(invoice.getPdfUrl())
                .status(invoice.getStatus())
                .dueDate(invoice.getDueDate())
                .issuedDate(invoice.getIssuedDate())
                .totalAmount(invoice.getTotalAmount())
                .refundedAmount(refundedAmount)
                .netAmount(netAmount)
                .taxAmount(invoice.getTaxAmount())
                .subtotalAmount(invoice.getSubtotalAmount())
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
