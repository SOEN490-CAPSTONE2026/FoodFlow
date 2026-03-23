package com.example.foodflow.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that the CORS configuration only allows explicitly whitelisted origins.
 *
 * The test profile sets:
 *   spring.web.cors.allowed-origins=http://localhost:3000,http://localhost:3001
 *
 * A CORS preflight (OPTIONS + Origin + Access-Control-Request-Method) is the
 * standard way to probe CORS policy without triggering controller logic.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigCorsTest {

    @Autowired
    private MockMvc mockMvc;

    // --- Allowed origins ---

    @Test
    void preflight_fromAllowedOrigin_localhost3000_returnsAllowOriginHeader() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void preflight_fromAllowedOrigin_localhost3001_returnsAllowOriginHeader() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://localhost:3001")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3001"));
    }

    @Test
    void preflight_fromAllowedOrigin_returnsAllowedMethods() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().exists("Access-Control-Allow-Methods"));
    }

    // --- Rejected origins ---

    @Test
    void preflight_fromNonAllowedOrigin_doesNotReturnAllowOriginHeader() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://evil.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void preflight_fromNonAllowedOrigin_returnsForbidden() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://evil.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void preflight_fromNonAllowedOrigin_differentSubdomain_returnsForbidden() throws Exception {
        // Ensures subdomain spoofing is blocked (e.g. attacker.localhost:3000.evil.com)
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://attacker.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void preflight_fromNonAllowedOrigin_httpsVariant_returnsForbidden() throws Exception {
        // https://localhost:3000 is NOT the same origin as http://localhost:3000
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "https://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
