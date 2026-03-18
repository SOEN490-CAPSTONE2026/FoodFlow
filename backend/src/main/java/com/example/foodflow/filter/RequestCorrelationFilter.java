package com.example.foodflow.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Filter that assigns a correlation ID and request metadata into MDC for logging.
 */
public class RequestCorrelationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestCorrelationFilter.class);
    private static final String CORRELATION_HEADER = "X-Correlation-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = request.getHeader(CORRELATION_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        String ipAddress = resolveClientIp(request);

        MDC.put("correlationId", correlationId);
        MDC.put("ipAddress", ipAddress);
        MDC.put("requestPath", request.getRequestURI());
        MDC.put("requestMethod", request.getMethod());

        response.setHeader(CORRELATION_HEADER, correlationId);

        try {
            log.debug("Request start {} {} [{}]", request.getMethod(), request.getRequestURI(), correlationId);
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
            MDC.remove("ipAddress");
            MDC.remove("requestPath");
            MDC.remove("requestMethod");
            MDC.remove("userId");
            log.debug("Request end {} {} [{}]", request.getMethod(), request.getRequestURI(), correlationId);
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String[] parts = xForwardedFor.split(",");
            return parts[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }

        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    /**
     * Attach the authenticated user ID to MDC for downstream logging.
     */
    public static void setUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            MDC.remove("userId");
        } else {
            MDC.put("userId", userId);
        }
    }
}
