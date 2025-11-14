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
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api/analytics/**").permitAll()
                .requestMatchers("/ws/**").permitAll()  // Allow WebSocket connections
                
                // Messaging endpoints - must be accessible to all authenticated users
                .requestMatchers("/api/conversations/**").hasAnyAuthority("DONOR", "RECEIVER")
                .requestMatchers("/api/messages/**").hasAnyAuthority("DONOR", "RECEIVER")
                
                // ✅ FIXED: Surplus endpoints with proper role restrictions
                .requestMatchers(HttpMethod.POST, "/api/surplus").hasAuthority("DONOR")
                .requestMatchers(HttpMethod.GET, "/api/surplus").hasAuthority("RECEIVER")
                .requestMatchers(HttpMethod.GET, "/api/surplus/my-posts").hasAuthority("DONOR")
                
                // ✅ NEW: Claims endpoints  
                .requestMatchers(HttpMethod.GET, "/api/claims/post/**").hasAnyAuthority("DONOR", "RECEIVER")
                .requestMatchers("/api/claims/**").hasAuthority("RECEIVER")
                
                // ✅ NEW: Receiver Preferences endpoints
                .requestMatchers("/api/receiver/preferences/**").hasAuthority("RECEIVER")
                
                // Other endpoints
                .requestMatchers("/api/feed/**").hasAuthority("RECEIVER")
                .requestMatchers("/api/requests/**").hasAnyAuthority("DONOR", "RECEIVER")
                
                // Dashboard endpoints
                .requestMatchers("/donor/**").hasAuthority("DONOR")
                .requestMatchers("/receiver/**").hasAuthority("RECEIVER")
                .requestMatchers("/admin/**").hasAuthority("ADMIN")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

    //       configuration.setAllowedOrigins(Arrays.asList(
    //     "http://localhost:3000",
    //     "http://localhost:3001",
    //     "http://localhost:3002"
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
