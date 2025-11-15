package com.example.foodflow.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;
import io.micrometer.core.instrument.Tags;


@Service
public class MetricsService {

    private final Counter userRegistrationCounter;
    private final Counter donorRegistrationCounter;
    private final Counter receiverRegistrationCounter;
    private final Counter loginAttemptCounter;
    private final Counter loginSuccessCounter;
    private final Counter userInteractionCounter;
    private final MeterRegistry meterRegistry;

    public MetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        this.userRegistrationCounter = Counter.builder("user.registrations.total")
                .description("Total user registrations")
                .register(meterRegistry);
        
        this.donorRegistrationCounter = Counter.builder("donor.registrations.total")
                .description("Total donor registrations")
                .register(meterRegistry);
        
        this.receiverRegistrationCounter = Counter.builder("receiver.registrations.total")
                .description("Total receiver registrations")
                .register(meterRegistry);
        
        this.loginAttemptCounter = Counter.builder("login.attempts.total")
                .description("Total login attempts")
                .register(meterRegistry);
        
        this.loginSuccessCounter = Counter.builder("login.success.total")
                .description("Successful logins")
                .register(meterRegistry);

        this.userInteractionCounter = Counter.builder("user.interactions.total")
                .description("User interactions from frontend")
                .register(meterRegistry);
    }

    public void incrementUserRegistration() {
        userRegistrationCounter.increment();
    }

    public void incrementDonorRegistration() {
        donorRegistrationCounter.increment();
    }

    public void incrementReceiverRegistration() {
        receiverRegistrationCounter.increment();
    }

    public void incrementLoginAttempt() {
        loginAttemptCounter.increment();
    }

    public void incrementLoginSuccess() {
        loginSuccessCounter.increment();
    }

    public void incrementUserInteraction(String action, String component) {
        Counter.builder("user.interactions.total")
                .tag("action", action)
                .tag("component", component)
                .register(meterRegistry)
                .increment();
    }

     public void incrementAuthFailure(String reason) {
        Counter.builder("auth.failures")
                .description("Authentication failures")
                .tag("reason", reason)
                .register(meterRegistry)
                .increment();
    }

    public void incrementSecurityEvent(String eventType) {
        Counter.builder("security.events")
                .description("Security-related events")
                .tag("type", eventType)
                .register(meterRegistry)
                .increment();
    }
}
