package com.example.foodflow.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.foodflow.service.RateLimitingService;

/**
 * Test configuration for rate limiting with relaxed limits for testing
 */
@TestConfiguration
@Profile("test")
public class TestRateLimitConfig {

    @Bean
    @Primary
    public RateLimitingService testRateLimitingService() {
        RateLimitingService service = new RateLimitingService(1000); // High OpenAI limit for tests

        // Set very relaxed rate limits for testing
        ReflectionTestUtils.setField(service, "userRequestsPerMinute", 100);
        ReflectionTestUtils.setField(service, "ipRequestsPerMinute", 200);
        ReflectionTestUtils.setField(service, "openaiRequestsPerMinute", 1000);
        ReflectionTestUtils.setField(service, "burstCapacity", 50);
        ReflectionTestUtils.setField(service, "rateLimitingEnabled", true);

        return service;
    }
}