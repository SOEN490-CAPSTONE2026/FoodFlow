package com.example.foodflow.controller;

import com.example.foodflow.service.RateLimitingService;
import com.example.foodflow.model.entity.User;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for monitoring rate limiting functionality.
 * Provides endpoints for administrators to monitor rate limiting statistics.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class RateLimitMonitoringController {

    @Autowired
    private RateLimitingService rateLimitingService;

    /**
     * Get comprehensive rate limiting statistics (admin only)
     */
    @GetMapping("/rate-limit-stats")
    public ResponseEntity<RateLimitingService.RateLimitStats> getRateLimitStats(
            @AuthenticationPrincipal User user) {

        // Only allow admins to view rate limit stats
        if (user == null || !"ADMIN".equals(user.getRole().toString())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        RateLimitingService.RateLimitStats stats = rateLimitingService.getStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get user's current rate limit status
     */
    @GetMapping("/my-rate-limit")
    public ResponseEntity<UserRateLimitStatus> getUserRateLimit(
            @AuthenticationPrincipal User user) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        int remaining = rateLimitingService.getRemainingUserQuota(user.getId());
        UserRateLimitStatus status = new UserRateLimitStatus(
                user.getId(),
                10, // Default limit per minute
                remaining,
                true // Rate limiting enabled
        );

        return ResponseEntity.ok(status);
    }

    /**
     * Response object for user rate limit status
     */
    public static class UserRateLimitStatus {
        public final Long userId;
        public final int limitPerMinute;
        public final int remaining;
        public final boolean enabled;

        public UserRateLimitStatus(Long userId, int limitPerMinute, int remaining, boolean enabled) {
            this.userId = userId;
            this.limitPerMinute = limitPerMinute;
            this.remaining = remaining;
            this.enabled = enabled;
        }
    }
}