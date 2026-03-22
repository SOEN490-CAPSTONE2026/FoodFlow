package com.example.foodflow.controller;

import com.example.foodflow.service.DisputeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that /api/reports/** enforces authentication.
 *
 * Prior to the security fix, this path was listed under permitAll() in SecurityConfig.
 * These tests confirm unauthenticated requests are rejected (401) and that all three
 * platform roles (DONOR, RECEIVER, ADMIN) are permitted through the security filter.
 *
 * Note: GET /api/reports has no handler — an authenticated request returns 405 (Method
 * Not Allowed), which confirms it passed the security filter. POST /api/reports requires
 * a valid body; an authenticated request with an empty body returns 400, not 401.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReportsEndpointSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DisputeService disputeService;

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
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // --- DONOR role ---

    @Test
    @WithMockUser(authorities = "DONOR")
    void getReports_withDonorRole_passesSecurity() throws Exception {
        // No GET handler exists; 405 confirms the request passed the security filter
        mockMvc.perform(get("/api/reports"))
                .andExpect(result -> assertNotEquals(
                        401, result.getResponse().getStatus(),
                        "DONOR should not receive 401 on /api/reports"));
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void postReports_withDonorRole_passesSecurity() throws Exception {
        // Invalid body returns 400 from the controller — not 401 from the security filter
        mockMvc.perform(post("/api/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> assertNotEquals(
                        401, result.getResponse().getStatus(),
                        "DONOR should not receive 401 on POST /api/reports"));
    }

    // --- RECEIVER role ---

    @Test
    @WithMockUser(authorities = "RECEIVER")
    void getReports_withReceiverRole_passesSecurity() throws Exception {
        mockMvc.perform(get("/api/reports"))
                .andExpect(result -> assertNotEquals(
                        401, result.getResponse().getStatus(),
                        "RECEIVER should not receive 401 on /api/reports"));
    }

    @Test
    @WithMockUser(authorities = "RECEIVER")
    void postReports_withReceiverRole_passesSecurity() throws Exception {
        mockMvc.perform(post("/api/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> assertNotEquals(
                        401, result.getResponse().getStatus(),
                        "RECEIVER should not receive 401 on POST /api/reports"));
    }

    // --- ADMIN role ---

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getReports_withAdminRole_passesSecurity() throws Exception {
        mockMvc.perform(get("/api/reports"))
                .andExpect(result -> assertNotEquals(
                        401, result.getResponse().getStatus(),
                        "ADMIN should not receive 401 on /api/reports"));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void postReports_withAdminRole_passesSecurity() throws Exception {
        mockMvc.perform(post("/api/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> assertNotEquals(
                        401, result.getResponse().getStatus(),
                        "ADMIN should not receive 401 on POST /api/reports"));
    }
}
