package com.example.foodflow.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import com.example.foodflow.websocket.JwtHandshakeInterceptor;
import com.example.foodflow.security.JwtTokenProvider;
import com.example.foodflow.repository.UserRepository;
import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    @Value("${spring.web.cors.allowed-origins:http://localhost:3000}")
    private String corsAllowedOrigins;

    public WebSocketConfig(JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory broker for /topic and /queue
        config.enableSimpleBroker("/topic", "/queue");
        // Set application destination prefix for messages bound for @MessageMapping
        // methods
        config.setApplicationDestinationPrefixes("/app");
        // Set user destination prefix for private messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Get allowed origins from same config as HTTP CORS
        String[] allowedOrigins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
        // Register STOMP endpoint at /ws with restricted origins
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins)
                .setHandshakeHandler(new com.example.foodflow.websocket.PrincipalHandshakeHandler())
                .addInterceptors(new JwtHandshakeInterceptor(jwtTokenProvider, userRepository))
                .withSockJS(); // Enable SockJS fallback options
    }
}
