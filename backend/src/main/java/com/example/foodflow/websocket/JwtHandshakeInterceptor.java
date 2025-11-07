package com.example.foodflow.websocket;

import com.example.foodflow.security.JwtTokenProvider;
import com.example.foodflow.repository.UserRepository;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import java.util.List;

public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(JwtHandshakeInterceptor.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public JwtHandshakeInterceptor(JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {

        // Try Authorization header first (if present)
        List<String> auth = request.getHeaders().get("Authorization");
        String token = null;
        if (auth != null && !auth.isEmpty()) {
            String header = auth.get(0);
            if (header.startsWith("Bearer ")) {
                token = header.substring(7);
            }
        }

        // If no header token, try token query param (used when connecting via SockJS)
        if (token == null) {
            try {
                String query = request.getURI().getQuery();
                if (query != null) {
                    for (String param : query.split("&")) {
                        if (param.startsWith("token=")) {
                            token = param.substring("token=".length());
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                // ignore parsing errors
            }
        }

        if (token != null && jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getEmailFromToken(token);
            var maybeUser = userRepository.findByEmail(email);
            if (maybeUser.isPresent()) {
                String userIdStr = maybeUser.get().getId().toString();
                // store the user id string as principal (PrincipalHandshakeHandler will use it)
                attributes.put("wsPrincipalName", userIdStr);
                logger.info("WebSocket handshake token valid for email={}, mapped principalId={}", email, userIdStr);
            } else {
                logger.warn("WebSocket handshake: token valid but no user found for email={}", email);
            }
        } else if (token != null) {
            logger.warn("WebSocket handshake: invalid token provided");
        }
        // allow handshake through; set actual Principal in a custom HandshakeHandler if needed
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) { }
}