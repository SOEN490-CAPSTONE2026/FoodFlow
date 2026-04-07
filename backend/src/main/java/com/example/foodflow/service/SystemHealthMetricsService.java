package com.example.foodflow.service;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;
import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
/**
 * Registers custom Prometheus gauges for system-level health conditions:
 *   - foodflow.disk.free.ratio    : free / total disk space (triggers alert when < 0.10)
 *   - foodflow.jvm.heap.used.ratio: used / max JVM heap    (triggers alert when > 0.85)
 *
 * Both gauges are evaluated live on each Prometheus scrape — no scheduled update needed.
 */
@Service
public class SystemHealthMetricsService {
    public SystemHealthMetricsService(MeterRegistry meterRegistry) {
        registerDiskMetrics(meterRegistry);
        registerMemoryMetrics(meterRegistry);
    }
    private void registerDiskMetrics(MeterRegistry meterRegistry) {
        File root = new File(File.separator);
        Gauge.builder("foodflow.disk.free.ratio", root,
                        f -> {
                            long total = f.getTotalSpace();
                            return total == 0 ? 1.0 : (double) f.getFreeSpace() / total;
                        })
                .description("Ratio of free disk space to total disk space (1=empty, 0=full)")
                .register(meterRegistry);
        Gauge.builder("foodflow.disk.free.bytes", root, File::getFreeSpace)
                .description("Free disk space in bytes")
                .baseUnit("bytes")
                .register(meterRegistry);
        Gauge.builder("foodflow.disk.total.bytes", root, File::getTotalSpace)
                .description("Total disk space in bytes")
                .baseUnit("bytes")
                .register(meterRegistry);
    }
    private void registerMemoryMetrics(MeterRegistry meterRegistry) {
        MemoryMXBean memBean = ManagementFactory.getMemoryMXBean();
        Gauge.builder("foodflow.jvm.heap.used.ratio", memBean,
                        bean -> {
                            long max = bean.getHeapMemoryUsage().getMax();
                            return max <= 0 ? 0.0 : (double) bean.getHeapMemoryUsage().getUsed() / max;
                        })
                .description("Ratio of JVM heap memory used to configured max (0=empty, 1=full)")
                .register(meterRegistry);
    }
}
