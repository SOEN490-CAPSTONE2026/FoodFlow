package com.example.foodflow.service.calendar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings("deprecation")
class EncryptionUtilityTest {

    private EncryptionUtility encryptionUtility;

    @BeforeEach
    void setUp() {
        // Use empty encryption key since it's deprecated and not used
        encryptionUtility = new EncryptionUtility("");
    }

    // ==================== encrypt ====================

    @Test
    void encrypt_ShouldReturnPlainText() {
        // Given
        String plainText = "my-secret-token";

        // When
        String result = encryptionUtility.encrypt(plainText);

        // Then - since encryption is disabled, should return as-is
        assertThat(result).isEqualTo(plainText);
    }

    @Test
    void encrypt_WithNullInput_ShouldReturnNull() {
        // When
        String result = encryptionUtility.encrypt(null);

        // Then
        assertThat(result).isNull();
    }

    @Test
    void encrypt_WithEmptyString_ShouldReturnEmptyString() {
        // When
        String result = encryptionUtility.encrypt("");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void encrypt_WithSpecialCharacters_ShouldReturnAsIs() {
        // Given
        String plainText = "token-with-special!@#$%^&*()";

        // When
        String result = encryptionUtility.encrypt(plainText);

        // Then
        assertThat(result).isEqualTo(plainText);
    }

    @Test
    void encrypt_WithLongString_ShouldReturnAsIs() {
        // Given
        String plainText = "a".repeat(1000); // 1000 character string

        // When
        String result = encryptionUtility.encrypt(plainText);

        // Then
        assertThat(result).isEqualTo(plainText);
    }

    // ==================== decrypt ====================

    @Test
    void decrypt_ShouldReturnPlainText() {
        // Given
        String encryptedText = "my-encrypted-token";

        // When
        String result = encryptionUtility.decrypt(encryptedText);

        // Then - since encryption is disabled, should return as-is
        assertThat(result).isEqualTo(encryptedText);
    }

    @Test
    void decrypt_WithNullInput_ShouldReturnNull() {
        // When
        String result = encryptionUtility.decrypt(null);

        // Then
        assertThat(result).isNull();
    }

    @Test
    void decrypt_WithEmptyString_ShouldReturnEmptyString() {
        // When
        String result = encryptionUtility.decrypt("");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void decrypt_WithSpecialCharacters_ShouldReturnAsIs() {
        // Given
        String encryptedText = "encrypted-with-special!@#$%^&*()";

        // When
        String result = encryptionUtility.decrypt(encryptedText);

        // Then
        assertThat(result).isEqualTo(encryptedText);
    }

    // ==================== encrypt/decrypt round-trip ====================

    @Test
    void encryptAndDecrypt_ShouldReturnOriginalValue() {
        // Given
        String original = "my-refresh-token-12345";

        // When
        String encrypted = encryptionUtility.encrypt(original);
        String decrypted = encryptionUtility.decrypt(encrypted);

        // Then - since both are no-ops, should get original back
        assertThat(decrypted).isEqualTo(original);
    }

    @Test
    void decryptAndEncrypt_ShouldReturnOriginalValue() {
        // Given
        String original = "stored-encrypted-token";

        // When
        String decrypted = encryptionUtility.decrypt(original);
        String encrypted = encryptionUtility.encrypt(decrypted);

        // Then
        assertThat(encrypted).isEqualTo(original);
    }

    @Test
    void multipleEncryptionCalls_ShouldBeIdempotent() {
        // Given
        String original = "test-token";

        // When
        String encrypted1 = encryptionUtility.encrypt(original);
        String encrypted2 = encryptionUtility.encrypt(encrypted1);
        String encrypted3 = encryptionUtility.encrypt(encrypted2);

        // Then - all should be equal since encryption is disabled
        assertThat(encrypted1).isEqualTo(original);
        assertThat(encrypted2).isEqualTo(original);
        assertThat(encrypted3).isEqualTo(original);
    }

    @Test
    void multipleDecryptionCalls_ShouldBeIdempotent() {
        // Given
        String original = "test-token";

        // When
        String decrypted1 = encryptionUtility.decrypt(original);
        String decrypted2 = encryptionUtility.decrypt(decrypted1);
        String decrypted3 = encryptionUtility.decrypt(decrypted2);

        // Then
        assertThat(decrypted1).isEqualTo(original);
        assertThat(decrypted2).isEqualTo(original);
        assertThat(decrypted3).isEqualTo(original);
    }
}
