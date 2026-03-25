package com.example.foodflow.service;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SystemHealthMetricsServiceTest {

    private MeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        new SystemHealthMetricsService(meterRegistry);
    }

    @Test
    void constructor_RegistersDiskFreeRatioGauge() {
        Gauge gauge = meterRegistry.find("foodflow.disk.free.ratio").gauge();
        assertThat(gauge).isNotNull();
    }

    @Test
    void constructor_RegistersDiskFreeBytesGauge() {
        Gauge gauge = meterRegistry.find("foodflow.disk.free.bytes").gauge();
        assertThat(gauge).isNotNull();
    }

    @Test
    void constructor_RegistersDiskTotalBytesGauge() {
        Gauge gauge = meterRegistry.find("foodflow.disk.total.bytes").gauge();
        assertThat(gauge).isNotNull();
    }

    @Test
    void constructor_RegistersJvmHeapUsedRatioGauge() {
        Gauge gauge = meterRegistry.find("foodflow.jvm.heap.used.ratio").gauge();
        assertThat(gauge).isNotNull();
    }

    @Test
    void diskFreeRatioGauge_ValueBetweenZeroAndOne() {
        Gauge gauge = meterRegistry.find("foodflow.disk.free.ratio").gauge();
        assertThat(gauge.value()).isBetween(0.0, 1.0);
    }

    @Test
    void diskFreeBytesGauge_ValueIsPositive() {
        Gauge gauge = meterRegistry.find("foodflow.disk.free.bytes").gauge();
        assertThat(gauge.value()).isPositive();
    }

    @Test
    void diskTotalBytesGauge_ValueIsPositive() {
        Gauge gauge = meterRegistry.find("foodflow.disk.total.bytes").gauge();
        assertThat(gauge.value()).isPositive();
    }

    @Test
    void jvmHeapUsedRatioGauge_ValueBetweenZeroAndOne() {
        Gauge gauge = meterRegistry.find("foodflow.jvm.heap.used.ratio").gauge();
        assertThat(gauge.value()).isBetween(0.0, 1.0);
    }

    @Test
    void diskFreeRatio_IsLessThanOrEqualToOne() {
        Gauge freeRatio = meterRegistry.find("foodflow.disk.free.ratio").gauge();
        Gauge freeBytes = meterRegistry.find("foodflow.disk.free.bytes").gauge();
        Gauge totalBytes = meterRegistry.find("foodflow.disk.total.bytes").gauge();
        assertThat(freeBytes.value()).isLessThanOrEqualTo(totalBytes.value());
        assertThat(freeRatio.value()).isLessThanOrEqualTo(1.0);
    }
}
