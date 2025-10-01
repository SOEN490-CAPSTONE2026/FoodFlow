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
}