package com.example.foodflow.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Custom HandshakeHandler that reads a 'wsPrincipalName' attribute (set by an interceptor)
 * and returns a Principal with that name so Spring's convertAndSendToUser can route messages.
 */
public class PrincipalHandshakeHandler extends DefaultHandshakeHandler {

    private static final Logger logger = LoggerFactory.getLogger(PrincipalHandshakeHandler.class);

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        Object name = attributes.get("wsPrincipalName");
        if (name != null) {
            logger.info("Creating WebSocket Principal from wsPrincipalName={}", name);
            return new StompPrincipal(name.toString());
        }
        Principal p = super.determineUser(request, wsHandler, attributes);
        if (p != null) logger.info("Default Principal determined: {}", p.getName());
        return p;
    }
}
