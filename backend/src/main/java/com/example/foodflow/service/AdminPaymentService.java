package com.example.foodflow.service;
import com.example.foodflow.model.dto.AdminPaymentSummaryResponse;
import com.example.foodflow.model.dto.AdminPaymentTransactionResponse;
import com.example.foodflow.model.dto.InvoiceResponse;
import com.example.foodflow.model.dto.RefundRequest;
import com.example.foodflow.model.dto.RefundResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.Refund;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.RefundStatus;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.RefundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
@Service
@RequiredArgsConstructor
public class AdminPaymentService {
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final RefundService refundService;
    private final InvoiceService invoiceService;
    @Transactional(readOnly = true)
    public Page<AdminPaymentTransactionResponse> getTransactions(
        String status,
        String refundStatus,
        String currency,
        String search,
        LocalDate fromDate,
        LocalDate toDate,
        int page,
        int size
    ) {
        List<Payment> filteredPayments = getFilteredPayments(status, refundStatus, currency, search, fromDate, toDate);
        Pageable pageable = PageRequest.of(page, size);
        int start = Math.min((int) pageable.getOffset(), filteredPayments.size());
        int end = Math.min(start + pageable.getPageSize(), filteredPayments.size());
        List<AdminPaymentTransactionResponse> content = filteredPayments.subList(start, end).stream()
            .map(this::toTransactionResponse)
            .toList();
        return new PageImpl<>(content, pageable, filteredPayments.size());
    }
    @Transactional(readOnly = true)
    public AdminPaymentSummaryResponse getSummary(
        String status,
        String refundStatus,
        String currency,
        String search,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        List<Payment> filteredPayments = getFilteredPayments(status, refundStatus, currency, search, fromDate, toDate);
        BigDecimal totalVolume = filteredPayments.stream()
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal refundedVolume = filteredPayments.stream()
            .map(this::getRefundedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return AdminPaymentSummaryResponse.builder()
            .totalTransactions(filteredPayments.size())
            .successfulTransactions(filteredPayments.stream().filter(payment -> payment.getStatus() == com.example.foodflow.model.types.PaymentStatus.SUCCEEDED).count())
            .refundedTransactions(filteredPayments.stream().filter(payment -> getRefundedAmount(payment).compareTo(BigDecimal.ZERO) > 0).count())
            .pendingRefundRequests(filteredPayments.stream().mapToLong(this::getPendingRefundCount).sum())
            .totalVolume(totalVolume)
            .refundedVolume(refundedVolume)
            .netVolume(totalVolume.subtract(refundedVolume).max(BigDecimal.ZERO))
            .build();
    }
    public RefundResponse approveRefund(Long refundId, User adminUser, String adminNotes) {
        return refundService.approveRefund(refundId, adminUser, adminNotes);
    }
    public RefundResponse rejectRefund(Long refundId, User adminUser, String adminNotes) {
        return refundService.rejectRefund(refundId, adminUser, adminNotes);
    }
    public RefundResponse createRefundRequest(RefundRequest request, User adminUser) {
        return refundService.createRefundRequestAsAdmin(request, adminUser);
    }
    private List<Payment> getFilteredPayments(
        String status,
        String refundStatus,
        String currency,
        String search,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        String normalizedSearch = search != null ? search.trim().toLowerCase(Locale.ROOT) : "";
        return paymentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
            .filter(payment -> status == null || status.isBlank() || payment.getStatus().name().equalsIgnoreCase(status))
            .filter(payment -> currency == null || currency.isBlank() || payment.getCurrency().equalsIgnoreCase(currency))
            .filter(payment -> fromDate == null || !payment.getCreatedAt().toLocalDate().isBefore(fromDate))
            .filter(payment -> toDate == null || !payment.getCreatedAt().toLocalDate().isAfter(toDate))
            .filter(payment -> refundMatches(payment, refundStatus))
            .filter(payment -> matchesSearch(payment, normalizedSearch))
            .toList();
    }
    private boolean refundMatches(Payment payment, String refundStatus) {
        if (refundStatus == null || refundStatus.isBlank()) {
            return true;
        }
        return refundRepository.findByPaymentId(payment.getId()).stream()
            .anyMatch(refund -> refund.getStatus().name().equalsIgnoreCase(refundStatus));
    }
    private boolean matchesSearch(Payment payment, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        Organization organization = payment.getOrganization();
        return String.valueOf(payment.getId()).contains(search)
            || (payment.getStripePaymentIntentId() != null && payment.getStripePaymentIntentId().toLowerCase(Locale.ROOT).contains(search))
            || (payment.getDescription() != null && payment.getDescription().toLowerCase(Locale.ROOT).contains(search))
            || (organization != null && organization.getName() != null && organization.getName().toLowerCase(Locale.ROOT).contains(search));
    }
    private AdminPaymentTransactionResponse toTransactionResponse(Payment payment) {
        List<RefundResponse> refunds = refundRepository.findByPaymentIdOrderByCreatedAtDesc(payment.getId()).stream()
            .map(refundService::toRefundResponse)
            .toList();
        InvoiceResponse invoice = invoiceService.getInvoiceByPaymentId(payment.getId());
        BigDecimal refundedAmount = getRefundedAmount(payment);
        return AdminPaymentTransactionResponse.builder()
            .id(payment.getId())
            .organizationId(payment.getOrganization().getId())
            .organizationName(payment.getOrganization().getName())
            .stripePaymentIntentId(payment.getStripePaymentIntentId())
            .amount(payment.getAmount())
            .currency(payment.getCurrency())
            .status(payment.getStatus())
            .paymentType(payment.getPaymentType())
            .description(payment.getDescription())
            .createdAt(payment.getCreatedAt())
            .updatedAt(payment.getUpdatedAt())
            .refundedAmount(refundedAmount)
            .netAmount(payment.getAmount().subtract(refundedAmount).max(BigDecimal.ZERO))
            .pendingRefundCount(getPendingRefundCount(payment))
            .latestRefundStatus(refunds.isEmpty() ? null : refunds.get(0).getStatus())
            .invoiceId(invoice != null ? invoice.getId() : null)
            .invoiceNumber(invoice != null ? invoice.getInvoiceNumber() : null)
            .invoiceStatus(invoice != null ? invoice.getStatus() : null)
            .invoiceTotalAmount(invoice != null ? invoice.getTotalAmount() : null)
            .refunds(refunds)
            .build();
    }
    private BigDecimal getRefundedAmount(Payment payment) {
        return refundRepository.findByPaymentId(payment.getId()).stream()
            .filter(refund -> refund.getStatus() == RefundStatus.PROCESSING || refund.getStatus() == RefundStatus.SUCCEEDED)
            .map(Refund::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    private long getPendingRefundCount(Payment payment) {
        return refundRepository.findByPaymentId(payment.getId()).stream()
            .filter(refund -> refund.getStatus() == RefundStatus.PENDING)
            .count();
    }
}
