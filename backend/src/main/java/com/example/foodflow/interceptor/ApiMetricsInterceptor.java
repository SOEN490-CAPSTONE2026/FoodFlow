package com.example.foodflow.interceptor;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Intercepts every HTTP request to record timing and outcome metrics.
 *
 * Custom alert metric registered here:
 *   foodflow.http.error.rate – live ratio of 4xx+5xx responses to total responses.
 *                               Alert fires when this exceeds 0.05 (5%).
 */
@Component
public class ApiMetricsInterceptor implements HandlerInterceptor {

    private final MeterRegistry meterRegistry;

    // Counters backing the foodflow.http.error.rate gauge
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong errorRequests = new AtomicLong(0);

    public ApiMetricsInterceptor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        Gauge.builder("foodflow.http.error.rate", this,
                        interceptor -> {
                            long total = interceptor.totalRequests.get();
                            return total == 0 ? 0.0
                                    : (double) interceptor.errorRequests.get() / total;
                        })
                .description("Ratio of HTTP 4xx+5xx responses to total responses (alert threshold: >0.05)")
                .register(meterRegistry);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute("startTime", System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Long startTime = (Long) request.getAttribute("startTime");
        if (startTime == null) return;

        long durationMs = System.currentTimeMillis() - startTime;

        // Timer for request latency
        Timer.builder("http.server.requests.duration")
                .description("HTTP request duration")
                .tag("method", request.getMethod())
                .tag("uri", request.getRequestURI())
                .tag("status", String.valueOf(response.getStatus()))
                .register(meterRegistry)
                .record(durationMs, java.util.concurrent.TimeUnit.MILLISECONDS);

        // Counter for requests per endpoint/status
        Counter.builder("http.server.requests.count")
                .description("HTTP requests count")
                .tag("method", request.getMethod())
                .tag("uri", request.getRequestURI())
                .tag("status", String.valueOf(response.getStatus()))
                .register(meterRegistry)
                .increment();

        // Counter for system health
        String outcome = response.getStatus() < 400 ? "SUCCESS" : "FAILURE";
        Counter.builder("http.server.requests.health")
                .description("Overall system request health")
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();

        // Update atomics backing the foodflow.http.error.rate gauge
        totalRequests.incrementAndGet();
        if (response.getStatus() >= 400) {
            errorRequests.incrementAndGet();
        }
    }
}
