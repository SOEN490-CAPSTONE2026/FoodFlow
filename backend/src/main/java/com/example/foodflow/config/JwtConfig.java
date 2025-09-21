package com.example.foodflow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private String secret = "mySecretKey";
    private long expiration = 86400000; // 24 hours

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    
    public long getExpiration() { return expiration; }
    public void setExpiration(long expiration) { this.expiration = expiration; }
}
