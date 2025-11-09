package com.example.foodflow.websocket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrincipalHandshakeHandlerTest {

    @Mock
    private ServerHttpRequest request;

    @Mock
    private WebSocketHandler wsHandler;

    private PrincipalHandshakeHandler handler;
    private Map<String, Object> attributes;

    @BeforeEach
    void setUp() {
        handler = new PrincipalHandshakeHandler();
        attributes = new HashMap<>();
    }

    @Test
    void testDetermineUser_WithWsPrincipalName() {
        // Arrange
        String userId = "12345";
        attributes.put("wsPrincipalName", userId);

        // Act
        Principal principal = handler.determineUser(request, wsHandler, attributes);

        // Assert
        assertNotNull(principal);
        assertInstanceOf(StompPrincipal.class, principal);
        assertEquals(userId, principal.getName());
    }

    @Test
    void testDetermineUser_WithoutWsPrincipalName() {
        // Arrange - attributes map is empty

        // Act
        Principal principal = handler.determineUser(request, wsHandler, attributes);

        // Assert - should return null or default principal from superclass
        // The default implementation may return null or a default principal
        // We just verify it doesn't throw an exception
        assertDoesNotThrow(() -> handler.determineUser(request, wsHandler, attributes));
    }

    @Test
    void testDetermineUser_WithNullWsPrincipalName() {
        // Arrange
        attributes.put("wsPrincipalName", null);

        // Act
        Principal principal = handler.determineUser(request, wsHandler, attributes);

        // Assert - should fall back to default behavior
        assertDoesNotThrow(() -> handler.determineUser(request, wsHandler, attributes));
    }

    @Test
    void testDetermineUser_WithNumericWsPrincipalName() {
        // Arrange
        Long userId = 999L;
        attributes.put("wsPrincipalName", userId);

        // Act
        Principal principal = handler.determineUser(request, wsHandler, attributes);

        // Assert
        assertNotNull(principal);
        assertInstanceOf(StompPrincipal.class, principal);
        assertEquals("999", principal.getName());
    }

    @Test
    void testDetermineUser_WithEmptyStringWsPrincipalName() {
        // Arrange
        attributes.put("wsPrincipalName", "");

        // Act
        Principal principal = handler.determineUser(request, wsHandler, attributes);

        // Assert
        assertNotNull(principal);
        assertInstanceOf(StompPrincipal.class, principal);
        assertEquals("", principal.getName());
    }

    @Test
    void testDetermineUser_WithSpecialCharactersInWsPrincipalName() {
        // Arrange
        String specialUserId = "user-123@domain.com";
        attributes.put("wsPrincipalName", specialUserId);

        // Act
        Principal principal = handler.determineUser(request, wsHandler, attributes);

        // Assert
        assertNotNull(principal);
        assertInstanceOf(StompPrincipal.class, principal);
        assertEquals(specialUserId, principal.getName());
    }

    @Test
    void testDetermineUser_MultipleCallsWithDifferentAttributes() {
        // Arrange
        Map<String, Object> attributes1 = new HashMap<>();
        attributes1.put("wsPrincipalName", "user1");
        
        Map<String, Object> attributes2 = new HashMap<>();
        attributes2.put("wsPrincipalName", "user2");

        // Act
        Principal principal1 = handler.determineUser(request, wsHandler, attributes1);
        Principal principal2 = handler.determineUser(request, wsHandler, attributes2);

        // Assert
        assertNotNull(principal1);
        assertNotNull(principal2);
        assertEquals("user1", principal1.getName());
        assertEquals("user2", principal2.getName());
        assertNotEquals(principal1.getName(), principal2.getName());
    }

    @Test
    void testDetermineUser_WithWhitespaceInWsPrincipalName() {
        // Arrange
        String userIdWithSpaces = "  user123  ";
        attributes.put("wsPrincipalName", userIdWithSpaces);

        // Act
        Principal principal = handler.determineUser(request, wsHandler, attributes);

        // Assert
        assertNotNull(principal);
        assertInstanceOf(StompPrincipal.class, principal);
        assertEquals(userIdWithSpaces, principal.getName());
    }

    @Test
    void testDetermineUser_WithLongWsPrincipalName() {
        // Arrange
        String longUserId = "a".repeat(1000);
        attributes.put("wsPrincipalName", longUserId);

        // Act
        Principal principal = handler.determineUser(request, wsHandler, attributes);

        // Assert
        assertNotNull(principal);
        assertInstanceOf(StompPrincipal.class, principal);
        assertEquals(longUserId, principal.getName());
    }

    @Test
    void testDetermineUser_AttributesNotModified() {
        // Arrange
        String userId = "testUser";
        attributes.put("wsPrincipalName", userId);
        attributes.put("otherAttribute", "value");
        int initialSize = attributes.size();

        // Act
        Principal principal = handler.determineUser(request, wsHandler, attributes);

        // Assert
        assertEquals(initialSize, attributes.size());
        assertTrue(attributes.containsKey("wsPrincipalName"));
        assertTrue(attributes.containsKey("otherAttribute"));
    }
}
