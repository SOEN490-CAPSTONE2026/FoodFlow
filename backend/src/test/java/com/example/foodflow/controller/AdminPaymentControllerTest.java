package com.example.foodflow.controller;
import com.example.foodflow.model.dto.AdminPaymentSummaryResponse;
import com.example.foodflow.model.dto.AdminPaymentTransactionResponse;
import com.example.foodflow.model.dto.RefundRequest;
import com.example.foodflow.model.dto.RefundResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.PaymentType;
import com.example.foodflow.model.types.RefundStatus;
import com.example.foodflow.service.AdminPaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminPaymentControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @MockBean
    private AdminPaymentService adminPaymentService;
    private UsernamePasswordAuthenticationToken authentication;
    @BeforeEach
    void setUp() {
        User admin = new User();
        admin.setId(1L);
        admin.setEmail("admin@example.com");
        admin.setRole(UserRole.ADMIN);
        Organization organization = new Organization();
        organization.setId(1L);
        organization.setName("FoodFlow HQ");
        admin.setOrganization(organization);
        authentication = new UsernamePasswordAuthenticationToken(
            admin,
            null,
            Collections.singletonList(new SimpleGrantedAuthority(UserRole.ADMIN.name()))
        );
    }
    @Test
    void getTransactions_Success() throws Exception {
        AdminPaymentTransactionResponse transaction = AdminPaymentTransactionResponse.builder()
            .id(1L)
            .organizationName("Helping Hands")
            .amount(BigDecimal.valueOf(40))
            .currency("USD")
            .status(PaymentStatus.SUCCEEDED)
            .paymentType(PaymentType.ONE_TIME)
            .pendingRefundCount(1)
            .build();
        Page<AdminPaymentTransactionResponse> page = new PageImpl<>(List.of(transaction));
        when(adminPaymentService.getTransactions(any(), any(), any(), any(), any(), any(), eq(0), eq(20)))
            .thenReturn(page);
        mockMvc.perform(get("/api/admin/payments").with(authentication(authentication)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(1))
            .andExpect(jsonPath("$.content[0].organizationName").value("Helping Hands"))
            .andExpect(jsonPath("$.content[0].pendingRefundCount").value(1));
    }
    @Test
    void getSummary_Success() throws Exception {
        AdminPaymentSummaryResponse summary = AdminPaymentSummaryResponse.builder()
            .totalTransactions(4)
            .successfulTransactions(3)
            .refundedTransactions(1)
            .pendingRefundRequests(2)
            .totalVolume(BigDecimal.valueOf(120))
            .refundedVolume(BigDecimal.valueOf(20))
            .netVolume(BigDecimal.valueOf(100))
            .build();
        when(adminPaymentService.getSummary(any(), any(), any(), any(), any(), any())).thenReturn(summary);
        mockMvc.perform(get("/api/admin/payments/summary").with(authentication(authentication)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalTransactions").value(4))
            .andExpect(jsonPath("$.pendingRefundRequests").value(2))
            .andExpect(jsonPath("$.netVolume").value(100));
    }
    @Test
    void approveRefund_Success() throws Exception {
        RefundResponse refund = RefundResponse.builder()
            .id(8L)
            .paymentId(4L)
            .amount(BigDecimal.valueOf(12))
            .status(RefundStatus.SUCCEEDED)
            .adminNotes("Approved")
            .build();
        when(adminPaymentService.approveRefund(eq(8L), any(User.class), eq("Approved")))
            .thenReturn(refund);
        mockMvc.perform(post("/api/admin/payments/refunds/8/approve")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Collections.singletonMap("adminNotes", "Approved"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SUCCEEDED"))
            .andExpect(jsonPath("$.adminNotes").value("Approved"));
    }
    @Test
    void rejectRefund_Success() throws Exception {
        RefundResponse refund = RefundResponse.builder()
            .id(9L)
            .paymentId(4L)
            .amount(BigDecimal.valueOf(12))
            .status(RefundStatus.CANCELED)
            .adminNotes("Rejected")
            .build();
        when(adminPaymentService.rejectRefund(eq(9L), any(User.class), eq("Rejected")))
            .thenReturn(refund);
        mockMvc.perform(post("/api/admin/payments/refunds/9/reject")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Collections.singletonMap("adminNotes", "Rejected"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELED"))
            .andExpect(jsonPath("$.adminNotes").value("Rejected"));
    }
    @Test
    void createRefundRequest_Success() throws Exception {
        RefundResponse refund = RefundResponse.builder()
            .id(10L)
            .paymentId(4L)
            .amount(BigDecimal.valueOf(18))
            .status(RefundStatus.PENDING)
            .reason("Customer support adjustment")
            .build();
        when(adminPaymentService.createRefundRequest(any(RefundRequest.class), any(User.class)))
            .thenReturn(refund);
        mockMvc.perform(post("/api/admin/payments/4/refund-requests")
                .with(authentication(authentication))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    java.util.Map.of("amount", BigDecimal.valueOf(18), "reason", "Customer support adjustment")
                )))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.paymentId").value(4))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.reason").value("Customer support adjustment"));
    }
}
