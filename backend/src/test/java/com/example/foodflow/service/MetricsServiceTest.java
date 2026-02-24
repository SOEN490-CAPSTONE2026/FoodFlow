package com.example.foodflow.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class MetricsServiceTest {

    private MeterRegistry meterRegistry;
    private MetricsService metricsService;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        metricsService = new MetricsService(meterRegistry);
    }

    @Test
    void testIncrementUserRegistration() {
        // Given
        double initialCount = meterRegistry.counter("user.registrations.total").count();

        // When
        metricsService.incrementUserRegistration();

        // Then
        double finalCount = meterRegistry.counter("user.registrations.total").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementDonorRegistration() {
        // Given
        double initialCount = meterRegistry.counter("donor.registrations.total").count();

        // When
        metricsService.incrementDonorRegistration();

        // Then
        double finalCount = meterRegistry.counter("donor.registrations.total").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementReceiverRegistration() {
        // Given
        double initialCount = meterRegistry.counter("receiver.registrations.total").count();

        // When
        metricsService.incrementReceiverRegistration();

        // Then
        double finalCount = meterRegistry.counter("receiver.registrations.total").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementLoginAttempt() {
        // Given
        double initialCount = meterRegistry.counter("login.attempts.total").count();

        // When
        metricsService.incrementLoginAttempt();

        // Then
        double finalCount = meterRegistry.counter("login.attempts.total").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementLoginSuccess() {
        // Given
        double initialCount = meterRegistry.counter("login.success.total").count();

        // When
        metricsService.incrementLoginSuccess();

        // Then
        double finalCount = meterRegistry.counter("login.success.total").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementUserInteraction() {
        // When
        metricsService.incrementUserInteraction("click", "button");

        // Then
        Counter counter = meterRegistry.find("user.interactions.total")
                .tag("action", "click")
                .tag("component", "button")
                .counter();
        assertNotNull(counter);
        assertEquals(1.0, counter.count());
    }

    @Test
    void testIncrementUserInteraction_MultipleActions() {
        // When
        metricsService.incrementUserInteraction("click", "login_button");
        metricsService.incrementUserInteraction("click", "login_button");
        metricsService.incrementUserInteraction("hover", "menu");

        // Then
        Counter clickCounter = meterRegistry.find("user.interactions.total")
                .tag("action", "click")
                .tag("component", "login_button")
                .counter();
        assertNotNull(clickCounter);
        assertEquals(2.0, clickCounter.count());

        Counter hoverCounter = meterRegistry.find("user.interactions.total")
                .tag("action", "hover")
                .tag("component", "menu")
                .counter();
        assertNotNull(hoverCounter);
        assertEquals(1.0, hoverCounter.count());
    }

    @Test
    void testIncrementAuthFailure() {
        // When
        metricsService.incrementAuthFailure("invalid_credentials");

        // Then
        Counter counter = meterRegistry.find("auth.failures")
                .tag("reason", "invalid_credentials")
                .counter();
        assertNotNull(counter);
        assertEquals(1.0, counter.count());
    }

    @Test
    void testIncrementAuthFailure_MultipleReasons() {
        // When
        metricsService.incrementAuthFailure("invalid_credentials");
        metricsService.incrementAuthFailure("invalid_credentials");
        metricsService.incrementAuthFailure("account_locked");

        // Then
        Counter invalidCredsCounter = meterRegistry.find("auth.failures")
                .tag("reason", "invalid_credentials")
                .counter();
        assertNotNull(invalidCredsCounter);
        assertEquals(2.0, invalidCredsCounter.count());

        Counter lockedCounter = meterRegistry.find("auth.failures")
                .tag("reason", "account_locked")
                .counter();
        assertNotNull(lockedCounter);
        assertEquals(1.0, lockedCounter.count());
    }

    @Test
    void testIncrementSecurityEvent() {
        // When
        metricsService.incrementSecurityEvent("suspicious_login");

        // Then
        Counter counter = meterRegistry.find("security.events")
                .tag("type", "suspicious_login")
                .counter();
        assertNotNull(counter);
        assertEquals(1.0, counter.count());
    }

    @Test
    void testIncrementSecurityEvent_MultipleTypes() {
        // When
        metricsService.incrementSecurityEvent("brute_force");
        metricsService.incrementSecurityEvent("sql_injection_attempt");
        metricsService.incrementSecurityEvent("brute_force");

        // Then
        Counter bruteForceCounter = meterRegistry.find("security.events")
                .tag("type", "brute_force")
                .counter();
        assertNotNull(bruteForceCounter);
        assertEquals(2.0, bruteForceCounter.count());

        Counter sqlCounter = meterRegistry.find("security.events")
                .tag("type", "sql_injection_attempt")
                .counter();
        assertNotNull(sqlCounter);
        assertEquals(1.0, sqlCounter.count());
    }

    @Test
    void testMultipleIncrements_UserRegistration() {
        // When
        metricsService.incrementUserRegistration();
        metricsService.incrementUserRegistration();
        metricsService.incrementUserRegistration();

        // Then
        double count = meterRegistry.counter("user.registrations.total").count();
        assertEquals(3.0, count);
    }

    @Test
    void testMultipleIncrements_LoginAttempts() {
        // When
        metricsService.incrementLoginAttempt();
        metricsService.incrementLoginAttempt();
        metricsService.incrementLoginAttempt();
        metricsService.incrementLoginAttempt();
        metricsService.incrementLoginAttempt();

        // Then
        double count = meterRegistry.counter("login.attempts.total").count();
        assertEquals(5.0, count);
    }

    @Test
    void testAllCountersStartAtZero() {
        // Given - Fresh service
        MeterRegistry freshRegistry = new SimpleMeterRegistry();

        // Then - All counters should exist and start at 0
        assertEquals(0.0, freshRegistry.counter("user.registrations.total").count());
        assertEquals(0.0, freshRegistry.counter("donor.registrations.total").count());
        assertEquals(0.0, freshRegistry.counter("receiver.registrations.total").count());
        assertEquals(0.0, freshRegistry.counter("login.attempts.total").count());
        assertEquals(0.0, freshRegistry.counter("login.success.total").count());
    }
}
