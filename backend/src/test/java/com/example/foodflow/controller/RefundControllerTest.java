package com.example.foodflow.controller;
import com.example.foodflow.model.dto.RefundRequest;
import com.example.foodflow.model.dto.RefundResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.RefundStatus;
import com.example.foodflow.service.RefundService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RefundControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @MockBean
    private RefundService refundService;
    private User testUser;
    private Organization testOrganization;
    private UsernamePasswordAuthenticationToken authentication;
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.DONOR);
        testOrganization = new Organization();
        testOrganization.setId(1L);
        testOrganization.setName("Test Org");
        testUser.setOrganization(testOrganization);
        authentication = new UsernamePasswordAuthenticationToken(
            testUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority(UserRole.DONOR.name()))
        );
    }
    @Test
    void processRefund_Success() throws Exception {
        RefundRequest request = new RefundRequest();
        request.setPaymentId(1L);
        request.setAmount(BigDecimal.valueOf(25.00));
        request.setReason("Customer request");
        RefundResponse response = RefundResponse.builder()
                .id(1L)
                .paymentId(1L)
                .amount(BigDecimal.valueOf(25.00))
                .status(RefundStatus.PENDING)
                .reason("Customer request")
                .build();
        when(refundService.processRefund(any(RefundRequest.class), any(User.class)))
                .thenReturn(response);
        mockMvc.perform(post("/api/refunds")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.paymentId").value(1))
                .andExpect(jsonPath("$.amount").value(25.00))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }
    @Test
    void processRefund_PartialRefund() throws Exception {
        RefundRequest request = new RefundRequest();
        request.setPaymentId(1L);
        request.setAmount(BigDecimal.valueOf(10.00));
        request.setReason("Partial refund");
        RefundResponse response = RefundResponse.builder()
                .id(2L)
                .paymentId(1L)
                .amount(BigDecimal.valueOf(10.00))
                .status(RefundStatus.PENDING)
                .reason("Partial refund")
                .build();
        when(refundService.processRefund(any(RefundRequest.class), any(User.class)))
                .thenReturn(response);
        mockMvc.perform(post("/api/refunds")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(10.00));
    }
    @Test
    void getRefundsForPayment_Success() throws Exception {
        RefundResponse refund1 = RefundResponse.builder()
                .id(1L)
                .paymentId(1L)
                .amount(BigDecimal.valueOf(25.00))
                .status(RefundStatus.SUCCEEDED)
                .build();
        RefundResponse refund2 = RefundResponse.builder()
                .id(2L)
                .paymentId(1L)
                .amount(BigDecimal.valueOf(10.00))
                .status(RefundStatus.SUCCEEDED)
                .build();
        when(refundService.getRefundsForPayment(eq(1L), any(User.class)))
                .thenReturn(List.of(refund1, refund2));
        mockMvc.perform(get("/api/refunds/payment/1")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }
    @Test
    void getRefundsForPayment_EmptyList() throws Exception {
        when(refundService.getRefundsForPayment(eq(1L), any(User.class)))
                .thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/refunds/payment/1")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }
    @Test
    void processRefund_Unauthenticated() throws Exception {
        RefundRequest request = new RefundRequest();
        request.setPaymentId(1L);
        request.setAmount(BigDecimal.valueOf(25.00));
        request.setReason("Test");
        mockMvc.perform(post("/api/refunds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
    @Test
    void getRefundsForPayment_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/refunds/payment/1"))
                .andExpect(status().isUnauthorized());
    }
}
