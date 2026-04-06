package com.example.foodflow.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.example.foodflow.security.JwtAuthenticationFilter;
import org.springframework.http.HttpMethod;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    @Value("${spring.web.cors.allowed-origins:http://localhost:3000}")
    private String corsAllowedOrigins;

    // Inject the existing JwtAuthenticationFilter
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> response
                                .sendError(HttpServletResponse.SC_UNAUTHORIZED))
                        .accessDeniedHandler((request, response, accessDeniedException) -> response
                                .sendError(HttpServletResponse.SC_FORBIDDEN)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public endpoints
                        .requestMatchers("/api/auth/resend-verification-email").authenticated()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/files/**").permitAll() // Files uploaded by users (immutable)
                        .requestMatchers("/uploads/**").permitAll() // Legacy uploaded file access
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/api/analytics/**").permitAll()
                        .requestMatchers("/ws/**").permitAll() // WebSocket connections
                        // Calendar OAuth callback (public for Google redirect)
                        .requestMatchers("/api/calendar/oauth/google/callback").permitAll()
                        // Messaging and calendar endpoints - authenticated users only
                        .requestMatchers("/api/conversations/**").hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")
                        .requestMatchers("/api/messages/**").hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")
                        .requestMatchers("/api/calendar/**").hasAnyAuthority("DONOR", "RECEIVER")
                        // Surplus endpoints with role-based restrictions
                        .requestMatchers(HttpMethod.POST, "/api/surplus").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.POST, "/api/surplus/*/evidence").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/surplus/**").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.GET, "/api/surplus").hasAuthority("RECEIVER")
                        .requestMatchers(HttpMethod.GET, "/api/surplus/my-posts").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.POST, "/api/surplus/search").hasAuthority("RECEIVER")
                        .requestMatchers(HttpMethod.GET, "/api/surplus/search").hasAuthority("RECEIVER")
                        .requestMatchers(HttpMethod.GET, "/api/surplus/{id}").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.PUT, "/api/surplus/{id}").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/surplus/{id}/complete").hasAuthority("DONOR")
                        // Claims endpoints
                        .requestMatchers(HttpMethod.GET, "/api/claims/post/**").hasAnyAuthority("DONOR", "RECEIVER")
                        .requestMatchers("/api/claims/**").hasAuthority("RECEIVER")
                        // User preferences and profile
                        .requestMatchers("/api/receiver/preferences/**").hasAuthority("RECEIVER")
                        .requestMatchers("/api/receiver/saved/**").hasAuthority("RECEIVER")
                        .requestMatchers(HttpMethod.PUT, "/api/profile/**")
                        .hasAnyAuthority("RECEIVER", "DONOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/profile/**")
                        .hasAnyAuthority("RECEIVER", "DONOR", "ADMIN")
                        // Reports and donations
                        .requestMatchers("/api/reports/**").hasAnyAuthority("ADMIN", "DONOR", "RECEIVER")
                        .requestMatchers("/api/donations/stats/**").hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")
                        .requestMatchers("/api/donations/badge/**").hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")
                        .requestMatchers("/api/donations/privacy/**").hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")
                        .requestMatchers("/api/donations/profile/*/public")
                        .hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")
                        // Other authenticated endpoints
                        .requestMatchers("/api/feed/**").hasAuthority("RECEIVER")
                        .requestMatchers("/api/requests/**").hasAnyAuthority("DONOR", "RECEIVER")
                        // All other requests require authentication
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> allowedOrigins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        // Restrict headers to only necessary ones, not wildcard (*)
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight requests for 1 hour
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
