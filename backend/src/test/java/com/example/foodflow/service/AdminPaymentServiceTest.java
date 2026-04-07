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
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.PaymentType;
import com.example.foodflow.model.types.RefundStatus;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.RefundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminPaymentService Tests")
class AdminPaymentServiceTest {
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private RefundRepository refundRepository;
    @Mock
    private RefundService refundService;
    @Mock
    private InvoiceService invoiceService;
    @InjectMocks
    private AdminPaymentService adminPaymentService;
    private User adminUser;
    private Organization organization;
    private Payment payment;
    private Refund refund;
    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@example.com");
        organization = new Organization();
        organization.setId(1L);
        organization.setName("Test Organization");
        organization.setUser(adminUser);
        payment = new Payment();
        payment.setId(1L);
        payment.setAmount(BigDecimal.valueOf(100.00));
        payment.setCurrency("USD");
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setPaymentType(PaymentType.ONE_TIME);
        payment.setOrganization(organization);
        payment.setStripePaymentIntentId("pi_test123");
        payment.setDescription("Test Payment");
        payment.setCreatedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());
        refund = new Refund();
        refund.setId(1L);
        refund.setPayment(payment);
        refund.setAmount(BigDecimal.valueOf(50.00));
        refund.setStatus(RefundStatus.SUCCEEDED);
        refund.setCreatedAt(LocalDateTime.now());
    }
    @Test
    @DisplayName("Should get transactions with pagination")
    void getTransactionsWithPagination() {
        List<Payment> payments = List.of(payment);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(new ArrayList<>());
        when(invoiceService.getInvoiceByPaymentId(1L)).thenReturn(null);
        Page<AdminPaymentTransactionResponse> result = adminPaymentService.getTransactions(
                null, null, null, null, null, null, 0, 10);
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(paymentRepository).findAll(any(Sort.class));
    }
    @Test
    @DisplayName("Should filter transactions by status")
    void getTransactionsFilteredByStatus() {
        List<Payment> payments = List.of(payment);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(new ArrayList<>());
        when(invoiceService.getInvoiceByPaymentId(1L)).thenReturn(null);
        Page<AdminPaymentTransactionResponse> result = adminPaymentService.getTransactions(
                "SUCCEEDED", null, null, null, null, null, 0, 10);
        assertThat(result.getContent()).hasSize(1);
    }
    @Test
    @DisplayName("Should filter transactions by currency")
    void getTransactionsFilteredByCurrency() {
        List<Payment> payments = List.of(payment);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(new ArrayList<>());
        when(invoiceService.getInvoiceByPaymentId(1L)).thenReturn(null);
        Page<AdminPaymentTransactionResponse> result = adminPaymentService.getTransactions(
                null, null, "USD", null, null, null, 0, 10);
        assertThat(result.getContent()).hasSize(1);
    }
    @Test
    @DisplayName("Should filter transactions by date range")
    void getTransactionsFilteredByDateRange() {
        List<Payment> payments = List.of(payment);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(new ArrayList<>());
        when(invoiceService.getInvoiceByPaymentId(1L)).thenReturn(null);
        LocalDate today = LocalDate.now();
        Page<AdminPaymentTransactionResponse> result = adminPaymentService.getTransactions(
                null, null, null, null, today.minusDays(10), today.plusDays(10), 0, 10);
        assertThat(result.getContent()).hasSize(1);
    }
    @Test
    @DisplayName("Should search transactions by ID")
    void getTransactionsSearchById() {
        List<Payment> payments = List.of(payment);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(new ArrayList<>());
        when(invoiceService.getInvoiceByPaymentId(1L)).thenReturn(null);
        Page<AdminPaymentTransactionResponse> result = adminPaymentService.getTransactions(
                null, null, null, "1", null, null, 0, 10);
        assertThat(result.getContent()).hasSize(1);
    }
    @Test
    @DisplayName("Should search transactions by organization name")
    void getTransactionsSearchByOrgName() {
        List<Payment> payments = List.of(payment);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(new ArrayList<>());
        when(invoiceService.getInvoiceByPaymentId(1L)).thenReturn(null);
        Page<AdminPaymentTransactionResponse> result = adminPaymentService.getTransactions(
                null, null, null, "Test Organization", null, null, 0, 10);
        assertThat(result.getContent()).hasSize(1);
    }
    @Test
    @DisplayName("Should get payment summary")
    void getSummary() {
        List<Payment> payments = List.of(payment);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of(refund));
        AdminPaymentSummaryResponse result = adminPaymentService.getSummary(
                null, null, null, null, null, null);
        assertThat(result).isNotNull();
        assertThat(result.getTotalTransactions()).isEqualTo(1);
        assertThat(result.getTotalVolume()).isEqualTo(BigDecimal.valueOf(100.00));
    }
    @Test
    @DisplayName("Should calculate refunded volume in summary")
    void getSummarywithRefundedVolume() {
        List<Payment> payments = List.of(payment);
        Refund processingRefund = new Refund();
        processingRefund.setId(2L);
        processingRefund.setPayment(payment);
        processingRefund.setAmount(BigDecimal.valueOf(25.00));
        processingRefund.setStatus(RefundStatus.PROCESSING);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of(refund, processingRefund));
        AdminPaymentSummaryResponse result = adminPaymentService.getSummary(
                null, null, null, null, null, null);
        assertThat(result.getRefundedVolume()).isEqualTo(BigDecimal.valueOf(75.00));
        assertThat(result.getNetVolume()).isEqualTo(BigDecimal.valueOf(25.00));
    }
    @Test
    @DisplayName("Should approve refund")
    void approveRefund() {
        RefundResponse refundResponse = RefundResponse.builder()
                .id(1L)
                .status(RefundStatus.SUCCEEDED)
                .build();
        when(refundService.approveRefund(1L, adminUser, "Approved"))
                .thenReturn(refundResponse);
        RefundResponse result = adminPaymentService.approveRefund(1L, adminUser, "Approved");
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(RefundStatus.SUCCEEDED);
        verify(refundService).approveRefund(1L, adminUser, "Approved");
    }
    @Test
    @DisplayName("Should reject refund")
    void rejectRefund() {
        RefundResponse refundResponse = RefundResponse.builder()
                .id(1L)
                .status(RefundStatus.FAILED)
                .build();
        when(refundService.rejectRefund(1L, adminUser, "Rejected"))
                .thenReturn(refundResponse);
        RefundResponse result = adminPaymentService.rejectRefund(1L, adminUser, "Rejected");
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(RefundStatus.FAILED);
        verify(refundService).rejectRefund(1L, adminUser, "Rejected");
    }
    @Test
    @DisplayName("Should create refund request")
    void createRefundRequest() {
        RefundRequest request = new RefundRequest();
        request.setPaymentId(1L);
        request.setAmount(BigDecimal.valueOf(50.00));
        RefundResponse refundResponse = RefundResponse.builder()
                .id(1L)
                .amount(BigDecimal.valueOf(50.00))
                .status(RefundStatus.PENDING)
                .build();
        when(refundService.createRefundRequestAsAdmin(request, adminUser))
                .thenReturn(refundResponse);
        RefundResponse result = adminPaymentService.createRefundRequest(request, adminUser);
        assertThat(result).isNotNull();
        assertThat(result.getAmount()).isEqualTo(BigDecimal.valueOf(50.00));
        verify(refundService).createRefundRequestAsAdmin(request, adminUser);
    }
    @Test
    @DisplayName("Should handle refund status filter")
    void getTransactionsWithRefundStatusFilter() {
        List<Payment> payments = List.of(payment);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of(refund));
        when(invoiceService.getInvoiceByPaymentId(1L)).thenReturn(null);
        Page<AdminPaymentTransactionResponse> result = adminPaymentService.getTransactions(
                null, "SUCCEEDED", null, null, null, null, 0, 10);
        assertThat(result.getContent()).hasSize(1);
    }
    @Test
    @DisplayName("Should handle pagination with empty results")
    void getTransactionsWithEmptyResults() {
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(new ArrayList<>());
        Page<AdminPaymentTransactionResponse> result = adminPaymentService.getTransactions(
                null, null, null, null, null, null, 0, 10);
        assertThat(result.getContent()).isEmpty();
    }
    @Test
    @DisplayName("Should exclude pending refunds from refunded volume")
    void getSummaryExcludesPendingRefunds() {
        List<Payment> payments = List.of(payment);
        Refund pendingRefund = new Refund();
        pendingRefund.setId(2L);
        pendingRefund.setPayment(payment);
        pendingRefund.setAmount(BigDecimal.valueOf(25.00));
        pendingRefund.setStatus(RefundStatus.PENDING);
        when(paymentRepository.findAll(any(Sort.class))).thenReturn(payments);
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of(pendingRefund));
        AdminPaymentSummaryResponse result = adminPaymentService.getSummary(
                null, null, null, null, null, null);
        // Pending refunds should not be included in refundedVolume
        assertThat(result.getRefundedVolume()).isEqualTo(BigDecimal.ZERO);
    }
}
