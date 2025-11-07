package com.example.foodflow.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.example.foodflow.websocket.JwtHandshakeInterceptor;
import com.example.foodflow.security.JwtTokenProvider;
import com.example.foodflow.repository.UserRepository;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory broker for /topic and /queue
        config.enableSimpleBroker("/topic", "/queue");
        // Set application destination prefix for messages bound for @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
        // Set user destination prefix for private messages
        config.setUserDestinationPrefix("/user");
    }
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint at /ws
    registry.addEndpoint("/ws")
        .setAllowedOriginPatterns("*")
        .setHandshakeHandler(new com.example.foodflow.websocket.PrincipalHandshakeHandler())
        .addInterceptors(new JwtHandshakeInterceptor(jwtTokenProvider, userRepository))
        .withSockJS();  // Enable SockJS fallback options
    }
}
