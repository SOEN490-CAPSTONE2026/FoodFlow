package com.example.foodflow.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;

@Service
public class BusinessMetricsService {

    private final MeterRegistry meterRegistry;
    private final ClaimRepository claimRepository;
    private final SurplusPostRepository surplusPostRepository;

    // Surplus Post Metrics
    private final Counter surplusPostCreatedCounter;
    private final Counter surplusPostClaimedCounter;
    private final Counter surplusPostCompletedCounter;

    // Claim Metrics
    private final Counter claimCreatedCounter;
    private final Counter claimCancelledCounter;
    private final Counter claimCompletedCounter;

    // Message Metrics
    private final Counter messagesSentCounter;
    private final Counter messagesReceivedCounter;

    public BusinessMetricsService(MeterRegistry meterRegistry,
                                 ClaimRepository claimRepository,
                                 SurplusPostRepository surplusPostRepository) {
        this.meterRegistry = meterRegistry;
        this.claimRepository = claimRepository;
        this.surplusPostRepository = surplusPostRepository;

        // Initialize counters
        this.surplusPostCreatedCounter = Counter.builder("surplus.posts.created")
                .description("Total surplus food posts created")
                .register(meterRegistry);

        this.surplusPostClaimedCounter = Counter.builder("surplus.posts.claimed")
                .description("Total surplus posts claimed")
                .register(meterRegistry);

        this.surplusPostCompletedCounter = Counter.builder("surplus.posts.completed")
                .description("Total surplus posts completed")
                .register(meterRegistry);

        this.claimCreatedCounter = Counter.builder("claims.created")
                .description("Total claims created")
                .register(meterRegistry);

        this.claimCancelledCounter = Counter.builder("claims.cancelled")
                .description("Total claims cancelled")
                .register(meterRegistry);

        this.claimCompletedCounter = Counter.builder("claims.completed")
                .description("Total claims completed")
                .register(meterRegistry);

        this.messagesSentCounter = Counter.builder("messages.sent")
                .description("Total messages sent")
                .register(meterRegistry);

        this.messagesReceivedCounter = Counter.builder("messages.received")
                .description("Total messages received")
                .register(meterRegistry);

        // Register gauges for active claims by status
        registerActiveClaimsGauges();
    }

    private void registerActiveClaimsGauges() {
        // Active claims gauge
        Gauge.builder("claims.active", claimRepository, repo -> 
                repo.countByStatus(ClaimStatus.ACTIVE))
                .description("Number of active claims")
                .register(meterRegistry);

        // Cancelled claims gauge
        Gauge.builder("claims.cancelled.total", claimRepository, repo -> 
                repo.countByStatus(ClaimStatus.CANCELLED))
                .description("Total number of cancelled claims")
                .register(meterRegistry);

        // Completed claims gauge
        Gauge.builder("claims.completed.total", claimRepository, repo -> 
                repo.countByStatus(ClaimStatus.COMPLETED))
                .description("Total number of completed claims")
                .register(meterRegistry);
    }

    // Surplus Post Methods
    public void incrementSurplusPostCreated() {
        surplusPostCreatedCounter.increment();
    }

    public void incrementSurplusPostClaimed() {
        surplusPostClaimedCounter.increment();
    }

    public void incrementSurplusPostCompleted() {
        surplusPostCompletedCounter.increment();
    }

    // Claim Methods
    public void incrementClaimCreated() {
        claimCreatedCounter.increment();
    }

    public void incrementClaimCancelled() {
        claimCancelledCounter.increment();
    }

    public void incrementClaimCompleted() {
        claimCompletedCounter.increment();
    }

    // Message Methods
    public void incrementMessagesSent() {
        messagesSentCounter.increment();
    }

    public void incrementMessagesReceived() {
        messagesReceivedCounter.increment();
    }

    // Timer for service method execution
    public Timer.Sample startTimer() {
        return Timer.start(meterRegistry);
    }

    public void recordTimer(Timer.Sample sample, String metricName, String... tags) {
        Timer.Builder timerBuilder = Timer.builder(metricName);
        for (int i = 0; i < tags.length - 1; i += 2) {
            timerBuilder.tag(tags[i], tags[i + 1]);
        }
        sample.stop(timerBuilder.register(meterRegistry));
    }
}