package com.example.foodflow.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter to add correlation IDs and contextual information to MDC (Mapped Diagnostic Context)
 * for all HTTP requests. This enables request tracking across the application through logs.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestCorrelationFilter.class);
    
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String MDC_CORRELATION_ID = "correlationId";
    private static final String MDC_USER_ID = "userId";
    private static final String MDC_IP_ADDRESS = "ipAddress";
    private static final String MDC_REQUEST_PATH = "requestPath";
    private static final String MDC_REQUEST_METHOD = "requestMethod";

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Generate or retrieve correlation ID
            String correlationId = getOrGenerateCorrelationId(request);
            MDC.put(MDC_CORRELATION_ID, correlationId);
            
            // Add correlation ID to response header for client tracking
            response.setHeader(CORRELATION_ID_HEADER, correlationId);
            
            // Extract and add IP address
            String ipAddress = extractIpAddress(request);
            MDC.put(MDC_IP_ADDRESS, ipAddress);
            
            // Add request path and method
            MDC.put(MDC_REQUEST_PATH, request.getRequestURI());
            MDC.put(MDC_REQUEST_METHOD, request.getMethod());
            
            // Extract user ID from JWT if available (will be set by JwtAuthenticationFilter later in chain)
            // For now, we'll set it as "anonymous" and let the security filter update it
            MDC.put(MDC_USER_ID, "anonymous");
            
            // Log the incoming request
            log.info("Incoming request: {} {} from {}", 
                request.getMethod(), 
                request.getRequestURI(), 
                ipAddress);
            
            // Continue with the filter chain
            filterChain.doFilter(request, response);
            
            // Log the response
            long duration = System.currentTimeMillis() - startTime;
            log.info("Request completed: {} {} - Status: {} - Duration: {}ms",
                request.getMethod(),
                request.getRequestURI(),
                response.getStatus(),
                duration);
            
        } finally {
            // Clean up MDC to prevent memory leaks
            MDC.clear();
        }
    }

    /**
     * Get correlation ID from request header or generate a new one
     */
    private String getOrGenerateCorrelationId(HttpServletRequest request) {
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = UUID.randomUUID().toString();
        }
        return correlationId;
    }

    /**
     * Extract IP address from request, handling proxies and load balancers
     */
    private String extractIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        
        // X-Forwarded-For can contain multiple IPs, take the first one (original client)
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        
        return ipAddress != null ? ipAddress : "unknown";
    }

    /**
     * Helper method to update user ID in MDC (can be called from authentication filter)
     */
    public static void setUserId(String userId) {
        if (userId != null && !userId.isEmpty()) {
            MDC.put(MDC_USER_ID, userId);
        }
    }

    /**
     * Get current correlation ID from MDC
     */
    public static String getCorrelationId() {
        return MDC.get(MDC_CORRELATION_ID);
    }
}
