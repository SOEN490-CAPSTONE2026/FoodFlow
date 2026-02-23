package com.example.foodflow.service;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BusinessMetricsServiceTest {

    private MeterRegistry meterRegistry;
    private BusinessMetricsService businessMetricsService;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        businessMetricsService = new BusinessMetricsService(meterRegistry);
    }

    @Test
    void testIncrementSurplusPostCreated() {
        // Given
        double initialCount = meterRegistry.counter("surplus.posts.created").count();

        // When
        businessMetricsService.incrementSurplusPostCreated();

        // Then
        double finalCount = meterRegistry.counter("surplus.posts.created").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementSurplusPostClaimed() {
        // Given
        double initialCount = meterRegistry.counter("surplus.posts.claimed").count();

        // When
        businessMetricsService.incrementSurplusPostClaimed();

        // Then
        double finalCount = meterRegistry.counter("surplus.posts.claimed").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementSurplusPostCompleted() {
        // Given
        double initialCount = meterRegistry.counter("surplus.posts.completed").count();

        // When
        businessMetricsService.incrementSurplusPostCompleted();

        // Then
        double finalCount = meterRegistry.counter("surplus.posts.completed").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementClaimCreated() {
        // Given
        double initialCount = meterRegistry.counter("claims.created").count();

        // When
        businessMetricsService.incrementClaimCreated();

        // Then
        double finalCount = meterRegistry.counter("claims.created").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementClaimCancelled() {
        // Given
        double initialCount = meterRegistry.counter("claims.cancelled").count();

        // When
        businessMetricsService.incrementClaimCancelled();

        // Then
        double finalCount = meterRegistry.counter("claims.cancelled").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementClaimCompleted() {
        // Given
        double initialCount = meterRegistry.counter("claims.completed").count();

        // When
        businessMetricsService.incrementClaimCompleted();

        // Then
        double finalCount = meterRegistry.counter("claims.completed").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementMessagesSent() {
        // Given
        double initialCount = meterRegistry.counter("messages.sent").count();

        // When
        businessMetricsService.incrementMessagesSent();

        // Then
        double finalCount = meterRegistry.counter("messages.sent").count();
        assertEquals(initialCount + 1, finalCount);
    }

    @Test
    void testIncrementMessagesReceived() {
        // Given
        double initialCount = meterRegistry.counter("messages.received").count();

        // When
        businessMetricsService.incrementMessagesReceived();

        // Then
        double finalCount = meterRegistry.counter("messages.received").count();
        assertEquals(initialCount + 1, finalCount);
    }


    @Test
    void testStartTimer() {
        // When
        Timer.Sample sample = businessMetricsService.startTimer();

        // Then
        assertNotNull(sample);
    }

    @Test
    void testRecordTimer() throws InterruptedException {
        // Given
        Timer.Sample sample = businessMetricsService.startTimer();
        Thread.sleep(10); // Small delay

        // When
        businessMetricsService.recordTimer(sample, "test.timer", "operation", "create");

        // Then
        Timer timer = meterRegistry.find("test.timer")
                .tag("operation", "create")
                .timer();
        assertNotNull(timer);
        assertTrue(timer.count() > 0);
    }

    @Test
    void testRecordTimer_MultipleTags() throws InterruptedException {
        // Given
        Timer.Sample sample = businessMetricsService.startTimer();
        Thread.sleep(5);

        // When
        businessMetricsService.recordTimer(sample, "service.execution",
                "service", "surplus",
                "method", "create",
                "status", "success");

        // Then
        Timer timer = meterRegistry.find("service.execution")
                .tag("service", "surplus")
                .tag("method", "create")
                .tag("status", "success")
                .timer();
        assertNotNull(timer);
        assertEquals(1, timer.count());
    }

    @Test
    void testMultipleIncrements_SurplusPostCreated() {
        // When
        businessMetricsService.incrementSurplusPostCreated();
        businessMetricsService.incrementSurplusPostCreated();
        businessMetricsService.incrementSurplusPostCreated();

        // Then
        double count = meterRegistry.counter("surplus.posts.created").count();
        assertEquals(3.0, count);
    }

    @Test
    void testMultipleIncrements_ClaimActions() {
        // When
        businessMetricsService.incrementClaimCreated();
        businessMetricsService.incrementClaimCreated();
        businessMetricsService.incrementClaimCancelled();
        businessMetricsService.incrementClaimCompleted();

        // Then
        assertEquals(2.0, meterRegistry.counter("claims.created").count());
        assertEquals(1.0, meterRegistry.counter("claims.cancelled").count());
        assertEquals(1.0, meterRegistry.counter("claims.completed").count());
    }

    @Test
    void testMultipleIncrements_Messages() {
        // When
        businessMetricsService.incrementMessagesSent();
        businessMetricsService.incrementMessagesSent();
        businessMetricsService.incrementMessagesSent();
        businessMetricsService.incrementMessagesReceived();
        businessMetricsService.incrementMessagesReceived();

        // Then
        assertEquals(3.0, meterRegistry.counter("messages.sent").count());
        assertEquals(2.0, meterRegistry.counter("messages.received").count());
    }

    @Test
    void testAllCountersStartAtZero() {
        // Given - Fresh service
        MeterRegistry freshRegistry = new SimpleMeterRegistry();

        // Then
        assertEquals(0.0, freshRegistry.counter("surplus.posts.created").count());
        assertEquals(0.0, freshRegistry.counter("surplus.posts.claimed").count());
        assertEquals(0.0, freshRegistry.counter("surplus.posts.completed").count());
        assertEquals(0.0, freshRegistry.counter("claims.created").count());
        assertEquals(0.0, freshRegistry.counter("claims.cancelled").count());
        assertEquals(0.0, freshRegistry.counter("claims.completed").count());
        assertEquals(0.0, freshRegistry.counter("messages.sent").count());
        assertEquals(0.0, freshRegistry.counter("messages.received").count());
    }
}
