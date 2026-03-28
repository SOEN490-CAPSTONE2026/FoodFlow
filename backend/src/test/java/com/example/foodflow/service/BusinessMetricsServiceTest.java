package com.example.foodflow.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
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

    // --- Payment counters (pre-existing) ---

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
        Counter counter = meterRegistry.find("payments.by.type").tag("type", "ONE_TIME").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementPaymentByCurrency_Success() {
        businessMetricsService.incrementPaymentByCurrency("USD");
        Counter counter = meterRegistry.find("payments.by.currency").tag("currency", "USD").counter();
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

    // --- Release 3: Donation counters ---

    @Test
    void incrementDonationsCreated_RegistersAndIncrements() {
        businessMetricsService.incrementDonationsCreated();
        Counter counter = meterRegistry.find("donations.created.total").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementDonationsClaimed_RegistersAndIncrements() {
        businessMetricsService.incrementDonationsClaimed();
        Counter counter = meterRegistry.find("donations.claimed.total").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementDonationsCompleted_RegistersAndIncrements() {
        businessMetricsService.incrementDonationsCompleted();
        Counter counter = meterRegistry.find("donations.completed.total").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void recordFoodRescued_AccumulatesKg() {
        businessMetricsService.recordFoodRescued(2.5);
        businessMetricsService.recordFoodRescued(1.5);
        Counter counter = meterRegistry.find("food.rescued.kg.total").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(4.0);
    }

    @Test
    void recordDonationQuantity_RecordsInDistributionSummary() {
        businessMetricsService.recordDonationQuantity(3.0);
        businessMetricsService.recordDonationQuantity(7.0);
        DistributionSummary summary = meterRegistry.find("donation.quantity.distribution").summary();
        assertThat(summary).isNotNull();
        assertThat(summary.count()).isEqualTo(2);
        assertThat(summary.totalAmount()).isEqualTo(10.0);
    }

    // --- Release 3: Gauges ---

    @Test
    void setActiveUsers_UpdatesGauge() {
        businessMetricsService.setActiveUsers(42);
        Gauge gauge = meterRegistry.find("active_users").gauge();
        assertThat(gauge).isNotNull();
        assertThat(gauge.value()).isEqualTo(42.0);
    }

    @Test
    void setAvailableDonations_UpdatesGauge() {
        businessMetricsService.setAvailableDonations(15);
        Gauge gauge = meterRegistry.find("available_donations").gauge();
        assertThat(gauge).isNotNull();
        assertThat(gauge.value()).isEqualTo(15.0);
    }

    @Test
    void setPendingClaims_UpdatesGauge() {
        businessMetricsService.setPendingClaims(7);
        Gauge gauge = meterRegistry.find("pending_claims").gauge();
        assertThat(gauge).isNotNull();
        assertThat(gauge.value()).isEqualTo(7.0);
    }

    // --- Release 3: SMS counters ---

    @Test
    void incrementSmsSent_RegistersAndIncrements() {
        businessMetricsService.incrementSmsSent();
        Counter counter = meterRegistry.find("sms.sent.total").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementSmsFailed_RegistersAndIncrements() {
        businessMetricsService.incrementSmsFailed();
        Counter counter = meterRegistry.find("sms.failed.total").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    // --- Release 3: Slow query counter ---

    @Test
    void incrementSlowQuery_RegistersWithContextTag() {
        businessMetricsService.incrementSlowQuery("getUserById");
        Counter counter = meterRegistry.find("database.slow.queries.total")
                .tag("context", "getUserById").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    // --- Release 3: OpenAI counters ---

    @Test
    void incrementOpenAiCalls_RegistersSuccessTag() {
        businessMetricsService.incrementOpenAiCalls("chat_completion");
        Counter counter = meterRegistry.find("openai.api.calls.total")
                .tag("operation", "chat_completion").tag("status", "success").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void incrementOpenAiCallsFailed_RegistersFailedTag() {
        businessMetricsService.incrementOpenAiCallsFailed("chat_completion");
        Counter counter = meterRegistry.find("openai.api.calls.total")
                .tag("operation", "chat_completion").tag("status", "failed").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    // --- Release 3: Timers ---

    @Test
    void recordDonationCreationDuration_RecordsTimer() {
        Timer.Sample sample = businessMetricsService.startTimer();
        businessMetricsService.recordDonationCreationDuration(sample);
        Timer timer = meterRegistry.find("donation.creation.duration").timer();
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1);
    }

    @Test
    void recordClaimProcessingDuration_RecordsTimer() {
        Timer.Sample sample = businessMetricsService.startTimer();
        businessMetricsService.recordClaimProcessingDuration(sample);
        Timer timer = meterRegistry.find("claim.processing.duration").timer();
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1);
    }

    @Test
    void recordEmailDeliveryDuration_RecordsTimer() {
        Timer.Sample sample = businessMetricsService.startTimer();
        businessMetricsService.recordEmailDeliveryDuration(sample);
        Timer timer = meterRegistry.find("email.delivery.duration").timer();
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1);
    }

    @Test
    void recordSmsDeliveryDuration_RecordsTimer() {
        Timer.Sample sample = businessMetricsService.startTimer();
        businessMetricsService.recordSmsDeliveryDuration(sample);
        Timer timer = meterRegistry.find("sms.delivery.duration").timer();
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1);
    }

    @Test
    void recordOpenAiDuration_RecordsTimerWithOperationTag() {
        Timer.Sample sample = businessMetricsService.startTimer();
        businessMetricsService.recordOpenAiDuration(sample, "chat_completion");
        Timer timer = meterRegistry.find("openai.api.duration").tag("operation", "chat_completion").timer();
        assertThat(timer).isNotNull();
        assertThat(timer.count()).isEqualTo(1);
    }
}
