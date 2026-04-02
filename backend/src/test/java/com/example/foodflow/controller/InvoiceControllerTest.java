package com.example.foodflow.controller;

import com.example.foodflow.model.dto.InvoiceResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.InvoiceStatus;
import com.example.foodflow.service.InvoiceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InvoiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InvoiceService invoiceService;

    private UsernamePasswordAuthenticationToken authentication;

    @BeforeEach
    void setUp() {
        User testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.DONOR);

        Organization organization = new Organization();
        organization.setId(1L);
        organization.setName("Test Org");
        testUser.setOrganization(organization);

        authentication = new UsernamePasswordAuthenticationToken(
            testUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority(UserRole.DONOR.name()))
        );
    }

    @Test
    void generateInvoice_Success() throws Exception {
        InvoiceResponse response = buildInvoiceResponse();
        when(invoiceService.generateInvoiceForUser(eq(1L), any(User.class))).thenReturn(response);

        mockMvc.perform(post("/api/payments/1/invoice").with(authentication(authentication)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.invoiceNumber").value("INV-100"))
            .andExpect(jsonPath("$.paymentId").value(1));
    }

    @Test
    void getInvoiceForPayment_Success() throws Exception {
        InvoiceResponse response = buildInvoiceResponse();
        when(invoiceService.getInvoiceByPaymentIdForUser(eq(1L), any(User.class))).thenReturn(response);

        mockMvc.perform(get("/api/payments/1/invoice").with(authentication(authentication)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.invoiceNumber").value("INV-100"));
    }

    @Test
    void getInvoiceById_Success() throws Exception {
        InvoiceResponse response = buildInvoiceResponse();
        when(invoiceService.getInvoiceByIdForUser(eq(1L), any(User.class))).thenReturn(response);

        mockMvc.perform(get("/api/payments/invoices/1").with(authentication(authentication)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.invoiceNumber").value("INV-100"));
    }

    @Test
    void listInvoices_Success() throws Exception {
        Page<InvoiceResponse> page = new PageImpl<>(List.of(buildInvoiceResponse()));
        when(invoiceService.getInvoicesForUser(any(User.class), any())).thenReturn(page);

        mockMvc.perform(get("/api/payments/invoices").with(authentication(authentication)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].invoiceNumber").value("INV-100"));
    }

    @Test
    void downloadInvoice_Success() throws Exception {
        InvoiceResponse response = buildInvoiceResponse();
        when(invoiceService.getInvoiceByIdForUser(eq(1L), any(User.class))).thenReturn(response);
        when(invoiceService.downloadInvoice(eq(1L), any(User.class))).thenReturn("%PDF-test".getBytes());

        mockMvc.perform(get("/api/payments/invoices/1/download").with(authentication(authentication)))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/pdf"))
            .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("INV-100.pdf")))
            .andExpect(content().bytes("%PDF-test".getBytes()));
    }

    private InvoiceResponse buildInvoiceResponse() {
        return InvoiceResponse.builder()
            .id(1L)
            .paymentId(1L)
            .invoiceNumber("INV-100")
            .status(InvoiceStatus.DRAFT)
            .issuedDate(LocalDate.of(2026, 1, 1))
            .dueDate(LocalDate.of(2026, 1, 31))
            .subtotalAmount(new BigDecimal("25.00"))
            .taxAmount(BigDecimal.ZERO)
            .totalAmount(new BigDecimal("25.00"))
            .build();
    }
}
