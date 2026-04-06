package com.example.foodflow.controller;

import com.example.foodflow.model.dto.DisputeResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.service.DisputeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReportsEndpointSecurityTest {

    private static final String VALID_BODY = "{\"reportedId\": 1, \"description\": \"Behaviour that violated the platform rules\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DisputeService disputeService;

    @MockitoBean
    private UserRepository userRepository;

    private User donorUser;
    private User receiverUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        donorUser = new User();
        donorUser.setId(1L);
        donorUser.setRole(UserRole.DONOR);

        receiverUser = new User();
        receiverUser.setId(2L);
        receiverUser.setRole(UserRole.RECEIVER);

        adminUser = new User();
        adminUser.setId(3L);
        adminUser.setRole(UserRole.ADMIN);

        when(disputeService.createReport(any(), anyLong())).thenReturn(new DisputeResponse());
    }

    private UsernamePasswordAuthenticationToken authAs(User user, String authority) {
        return new UsernamePasswordAuthenticationToken(
                user, null,
                Collections.singletonList(new SimpleGrantedAuthority(authority)));
    }

    // --- Unauthenticated requests ---

    @Test
    void getReports_withoutAuthentication_returns401() throws Exception {
        mockMvc.perform(get("/api/reports"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postReports_withoutAuthentication_returns401() throws Exception {
        mockMvc.perform(post("/api/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_BODY))
                .andExpect(status().isUnauthorized());
    }

    // --- DONOR role ---

    @Test
    void postReports_withDonorRole_returns201() throws Exception {
        // Passes SecurityConfig URL filter and method-level @PreAuthorize;
        // service mocked → 201 Created
        mockMvc.perform(post("/api/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_BODY)
                .with(authentication(authAs(donorUser, "DONOR"))))
                .andExpect(status().isCreated());
    }

    // --- RECEIVER role ---

    @Test
    void postReports_withReceiverRole_returns201() throws Exception {
        mockMvc.perform(post("/api/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_BODY)
                .with(authentication(authAs(receiverUser, "RECEIVER"))))
                .andExpect(status().isCreated());
    }

    // --- ADMIN role ---

    @Test
    void postReports_withAdminRole_returns400() throws Exception {
        // SecurityConfig allows ADMIN on /api/reports/**, but the method-level
        // @PreAuthorize("hasAnyAuthority('DONOR', 'RECEIVER')") blocks ADMIN by
        // throwing 400 status code
        mockMvc.perform(post("/api/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_BODY)
                .with(authentication(authAs(adminUser, "ADMIN"))))
                .andExpect(status().isBadRequest());
    }
}
