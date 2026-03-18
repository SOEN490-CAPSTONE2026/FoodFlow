package com.example.foodflow.service;

import com.google.common.util.concurrent.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Field;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RateLimitingServiceTest {

    private RateLimitingService rateLimitingService;

    @Mock
    private HttpServletRequest httpServletRequest;

    @BeforeEach
    void setUp() {
        // Create service with test configuration
        rateLimitingService = new RateLimitingService(100);

        // Set test values using reflection
        ReflectionTestUtils.setField(rateLimitingService, "userRequestsPerMinute", 10);
        ReflectionTestUtils.setField(rateLimitingService, "ipRequestsPerMinute", 30);
        ReflectionTestUtils.setField(rateLimitingService, "openaiRequestsPerMinute", 100);
        ReflectionTestUtils.setField(rateLimitingService, "burstCapacity", 5);
        ReflectionTestUtils.setField(rateLimitingService, "rateLimitingEnabled", true);
    }

    @Test
    void allowSupportRequest_WhenRateLimitingDisabled_ShouldReturnTrue() {
        // Given
        ReflectionTestUtils.setField(rateLimitingService, "rateLimitingEnabled", false);
        Long userId = 1L;
        String userIp = "192.168.1.1";

        // When
        boolean result = rateLimitingService.allowSupportRequest(userId, userIp);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void allowSupportRequest_FirstRequest_ShouldReturnTrue() {
        // Given
        Long userId = 1L;
        String userIp = "192.168.1.1";

        // When
        boolean result = rateLimitingService.allowSupportRequest(userId, userIp);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void allowSupportRequest_WithinUserLimit_ShouldReturnTrue() {
        // Given
        Long userId = 1L;
        String userIp = "192.168.1.1";

        // When - Make several requests within limit
        boolean result1 = rateLimitingService.allowSupportRequest(userId, userIp);
        boolean result2 = rateLimitingService.allowSupportRequest(userId, userIp);
        boolean result3 = rateLimitingService.allowSupportRequest(userId, userIp);

        // Then
        assertThat(result1).isTrue();
        assertThat(result2).isTrue();
        assertThat(result3).isTrue();
    }

    @Test
    void allowSupportRequest_ExceedingUserLimit_ShouldEventuallyReturnFalse() throws InterruptedException {
        // Given
        ReflectionTestUtils.setField(rateLimitingService, "userRequestsPerMinute", 1); // Very low limit
        Long userId = 1L;
        String userIp = "192.168.1.1";

        // When - First request should pass
        boolean firstResult = rateLimitingService.allowSupportRequest(userId, userIp);

        // Then - Second immediate request should fail due to rate limit
        boolean secondResult = rateLimitingService.allowSupportRequest(userId, userIp);

        assertThat(firstResult).isTrue();
        assertThat(secondResult).isFalse();
    }

    @Test
    void allowSupportRequest_DifferentUsers_ShouldNotAffectEachOther() {
        // Given
        Long userId1 = 1L;
        Long userId2 = 2L;
        String userIp = "192.168.1.1";

        // When
        boolean result1 = rateLimitingService.allowSupportRequest(userId1, userIp);
        boolean result2 = rateLimitingService.allowSupportRequest(userId2, userIp);

        // Then
        assertThat(result1).isTrue();
        assertThat(result2).isTrue();
    }

    @Test
    void allowSupportRequest_ExceedingIpLimit_ShouldEventuallyReturnFalse() throws InterruptedException {
        // Given
        ReflectionTestUtils.setField(rateLimitingService, "ipRequestsPerMinute", 1); // Very low limit
        Long userId = 1L;
        String userIp = "192.168.1.1";

        // When - First request should pass
        boolean firstResult = rateLimitingService.allowSupportRequest(userId, userIp);

        // Then - Second immediate request should fail due to IP rate limit
        boolean secondResult = rateLimitingService.allowSupportRequest(userId, userIp);

        assertThat(firstResult).isTrue();
        assertThat(secondResult).isFalse();
    }

    @Test
    void allowSupportRequest_ExceedingGlobalLimit_ShouldEventuallyReturnFalse() throws InterruptedException {
        // Given
        ReflectionTestUtils.setField(rateLimitingService, "openaiRequestsPerMinute", 1); // Very low limit
        Long userId = 1L;
        String userIp = "192.168.1.1";

        // When - First request should pass
        boolean firstResult = rateLimitingService.allowSupportRequest(userId, userIp);

        // Then - Second immediate request should fail due to global rate limit
        boolean secondResult = rateLimitingService.allowSupportRequest(userId, userIp);

        assertThat(firstResult).isTrue();
        assertThat(secondResult).isFalse();
    }

    @Test
    void getClientIpAddress_WithXForwardedFor_ShouldReturnFirstIp() {
        // Given
        when(httpServletRequest.getHeader("X-Forwarded-For")).thenReturn("192.168.1.1, 10.0.0.1");

        // When
        String clientIp = rateLimitingService.getClientIpAddress(httpServletRequest);

        // Then
        assertThat(clientIp).isEqualTo("192.168.1.1");
    }

    @Test
    void getClientIpAddress_WithXRealIp_ShouldReturnXRealIp() {
        // Given
        when(httpServletRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpServletRequest.getHeader("X-Real-IP")).thenReturn("192.168.1.2");

        // When
        String clientIp = rateLimitingService.getClientIpAddress(httpServletRequest);

        // Then
        assertThat(clientIp).isEqualTo("192.168.1.2");
    }

    @Test
    void getClientIpAddress_WithRemoteAddr_ShouldReturnRemoteAddr() {
        // Given
        when(httpServletRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpServletRequest.getHeader("X-Real-IP")).thenReturn(null);
        when(httpServletRequest.getRemoteAddr()).thenReturn("192.168.1.3");

        // When
        String clientIp = rateLimitingService.getClientIpAddress(httpServletRequest);

        // Then
        assertThat(clientIp).isEqualTo("192.168.1.3");
    }

    @Test
    void getRemainingUserQuota_NewUser_ShouldReturnFullQuota() {
        // Given
        Long userId = 1L;

        // When
        int remaining = rateLimitingService.getRemainingUserQuota(userId);

        // Then
        assertThat(remaining).isEqualTo(10); // userRequestsPerMinute
    }

    @Test
    void getRemainingUserQuota_WhenRateLimitingDisabled_ShouldReturnFullQuota() {
        // Given
        ReflectionTestUtils.setField(rateLimitingService, "rateLimitingEnabled", false);
        Long userId = 1L;

        // When
        int remaining = rateLimitingService.getRemainingUserQuota(userId);

        // Then
        assertThat(remaining).isEqualTo(10); // userRequestsPerMinute
    }

    @Test
    void getStats_ShouldReturnCorrectStatistics() {
        // Given
        Long userId = 1L;
        String userIp = "192.168.1.1";
        rateLimitingService.allowSupportRequest(userId, userIp); // Trigger rate limiter creation

        // When
        RateLimitingService.RateLimitStats stats = rateLimitingService.getStats();

        // Then
        assertThat(stats.activeUserLimiters).isGreaterThanOrEqualTo(1);
        assertThat(stats.activeIpLimiters).isGreaterThanOrEqualTo(1);
        assertThat(stats.userRequestsPerMinute).isEqualTo(10);
        assertThat(stats.ipRequestsPerMinute).isEqualTo(30);
        assertThat(stats.openaiRequestsPerMinute).isEqualTo(100);
        assertThat(stats.enabled).isTrue();
    }

    @Test
    void allowSupportRequest_WithNullIp_ShouldStillCheckUserAndGlobalLimits() {
        // Given
        Long userId = 1L;
        String userIp = null;

        // When
        boolean result = rateLimitingService.allowSupportRequest(userId, userIp);

        // Then
        assertThat(result).isTrue(); // Should not fail due to null IP
    }

    @Test
    void allowSupportRequest_WithEmptyIp_ShouldStillCheckUserAndGlobalLimits() {
        // Given
        Long userId = 1L;
        String userIp = "";

        // When
        boolean result = rateLimitingService.allowSupportRequest(userId, userIp);

        // Then
        assertThat(result).isTrue(); // Should not fail due to empty IP
    }

    @Test
    void rateLimitStats_AllFieldsAccessible() {
        // Given
        RateLimitingService.RateLimitStats stats = new RateLimitingService.RateLimitStats(
                5, 10, 10, 30, 100, true);

        // Then
        assertThat(stats.activeUserLimiters).isEqualTo(5);
        assertThat(stats.activeIpLimiters).isEqualTo(10);
        assertThat(stats.userRequestsPerMinute).isEqualTo(10);
        assertThat(stats.ipRequestsPerMinute).isEqualTo(30);
        assertThat(stats.openaiRequestsPerMinute).isEqualTo(100);
        assertThat(stats.enabled).isTrue();
    }

    @Test
    void allowSupportRequest_ConcurrentRequests_ShouldHandleCorrectly() throws InterruptedException {
        // Given
        Long userId = 1L;
        String userIp = "192.168.1.1";
        int threadCount = 5;
        Thread[] threads = new Thread[threadCount];
        boolean[] results = new boolean[threadCount];

        // When - Multiple threads making requests simultaneously
        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            threads[i] = new Thread(() -> {
                results[index] = rateLimitingService.allowSupportRequest(userId, userIp);
            });
            threads[i].start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }

        // Then - At least some requests should be allowed (thread-safe behavior)
        long allowedRequests = 0;
        for (boolean result : results) {
            if (result)
                allowedRequests++;
        }

        assertThat(allowedRequests).isGreaterThanOrEqualTo(1);
    }
}