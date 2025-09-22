package com.example.foodflow.security;

import com.example.foodflow.config.JwtConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
// import org.mockito.junit.jupiter.MockitoSettings;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtTokenProviderTest {

    @Mock
    private JwtConfig jwtConfig;

    @InjectMocks
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        // Mock the JwtConfig to return test values
        when(jwtConfig.getSecret()).thenReturn("testSecretKeyThatIsAtLeast32CharactersLongForTesting");
        when(jwtConfig.getExpiration()).thenReturn(86400000L); // 24 hours
    }

    @Test
    void generateToken_Success() {
        // Given
        String email = "test@example.com";
        String role = "DONOR";

        // When
        String token = jwtTokenProvider.generateToken(email, role);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.startsWith("eyJ")); // JWT tokens start with eyJ
    }

    @Test
    void getEmailFromToken_Success() {
        // Given
        String email = "test@example.com";
        String role = "DONOR";
        String token = jwtTokenProvider.generateToken(email, role);

        // When
        String extractedEmail = jwtTokenProvider.getEmailFromToken(token);

        // Then
        assertEquals(email, extractedEmail);
    }

    @Test
    void validateToken_ValidToken_ReturnsTrue() {
        // Given
        String email = "test@example.com";
        String role = "DONOR";
        String token = jwtTokenProvider.generateToken(email, role);

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertTrue(isValid);
    }

    @Test
    void validateToken_InvalidToken_ReturnsFalse() {
        // Given
        String invalidToken = "invalid.jwt.token";

        // When
        boolean isValid = jwtTokenProvider.validateToken(invalidToken);

        // Then
        assertFalse(isValid);
    }

    @Test
    void validateToken_ExpiredToken_ReturnsFalse() {
        // Given - Mock short expiration time
        JwtConfig expiredConfig = mock(JwtConfig.class);
        when(expiredConfig.getSecret()).thenReturn("testSecretKeyThatIsAtLeast32CharactersLongForTesting");
        when(jwtConfig.getExpiration()).thenReturn(-1000L); // 1ms expiration
        
        String token = jwtTokenProvider.generateToken("test@example.com", "DONOR");
        
        // Wait for token to expire
        try {
            Thread.sleep(10); // Wait 10ms to ensure expiration
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertFalse(isValid);
    }

    @Test
    void validateToken_NullToken_ReturnsFalse() {
        // When
        boolean isValid = jwtTokenProvider.validateToken(null);

        // Then
        assertFalse(isValid);
    }

    @Test
    void validateToken_EmptyToken_ReturnsFalse() {
        // When
        boolean isValid = jwtTokenProvider.validateToken("");

        // Then
        assertFalse(isValid);
    }
}
