package com.example.foodflow.service.calendar.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for Google OAuth2 authentication
 * Handles authorization code exchange for tokens
 */
@Service
public class GoogleOAuthService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuthService.class);
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

    @Value("${google.calendar.client-id}")
    private String clientId;

    @Value("${google.calendar.client-secret}")
    private String clientSecret;

    @Value("${google.calendar.redirect-uri}")
    private String redirectUri;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GoogleOAuthService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Exchange authorization code for access and refresh tokens
     */
    public GoogleTokenResponse exchangeCodeForTokens(String authCode) throws CalendarProvider.CalendarProviderException {
        try {
            Map<String, String> body = new HashMap<>();
            body.put("code", authCode);
            body.put("client_id", clientId);
            body.put("client_secret", clientSecret);
            body.put("redirect_uri", redirectUri);
            body.put("grant_type", "authorization_code");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String requestBody = buildFormUrlEncodedBody(body);
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

            String response = restTemplate.postForObject(GOOGLE_TOKEN_URL, request, String.class);
            JsonNode jsonResponse = objectMapper.readTree(response);

            GoogleTokenResponse tokenResponse = new GoogleTokenResponse();
            tokenResponse.setAccessToken(jsonResponse.get("access_token").asText());
            tokenResponse.setRefreshToken(jsonResponse.get("refresh_token").asText());
            tokenResponse.setExpiresIn(jsonResponse.get("expires_in").asInt());
            tokenResponse.setTokenType(jsonResponse.get("token_type").asText("Bearer"));
            
            // Extract scope if present (space-separated list of granted scopes)
            if (jsonResponse.has("scope")) {
                tokenResponse.setScope(jsonResponse.get("scope").asText());
            }

            // Calculate expiry time
            LocalDateTime expiryTime = LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn());
            tokenResponse.setAccessTokenExpiry(expiryTime);

            logger.info("Successfully exchanged authorization code for tokens");
            return tokenResponse;
        } catch (Exception e) {
            logger.error("Failed to exchange authorization code for tokens", e);
            throw new CalendarProvider.CalendarProviderException("Token exchange failed: " + e.getMessage(), e);
        }
    }

    /**
     * Refresh an expired access token
     */
    public GoogleTokenResponse refreshAccessToken(String refreshToken) throws CalendarProvider.CalendarProviderException {
        try {
            Map<String, String> body = new HashMap<>();
            body.put("client_id", clientId);
            body.put("client_secret", clientSecret);
            body.put("refresh_token", refreshToken);
            body.put("grant_type", "refresh_token");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String requestBody = buildFormUrlEncodedBody(body);
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

            String response = restTemplate.postForObject(GOOGLE_TOKEN_URL, request, String.class);
            JsonNode jsonResponse = objectMapper.readTree(response);

            GoogleTokenResponse tokenResponse = new GoogleTokenResponse();
            tokenResponse.setAccessToken(jsonResponse.get("access_token").asText());
            tokenResponse.setRefreshToken(refreshToken); // Refresh token stays the same
            tokenResponse.setExpiresIn(jsonResponse.get("expires_in").asInt());
            tokenResponse.setTokenType(jsonResponse.get("token_type").asText("Bearer"));

            LocalDateTime expiryTime = LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn());
            tokenResponse.setAccessTokenExpiry(expiryTime);

            logger.info("Successfully refreshed access token");
            return tokenResponse;
        } catch (Exception e) {
            logger.error("Failed to refresh access token", e);
            throw new CalendarProvider.CalendarProviderException("Token refresh failed: " + e.getMessage(), e);
        }
    }

    /**
     * Revoke a refresh token (disconnect)
     * Makes a POST request to Google's revoke endpoint with the token
     */
    public void revokeRefreshToken(String refreshToken) throws CalendarProvider.CalendarProviderException {
        try {
            logger.info("Attempting to revoke refresh token with Google");
            
            Map<String, String> body = new HashMap<>();
            body.put("token", refreshToken);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String requestBody = buildFormUrlEncodedBody(body);
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

            restTemplate.postForObject(GOOGLE_REVOKE_URL, request, String.class);
            logger.info("Successfully revoked refresh token with Google");
        } catch (Exception e) {
            logger.warn("Failed to revoke refresh token with Google (may already be revoked): {}", e.getMessage());
            // Don't throw exception - revocation failure shouldn't block disconnect
            // Token may already be revoked or invalid
        }
    }

    /**
     * Convert map to form URL encoded body
     */
    private String buildFormUrlEncodedBody(Map<String, String> params) {
        StringBuilder body = new StringBuilder();
        params.forEach((key, value) -> {
            if (body.length() > 0) body.append("&");
            body.append(URLEncoder.encode(key, StandardCharsets.UTF_8))
                .append("=")
                .append(URLEncoder.encode(value, StandardCharsets.UTF_8));
        });
        return body.toString();
    }

    /**
     * Generate OAuth authorization URL
     */
    public String getAuthorizationUrl(String state) {
        return UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
            .queryParam("client_id", clientId)
            .queryParam("redirect_uri", redirectUri)
            .queryParam("response_type", "code")
            .queryParam("scope", "https://www.googleapis.com/auth/calendar")
            .queryParam("state", state)
            .queryParam("access_type", "offline")
            .queryParam("prompt", "consent")
            .toUriString();
    }

    /**
     * DTO for Google OAuth token response
     */
    public static class GoogleTokenResponse {
        private String accessToken;
        private String refreshToken;
        private int expiresIn;
        private String tokenType;
        private String scope; // Space-separated list of granted scopes
        private LocalDateTime accessTokenExpiry;

        // Getters and Setters
        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

        public int getExpiresIn() { return expiresIn; }
        public void setExpiresIn(int expiresIn) { this.expiresIn = expiresIn; }

        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }

        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }

        public LocalDateTime getAccessTokenExpiry() { return accessTokenExpiry; }
        public void setAccessTokenExpiry(LocalDateTime accessTokenExpiry) { this.accessTokenExpiry = accessTokenExpiry; }
    }
}
