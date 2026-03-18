package com.example.foodflow.repository;

import com.example.foodflow.model.entity.PasswordResetToken;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
public class PasswordResetTokenRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPassword("hashedPassword");
        testUser.setRole(UserRole.DONOR);
        testUser.setPhone("+11234567890");
        testUser = entityManager.persist(testUser);
        entityManager.flush();
    }

    @Test
    void findByToken_ExistingToken_ReturnsToken() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(testUser);
        token.setToken("test-token-123");
        token.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        token = entityManager.persist(token);
        entityManager.flush();

        Optional<PasswordResetToken> found = passwordResetTokenRepository.findByToken("test-token-123");

        assertTrue(found.isPresent());
        assertEquals("test-token-123", found.get().getToken());
        assertEquals(testUser.getId(), found.get().getUser().getId());
    }

    @Test
    void findByToken_NonExistingToken_ReturnsEmpty() {
        Optional<PasswordResetToken> found = passwordResetTokenRepository.findByToken("non-existing-token");
        assertFalse(found.isPresent());
    }

    @Test
    void deleteByUserId_RemovesAllTokensForUser() {
        // Create multiple tokens for the same user
        PasswordResetToken token1 = new PasswordResetToken();
        token1.setUser(testUser);
        token1.setToken("token-1");
        token1.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        entityManager.persist(token1);

        PasswordResetToken token2 = new PasswordResetToken();
        token2.setUser(testUser);
        token2.setToken("token-2");
        token2.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        entityManager.persist(token2);
        entityManager.flush();

        passwordResetTokenRepository.deleteByUserId(testUser.getId());
        entityManager.flush();

        Optional<PasswordResetToken> found1 = passwordResetTokenRepository.findByToken("token-1");
        Optional<PasswordResetToken> found2 = passwordResetTokenRepository.findByToken("token-2");

        assertFalse(found1.isPresent());
        assertFalse(found2.isPresent());
    }

    @Test
    void deleteByExpiresAtBefore_RemovesExpiredTokens() {
        // Create expired token
        PasswordResetToken expiredToken = new PasswordResetToken();
        expiredToken.setUser(testUser);
        expiredToken.setToken("expired-token");
        expiredToken.setExpiresAt(Timestamp.from(Instant.now().minus(1, ChronoUnit.HOURS)));
        entityManager.persist(expiredToken);

        // Create valid token
        PasswordResetToken validToken = new PasswordResetToken();
        validToken.setUser(testUser);
        validToken.setToken("valid-token");
        validToken.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        entityManager.persist(validToken);
        entityManager.flush();

        passwordResetTokenRepository.deleteByExpiresAtBefore(Timestamp.from(Instant.now()));
        entityManager.flush();

        Optional<PasswordResetToken> foundExpired = passwordResetTokenRepository.findByToken("expired-token");
        Optional<PasswordResetToken> foundValid = passwordResetTokenRepository.findByToken("valid-token");

        assertFalse(foundExpired.isPresent(), "Expired token should be deleted");
        assertTrue(foundValid.isPresent(), "Valid token should remain");
    }

    @Test
    void save_NewToken_PersistsSuccessfully() {
        PasswordResetToken newToken = new PasswordResetToken();
        newToken.setUser(testUser);
        newToken.setToken("new-token-abc");
        newToken.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));

        PasswordResetToken saved = passwordResetTokenRepository.save(newToken);

        assertNotNull(saved.getId());
        assertEquals("new-token-abc", saved.getToken());
    }

    @Test
    void findTopByUserIdOrderByCreatedAtDesc_ReturnsLatestToken() {
        PasswordResetToken token1 = new PasswordResetToken();
        token1.setUser(testUser);
        token1.setToken("token-a");
        token1.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        entityManager.persist(token1);
        entityManager.flush();

        // Wait a moment to ensure different timestamps
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
        }

        PasswordResetToken token2 = new PasswordResetToken();
        token2.setUser(testUser);
        token2.setToken("token-b");
        token2.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        entityManager.persist(token2);
        entityManager.flush();

        Optional<PasswordResetToken> found = passwordResetTokenRepository
                .findTopByUserIdOrderByCreatedAtDesc(testUser.getId());

        assertTrue(found.isPresent());
        assertEquals("token-b", found.get().getToken(), "Should return the most recent token");
    }

    @Test
    void isExpired_ExpiredToken_ReturnsTrue() {
        PasswordResetToken expiredToken = new PasswordResetToken();
        expiredToken.setUser(testUser);
        expiredToken.setToken("expired-token");
        expiredToken.setExpiresAt(Timestamp.from(Instant.now().minus(1, ChronoUnit.HOURS)));

        assertTrue(expiredToken.isExpired());
    }

    @Test
    void isExpired_ValidToken_ReturnsFalse() {
        PasswordResetToken validToken = new PasswordResetToken();
        validToken.setUser(testUser);
        validToken.setToken("valid-token");
        validToken.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));

        assertFalse(validToken.isExpired());
    }

    @Test
    void isUsed_UnusedToken_ReturnsFalse() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(testUser);
        token.setToken("unused-token");
        token.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));

        assertFalse(token.isUsed());
    }

    @Test
    void isUsed_UsedToken_ReturnsTrue() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(testUser);
        token.setToken("used-token");
        token.setExpiresAt(Timestamp.from(Instant.now().plus(15, ChronoUnit.MINUTES)));
        token.setUsedAt(Timestamp.from(Instant.now()));

        assertTrue(token.isUsed());
    }
}
