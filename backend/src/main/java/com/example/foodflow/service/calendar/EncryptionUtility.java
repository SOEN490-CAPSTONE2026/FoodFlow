package com.example.foodflow.service.calendar;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Utility for encrypting/decrypting sensitive tokens (OAuth refresh tokens)
 * DEPRECATED: Encryption has been removed for local development simplicity
 * Tokens are stored in plain text in the database
 * 
 * For production, consider:
 * - Database-level encryption (PostgreSQL pgcrypto)
 * - Column-level encryption
 * - External secret management (AWS Secrets Manager, HashiCorp Vault)
 */
@Component
@Deprecated
public class EncryptionUtility {

    private static final Logger logger = LoggerFactory.getLogger(EncryptionUtility.class);

    public EncryptionUtility(@Value("${calendar.encryption.key:}") String encryptionKeyString) {
        logger.warn("EncryptionUtility is deprecated and should not be used. Tokens are stored in plain text.");
    }

    /**
     * @deprecated No longer encrypts - returns input as-is
     */
    @Deprecated
    public String encrypt(String plainText) {
        logger.warn("encrypt() called but encryption is disabled - returning plain text");
        return plainText;
    }

    /**
     * @deprecated No longer decrypts - returns input as-is
     */
    @Deprecated
    public String decrypt(String encryptedText) {
        logger.warn("decrypt() called but encryption is disabled - returning plain text");
        return encryptedText;
    }
}
