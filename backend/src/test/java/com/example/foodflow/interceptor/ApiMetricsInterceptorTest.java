package com.example.foodflow.interceptor;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class ApiMetricsInterceptorTest {

    private MeterRegistry meterRegistry;
    private ApiMetricsInterceptor interceptor;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        interceptor = new ApiMetricsInterceptor(meterRegistry);
    }

    @Test
    void preHandle_SetsStartTimeAttribute() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean result = interceptor.preHandle(request, response, new Object());

        assertThat(result).isTrue();
        assertThat(request.getAttribute("startTime")).isNotNull();
        assertThat((Long) request.getAttribute("startTime")).isPositive();
    }

    @Test
    void afterCompletion_NullStartTime_RecordsNoMetrics() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(200);

        interceptor.afterCompletion(request, response, new Object(), null);

        assertThat(meterRegistry.find("http.server.requests.count").counter()).isNull();
    }

    @Test
    void afterCompletion_2xxResponse_RecordsSuccessOutcome() {
        MockHttpServletRequest request = buildRequest("GET", "/api/test");
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(200);
        interceptor.preHandle(request, response, new Object());

        interceptor.afterCompletion(request, response, new Object(), null);

        Counter health = meterRegistry.find("http.server.requests.health").tag("outcome", "SUCCESS").counter();
        assertThat(health).isNotNull();
        assertThat(health.count()).isEqualTo(1.0);
    }

    @Test
    void afterCompletion_4xxResponse_RecordsFailureOutcome() {
        MockHttpServletRequest request = buildRequest("GET", "/api/missing");
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(404);
        interceptor.preHandle(request, response, new Object());

        interceptor.afterCompletion(request, response, new Object(), null);

        Counter health = meterRegistry.find("http.server.requests.health").tag("outcome", "FAILURE").counter();
        assertThat(health).isNotNull();
        assertThat(health.count()).isEqualTo(1.0);
    }

    @Test
    void afterCompletion_5xxResponse_RecordsFailureOutcome() {
        MockHttpServletRequest request = buildRequest("POST", "/api/crash");
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(500);
        interceptor.preHandle(request, response, new Object());

        interceptor.afterCompletion(request, response, new Object(), null);

        Counter health = meterRegistry.find("http.server.requests.health").tag("outcome", "FAILURE").counter();
        assertThat(health).isNotNull();
        assertThat(health.count()).isEqualTo(1.0);
    }

    @Test
    void afterCompletion_RecordsRequestDurationsAndCounts() {
        MockHttpServletRequest request = buildRequest("GET", "/api/surplus");
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(200);
        interceptor.preHandle(request, response, new Object());

        interceptor.afterCompletion(request, response, new Object(), null);

        Counter count = meterRegistry.find("http.server.requests.count")
                .tag("method", "GET")
                .tag("uri", "/api/surplus")
                .tag("status", "200")
                .counter();
        assertThat(count).isNotNull();
        assertThat(count.count()).isEqualTo(1.0);
    }

    // --- helpers ---

    private MockHttpServletRequest buildRequest(String method, String uri) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setMethod(method);
        req.setRequestURI(uri);
        return req;
    }
}
