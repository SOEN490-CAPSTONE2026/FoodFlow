package com.example.foodflow.service.calendar;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

/**
 * Utility for encrypting/decrypting sensitive tokens (OAuth refresh tokens)
 * Uses AES encryption with a secret key from environment variables
 */
@Component
public class EncryptionUtility {

    private static final String ALGORITHM = "AES";
    private static final int KEY_SIZE = 256;
    private final SecretKey secretKey;

    public EncryptionUtility(@Value("${calendar.encryption.key:}") String encryptionKeyString) {
        this.secretKey = loadOrCreateKey(encryptionKeyString);
    }

    private SecretKey loadOrCreateKey(String keyString) {
        try {
            if (keyString != null && !keyString.isBlank()) {
                byte[] decodedKey = Base64.getDecoder().decode(keyString);
                return new SecretKeySpec(decodedKey, 0, decodedKey.length, ALGORITHM);
            } else {
                // Generate a new key if not provided (for development only)
                KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
                keyGen.init(KEY_SIZE);
                return keyGen.generateKey();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to load encryption key", e);
        }
    }

    /**
     * Encrypt a string (e.g., OAuth refresh token)
     */
    public String encrypt(String plainText) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypt a string (e.g., OAuth refresh token)
     */
    public String decrypt(String encryptedText) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decodedBytes = Base64.getDecoder().decode(encryptedText);
            byte[] decryptedBytes = cipher.doFinal(decodedBytes);
            return new String(decryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
