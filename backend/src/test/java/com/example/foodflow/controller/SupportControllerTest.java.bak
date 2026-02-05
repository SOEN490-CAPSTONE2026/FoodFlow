package com.example.foodflow.controller;

import com.example.foodflow.exception.RateLimitExceededException;
import com.example.foodflow.model.dto.SupportChatRequest;
import com.example.foodflow.model.dto.SupportChatResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.RateLimitingService;
import com.example.foodflow.service.SupportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SupportController.class)
class SupportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SupportService supportService;

    @MockBean
    private RateLimitingService rateLimitingService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private SupportChatRequest validRequest;
    private SupportChatResponse validResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setRole(UserRole.RECEIVER);
        testUser.setLanguagePreference("en");

        validRequest = new SupportChatRequest();
        validRequest.setMessage("How do I create an account?");
        validRequest.setPageContext("/register");

        validResponse = new SupportChatResponse(
                "To create an account, please...",
                "ACCOUNT_CREATE",
                Arrays.asList(new SupportChatResponse.SupportAction("navigate", "Go to Registration", "/register")),
                false);
    }

    @Test
    void chat_ValidRequest_ShouldReturnSuccessResponse() throws Exception {
        // Given
        when(rateLimitingService.getClientIpAddress(any(HttpServletRequest.class))).thenReturn("192.168.1.1");
        when(rateLimitingService.allowSupportRequest(1L, "192.168.1.1")).thenReturn(true);
        when(rateLimitingService.getRemainingUserQuota(1L)).thenReturn(9);
        when(supportService.processChat(any(SupportChatRequest.class), any(User.class))).thenReturn(validResponse);

        // When & Then
        MvcResult result = mockMvc.perform(post("/api/support/chat")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(header().string("X-RateLimit-Limit", "10"))
                .andExpect(header().string("X-RateLimit-Remaining", "9"))
                .andExpect(jsonPath("$.reply").value("To create an account, please..."))
                .andExpect(jsonPath("$.intent").value("ACCOUNT_CREATE"))
                .andExpect(jsonPath("$.requiresEscalation").value(false))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        SupportChatResponse response = objectMapper.readValue(responseBody, SupportChatResponse.class);
        assertThat(response.getActions()).hasSize(1);
        assertThat(response.getActions().get(0).getType()).isEqualTo("navigate");
    }

    @Test
    void chat_RateLimitExceeded_ShouldReturnTooManyRequests() throws Exception {
        // Given
        when(rateLimitingService.getClientIpAddress(any(HttpServletRequest.class))).thenReturn("192.168.1.1");
        when(rateLimitingService.allowSupportRequest(1L, "192.168.1.1")).thenReturn(false);
        when(rateLimitingService.getRemainingUserQuota(1L)).thenReturn(0);

        // When & Then
        mockMvc.perform(post("/api/support/chat")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("X-RateLimit-Limit", "10"))
                .andExpect(header().string("X-RateLimit-Remaining", "0"))
                .andExpect(header().string("Retry-After", "60"))
                .andExpected(jsonPath("$.reply").value("Too many requests. Please wait before trying again."))
                .andExpect(jsonPath("$.intent").value("RATE_LIMITED"));
    }

    @Test
    void chat_RateLimitExceededFrenchUser_ShouldReturnFrenchErrorMessage() throws Exception {
        // Given
        testUser.setLanguagePreference("fr");
        when(rateLimitingService.getClientIpAddress(any(HttpServletRequest.class))).thenReturn("192.168.1.1");
        when(rateLimitingService.allowSupportRequest(1L, "192.168.1.1")).thenReturn(false);
        when(rateLimitingService.getRemainingUserQuota(1L)).thenReturn(0);

        // When & Then
        mockMvc.perform(post("/api/support/chat")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpected(status().isTooManyRequests())
                .andExpect(jsonPath("$.reply").value("Trop de demandes. Veuillez attendre avant de réessayer."));
    }

    @Test
    void chat_RateLimitExceptionThrown_ShouldHandleGracefully() throws Exception {
        // Given
        when(rateLimitingService.getClientIpAddress(any(HttpServletRequest.class))).thenReturn("192.168.1.1");
        when(rateLimitingService.allowSupportRequest(1L, "192.168.1.1")).thenReturn(true);
        when(supportService.processChat(any(SupportChatRequest.class), any(User.class)))
                .thenThrow(new RateLimitExceededException("user", 60));

        // When & Then
        mockMvc.perform(post("/api/support/chat")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.intent").value("RATE_LIMITED"));
    }

    @Test
    void chat_ServiceThrowsException_ShouldReturnErrorResponse() throws Exception {
        // Given
        when(rateLimitingService.getClientIpAddress(any(HttpServletRequest.class))).thenReturn("192.168.1.1");
        when(rateLimitingService.allowSupportRequest(1L, "192.168.1.1")).thenReturn(true);
        when(supportService.processChat(any(SupportChatRequest.class), any(User.class)))
                .thenThrow(new RuntimeException("Service error"));

        // When & Then
        mockMvc.perform(post("/api/support/chat")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk()) // Controller catches exceptions and returns 200 with error message
                .andExpect(jsonPath("$.reply").value("An error occurred. Please contact support."))
                .andExpect(jsonPath("$.intent").value("ERROR"))
                .andExpect(jsonPath("$.requiresEscalation").value(true));
    }

    @Test
    void chat_ServiceThrowsExceptionFrenchUser_ShouldReturnFrenchErrorMessage() throws Exception {
        // Given
        testUser.setLanguagePreference("fr");
        when(rateLimitingService.getClientIpAddress(any(HttpServletRequest.class))).thenReturn("192.168.1.1");
        when(rateLimitingService.allowSupportRequest(1L, "192.168.1.1")).thenReturn(true);
        when(supportService.processChat(any(SupportChatRequest.class), any(User.class)))
                .thenThrow(new RuntimeException("Service error"));

        // When & Then
        mockMvc.perform(post("/api/support/chat")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Une erreur est survenue. Veuillez contacter le support."));
    }

    @Test
    void chat_InvalidRequest_ShouldReturnBadRequest() throws Exception {
        // Given
        SupportChatRequest invalidRequest = new SupportChatRequest();
        // Missing required fields

        // When & Then
        mockMvc.perform(post("/api/support/chat")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void chat_UnauthenticatedUser_ShouldReturnUnauthorized() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/support/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getRateLimitStats_AdminUser_ShouldReturnStats() throws Exception {
        // Given
        User adminUser = new User();
        adminUser.setId(2L);
        adminUser.setRole(UserRole.ADMIN);

        RateLimitingService.RateLimitStats stats = new RateLimitingService.RateLimitStats(
                5, 10, 10, 30, 100, true);
        when(rateLimitingService.getStats()).thenReturn(stats);

        // When & Then
        mockMvc.perform(get("/api/support/rate-limit-stats")
                .with(user(adminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeUserLimiters").value(5))
                .andExpect(jsonPath("$.activeIpLimiters").value(10))
                .andExpect(jsonPath("$.userRequestsPerMinute").value(10))
                .andExpect(jsonPath("$.ipRequestsPerMinute").value(30))
                .andExpect(jsonPath("$.openaiRequestsPerMinute").value(100))
                .andExpect(jsonPath("$.enabled").value(true));
    }

    @Test
    void getRateLimitStats_NonAdminUser_ShouldReturnForbidden() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/support/rate-limit-stats")
                .with(user(testUser))) // Regular user, not admin
                .andExpect(status().isForbidden());
    }

    @Test
    void getRateLimitStats_UnauthenticatedUser_ShouldReturnUnauthorized() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/support/rate-limit-stats"))
                .andExpect(status().isUnauthorized());
    }
}