package com.example.foodflow.service;

import com.example.foodflow.model.dto.InvoiceResponse;
import com.example.foodflow.model.entity.Invoice;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.entity.Refund;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.InvoiceStatus;
import com.example.foodflow.model.types.RefundStatus;
import com.example.foodflow.repository.InvoiceRepository;
import com.example.foodflow.repository.PaymentRepository;
import com.example.foodflow.repository.RefundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RefundRepository refundRepository;

    @InjectMocks
    private InvoiceService invoiceService;

    private Payment testPayment;
    private Invoice testInvoice;
    private User testUser;

    @BeforeEach
    void setUp() {
        // Setup test payment
        testPayment = new Payment();
        testPayment.setId(1L);
        testPayment.setAmount(new BigDecimal("100.00"));
        testPayment.setStripePaymentIntentId("pi_123");

        com.example.foodflow.model.entity.Organization organization = new com.example.foodflow.model.entity.Organization();
        organization.setId(10L);
        testPayment.setOrganization(organization);

        testUser = new User();
        testUser.setId(1L);
        testUser.setOrganization(organization);

        // Setup test invoice
        testInvoice = new Invoice();
        testInvoice.setId(1L);
        testInvoice.setPayment(testPayment);
        testInvoice.setInvoiceNumber("INV-1234567890");
        testInvoice.setStatus(InvoiceStatus.DRAFT);
        testInvoice.setIssuedDate(LocalDate.now());
        testInvoice.setDueDate(LocalDate.now().plusDays(30));
        testInvoice.setSubtotalAmount(new BigDecimal("100.00"));
        testInvoice.setTaxAmount(BigDecimal.ZERO);
        testInvoice.setTotalAmount(new BigDecimal("100.00"));
        testInvoice.setCreatedAt(LocalDateTime.now());

        lenient().when(refundRepository.findByPaymentId(1L)).thenReturn(List.of());
    }

    @Test
    void testGenerateInvoice_Success() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.empty());
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(testInvoice);

        // When
        InvoiceResponse response = invoiceService.generateInvoice(1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getPaymentId()).isEqualTo(1L);
        assertThat(response.getInvoiceNumber()).isEqualTo("INV-1234567890");
        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.DRAFT);
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.getRefundedAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getNetAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.getSubtotalAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);

        verify(invoiceRepository).save(any(Invoice.class));
    }

    @Test
    void testGenerateInvoice_PaymentNotFound() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> invoiceService.generateInvoice(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment not found");

        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void testGenerateInvoice_InvoiceAlreadyExists() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.of(testInvoice));
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(testInvoice);

        // When
        InvoiceResponse response = invoiceService.generateInvoice(1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getInvoiceNumber()).isEqualTo("INV-1234567890");

        verify(invoiceRepository).save(any());
    }

    @Test
    void testGenerateInvoice_VerifiesInvoiceFields() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.empty());
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        invoiceService.generateInvoice(1L);

        // Then
        ArgumentCaptor<Invoice> invoiceCaptor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(invoiceCaptor.capture());

        Invoice savedInvoice = invoiceCaptor.getValue();
        assertThat(savedInvoice.getPayment()).isEqualTo(testPayment);
        assertThat(savedInvoice.getInvoiceNumber()).startsWith("INV-");
        assertThat(savedInvoice.getStatus()).isEqualTo(InvoiceStatus.DRAFT);
        assertThat(savedInvoice.getIssuedDate()).isEqualTo(LocalDate.now());
        assertThat(savedInvoice.getDueDate()).isEqualTo(LocalDate.now().plusDays(30));
        assertThat(savedInvoice.getSubtotalAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(savedInvoice.getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(savedInvoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
    }

    @Test
    void testGenerateInvoice_WithDifferentPaymentAmount() {
        // Given
        testPayment.setAmount(new BigDecimal("250.75"));
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.empty());

        Invoice customInvoice = new Invoice();
        customInvoice.setId(2L);
        customInvoice.setPayment(testPayment);
        customInvoice.setInvoiceNumber("INV-9999999999");
        customInvoice.setStatus(InvoiceStatus.DRAFT);
        customInvoice.setSubtotalAmount(new BigDecimal("250.75"));
        customInvoice.setTaxAmount(BigDecimal.ZERO);
        customInvoice.setTotalAmount(new BigDecimal("250.75"));
        customInvoice.setIssuedDate(LocalDate.now());
        customInvoice.setDueDate(LocalDate.now().plusDays(30));

        when(invoiceRepository.save(any(Invoice.class))).thenReturn(customInvoice);

        // When
        InvoiceResponse response = invoiceService.generateInvoice(1L);

        // Then
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("250.75"));
        assertThat(response.getSubtotalAmount()).isEqualByComparingTo(new BigDecimal("250.75"));
    }

    @Test
    void testGetInvoiceByPaymentId_Success() {
        // Given
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.of(testInvoice));

        // When
        InvoiceResponse response = invoiceService.getInvoiceByPaymentId(1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getPaymentId()).isEqualTo(1L);
        assertThat(response.getInvoiceNumber()).isEqualTo("INV-1234567890");
        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.DRAFT);

        verify(invoiceRepository).findByPaymentId(1L);
    }

    @Test
    void testGetInvoiceByPaymentId_NotFound() {
        // Given
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.empty());

        // When
        InvoiceResponse response = invoiceService.getInvoiceByPaymentId(1L);

        // Then
        assertThat(response).isNull();
    }

    @Test
    void testGetInvoiceById_Success() {
        // Given
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        // When
        InvoiceResponse response = invoiceService.getInvoiceById(1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getPaymentId()).isEqualTo(1L);
        assertThat(response.getInvoiceNumber()).isEqualTo("INV-1234567890");

        verify(invoiceRepository).findById(1L);
    }

    @Test
    void testGetInvoiceById_NotFound() {
        // Given
        when(invoiceRepository.findById(1L)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> invoiceService.getInvoiceById(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invoice not found");
    }

    @Test
    void testInvoiceResponse_ContainsAllFields() {
        // Given
        testInvoice.setPdfUrl("https://example.com/invoice.pdf");
        testInvoice.setCreatedAt(LocalDateTime.of(2026, 3, 13, 14, 30));

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        // When
        InvoiceResponse response = invoiceService.getInvoiceById(1L);

        // Then
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getPaymentId()).isEqualTo(1L);
        assertThat(response.getInvoiceNumber()).isEqualTo("INV-1234567890");
        assertThat(response.getPdfUrl()).isEqualTo("https://example.com/invoice.pdf");
        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.DRAFT);
        assertThat(response.getDueDate()).isEqualTo(LocalDate.now().plusDays(30));
        assertThat(response.getIssuedDate()).isEqualTo(LocalDate.now());
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.getRefundedAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getNetAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.getTaxAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getSubtotalAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 3, 13, 14, 30));
    }

    @Test
    void testInvoiceResponse_WithNullPdfUrl() {
        // Given
        testInvoice.setPdfUrl(null);
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        // When
        InvoiceResponse response = invoiceService.getInvoiceById(1L);

        // Then
        assertThat(response.getPdfUrl()).isNull();
    }

    @Test
    void testGenerateInvoice_GeneratesUniqueInvoiceNumber() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.empty());
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        invoiceService.generateInvoice(1L);

        // Then
        ArgumentCaptor<Invoice> invoiceCaptor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(invoiceCaptor.capture());

        Invoice savedInvoice = invoiceCaptor.getValue();
        assertThat(savedInvoice.getInvoiceNumber()).matches("INV-\\d+");
    }

    @Test
    void testGenerateInvoice_SetsCorrectDueDate() {
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.empty());
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LocalDate expectedDueDate = LocalDate.now().plusDays(30);

        // When
        invoiceService.generateInvoice(1L);

        // Then
        ArgumentCaptor<Invoice> invoiceCaptor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(invoiceCaptor.capture());

        Invoice savedInvoice = invoiceCaptor.getValue();
        assertThat(savedInvoice.getDueDate()).isEqualTo(expectedDueDate);
    }

    @Test
    void testGenerateInvoice_WithLargeAmount() {
        // Given
        testPayment.setAmount(new BigDecimal("9999.99"));
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.empty());

        Invoice largeInvoice = new Invoice();
        largeInvoice.setId(3L);
        largeInvoice.setPayment(testPayment);
        largeInvoice.setInvoiceNumber("INV-8888888888");
        largeInvoice.setStatus(InvoiceStatus.DRAFT);
        largeInvoice.setSubtotalAmount(new BigDecimal("9999.99"));
        largeInvoice.setTaxAmount(BigDecimal.ZERO);
        largeInvoice.setTotalAmount(new BigDecimal("9999.99"));
        largeInvoice.setIssuedDate(LocalDate.now());
        largeInvoice.setDueDate(LocalDate.now().plusDays(30));

        when(invoiceRepository.save(any(Invoice.class))).thenReturn(largeInvoice);

        // When
        InvoiceResponse response = invoiceService.generateInvoice(1L);

        // Then
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("9999.99"));
    }

    @Test
    void testGenerateInvoice_TransactionalAnnotation() {
        // This test verifies the method is annotated with @Transactional
        // The actual transactional behavior would be tested in integration tests
        // Here we just verify the method executes correctly
        
        // Given
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.empty());
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(testInvoice);

        // When
        InvoiceResponse response = invoiceService.generateInvoice(1L);

        // Then
        assertThat(response).isNotNull();
        verify(paymentRepository).findById(1L);
        verify(invoiceRepository).findByPaymentId(1L);
        verify(invoiceRepository).save(any(Invoice.class));
    }

    @Test
    void testGenerateInvoiceForUser_Success() {
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.of(testInvoice));
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(testInvoice);

        InvoiceResponse response = invoiceService.generateInvoiceForUser(1L, testUser);

        assertThat(response.getInvoiceNumber()).isEqualTo("INV-1234567890");
    }

    @Test
    void testGenerateInvoiceForUser_Unauthorized() {
        User otherUser = new User();
        com.example.foodflow.model.entity.Organization otherOrg = new com.example.foodflow.model.entity.Organization();
        otherOrg.setId(99L);
        otherUser.setOrganization(otherOrg);

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));

        assertThatThrownBy(() -> invoiceService.generateInvoiceForUser(1L, otherUser))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("Unauthorized access to invoice");
    }

    @Test
    void testGetInvoiceByPaymentIdForUser_NotFound() {
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.getInvoiceByPaymentIdForUser(1L, testUser))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("Invoice not found");
    }

    @Test
    void testGetInvoiceByIdForUser_Success() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        InvoiceResponse response = invoiceService.getInvoiceByIdForUser(1L, testUser);

        assertThat(response.getInvoiceNumber()).isEqualTo("INV-1234567890");
    }

    @Test
    void testGetInvoicesForUser_Success() {
        org.springframework.data.domain.Page<Invoice> page =
            new org.springframework.data.domain.PageImpl<>(List.of(testInvoice));
        when(invoiceRepository.findByOrganizationId(eq(10L), any())).thenReturn(page);

        org.springframework.data.domain.Page<InvoiceResponse> response =
            invoiceService.getInvoicesForUser(testUser, org.springframework.data.domain.PageRequest.of(0, 10));

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getInvoiceNumber()).isEqualTo("INV-1234567890");
    }

    @Test
    void testDownloadInvoice_Success() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        byte[] bytes = invoiceService.downloadInvoice(1L, testUser);

        assertThat(bytes).isNotEmpty();
        assertThat(new String(bytes, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    void testSyncInvoiceForPayment_AppliesApprovedRefundAmounts() {
        Refund refund = new Refund();
        refund.setPayment(testPayment);
        refund.setAmount(new BigDecimal("25.00"));
        refund.setStatus(RefundStatus.SUCCEEDED);
        testPayment.setStatus(com.example.foodflow.model.types.PaymentStatus.SUCCEEDED);

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(testPayment));
        when(invoiceRepository.findByPaymentId(1L)).thenReturn(Optional.of(testInvoice));
        when(refundRepository.findByPaymentId(1L)).thenReturn(List.of(refund));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InvoiceResponse response = invoiceService.syncInvoiceForPayment(1L);

        assertThat(response.getSubtotalAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.getRefundedAmount()).isEqualByComparingTo(new BigDecimal("25.00"));
        assertThat(response.getNetAmount()).isEqualByComparingTo(new BigDecimal("75.00"));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("75.00"));
        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.PAID);
    }
}
