package com.example.foodflow.service.calendar.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleOAuthServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper;

    private GoogleOAuthService googleOAuthService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        googleOAuthService = new GoogleOAuthService(restTemplate, objectMapper);
        
        // Set test values for @Value fields
        ReflectionTestUtils.setField(googleOAuthService, "clientId", "test-client-id");
        ReflectionTestUtils.setField(googleOAuthService, "clientSecret", "test-client-secret");
        ReflectionTestUtils.setField(googleOAuthService, "redirectUri", "http://localhost:8080/callback");
    }

    // ==================== exchangeCodeForTokens ====================

    @Test
    void exchangeCodeForTokens_Success_ShouldReturnTokenResponse() throws Exception {
        // Given
        String authCode = "test-auth-code";
        String responseJson = """
            {
              "access_token": "test-access-token",
              "refresh_token": "test-refresh-token",
              "expires_in": 3600,
              "token_type": "Bearer",
              "scope": "https://www.googleapis.com/auth/calendar"
            }
            """;

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(responseJson);

        // When
        GoogleOAuthService.GoogleTokenResponse result = googleOAuthService.exchangeCodeForTokens(authCode);

        // Then
        assertThat(result.getAccessToken()).isEqualTo("test-access-token");
        assertThat(result.getRefreshToken()).isEqualTo("test-refresh-token");
        assertThat(result.getExpiresIn()).isEqualTo(3600);
        assertThat(result.getTokenType()).isEqualTo("Bearer");
        assertThat(result.getScope()).isEqualTo("https://www.googleapis.com/auth/calendar");
        assertThat(result.getAccessTokenExpiry()).isAfter(LocalDateTime.now());
        assertThat(result.getAccessTokenExpiry()).isBefore(LocalDateTime.now().plusSeconds(3601));

        // Verify request was made
        verify(restTemplate).postForObject(
            eq("https://oauth2.googleapis.com/token"),
            any(HttpEntity.class),
            eq(String.class)
        );
    }

    @Test
    void exchangeCodeForTokens_WithoutScope_ShouldHandleGracefully() throws Exception {
        // Given
        String authCode = "test-auth-code";
        String responseJson = """
            {
              "access_token": "test-access-token",
              "refresh_token": "test-refresh-token",
              "expires_in": 3600,
              "token_type": "Bearer"
            }
            """;

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(responseJson);

        // When
        GoogleOAuthService.GoogleTokenResponse result = googleOAuthService.exchangeCodeForTokens(authCode);

        // Then - scope should be null when not provided
        assertThat(result.getScope()).isNull();
        assertThat(result.getAccessToken()).isEqualTo("test-access-token");
    }

    @Test
    void exchangeCodeForTokens_ShouldIncludeCorrectParameters() throws Exception {
        // Given
        String authCode = "test-auth-code";
        String responseJson = """
            {
              "access_token": "token",
              "refresh_token": "refresh",
              "expires_in": 3600,
              "token_type": "Bearer"
            }
            """;

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(responseJson);

        // When
        googleOAuthService.exchangeCodeForTokens(authCode);

        // Then - capture and verify the request body
        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<String>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String requestBody = (String) captor.getValue().getBody();
        assertThat(requestBody).contains("code=" + authCode);
        assertThat(requestBody).contains("client_id=test-client-id");
        assertThat(requestBody).contains("client_secret=test-client-secret");
        assertThat(requestBody).contains("redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcallback");
        assertThat(requestBody).contains("grant_type=authorization_code");
    }

    @Test
    void exchangeCodeForTokens_WhenRestTemplateFails_ShouldThrowException() {
        // Given
        String authCode = "test-auth-code";
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenThrow(new RuntimeException("Network error"));

        // When/Then
        assertThatThrownBy(() -> googleOAuthService.exchangeCodeForTokens(authCode))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Token exchange failed");
    }

    @Test
    void exchangeCodeForTokens_WithInvalidJson_ShouldThrowException() {
        // Given
        String authCode = "test-auth-code";
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn("invalid json");

        // When/Then
        assertThatThrownBy(() -> googleOAuthService.exchangeCodeForTokens(authCode))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Token exchange failed");
    }

    // ==================== refreshAccessToken ====================

    @Test
    void refreshAccessToken_Success_ShouldReturnNewAccessToken() throws Exception {
        // Given
        String refreshToken = "test-refresh-token";
        String responseJson = """
            {
              "access_token": "new-access-token",
              "expires_in": 3600,
              "token_type": "Bearer"
            }
            """;

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(responseJson);

        // When
        GoogleOAuthService.GoogleTokenResponse result = googleOAuthService.refreshAccessToken(refreshToken);

        // Then
        assertThat(result.getAccessToken()).isEqualTo("new-access-token");
        assertThat(result.getRefreshToken()).isEqualTo(refreshToken); // Should keep original refresh token
        assertThat(result.getExpiresIn()).isEqualTo(3600);
        assertThat(result.getTokenType()).isEqualTo("Bearer");
        assertThat(result.getAccessTokenExpiry()).isAfter(LocalDateTime.now());
    }

    @Test
    void refreshAccessToken_ShouldIncludeCorrectParameters() throws Exception {
        // Given
        String refreshToken = "test-refresh-token";
        String responseJson = """
            {
              "access_token": "new-access-token",
              "expires_in": 3600,
              "token_type": "Bearer"
            }
            """;

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(responseJson);

        // When
        googleOAuthService.refreshAccessToken(refreshToken);

        // Then
        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<String>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String requestBody = (String) captor.getValue().getBody();
        assertThat(requestBody).contains("client_id=test-client-id");
        assertThat(requestBody).contains("client_secret=test-client-secret");
        assertThat(requestBody).contains("refresh_token=test-refresh-token");
        assertThat(requestBody).contains("grant_type=refresh_token");
    }

    @Test
    void refreshAccessToken_WhenFails_ShouldThrowException() {
        // Given
        String refreshToken = "invalid-refresh-token";
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenThrow(new RuntimeException("Invalid token"));

        // When/Then
        assertThatThrownBy(() -> googleOAuthService.refreshAccessToken(refreshToken))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Token refresh failed");
    }

    @Test
    void refreshAccessToken_WithMalformedResponse_ShouldThrowException() {
        // Given
        String refreshToken = "test-refresh-token";
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn("{malformed}");

        // When/Then
        assertThatThrownBy(() -> googleOAuthService.refreshAccessToken(refreshToken))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Token refresh failed");
    }

    // ==================== revokeRefreshToken ====================

    @Test
    void revokeRefreshToken_Success_ShouldCompleteWithoutException() throws Exception {
        // Given
        String refreshToken = "test-refresh-token";
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn("{}");

        // When
        googleOAuthService.revokeRefreshToken(refreshToken);

        // Then - no exception thrown
        verify(restTemplate).postForObject(
            eq("https://oauth2.googleapis.com/revoke"),
            any(HttpEntity.class),
            eq(String.class)
        );
    }

    @Test
    void revokeRefreshToken_ShouldSendTokenInBody() throws Exception {
        // Given
        String refreshToken = "test-refresh-token";
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn("{}");

        // When
        googleOAuthService.revokeRefreshToken(refreshToken);

        // Then
        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<String>> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String requestBody = (String) captor.getValue().getBody();
        assertThat(requestBody).contains("token=test-refresh-token");
    }

    @Test
    void revokeRefreshToken_WhenFails_ShouldNotThrowException() throws Exception {
        // Given
        String refreshToken = "test-refresh-token";
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenThrow(new RuntimeException("Token already revoked"));

        // When/Then - should not throw, just log warning
        googleOAuthService.revokeRefreshToken(refreshToken);

        // Verify the call was attempted
        verify(restTemplate).postForObject(anyString(), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void revokeRefreshToken_WithInvalidToken_ShouldNotThrowException() throws Exception {
        // Given
        String invalidToken = "invalid-token";
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenThrow(new RuntimeException("Invalid token"));

        // When/Then - should gracefully handle the error
        googleOAuthService.revokeRefreshToken(invalidToken);
        
        verify(restTemplate).postForObject(anyString(), any(HttpEntity.class), eq(String.class));
    }

    // ==================== getAuthorizationUrl ====================

    @Test
    void getAuthorizationUrl_ShouldGenerateCorrectUrl() {
        // Given
        String state = "test-state-123";

        // When
        String result = googleOAuthService.getAuthorizationUrl(state);

        // Then
        assertThat(result).startsWith("https://accounts.google.com/o/oauth2/v2/auth");
        assertThat(result).contains("client_id=test-client-id");
        assertThat(result).contains("redirect_uri=http://localhost:8080/callback");
        assertThat(result).contains("response_type=code");
        assertThat(result).contains("scope=https://www.googleapis.com/auth/calendar");
        assertThat(result).contains("state=test-state-123");
        assertThat(result).contains("access_type=offline");
        assertThat(result).contains("prompt=consent");
    }

    @Test
    void getAuthorizationUrl_WithSpecialCharactersInState_ShouldEncodeCorrectly() {
        // Given
        String state = "state-with-special&chars=test";

        // When
        String result = googleOAuthService.getAuthorizationUrl(state);

        // Then - state should be URL encoded
        assertThat(result).contains("state=state-with-special%26chars%3Dtest");
    }

    @Test
    void getAuthorizationUrl_ShouldRequestOfflineAccess() {
        // Given
        String state = "test-state";

        // When
        String result = googleOAuthService.getAuthorizationUrl(state);

        // Then - offline access ensures we get a refresh token
        assertThat(result).contains("access_type=offline");
    }

    @Test
    void getAuthorizationUrl_ShouldForceConsent() {
        // Given
        String state = "test-state";

        // When
        String result = googleOAuthService.getAuthorizationUrl(state);

        // Then - consent prompt ensures refresh token on subsequent auths
        assertThat(result).contains("prompt=consent");
    }

    // ==================== GoogleTokenResponse ====================

    @Test
    void googleTokenResponse_SettersAndGetters_ShouldWork() {
        // Given
        GoogleOAuthService.GoogleTokenResponse response = new GoogleOAuthService.GoogleTokenResponse();
        LocalDateTime expiry = LocalDateTime.now().plusHours(1);

        // When
        response.setAccessToken("access-token");
        response.setRefreshToken("refresh-token");
        response.setExpiresIn(7200);
        response.setTokenType("Bearer");
        response.setScope("calendar.readonly");
        response.setAccessTokenExpiry(expiry);

        // Then
        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getExpiresIn()).isEqualTo(7200);
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getScope()).isEqualTo("calendar.readonly");
        assertThat(response.getAccessTokenExpiry()).isEqualTo(expiry);
    }

    @Test
    void googleTokenResponse_DefaultValues_ShouldBeNull() {
        // Given/When
        GoogleOAuthService.GoogleTokenResponse response = new GoogleOAuthService.GoogleTokenResponse();

        // Then
        assertThat(response.getAccessToken()).isNull();
        assertThat(response.getRefreshToken()).isNull();
        assertThat(response.getExpiresIn()).isZero();
        assertThat(response.getTokenType()).isNull();
        assertThat(response.getScope()).isNull();
        assertThat(response.getAccessTokenExpiry()).isNull();
    }
}
