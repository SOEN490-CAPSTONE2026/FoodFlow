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
}
