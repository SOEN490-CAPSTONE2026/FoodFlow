package com.example.foodflow.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtConfigTest {

    private JwtConfig configWithSecret(String secret) {
        JwtConfig config = new JwtConfig();
        config.setSecret(secret);
        return config;
    }

    // --- Null / blank ---

    @Test
    void validateSecret_nullSecret_throwsIllegalStateException() {
        JwtConfig config = configWithSecret(null);
        assertThrows(IllegalStateException.class, config::validateSecret);
    }

    @Test
    void validateSecret_emptySecret_throwsIllegalStateException() {
        JwtConfig config = configWithSecret("");
        assertThrows(IllegalStateException.class, config::validateSecret);
    }

    @Test
    void validateSecret_blankSecret_throwsIllegalStateException() {
        JwtConfig config = configWithSecret("   ");
        assertThrows(IllegalStateException.class, config::validateSecret);
    }

    // --- Known weak values ---

    @Test
    void validateSecret_weakValue_mySecretKey_throwsIllegalStateException() {
        JwtConfig config = configWithSecret("mySecretKey");
        IllegalStateException ex = assertThrows(IllegalStateException.class, config::validateSecret);
        assertTrue(ex.getMessage().toLowerCase().contains("insecure") || ex.getMessage().toLowerCase().contains("weak"),
                "Expected message to mention insecure/weak value");
    }

    @Test
    void validateSecret_weakValue_secret_throwsIllegalStateException() {
        JwtConfig config = configWithSecret("secret");
        assertThrows(IllegalStateException.class, config::validateSecret);
    }

    @Test
    void validateSecret_weakValue_changeme_throwsIllegalStateException() {
        JwtConfig config = configWithSecret("changeme");
        assertThrows(IllegalStateException.class, config::validateSecret);
    }

    @Test
    void validateSecret_weakValue_password_throwsIllegalStateException() {
        JwtConfig config = configWithSecret("password");
        assertThrows(IllegalStateException.class, config::validateSecret);
    }

    @Test
    void validateSecret_weakValue_myLocalSecretKeyPleaseChange_throwsIllegalStateException() {
        JwtConfig config = configWithSecret("my-local-secret-key-please-change");
        assertThrows(IllegalStateException.class, config::validateSecret);
    }

    // --- Too short ---

    @Test
    void validateSecret_31Characters_throwsIllegalStateException() {
        // 31 chars — one short of the 32-character minimum
        String shortSecret = "a".repeat(31);
        JwtConfig config = configWithSecret(shortSecret);
        IllegalStateException ex = assertThrows(IllegalStateException.class, config::validateSecret);
        assertTrue(ex.getMessage().toLowerCase().contains("short") || ex.getMessage().toLowerCase().contains("32"),
                "Expected message to mention length requirement");
    }

    @Test
    void validateSecret_1Character_throwsIllegalStateException() {
        JwtConfig config = configWithSecret("x");
        assertThrows(IllegalStateException.class, config::validateSecret);
    }

    // --- Valid secrets ---

    @Test
    void validateSecret_exactly32Characters_passes() {
        // Exactly 32 characters, not a known weak value
        JwtConfig config = configWithSecret("aValidSecretThatIsExactly32Chars");
        assertDoesNotThrow(config::validateSecret);
    }

    @Test
    void validateSecret_strongLongSecret_passes() {
        JwtConfig config = configWithSecret("aVeryStrongAndLongSecretKeyForJWT-Production2024!");
        assertDoesNotThrow(config::validateSecret);
    }

    @Test
    void validateSecret_testProfileSecret_passes() {
        // The exact secret used in application-test.properties must satisfy the validator
        JwtConfig config = configWithSecret("testSecretKeyThatIsAtLeast32CharactersLongForTesting");
        assertDoesNotThrow(config::validateSecret);
    }
}
