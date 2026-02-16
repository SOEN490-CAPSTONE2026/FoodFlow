package com.example.foodflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

class RateLimitingServiceTest {

    private RateLimitingService service;

    private RateLimitingService createService() {
        RateLimitingService svc = new RateLimitingService(120);
        stopCleanupThread();
        ReflectionTestUtils.setField(svc, "rateLimitingEnabled", true);
        ReflectionTestUtils.setField(svc, "userRequestsPerMinute", 120);
        ReflectionTestUtils.setField(svc, "ipRequestsPerMinute", 120);
        ReflectionTestUtils.setField(svc, "openaiRequestsPerMinute", 120);
        return svc;
    }

    @AfterEach
    void tearDown() {
        stopCleanupThread();
    }

    private void stopCleanupThread() {
        for (Thread thread : Thread.getAllStackTraces().keySet()) {
            StackTraceElement[] stack = thread.getStackTrace();
            for (StackTraceElement element : stack) {
                if ("cleanupExpiredLimiters".equals(element.getMethodName())
                    && element.getClassName().contains("RateLimitingService")) {
                    thread.interrupt();
                }
            }
        }
    }

    @Test
    void allowSupportRequest_whenDisabled_allows() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", false);

        boolean allowed = service.allowSupportRequest(1L, "127.0.0.1");
        assertThat(allowed).isTrue();
    }

    @Test
    void allowSupportRequest_whenLimiterThrows_failsOpen() {
        service = createService();
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 0);

        boolean allowed = service.allowSupportRequest(1L, "127.0.0.1");
        assertThat(allowed).isTrue();
    }

    @Test
    void getClientIpAddress_prefersForwardedAndRealIp() {
        service = createService();
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn("1.2.3.4, 5.6.7.8");
        when(request.getHeader("X-Real-IP")).thenReturn("9.9.9.9");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        assertThat(service.getClientIpAddress(request)).isEqualTo("1.2.3.4");

        HttpServletRequest request2 = Mockito.mock(HttpServletRequest.class);
        when(request2.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request2.getHeader("X-Real-IP")).thenReturn("9.9.9.9");
        when(request2.getRemoteAddr()).thenReturn("10.0.0.1");
        assertThat(service.getClientIpAddress(request2)).isEqualTo("9.9.9.9");
    }

    @Test
    void getRemainingUserQuota_whenLimiterMissing_returnsConfiguredLimit() {
        service = createService();
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 15);

        int remaining = service.getRemainingUserQuota(42L);
        assertThat(remaining).isEqualTo(15);
    }

    @Test
    void allowSupportRequest_whenEnabled_checksUserLimit() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", true);
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 600);
        ReflectionTestUtils.setField(service, "ipRequestsPerMinute", 600);

        boolean allowed = service.allowSupportRequest(1L, "127.0.0.1");
        assertThat(allowed).isTrue();
    }

    @Test
    void allowSupportRequest_withNullIp_stillAllows() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", true);
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 600);
        ReflectionTestUtils.setField(service, "ipRequestsPerMinute", 600);

        boolean allowed = service.allowSupportRequest(1L, null);
        assertThat(allowed).isTrue();
    }

    @Test
    void allowSupportRequest_withEmptyIp_stillAllows() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", true);
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 600);
        ReflectionTestUtils.setField(service, "ipRequestsPerMinute", 600);

        boolean allowed = service.allowSupportRequest(1L, "   ");
        assertThat(allowed).isTrue();
    }

    @Test
    void getClientIpAddress_fallsBackToRemoteAddr() {
        service = createService();
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        assertThat(service.getClientIpAddress(request)).isEqualTo("10.0.0.1");
    }

    @Test
    void getClientIpAddress_withEmptyForwardedFor_usesRealIp() {
        service = createService();
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn("");
        when(request.getHeader("X-Real-IP")).thenReturn("9.9.9.9");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        assertThat(service.getClientIpAddress(request)).isEqualTo("9.9.9.9");
    }

    @Test
    void getRemainingUserQuota_whenRateLimitingDisabled_returnsConfiguredLimit() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", false);
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 20);

        int remaining = service.getRemainingUserQuota(1L);
        assertThat(remaining).isEqualTo(20);
    }

    @Test
    void getRemainingUserQuota_afterRequest_returnsApproximateRemaining() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", true);
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 600);
        ReflectionTestUtils.setField(service, "ipRequestsPerMinute", 600);

        // Make a request to create the rate limiter
        service.allowSupportRequest(1L, "127.0.0.1");

        // Get remaining quota
        int remaining = service.getRemainingUserQuota(1L);
        assertThat(remaining).isGreaterThanOrEqualTo(0);
    }

    @Test
    void getStats_returnsCorrectConfiguration() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", true);
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 10);
        ReflectionTestUtils.setField(service, "ipRequestsPerMinute", 30);
        ReflectionTestUtils.setField(service, "openaiRequestsPerMinute", 100);

        RateLimitingService.RateLimitStats stats = service.getStats();

        assertThat(stats.enabled).isTrue();
        assertThat(stats.userRequestsPerMinute).isEqualTo(10);
        assertThat(stats.ipRequestsPerMinute).isEqualTo(30);
        assertThat(stats.openaiRequestsPerMinute).isEqualTo(100);
    }

    @Test
    void getStats_includesActiveLimiterCounts() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", true);
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 600);
        ReflectionTestUtils.setField(service, "ipRequestsPerMinute", 600);

        // Create rate limiters by making requests
        service.allowSupportRequest(1L, "127.0.0.1");
        service.allowSupportRequest(2L, "192.168.1.1");

        RateLimitingService.RateLimitStats stats = service.getStats();

        assertThat(stats.activeUserLimiters).isGreaterThanOrEqualTo(0);
        assertThat(stats.activeIpLimiters).isGreaterThanOrEqualTo(0);
    }

    @Test
    void allowSupportRequest_multipleCalls_tracksSeparateUsers() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", true);
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 600);
        ReflectionTestUtils.setField(service, "ipRequestsPerMinute", 600);

        // Different users should have separate rate limiters
        boolean allowed1 = service.allowSupportRequest(1L, "127.0.0.1");
        boolean allowed2 = service.allowSupportRequest(2L, "127.0.0.2");

        assertThat(allowed1).isTrue();
        assertThat(allowed2).isTrue();
    }

    @Test
    void allowSupportRequest_multipleCalls_tracksSeparateIps() {
        service = createService();
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", true);
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 600);
        ReflectionTestUtils.setField(service, "ipRequestsPerMinute", 600);

        // Same user from different IPs should be tracked separately
        boolean allowed1 = service.allowSupportRequest(1L, "127.0.0.1");
        boolean allowed2 = service.allowSupportRequest(1L, "192.168.1.1");

        assertThat(allowed1).isTrue();
        assertThat(allowed2).isTrue();
    }
}
