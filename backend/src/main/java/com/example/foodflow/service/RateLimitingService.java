package com.example.foodflow.service;

import com.google.common.util.concurrent.RateLimiter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Rate limiting service to protect OpenAI API and prevent spam/abuse.
 * Implements multiple layers of rate limiting:
 * - Per-user rate limiting
 * - Per-IP rate limiting
 * - Global OpenAI API rate limiting
 */
@Service
public class RateLimitingService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingService.class);

    @Value("${app.ratelimit.user.requests-per-minute:10}")
    private int userRequestsPerMinute;

    @Value("${app.ratelimit.ip.requests-per-minute:30}")
    private int ipRequestsPerMinute;

    @Value("${app.ratelimit.openai.requests-per-minute:100}")
    private int openaiRequestsPerMinute;

    @Value("${app.ratelimit.burst-capacity:5}")
    private int burstCapacity;

    @Value("${app.ratelimit.enabled:true}")
    private boolean rateLimitingEnabled;

    // Rate limiters for different scenarios
    private final ConcurrentHashMap<String, RateLimiter> userRateLimiters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RateLimiter> ipRateLimiters = new ConcurrentHashMap<>();
    private final RateLimiter globalOpenAiRateLimiter;

    // Cleanup tracking
    private final ConcurrentHashMap<String, Long> lastAccessTime = new ConcurrentHashMap<>();
    private static final long CLEANUP_INTERVAL = TimeUnit.HOURS.toMillis(1); // Cleanup every hour
    private static final long RATE_LIMITER_EXPIRY = TimeUnit.HOURS.toMillis(2); // Remove unused limiters after 2 hours

    public RateLimitingService(@Value("${app.ratelimit.openai.requests-per-minute:100}") int openaiRequestsPerMinute) {
        this.globalOpenAiRateLimiter = RateLimiter.create(openaiRequestsPerMinute / 60.0); // Convert to per-second

        // Schedule periodic cleanup of unused rate limiters
        new Thread(this::cleanupExpiredLimiters).start();
    }

    /**
     * Check if a user can make a support request
     * 
     * @param userId The user ID
     * @param userIp The user's IP address
     * @return true if request is allowed, false if rate limited
     */
    public boolean allowSupportRequest(Long userId, String userIp) {
        if (!rateLimitingEnabled) {
            return true;
        }

        try {
            // Check user-specific rate limit
            if (!checkUserRateLimit(userId)) {
                logger.warn("User {} exceeded rate limit", userId);
                return false;
            }

            // Check IP-based rate limit
            if (!checkIpRateLimit(userIp)) {
                logger.warn("IP {} exceeded rate limit", userIp);
                return false;
            }

            // Check global OpenAI rate limit
            if (!checkGlobalOpenAiRateLimit()) {
                logger.warn("Global OpenAI rate limit exceeded");
                return false;
            }

            return true;

        } catch (Exception e) {
            logger.error("Error checking rate limits", e);
            // In case of error, allow the request (fail open)
            return true;
        }
    }

    /**
     * Check user-specific rate limit
     */
    private boolean checkUserRateLimit(Long userId) {
        String key = "user:" + userId;
        RateLimiter rateLimiter = userRateLimiters.computeIfAbsent(key,
                k -> RateLimiter.create(userRequestsPerMinute / 60.0)); // Convert to per-second

        lastAccessTime.put(key, System.currentTimeMillis());
        return rateLimiter.tryAcquire(1, 1, TimeUnit.SECONDS);
    }

    /**
     * Check IP-based rate limit
     */
    private boolean checkIpRateLimit(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return true; // Allow if IP cannot be determined
        }

        String key = "ip:" + ip;
        RateLimiter rateLimiter = ipRateLimiters.computeIfAbsent(key,
                k -> RateLimiter.create(ipRequestsPerMinute / 60.0)); // Convert to per-second

        lastAccessTime.put(key, System.currentTimeMillis());
        return rateLimiter.tryAcquire(1, 1, TimeUnit.SECONDS);
    }

    /**
     * Check global OpenAI rate limit
     */
    private boolean checkGlobalOpenAiRateLimit() {
        return globalOpenAiRateLimiter.tryAcquire(1, 1, TimeUnit.SECONDS);
    }

    /**
     * Get the client IP address from the request
     */
    public String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * Get remaining quota for a user (for client-side display)
     */
    public int getRemainingUserQuota(Long userId) {
        if (!rateLimitingEnabled) {
            return userRequestsPerMinute;
        }

        String key = "user:" + userId;
        RateLimiter rateLimiter = userRateLimiters.get(key);

        if (rateLimiter == null) {
            return userRequestsPerMinute;
        }

        // This is an approximation - RateLimiter doesn't expose exact remaining quota
        double rate = rateLimiter.getRate();
        return (int) Math.max(0, rate * 60); // Convert back to per-minute
    }

    /**
     * Get rate limiting statistics for monitoring
     */
    public RateLimitStats getStats() {
        return new RateLimitStats(
                userRateLimiters.size(),
                ipRateLimiters.size(),
                userRequestsPerMinute,
                ipRequestsPerMinute,
                openaiRequestsPerMinute,
                rateLimitingEnabled);
    }

    /**
     * Periodic cleanup of expired rate limiters to prevent memory leaks
     */
    private void cleanupExpiredLimiters() {
        while (true) {
            try {
                Thread.sleep(CLEANUP_INTERVAL);

                long currentTime = System.currentTimeMillis();

                // Clean user rate limiters
                userRateLimiters.entrySet().removeIf(entry -> {
                    Long lastAccess = lastAccessTime.get(entry.getKey());
                    return lastAccess != null && (currentTime - lastAccess) > RATE_LIMITER_EXPIRY;
                });

                // Clean IP rate limiters
                ipRateLimiters.entrySet().removeIf(entry -> {
                    Long lastAccess = lastAccessTime.get(entry.getKey());
                    return lastAccess != null && (currentTime - lastAccess) > RATE_LIMITER_EXPIRY;
                });

                // Clean access time tracking
                lastAccessTime.entrySet().removeIf(entry -> (currentTime - entry.getValue()) > RATE_LIMITER_EXPIRY);

                logger.debug("Rate limiter cleanup completed. Active user limiters: {}, IP limiters: {}",
                        userRateLimiters.size(), ipRateLimiters.size());

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                logger.error("Error during rate limiter cleanup", e);
            }
        }
    }

    /**
     * Rate limiting statistics for monitoring
     */
    public static class RateLimitStats {
        public final int activeUserLimiters;
        public final int activeIpLimiters;
        public final int userRequestsPerMinute;
        public final int ipRequestsPerMinute;
        public final int openaiRequestsPerMinute;
        public final boolean enabled;

        public RateLimitStats(int activeUserLimiters, int activeIpLimiters,
                int userRequestsPerMinute, int ipRequestsPerMinute,
                int openaiRequestsPerMinute, boolean enabled) {
            this.activeUserLimiters = activeUserLimiters;
            this.activeIpLimiters = activeIpLimiters;
            this.userRequestsPerMinute = userRequestsPerMinute;
            this.ipRequestsPerMinute = ipRequestsPerMinute;
            this.openaiRequestsPerMinute = openaiRequestsPerMinute;
            this.enabled = enabled;
        }
    }
}