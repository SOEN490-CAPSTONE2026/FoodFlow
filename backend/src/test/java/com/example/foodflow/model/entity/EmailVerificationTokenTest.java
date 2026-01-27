package com.example.foodflow.model.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

class EmailVerificationTokenTest {

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
    }

    @Test
    void constructor_NoArgs_InitializesTimestamps() {
        // When
        EmailVerificationToken token = new EmailVerificationToken();

        // Then
        assertNotNull(token.getCreatedAt());
        assertNotNull(token.getExpiresAt());
        assertNull(token.getVerifiedAt());
        
        // Verify expiry is approximately 24 hours from now
        long hoursDiff = ChronoUnit.HOURS.between(
            token.getCreatedAt().toInstant(), 
            token.getExpiresAt().toInstant()
        );
        assertEquals(24, hoursDiff);
    }

    @Test
    void constructor_WithUserAndToken_SetsFieldsCorrectly() {
        // Given
        String tokenValue = "test-token-123";

        // When
        EmailVerificationToken token = new EmailVerificationToken(testUser, tokenValue);

        // Then
        assertEquals(testUser, token.getUser());
        assertEquals(tokenValue, token.getToken());
        assertNotNull(token.getCreatedAt());
        assertNotNull(token.getExpiresAt());
        assertNull(token.getVerifiedAt());
    }

    @Test
    void isExpired_WhenTokenNotExpired_ReturnsFalse() {
        // Given
        EmailVerificationToken token = new EmailVerificationToken(testUser, "token");

        // When
        boolean expired = token.isExpired();

        // Then
        assertFalse(expired);
    }

    @Test
    void isExpired_WhenTokenExpired_ReturnsTrue() {
        // Given
        EmailVerificationToken token = new EmailVerificationToken(testUser, "token");
        Timestamp pastTime = Timestamp.from(Instant.now().minus(1, ChronoUnit.DAYS));
        token.setExpiresAt(pastTime);

        // When
        boolean expired = token.isExpired();

        // Then
        assertTrue(expired);
    }

    @Test
    void isVerified_WhenNotVerified_ReturnsFalse() {
        // Given
        EmailVerificationToken token = new EmailVerificationToken(testUser, "token");

        // When
        boolean verified = token.isVerified();

        // Then
        assertFalse(verified);
    }

    @Test
    void isVerified_WhenVerified_ReturnsTrue() {
        // Given
        EmailVerificationToken token = new EmailVerificationToken(testUser, "token");
        token.setVerifiedAt(Timestamp.from(Instant.now()));

        // When
        boolean verified = token.isVerified();

        // Then
        assertTrue(verified);
    }

    @Test
    void settersAndGetters_WorkCorrectly() {
        // Given
        EmailVerificationToken token = new EmailVerificationToken();
        Long id = 100L;
        String tokenValue = "new-token-456";
        Timestamp createdAt = Timestamp.from(Instant.now());
        Timestamp expiresAt = Timestamp.from(Instant.now().plus(48, ChronoUnit.HOURS));
        Timestamp verifiedAt = Timestamp.from(Instant.now());

        // When
        token.setId(id);
        token.setUser(testUser);
        token.setToken(tokenValue);
        token.setCreatedAt(createdAt);
        token.setExpiresAt(expiresAt);
        token.setVerifiedAt(verifiedAt);

        // Then
        assertEquals(id, token.getId());
        assertEquals(testUser, token.getUser());
        assertEquals(tokenValue, token.getToken());
        assertEquals(createdAt, token.getCreatedAt());
        assertEquals(expiresAt, token.getExpiresAt());
        assertEquals(verifiedAt, token.getVerifiedAt());
    }

    @Test
    void isExpired_AtExactExpiryTime_ReturnsTrue() {
        // Given
        EmailVerificationToken token = new EmailVerificationToken(testUser, "token");
        Timestamp exactExpiryTime = Timestamp.from(Instant.now().minus(1, ChronoUnit.MILLIS));
        token.setExpiresAt(exactExpiryTime);

        // When
        boolean expired = token.isExpired();

        // Then
        assertTrue(expired);
    }

    @Test
    void multipleTokens_ForSameUser_AreIndependent() {
        // Given
        EmailVerificationToken token1 = new EmailVerificationToken(testUser, "token-1");
        EmailVerificationToken token2 = new EmailVerificationToken(testUser, "token-2");

        // When
        token1.setVerifiedAt(Timestamp.from(Instant.now()));

        // Then
        assertTrue(token1.isVerified());
        assertFalse(token2.isVerified());
        assertEquals(testUser, token1.getUser());
        assertEquals(testUser, token2.getUser());
        assertNotEquals(token1.getToken(), token2.getToken());
    }
}
