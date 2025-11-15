package com.example.foodflow.websocket;

import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JwtHandshakeInterceptorTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ServerHttpRequest request;

    @Mock
    private ServerHttpResponse response;

    @Mock
    private WebSocketHandler wsHandler;

    private JwtHandshakeInterceptor interceptor;
    private Map<String, Object> attributes;
    private HttpHeaders headers;

    @BeforeEach
    void setUp() {
        interceptor = new JwtHandshakeInterceptor(jwtTokenProvider, userRepository);
        attributes = new HashMap<>();
        headers = new HttpHeaders();
        when(request.getHeaders()).thenReturn(headers);
    }

    @Test
    void testBeforeHandshake_ValidTokenInAuthorizationHeader() throws URISyntaxException {
        // Arrange
        String token = "valid.jwt.token";
        String email = "test@example.com";
        Long userId = 123L;
        
        headers.add("Authorization", "Bearer " + token);
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws"));
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getEmailFromToken(token)).thenReturn(email);
        
        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setEmail(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mockUser));

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result);
        assertEquals(userId.toString(), attributes.get("wsPrincipalName"));
        verify(jwtTokenProvider).validateToken(token);
        verify(jwtTokenProvider).getEmailFromToken(token);
        verify(userRepository).findByEmail(email);
    }

    @Test
    void testBeforeHandshake_ValidTokenInQueryParameter() throws URISyntaxException {
        // Arrange
        String token = "valid.jwt.token";
        String email = "test@example.com";
        Long userId = 456L;
        
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws?token=" + token));
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getEmailFromToken(token)).thenReturn(email);
        
        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setEmail(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mockUser));

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result);
        assertEquals(userId.toString(), attributes.get("wsPrincipalName"));
        verify(jwtTokenProvider).validateToken(token);
        verify(jwtTokenProvider).getEmailFromToken(token);
        verify(userRepository).findByEmail(email);
    }

    @Test
    void testBeforeHandshake_InvalidToken() throws URISyntaxException {
        // Arrange
        String token = "invalid.jwt.token";
        
        headers.add("Authorization", "Bearer " + token);
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws"));
        when(jwtTokenProvider.validateToken(token)).thenReturn(false);

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result); // Handshake still allowed
        assertNull(attributes.get("wsPrincipalName"));
        verify(jwtTokenProvider).validateToken(token);
        verify(jwtTokenProvider, never()).getEmailFromToken(anyString());
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void testBeforeHandshake_NoToken() throws URISyntaxException {
        // Arrange
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws"));

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result); // Handshake still allowed
        assertNull(attributes.get("wsPrincipalName"));
        verify(jwtTokenProvider, never()).validateToken(anyString());
        verify(jwtTokenProvider, never()).getEmailFromToken(anyString());
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void testBeforeHandshake_ValidTokenButUserNotFound() throws URISyntaxException {
        // Arrange
        String token = "valid.jwt.token";
        String email = "nonexistent@example.com";
        
        headers.add("Authorization", "Bearer " + token);
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws"));
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getEmailFromToken(token)).thenReturn(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result); // Handshake still allowed
        assertNull(attributes.get("wsPrincipalName"));
        verify(jwtTokenProvider).validateToken(token);
        verify(jwtTokenProvider).getEmailFromToken(token);
        verify(userRepository).findByEmail(email);
    }

    @Test
    void testBeforeHandshake_MalformedAuthorizationHeader() throws URISyntaxException {
        // Arrange
        headers.add("Authorization", "InvalidFormat token123");
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws"));

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result);
        assertNull(attributes.get("wsPrincipalName"));
        verify(jwtTokenProvider, never()).validateToken(anyString());
    }

    @Test
    void testBeforeHandshake_EmptyAuthorizationHeader() throws URISyntaxException {
        // Arrange
        headers.add("Authorization", "");
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws"));

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result);
        assertNull(attributes.get("wsPrincipalName"));
        verify(jwtTokenProvider, never()).validateToken(anyString());
    }

    @Test
    void testBeforeHandshake_TokenInQueryWithMultipleParams() throws URISyntaxException {
        // Arrange
        String token = "query.jwt.token";
        String email = "query@example.com";
        Long userId = 789L;
        
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws?param1=value1&token=" + token + "&param2=value2"));
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getEmailFromToken(token)).thenReturn(email);
        
        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setEmail(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mockUser));

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result);
        assertEquals(userId.toString(), attributes.get("wsPrincipalName"));
    }

    @Test
    void testBeforeHandshake_NullQueryString() throws URISyntaxException {
        // Arrange
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws"));

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result);
        assertNull(attributes.get("wsPrincipalName"));
    }

    @Test
    void testBeforeHandshake_HeaderTokenTakesPrecedenceOverQueryToken() throws URISyntaxException {
        // Arrange
        String headerToken = "header.jwt.token";
        String queryToken = "query.jwt.token";
        String email = "header@example.com";
        Long userId = 111L;
        
        headers.add("Authorization", "Bearer " + headerToken);
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws?token=" + queryToken));
        when(jwtTokenProvider.validateToken(headerToken)).thenReturn(true);
        when(jwtTokenProvider.getEmailFromToken(headerToken)).thenReturn(email);
        
        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setEmail(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mockUser));

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result);
        assertEquals(userId.toString(), attributes.get("wsPrincipalName"));
        verify(jwtTokenProvider).validateToken(headerToken);
        verify(jwtTokenProvider, never()).validateToken(queryToken);
    }

    @Test
    void testBeforeHandshake_QueryParsingException() throws URISyntaxException {
        // Arrange
        when(request.getURI()).thenThrow(new RuntimeException("URI parsing error"));

        // Act & Assert
        assertDoesNotThrow(() -> {
            boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);
            assertTrue(result);
        });
    }

    @Test
    void testBeforeHandshake_AuthorizationHeaderAsList() throws URISyntaxException {
        // Arrange
        String token = "list.jwt.token";
        String email = "list@example.com";
        Long userId = 222L;
        
        List<String> authHeaders = Arrays.asList("Bearer " + token);
        headers.put("Authorization", authHeaders);
        when(request.getURI()).thenReturn(new URI("ws://localhost:8080/ws"));
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getEmailFromToken(token)).thenReturn(email);
        
        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setEmail(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mockUser));

        // Act
        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        // Assert
        assertTrue(result);
        assertEquals(userId.toString(), attributes.get("wsPrincipalName"));
    }

    @Test
    void testAfterHandshake_NoException() {
        // Act & Assert
        assertDoesNotThrow(() -> 
            interceptor.afterHandshake(request, response, wsHandler, null)
        );
    }

    @Test
    void testAfterHandshake_WithException() {
        // Arrange
        Exception exception = new RuntimeException("Test exception");

        // Act & Assert
        assertDoesNotThrow(() -> 
            interceptor.afterHandshake(request, response, wsHandler, exception)
        );
    }
}
