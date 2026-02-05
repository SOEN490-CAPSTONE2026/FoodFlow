package com.example.foodflow.controller;

import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import com.example.foodflow.service.RateLimitingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RateLimitMonitoringController.class)
@Import(com.example.foodflow.config.TestMetricsConfig.class)
class RateLimitMonitoringControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RateLimitingService rateLimitingService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User adminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(UserRole.ADMIN);

        regularUser = new User();
        regularUser.setId(2L);
        regularUser.setEmail("user@example.com");
        regularUser.setRole(UserRole.RECEIVER);
    }

    @Test
    void getRateLimitStats_AdminUser_ShouldReturnStats() throws Exception {
        // Given
        RateLimitingService.RateLimitStats stats = new RateLimitingService.RateLimitStats(
                5, 10, 10, 30, 100, true);
        when(rateLimitingService.getStats()).thenReturn(stats);

        // When & Then
        mockMvc.perform(get("/api/admin/rate-limit-stats")
                .with(authenticateUser(adminUser, "ADMIN")))
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
        mockMvc.perform(get("/api/admin/rate-limit-stats")
                .with(authenticateUser(regularUser, "RECEIVER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getRateLimitStats_UnauthenticatedUser_ShouldReturnUnauthorized() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/admin/rate-limit-stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getRateLimitStats_NullUser_ShouldReturnForbidden() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/admin/rate-limit-stats")
                .with(authenticateUser(null, "ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserRateLimit_AuthenticatedUser_ShouldReturnUserStatus() throws Exception {
        // Given
        when(rateLimitingService.getRemainingUserQuota(2L)).thenReturn(7);

        // When & Then
        mockMvc.perform(get("/api/admin/my-rate-limit")
                .with(authenticateUser(regularUser, "RECEIVER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(2))
                .andExpect(jsonPath("$.limitPerMinute").value(10))
                .andExpect(jsonPath("$.remaining").value(7))
                .andExpect(jsonPath("$.enabled").value(true));
    }

    @Test
    void getUserRateLimit_AdminUser_ShouldReturnAdminStatus() throws Exception {
        // Given
        when(rateLimitingService.getRemainingUserQuota(1L)).thenReturn(8);

        // When & Then
        mockMvc.perform(get("/api/admin/my-rate-limit")
                .with(authenticateUser(adminUser, "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.limitPerMinute").value(10))
                .andExpect(jsonPath("$.remaining").value(8))
                .andExpect(jsonPath("$.enabled").value(true));
    }

    @Test
    void getUserRateLimit_UnauthenticatedUser_ShouldReturnUnauthorized() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/admin/my-rate-limit"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUserRateLimit_NullUser_ShouldReturnUnauthorized() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/admin/my-rate-limit")
                .with(authenticateUser(null, "RECEIVER")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userRateLimitStatus_AllFieldsAccessible() {
        // Given
        RateLimitMonitoringController.UserRateLimitStatus status = new RateLimitMonitoringController.UserRateLimitStatus(
                1L, 10, 5, true);

        // Then
        assertThat(status.userId).isEqualTo(1L);
        assertThat(status.limitPerMinute).isEqualTo(10);
        assertThat(status.remaining).isEqualTo(5);
        assertThat(status.enabled).isTrue();
    }

    private RequestPostProcessor authenticateUser(User user, String... authorities) {
        return authentication(new UsernamePasswordAuthenticationToken(
                user,
                "password",
                Arrays.stream(authorities).map(SimpleGrantedAuthority::new).toList()
        ));
    }
}
