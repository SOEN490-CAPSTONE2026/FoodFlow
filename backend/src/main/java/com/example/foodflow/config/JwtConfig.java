package com.example.foodflow.config;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import java.util.Set;

@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    private static final Set<String> KNOWN_WEAK_SECRETS = Set.of(
            "mySecretKey",
            "secret",
            "my-local-secret-key-please-change",
            "changeme",
            "password"
    );

    private String secret;
    private long expiration = 86400000; // 24 hours

    @PostConstruct
    public void validateSecret() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT secret is not configured. Set the JWT_SECRET environment variable.");
        }
        if (KNOWN_WEAK_SECRETS.contains(secret)) {
            throw new IllegalStateException(
                    "JWT secret is a known insecure default value. Set a strong, unique JWT_SECRET environment variable.");
        }
        if (secret.length() < 32) {
            throw new IllegalStateException(
                    "JWT secret is too short (minimum 32 characters). Set a strong JWT_SECRET environment variable.");
        }
    }

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }

    public long getExpiration() { return expiration; }
    public void setExpiration(long expiration) { this.expiration = expiration; }
}
