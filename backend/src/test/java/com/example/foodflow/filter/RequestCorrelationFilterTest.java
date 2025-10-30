package com.example.foodflow.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RequestCorrelationFilterTest {

    private RequestCorrelationFilter filter;

    @Mock
    private FilterChain filterChain;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        filter = new RequestCorrelationFilter();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        MDC.clear();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    void shouldGenerateCorrelationIdWhenNotPresent() throws ServletException, IOException {
        // Given
        request.setMethod("GET");
        request.setRequestURI("/api/surplus");
        request.setRemoteAddr("192.168.1.100");

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        String correlationId = response.getHeader("X-Correlation-ID");
        assertNotNull(correlationId, "Correlation ID should be generated");
        assertTrue(correlationId.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"),
                "Correlation ID should be a valid UUID");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldUseExistingCorrelationIdFromHeader() throws ServletException, IOException {
        // Given
        String existingCorrelationId = "test-correlation-id-12345";
        request.addHeader("X-Correlation-ID", existingCorrelationId);
        request.setMethod("POST");
        request.setRequestURI("/api/auth/login");
        request.setRemoteAddr("10.0.0.1");

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        String responseCorrelationId = response.getHeader("X-Correlation-ID");
        assertEquals(existingCorrelationId, responseCorrelationId,
                "Should use existing correlation ID from request header");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldSetMdcValuesCorrectly() throws ServletException, IOException {
        // Given
        request.setMethod("PUT");
        request.setRequestURI("/api/surplus/123");
        request.setRemoteAddr("172.16.0.50");

        // When
        filter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest servletRequest,
                                 jakarta.servlet.ServletResponse servletResponse) {
                // Verify MDC values are set during filter execution
                assertNotNull(MDC.get("correlationId"), "Correlation ID should be in MDC");
                assertEquals("172.16.0.50", MDC.get("ipAddress"), "IP address should be in MDC");
                assertEquals("/api/surplus/123", MDC.get("requestPath"), "Request path should be in MDC");
                assertEquals("PUT", MDC.get("requestMethod"), "Request method should be in MDC");
            }
        });

        // Then - verify filterChain was called
        // (verification is done inside the mock FilterChain above)
    }

    @Test
    void shouldClearMdcAfterRequest() throws ServletException, IOException {
        // Given
        request.setMethod("DELETE");
        request.setRequestURI("/api/surplus/456");
        request.setRemoteAddr("192.168.1.200");

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then - MDC should be cleared after request
        assertNull(MDC.get("correlationId"), "Correlation ID should be cleared from MDC");
        assertNull(MDC.get("ipAddress"), "IP address should be cleared from MDC");
        assertNull(MDC.get("requestPath"), "Request path should be cleared from MDC");
        assertNull(MDC.get("requestMethod"), "Request method should be cleared from MDC");
        assertNull(MDC.get("userId"), "User ID should be cleared from MDC");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldUseXForwardedForHeaderWhenPresent() throws ServletException, IOException {
        // Given
        String clientIp = "203.0.113.195";
        request.addHeader("X-Forwarded-For", clientIp);
        request.setMethod("GET");
        request.setRequestURI("/api/claims");
        request.setRemoteAddr("10.0.0.1"); // This should be ignored

        // When
        filter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest servletRequest,
                                 jakarta.servlet.ServletResponse servletResponse) {
                // Verify the X-Forwarded-For IP is used
                assertEquals(clientIp, MDC.get("ipAddress"),
                        "Should use X-Forwarded-For header when present");
            }
        });

        // Then - verification done in mock FilterChain above
        verify(filterChain, never()).doFilter(request, response); // It was called in the mock above
    }

    @Test
    void shouldHandleXForwardedForWithMultipleIps() throws ServletException, IOException {
        // Given - X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2)
        String forwardedForHeader = "203.0.113.195, 70.41.3.18, 150.172.238.178";
        request.addHeader("X-Forwarded-For", forwardedForHeader);
        request.setMethod("GET");
        request.setRequestURI("/api/surplus");
        request.setRemoteAddr("10.0.0.1");

        // When
        filter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest servletRequest,
                                 jakarta.servlet.ServletResponse servletResponse) {
                // Verify the first IP (actual client) is used
                assertEquals("203.0.113.195", MDC.get("ipAddress"),
                        "Should use first IP from X-Forwarded-For (actual client)");
            }
        });
    }

    @Test
    void shouldHandleEmptyXForwardedForHeader() throws ServletException, IOException {
        // Given
        request.addHeader("X-Forwarded-For", "");
        request.setMethod("GET");
        request.setRequestURI("/api/surplus");
        request.setRemoteAddr("192.168.1.100");

        // When
        filter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest servletRequest,
                                 jakarta.servlet.ServletResponse servletResponse) {
                // Should fall back to remote address
                assertEquals("192.168.1.100", MDC.get("ipAddress"),
                        "Should use remote address when X-Forwarded-For is empty");
            }
        });
    }

    @Test
    void shouldLogRequestStartAndCompletion() throws ServletException, IOException {
        // Given
        request.setMethod("POST");
        request.setRequestURI("/api/auth/register");
        request.setRemoteAddr("192.168.1.150");

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        // Note: We can't easily verify log statements without a logging framework mock,
        // but we can verify the filter executed without errors
        assertNotNull(response.getHeader("X-Correlation-ID"));
    }

    @Test
    void shouldHandleFilterChainException() throws ServletException, IOException {
        // Given
        request.setMethod("GET");
        request.setRequestURI("/api/surplus");
        request.setRemoteAddr("192.168.1.100");

        ServletException expectedException = new ServletException("Filter chain error");
        doThrow(expectedException).when(filterChain).doFilter(request, response);

        // When/Then
        assertThrows(ServletException.class, () -> {
            filter.doFilterInternal(request, response, filterChain);
        });

        // MDC should still be cleared even after exception
        assertNull(MDC.get("correlationId"), "MDC should be cleared even after exception");
        assertNull(MDC.get("ipAddress"), "MDC should be cleared even after exception");
    }

    @Test
    void shouldHandleNullRemoteAddr() throws ServletException, IOException {
        // Given
        request.setMethod("GET");
        request.setRequestURI("/api/surplus");
        request.setRemoteAddr(null);

        // When
        filter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest servletRequest,
                                 jakarta.servlet.ServletResponse servletResponse) {
                // Should handle null gracefully
                String ipAddress = MDC.get("ipAddress");
                assertTrue(ipAddress == null || ipAddress.equals("unknown"),
                        "Should handle null remote address gracefully");
            }
        });
    }

    @Test
    void shouldSetResponseHeaderBeforeFilterChain() throws ServletException, IOException {
        // Given
        request.setMethod("GET");
        request.setRequestURI("/api/surplus");
        request.setRemoteAddr("192.168.1.100");

        // When
        filter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest servletRequest,
                                 jakarta.servlet.ServletResponse servletResponse) {
                // Response header should be set before filter chain executes
                MockHttpServletResponse mockResponse = (MockHttpServletResponse) servletResponse;
                assertNotNull(mockResponse.getHeader("X-Correlation-ID"),
                        "Correlation ID header should be set before filter chain");
            }
        });
    }

    @Test
    void shouldHandleDifferentRequestMethods() throws ServletException, IOException {
        // Test GET
        testRequestMethod("GET", "/api/surplus");

        // Reset
        setUp();

        // Test POST
        testRequestMethod("POST", "/api/auth/login");

        // Reset
        setUp();

        // Test PUT
        testRequestMethod("PUT", "/api/surplus/123");

        // Reset
        setUp();

        // Test DELETE
        testRequestMethod("DELETE", "/api/surplus/123");

        // Reset
        setUp();

        // Test PATCH
        testRequestMethod("PATCH", "/api/surplus/123");
    }

    private void testRequestMethod(String method, String uri) throws ServletException, IOException {
        request.setMethod(method);
        request.setRequestURI(uri);
        request.setRemoteAddr("192.168.1.100");

        filter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest servletRequest,
                                 jakarta.servlet.ServletResponse servletResponse) {
                assertEquals(method, MDC.get("requestMethod"),
                        "Request method should be correctly set in MDC");
                assertEquals(uri, MDC.get("requestPath"),
                        "Request path should be correctly set in MDC");
            }
        });
    }

    @Test
    void shouldHandleLongRequestPaths() throws ServletException, IOException {
        // Given
        String longPath = "/api/surplus/123/claims/456/conversations/789/messages?page=1&size=20&sort=createdAt,desc";
        request.setMethod("GET");
        request.setRequestURI(longPath);
        request.setRemoteAddr("192.168.1.100");

        // When
        filter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest servletRequest,
                                 jakarta.servlet.ServletResponse servletResponse) {
                assertEquals(longPath, MDC.get("requestPath"),
                        "Should handle long request paths correctly");
            }
        });
    }

    @Test
    void shouldHandleSpecialCharactersInPath() throws ServletException, IOException {
        // Given
        String pathWithSpecialChars = "/api/search?query=test%20value&filter=type%3Dfood";
        request.setMethod("GET");
        request.setRequestURI(pathWithSpecialChars);
        request.setRemoteAddr("192.168.1.100");

        // When
        filter.doFilterInternal(request, response, new FilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest servletRequest,
                                 jakarta.servlet.ServletResponse servletResponse) {
                assertEquals(pathWithSpecialChars, MDC.get("requestPath"),
                        "Should handle special characters in path");
            }
        });
    }
}
