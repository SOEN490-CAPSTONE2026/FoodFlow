package com.example.foodflow.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.Counter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import com.example.foodflow.interceptor.ApiMetricsInterceptor;

@Configuration
public class MetricsConfig implements WebMvcConfigurer {

    private final ApiMetricsInterceptor apiMetricsInterceptor;

    public MetricsConfig(ApiMetricsInterceptor apiMetricsInterceptor) {
        this.apiMetricsInterceptor = apiMetricsInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(apiMetricsInterceptor);
    }

    @Bean
    public Timer apiResponseTimer(MeterRegistry meterRegistry) {
        return Timer.builder("api.response.time")
                .description("API response time")
                .register(meterRegistry);
    }

    @Bean
    public Counter apiRequestCounter(MeterRegistry meterRegistry) {
        return Counter.builder("api.requests.total")
                .description("Total API requests")
                .register(meterRegistry);
    }

    @Bean
    public Counter surplusPostCreatedCounter(MeterRegistry meterRegistry) {
        return Counter.builder("surplus.posts.created")
                .description("Total surplus food posts created")
                .tag("type", "created")
                .register(meterRegistry);
    }

    @Bean
    public Counter surplusPostClaimedCounter(MeterRegistry meterRegistry) {
        return Counter.builder("surplus.posts.claimed")
                .description("Total surplus posts claimed")
                .tag("type", "claimed")
                .register(meterRegistry);
    }

    @Bean
    public Counter surplusPostCompletedCounter(MeterRegistry meterRegistry) {
        return Counter.builder("surplus.posts.completed")
                .description("Total surplus posts completed")
                .tag("type", "completed")
                .register(meterRegistry);
    }

    // Business Metrics - Claims
    @Bean
    public Counter claimCreatedCounter(MeterRegistry meterRegistry) {
        return Counter.builder("claims.created")
                .description("Total claims created")
                .register(meterRegistry);
    }

    @Bean
    public Counter claimCancelledCounter(MeterRegistry meterRegistry) {
        return Counter.builder("claims.cancelled")
                .description("Total claims cancelled")
                .register(meterRegistry);
    }

    @Bean
    public Counter claimCompletedCounter(MeterRegistry meterRegistry) {
        return Counter.builder("claims.completed")
                .description("Total claims completed")
                .register(meterRegistry);
    }

    // Business Metrics - Messages
    @Bean
    public Counter messagesSentCounter(MeterRegistry meterRegistry) {
        return Counter.builder("messages.sent")
                .description("Total messages sent")
                .register(meterRegistry);
    }

    @Bean
    public Counter messagesReceivedCounter(MeterRegistry meterRegistry) {
        return Counter.builder("messages.received")
                .description("Total messages received")
                .register(meterRegistry);
    }

    // Security Metrics
    @Bean
    public Counter authFailureCounter(MeterRegistry meterRegistry) {
        return Counter.builder("auth.failures")
                .description("Total authentication failures")
                .register(meterRegistry);
    }

    @Bean
    public Counter securityEventCounter(MeterRegistry meterRegistry) {
        return Counter.builder("security.events")
                .description("Security-related events")
                .register(meterRegistry);
    }

    // Database Metrics - Query Performance Timer
    @Bean
    public Timer databaseQueryTimer(MeterRegistry meterRegistry) {
        return Timer.builder("database.query.duration")
                .description("Database query execution time")
                .register(meterRegistry);
    }

    @Bean
    public Timer databaseTransactionTimer(MeterRegistry meterRegistry) {
        return Timer.builder("database.transaction.duration")
                .description("Database transaction duration")
                .register(meterRegistry);
    }
}