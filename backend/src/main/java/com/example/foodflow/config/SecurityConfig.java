package com.example.foodflow.config;

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

import com.example.foodflow.security.JwtAuthenticationFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

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
                .authenticationEntryPoint((request, response, authException) ->
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                .accessDeniedHandler((request, response, accessDeniedException) ->
                    response.sendError(HttpServletResponse.SC_FORBIDDEN)))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/resend-verification-email").authenticated()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/files/**").permitAll()  // Allow access to uploaded files
                .requestMatchers("/uploads/**").permitAll()  // Allow access to legacy upload URLs
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api/analytics/**").permitAll()
                .requestMatchers("/ws/**").permitAll()  // Allow WebSocket connections
                
                // Messaging endpoints - must be accessible to all authenticated users
                .requestMatchers("/api/conversations/**").hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")
                .requestMatchers("/api/messages/**").hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")
                
                // Surplus endpoints with proper role restrictions
                .requestMatchers(HttpMethod.POST, "/api/surplus").hasAuthority("DONOR")
                .requestMatchers(HttpMethod.POST, "/api/surplus/*/evidence").hasAuthority("DONOR")
                .requestMatchers(HttpMethod.GET, "/api/surplus").hasAuthority("RECEIVER")
                .requestMatchers(HttpMethod.GET, "/api/surplus/my-posts").hasAuthority("DONOR")
                .requestMatchers(HttpMethod.DELETE, "/api/surplus/**").hasAuthority("DONOR")

                        // Messaging endpoints - must be accessible to all authenticated users
                        .requestMatchers("/api/conversations/**").hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")
                        .requestMatchers("/api/messages/**").hasAnyAuthority("DONOR", "RECEIVER", "ADMIN")

                        // Surplus endpoints with proper role restrictions
                        .requestMatchers(HttpMethod.POST, "/api/surplus").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.POST, "/api/surplus/*/evidence").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.GET, "/api/surplus").hasAuthority("RECEIVER")
                        .requestMatchers(HttpMethod.GET, "/api/surplus/my-posts").hasAuthority("DONOR")
                        // Search endpoints must come before {id} patterns
                        .requestMatchers(HttpMethod.POST, "/api/surplus/search").hasAuthority("RECEIVER")
                        .requestMatchers(HttpMethod.GET, "/api/surplus/search").hasAuthority("RECEIVER")
                        // Path variable endpoints
                        .requestMatchers(HttpMethod.GET, "/api/surplus/{id}").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.PUT, "/api/surplus/{id}").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/surplus/{id}/complete").hasAuthority("DONOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/surplus/**").hasAuthority("DONOR")

                        // Claims endpoints
                        .requestMatchers(HttpMethod.GET, "/api/claims/post/**").hasAnyAuthority("DONOR", "RECEIVER")
                        .requestMatchers("/api/claims/**").hasAuthority("RECEIVER")

                        // Receiver Preferences endpoints
                        .requestMatchers("/api/receiver/preferences/**").hasAuthority("RECEIVER")

                        // Reports/Disputes endpoints - TEMPORARILY permitAll for debugging
                        .requestMatchers("/api/reports/**").permitAll()

                        // Other endpoints
                        .requestMatchers("/api/feed/**").hasAuthority("RECEIVER")
                        .requestMatchers("/api/requests/**").hasAnyAuthority("DONOR", "RECEIVER")

                        // Admin API endpoints
                        .requestMatchers("/api/admin/**").hasAuthority("ADMIN")

                        // Dashboard endpoints
                        .requestMatchers("/donor/**").hasAuthority("DONOR")
                        .requestMatchers("/receiver/**").hasAuthority("RECEIVER")
                        .requestMatchers("/admin/**").hasAuthority("ADMIN")

                        // Profile endpoints
                        .requestMatchers(HttpMethod.PUT, "/api/profile/**")
                        .hasAnyAuthority("RECEIVER", "DONOR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/profile/**")
                        .hasAnyAuthority("RECEIVER", "DONOR", "ADMIN")

                        //Save endpoints
                        .requestMatchers("/api/receiver/saved/**").hasAuthority("RECEIVER")


                        // All other requests require authentication
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // configuration.setAllowedOrigins(Arrays.asList(
        // "http://localhost:3000",
        // "http://localhost:3001",
        // "http://localhost:3002"
        // ));

        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
