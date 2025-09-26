package com.example.foodflow.interceptor;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import io.micrometer.core.instrument.Tags;

@Component
public class ApiMetricsInterceptor implements HandlerInterceptor {

    private final MeterRegistry meterRegistry;
    private final Timer responseTimer;
    private final Counter requestCounter;

    public ApiMetricsInterceptor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.responseTimer = Timer.builder("http.server.requests")
                .description("HTTP request duration")
                .register(meterRegistry);
        this.requestCounter = Counter.builder("http.server.requests.count")
                .description("HTTP request count")
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
        if (startTime != null) {
            long duration = System.currentTimeMillis() - startTime;
            
            Timer.Sample sample = Timer.start(meterRegistry);
            sample.stop(Timer.builder("http.server.requests")
                    .tag("method", request.getMethod())
                    .tag("uri", request.getRequestURI())
                    .tag("status", String.valueOf(response.getStatus()))
                    .register(meterRegistry));

            // Create a tagged counter and increment it
            Counter.builder("http.server.requests.count")
                    .tag("method", request.getMethod())
                    .tag("uri", request.getRequestURI())
                    .tag("status", String.valueOf(response.getStatus()))
                    .register(meterRegistry)
                    .increment();
        }
    }

}
