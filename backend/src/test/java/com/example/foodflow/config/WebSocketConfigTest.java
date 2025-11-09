package com.example.foodflow.config;

import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import com.example.foodflow.websocket.JwtHandshakeInterceptor;
import com.example.foodflow.websocket.PrincipalHandshakeHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.SockJsServiceRegistration;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.StompWebSocketEndpointRegistration;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WebSocketConfigTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MessageBrokerRegistry messageBrokerRegistry;

    @Mock
    private StompEndpointRegistry stompEndpointRegistry;

    @Mock
    private StompWebSocketEndpointRegistration endpointRegistration;

    @Mock
    private SockJsServiceRegistration sockJsServiceRegistration;

    @InjectMocks
    private WebSocketConfig webSocketConfig;

    @BeforeEach
    void setUp() {
        // Mock the chain of method calls for endpoint registration
        when(stompEndpointRegistry.addEndpoint(anyString())).thenReturn(endpointRegistration);
        when(endpointRegistration.setAllowedOriginPatterns(anyString())).thenReturn(endpointRegistration);
        when(endpointRegistration.setHandshakeHandler(any())).thenReturn(endpointRegistration);
        when(endpointRegistration.addInterceptors(any())).thenReturn(endpointRegistration);
        when(endpointRegistration.withSockJS()).thenReturn(sockJsServiceRegistration);
    }

    @Test
    void testConfigureMessageBroker() {
        // Act
        webSocketConfig.configureMessageBroker(messageBrokerRegistry);

        // Assert
        verify(messageBrokerRegistry).enableSimpleBroker("/topic", "/queue");
        verify(messageBrokerRegistry).setApplicationDestinationPrefixes("/app");
        verify(messageBrokerRegistry).setUserDestinationPrefix("/user");
    }

    @Test
    void testConfigureMessageBroker_EnablesCorrectBrokerDestinations() {
        // Arrange
        ArgumentCaptor<String> destinationCaptor = ArgumentCaptor.forClass(String.class);

        // Act
        webSocketConfig.configureMessageBroker(messageBrokerRegistry);

        // Assert
        verify(messageBrokerRegistry).enableSimpleBroker(destinationCaptor.capture(), destinationCaptor.capture());
        assertTrue(destinationCaptor.getAllValues().contains("/topic"));
        assertTrue(destinationCaptor.getAllValues().contains("/queue"));
    }

    @Test
    void testConfigureMessageBroker_SetsApplicationPrefix() {
        // Arrange
        ArgumentCaptor<String> prefixCaptor = ArgumentCaptor.forClass(String.class);

        // Act
        webSocketConfig.configureMessageBroker(messageBrokerRegistry);

        // Assert
        verify(messageBrokerRegistry).setApplicationDestinationPrefixes(prefixCaptor.capture());
        assertEquals("/app", prefixCaptor.getValue());
    }

    @Test
    void testConfigureMessageBroker_SetsUserPrefix() {
        // Arrange
        ArgumentCaptor<String> prefixCaptor = ArgumentCaptor.forClass(String.class);

        // Act
        webSocketConfig.configureMessageBroker(messageBrokerRegistry);

        // Assert
        verify(messageBrokerRegistry).setUserDestinationPrefix(prefixCaptor.capture());
        assertEquals("/user", prefixCaptor.getValue());
    }

    @Test
    void testRegisterStompEndpoints() {
        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);

        // Assert
        verify(stompEndpointRegistry).addEndpoint("/ws");
        verify(endpointRegistration).setAllowedOriginPatterns("*");
        verify(endpointRegistration).setHandshakeHandler(any(PrincipalHandshakeHandler.class));
        verify(endpointRegistration).addInterceptors(any(JwtHandshakeInterceptor.class));
        verify(endpointRegistration).withSockJS();
    }

    @Test
    void testRegisterStompEndpoints_AddsCorrectEndpoint() {
        // Arrange
        ArgumentCaptor<String> endpointCaptor = ArgumentCaptor.forClass(String.class);

        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);

        // Assert
        verify(stompEndpointRegistry).addEndpoint(endpointCaptor.capture());
        assertEquals("/ws", endpointCaptor.getValue());
    }

    @Test
    void testRegisterStompEndpoints_AllowsAllOriginPatterns() {
        // Arrange
        ArgumentCaptor<String> originCaptor = ArgumentCaptor.forClass(String.class);

        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);

        // Assert
        verify(endpointRegistration).setAllowedOriginPatterns(originCaptor.capture());
        assertEquals("*", originCaptor.getValue());
    }

    @Test
    void testRegisterStompEndpoints_SetsPrincipalHandshakeHandler() {
        // Arrange
        ArgumentCaptor<DefaultHandshakeHandler> handlerCaptor = ArgumentCaptor.forClass(DefaultHandshakeHandler.class);

        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);

        // Assert
        verify(endpointRegistration).setHandshakeHandler(handlerCaptor.capture());
        assertInstanceOf(PrincipalHandshakeHandler.class, handlerCaptor.getValue());
    }

    @Test
    void testRegisterStompEndpoints_AddsJwtHandshakeInterceptor() {
        // Arrange
        ArgumentCaptor<HandshakeInterceptor> interceptorCaptor = ArgumentCaptor.forClass(HandshakeInterceptor.class);

        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);

        // Assert
        verify(endpointRegistration).addInterceptors(interceptorCaptor.capture());
        assertInstanceOf(JwtHandshakeInterceptor.class, interceptorCaptor.getValue());
    }

    @Test
    void testRegisterStompEndpoints_EnablesSockJS() {
        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);

        // Assert
        verify(endpointRegistration).withSockJS();
    }

    @Test
    void testRegisterStompEndpoints_CallsInCorrectOrder() {
        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);

        // Assert - verify the chain is called in correct order
        var inOrder = inOrder(stompEndpointRegistry, endpointRegistration);
        inOrder.verify(stompEndpointRegistry).addEndpoint("/ws");
        inOrder.verify(endpointRegistration).setAllowedOriginPatterns("*");
        inOrder.verify(endpointRegistration).setHandshakeHandler(any(PrincipalHandshakeHandler.class));
        inOrder.verify(endpointRegistration).addInterceptors(any(JwtHandshakeInterceptor.class));
        inOrder.verify(endpointRegistration).withSockJS();
    }

    @Test
    void testConfigureMessageBroker_CalledMultipleTimes() {
        // Act
        webSocketConfig.configureMessageBroker(messageBrokerRegistry);
        webSocketConfig.configureMessageBroker(messageBrokerRegistry);

        // Assert - should be called twice
        verify(messageBrokerRegistry, times(2)).enableSimpleBroker("/topic", "/queue");
        verify(messageBrokerRegistry, times(2)).setApplicationDestinationPrefixes("/app");
        verify(messageBrokerRegistry, times(2)).setUserDestinationPrefix("/user");
    }

    @Test
    void testRegisterStompEndpoints_CalledMultipleTimes() {
        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);

        // Assert - should be called twice
        verify(stompEndpointRegistry, times(2)).addEndpoint("/ws");
        verify(endpointRegistration, times(2)).withSockJS();
    }

    @Test
    void testWebSocketConfig_HasCorrectDependencies() {
        // Assert - verify dependencies are correctly injected
        assertNotNull(webSocketConfig);
    }

    @Test
    void testConfigureMessageBroker_AllMethodsCalled() {
        // Arrange
        reset(messageBrokerRegistry);

        // Act
        webSocketConfig.configureMessageBroker(messageBrokerRegistry);

        // Assert - verify all three configuration methods are called
        verify(messageBrokerRegistry, times(1)).enableSimpleBroker(anyString(), anyString());
        verify(messageBrokerRegistry, times(1)).setApplicationDestinationPrefixes(anyString());
        verify(messageBrokerRegistry, times(1)).setUserDestinationPrefix(anyString());
        verifyNoMoreInteractions(messageBrokerRegistry);
    }

    @Test
    void testRegisterStompEndpoints_AllMethodsCalled() {
        // Arrange
        reset(stompEndpointRegistry, endpointRegistration, sockJsServiceRegistration);
        when(stompEndpointRegistry.addEndpoint(anyString())).thenReturn(endpointRegistration);
        when(endpointRegistration.setAllowedOriginPatterns(anyString())).thenReturn(endpointRegistration);
        when(endpointRegistration.setHandshakeHandler(any())).thenReturn(endpointRegistration);
        when(endpointRegistration.addInterceptors(any())).thenReturn(endpointRegistration);
        when(endpointRegistration.withSockJS()).thenReturn(sockJsServiceRegistration);

        // Act
        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);

        // Assert - verify all configuration methods are called
        verify(stompEndpointRegistry, times(1)).addEndpoint(anyString());
        verify(endpointRegistration, times(1)).setAllowedOriginPatterns(anyString());
        verify(endpointRegistration, times(1)).setHandshakeHandler(any());
        verify(endpointRegistration, times(1)).addInterceptors(any());
        verify(endpointRegistration, times(1)).withSockJS();
    }
}
