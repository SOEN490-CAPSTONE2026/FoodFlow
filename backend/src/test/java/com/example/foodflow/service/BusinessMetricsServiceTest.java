package com.example.foodflow.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BusinessMetricsServiceTest {

    private MeterRegistry meterRegistry;
    private BusinessMetricsService businessMetricsService;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        businessMetricsService = new BusinessMetricsService(meterRegistry);
    }

    @Test
    void incrementPaymentCreated_Success() {
        businessMetricsService.incrementPaymentCreated();
        
        Counter counter = meterRegistry.find("payments.created").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementPaymentSucceeded_Success() {
        businessMetricsService.incrementPaymentSucceeded();
        
        Counter counter = meterRegistry.find("payments.succeeded").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementPaymentFailed_Success() {
        businessMetricsService.incrementPaymentFailed();
        
        Counter counter = meterRegistry.find("payments.failed").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementRefundProcessed_Success() {
        businessMetricsService.incrementRefundProcessed();
        
        Counter counter = meterRegistry.find("refunds.processed").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementPaymentByType_Success() {
        businessMetricsService.incrementPaymentByType("ONE_TIME");
        
        Counter counter = meterRegistry.find("payments.by.type")
                .tag("type", "ONE_TIME")
                .counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementPaymentByCurrency_Success() {
        businessMetricsService.incrementPaymentByCurrency("USD");
        
        Counter counter = meterRegistry.find("payments.by.currency")
                .tag("currency", "USD")
                .counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void multipleIncrements_AccumulateCorrectly() {
        businessMetricsService.incrementPaymentCreated();
        businessMetricsService.incrementPaymentCreated();
        businessMetricsService.incrementPaymentCreated();
        
        Counter counter = meterRegistry.find("payments.created").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(3.0);
    }
}
