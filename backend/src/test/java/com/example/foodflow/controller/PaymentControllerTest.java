package com.example.foodflow.controller;
import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.PaymentMethodType;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.model.types.PaymentType;
import com.example.foodflow.service.PaymentMethodService;
import com.example.foodflow.service.PaymentRetryService;
import com.example.foodflow.service.PaymentService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaymentControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @MockBean
    private PaymentService paymentService;
    @MockBean
    private PaymentMethodService paymentMethodService;
    @MockBean
    private PaymentRetryService paymentRetryService;
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
    void createPaymentIntent_Success() throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setAmount(BigDecimal.valueOf(25.00));
        request.setCurrency("USD");
        request.setPaymentType(PaymentType.ONE_TIME);
        request.setDescription("Test payment");
        PaymentIntentResponse response = PaymentIntentResponse.builder()
                .paymentIntentId("pi_test123")
                .clientSecret("pi_test123_secret")
                .paymentId(1L)
                .status("requires_payment_method")
                .message("Payment intent created successfully")
                .build();
        when(paymentService.createPaymentIntent(any(CreatePaymentRequest.class), any(User.class)))
                .thenReturn(response);
        mockMvc.perform(post("/api/payments/create-intent")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentIntentId").value("pi_test123"))
                .andExpect(jsonPath("$.clientSecret").value("pi_test123_secret"));
    }
    @Test
    void confirmPayment_Success() throws Exception {
        PaymentResponse response = PaymentResponse.builder()
                .id(1L)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCEEDED)
                .build();
        when(paymentService.confirmPayment(eq(1L), any(User.class)))
                .thenReturn(response);
        mockMvc.perform(post("/api/payments/1/confirm")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("SUCCEEDED"));
    }
    @Test
    void cancelPayment_Success() throws Exception {
        PaymentResponse response = PaymentResponse.builder()
                .id(1L)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.CANCELED)
                .build();
        when(paymentService.cancelPayment(eq(1L), any(User.class)))
                .thenReturn(response);
        mockMvc.perform(post("/api/payments/1/cancel")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));
    }
    @Test
    void getPaymentHistory_Success() throws Exception {
        PaymentResponse payment = PaymentResponse.builder()
                .id(1L)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCEEDED)
                .build();
        Page<PaymentResponse> page = new PageImpl<>(List.of(payment));
        when(paymentService.getPaymentHistory(any(User.class), any()))
                .thenReturn(page);
        mockMvc.perform(get("/api/payments/history")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }
    @Test
    void getPaymentDetails_Success() throws Exception {
        PaymentResponse response = PaymentResponse.builder()
                .id(1L)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCEEDED)
                .build();
        when(paymentService.getPaymentDetails(eq(1L), any(User.class)))
                .thenReturn(response);
        mockMvc.perform(get("/api/payments/1")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.amount").value(25.00));
    }
    @Test
    void attachPaymentMethod_Success() throws Exception {
        AttachPaymentMethodRequest request = new AttachPaymentMethodRequest();
        request.setPaymentMethodId("pm_test123");
        PaymentMethodResponse response = PaymentMethodResponse.builder()
                .id(1L)
                .stripePaymentMethodId("pm_test123")
                .paymentMethodType(PaymentMethodType.CARD)
                .isDefault(true)
                .build();
        when(paymentMethodService.attachPaymentMethod(any(AttachPaymentMethodRequest.class), any(User.class)))
                .thenReturn(response);
        mockMvc.perform(post("/api/payments/methods")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.stripePaymentMethodId").value("pm_test123"));
    }
    @Test
    void listPaymentMethods_Success() throws Exception {
        PaymentMethodResponse method = PaymentMethodResponse.builder()
                .id(1L)
                .stripePaymentMethodId("pm_test123")
                .paymentMethodType(PaymentMethodType.CARD)
                .isDefault(true)
                .build();
        when(paymentMethodService.listPaymentMethods(any(User.class)))
                .thenReturn(List.of(method));
        mockMvc.perform(get("/api/payments/methods")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].paymentMethodType").value("CARD"));
    }
    @Test
    void detachPaymentMethod_Success() throws Exception {
        mockMvc.perform(delete("/api/payments/methods/1")
                        .with(authentication(authentication)))
                .andExpect(status().isNoContent());
    }
    @Test
    void setDefaultPaymentMethod_Success() throws Exception {
        PaymentMethodResponse response = PaymentMethodResponse.builder()
                .id(1L)
                .stripePaymentMethodId("pm_test123")
                .paymentMethodType(PaymentMethodType.CARD)
                .isDefault(true)
                .build();
        when(paymentMethodService.setDefaultPaymentMethod(eq(1L), any(User.class)))
                .thenReturn(response);
        mockMvc.perform(put("/api/payments/methods/1/default")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDefault").value(true));
    }
    @Test
    void retryPayment_Success() throws Exception {
        PaymentResponse response = PaymentResponse.builder()
                .id(1L)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.PROCESSING)
                .build();
        when(paymentRetryService.retryPayment(eq(1L), any(User.class)))
                .thenReturn(response);
        mockMvc.perform(post("/api/payments/1/retry")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PROCESSING"));
    }
    @Test
    void getPaymentRetries_Success() throws Exception {
        PaymentRetryResponse retry = PaymentRetryResponse.builder()
                .id(5L)
                .paymentId(1L)
                .attemptNumber(2)
                .status("FAILED")
                .build();
        when(paymentRetryService.getRetriesForPayment(eq(1L), any(User.class)))
                .thenReturn(List.of(retry));
        mockMvc.perform(get("/api/payments/1/retries")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].attemptNumber").value(2))
                .andExpect(jsonPath("$[0].status").value("FAILED"));
    }
    @Test
    void getSupportedCurrencies_Success() throws Exception {
        mockMvc.perform(get("/api/payments/currencies")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("USD"))
                .andExpect(jsonPath("$[3]").value("GBP"));
    }
    @Test
    void createMethodSetupIntent_Success() throws Exception {
        SetupIntentResponse response = SetupIntentResponse.builder()
                .setupIntentId("seti_123")
                .clientSecret("seti_secret_123")
                .status("requires_payment_method")
                .message("Setup intent created successfully")
                .build();
        when(paymentMethodService.createSetupIntent(any(User.class)))
                .thenReturn(response);
        mockMvc.perform(post("/api/payments/methods/setup-intent")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setupIntentId").value("seti_123"))
                .andExpect(jsonPath("$.clientSecret").value("seti_secret_123"));
    }
}
