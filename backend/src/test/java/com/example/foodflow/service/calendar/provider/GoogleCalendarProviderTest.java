package com.example.foodflow.service.calendar.provider;

import com.example.foodflow.model.dto.calendar.google.GoogleCalendarEventRequest;
import com.example.foodflow.model.dto.calendar.google.GoogleCalendarEventResponse;
import com.example.foodflow.model.dto.calendar.google.GoogleCalendarSettingsResponse;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.service.calendar.EncryptionUtility;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("deprecation")
class GoogleCalendarProviderTest {

    @Mock
    private GoogleOAuthService googleOAuthService;

    @Mock
    private EncryptionUtility encryptionUtility;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ObjectWriter objectWriter;

    @Mock
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;

    @InjectMocks
    private GoogleCalendarProvider googleCalendarProvider;

    private User testUser;
    private SyncedCalendarEvent testEvent;
    private CalendarSyncPreference testPreferences;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testEvent = new SyncedCalendarEvent();
        testEvent.setId(1L);
        testEvent.setUser(testUser);
        testEvent.setEventTitle("Test Event");
        testEvent.setEventDescription("Test Description");
        testEvent.setStartTime(LocalDateTime.of(2026, 3, 1, 10, 0));
        testEvent.setEndTime(LocalDateTime.of(2026, 3, 1, 11, 0));
        testEvent.setTimezone("America/New_York");
        testEvent.setExternalEventId("google-event-123");

        testPreferences = new CalendarSyncPreference();
        testPreferences.setUser(testUser);
        testPreferences.setEventColor("BLUE");
        testPreferences.setEventVisibility("PRIVATE");
        testPreferences.setAutoCreateReminders(true);
        testPreferences.setReminderMinutesBefore(30);
        testPreferences.setReminderType("POPUP");
    }

    // ==================== getProviderName ====================

    @Test
    void getProviderName_ShouldReturnGoogle() {
        // When
        String result = googleCalendarProvider.getProviderName();

        // Then
        assertThat(result).isEqualTo("GOOGLE");
    }

    // ==================== createEvent ====================

    @Test
    void createEvent_WithPreferences_ShouldApplyUserSettings() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        String refreshToken = "refresh-token";
        String accessToken = "access-token";

        lenient().when(encryptionUtility.decrypt(anyString())).thenReturn(refreshToken);
        lenient().when(encryptionUtility.encrypt(anyString())).thenReturn(encryptedToken);
        
        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPreferences));
        when(objectMapper.writerWithDefaultPrettyPrinter()).thenReturn(objectWriter);
        when(objectWriter.writeValueAsString(any())).thenReturn("{}");

        ResponseEntity<String> response = ResponseEntity.ok("{\"id\":\"event-123\"}");
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(response);

        GoogleCalendarEventResponse eventResponse = new GoogleCalendarEventResponse();
        eventResponse.setId("event-123");
        when(objectMapper.readValue(anyString(), eq(GoogleCalendarEventResponse.class)))
            .thenReturn(eventResponse);

        // When
        googleCalendarProvider.createEvent(encryptedToken, testEvent);

        // Then - verify preferences were retrieved
        verify(calendarSyncPreferenceRepository).findByUserId(1L);
    }

    @Test
    void createEvent_WhenApiReturnsError_ShouldThrowException() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        String refreshToken = "refresh-token";
        String accessToken = "access-token";

        lenient().when(encryptionUtility.decrypt(anyString())).thenReturn(refreshToken);
        lenient().when(encryptionUtility.encrypt(anyString())).thenReturn(encryptedToken);
        
        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPreferences));
        when(objectMapper.writerWithDefaultPrettyPrinter()).thenReturn(objectWriter);
        when(objectWriter.writeValueAsString(any())).thenReturn("{}");

        ResponseEntity<String> response = ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error");
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
            .thenReturn(response);

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.createEvent(encryptedToken, testEvent))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Failed to create event");
    }

    @Test
    void createEvent_WhenExceptionThrown_ShouldWrapInProviderException() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        when(encryptionUtility.decrypt(encryptedToken)).thenThrow(new RuntimeException("Decryption failed"));

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.createEvent(encryptedToken, testEvent))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Event creation failed");
    }

    // ==================== updateEvent ====================

    @Test
    void updateEvent_Success_ShouldUpdateEvent() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        String refreshToken = "refresh-token";
        String accessToken = "access-token";

        lenient().when(encryptionUtility.decrypt(anyString())).thenReturn(refreshToken);
        lenient().when(encryptionUtility.encrypt(anyString())).thenReturn(encryptedToken);
        
        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPreferences));

        ResponseEntity<String> response = ResponseEntity.ok("{}");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(String.class)))
            .thenReturn(response);

        // When
        googleCalendarProvider.updateEvent(encryptedToken, testEvent);

        // Then
        verify(restTemplate).exchange(
            contains("google-event-123"),
            eq(HttpMethod.PATCH),
            any(HttpEntity.class),
            eq(String.class)
        );
    }

    @Test
    void updateEvent_WithoutExternalEventId_ShouldThrowException() {
        // Given
        testEvent.setExternalEventId(null);
        String encryptedToken = "encrypted-token";

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.updateEvent(encryptedToken, testEvent))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Cannot update event without external event ID");
    }

    @Test
    void updateEvent_WhenApiReturnsError_ShouldThrowException() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        String refreshToken = "refresh-token";
        String accessToken = "access-token";

        lenient().when(encryptionUtility.decrypt(anyString())).thenReturn(refreshToken);
        lenient().when(encryptionUtility.encrypt(anyString())).thenReturn(encryptedToken);
        
        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPreferences));

        ResponseEntity<String> response = ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PATCH), any(HttpEntity.class), eq(String.class)))
            .thenReturn(response);

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.updateEvent(encryptedToken, testEvent))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Failed to update event");
    }

    @Test
    void updateEvent_WhenExceptionThrown_ShouldWrapException() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        when(encryptionUtility.decrypt(encryptedToken)).thenThrow(new RuntimeException("Error"));

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.updateEvent(encryptedToken, testEvent))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Event update failed");
    }

    // ==================== deleteEvent ====================

    @Test
    void deleteEvent_Success_ShouldDeleteEvent() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        String refreshToken = "refresh-token";
        String accessToken = "access-token";
        String externalEventId = "event-to-delete";

        lenient().when(encryptionUtility.decrypt(anyString())).thenReturn(refreshToken);
        lenient().when(encryptionUtility.encrypt(anyString())).thenReturn(encryptedToken);
        
        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        ResponseEntity<Void> response = ResponseEntity.ok().build();
        when(restTemplate.exchange(anyString(), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class)))
            .thenReturn(response);

        // When
        googleCalendarProvider.deleteEvent(encryptedToken, externalEventId);

        // Then
        verify(restTemplate).exchange(
            contains(externalEventId),
            eq(HttpMethod.DELETE),
            any(HttpEntity.class),
            eq(Void.class)
        );
    }

    @Test
    void deleteEvent_WhenApiReturnsError_ShouldThrowException() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        String refreshToken = "refresh-token";
        String accessToken = "access-token";
        String externalEventId = "event-to-delete";

        lenient().when(encryptionUtility.decrypt(anyString())).thenReturn(refreshToken);
        lenient().when(encryptionUtility.encrypt(anyString())).thenReturn(encryptedToken);
        
        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        ResponseEntity<Void> response = ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        when(restTemplate.exchange(anyString(), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class)))
            .thenReturn(response);

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.deleteEvent(encryptedToken, externalEventId))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Failed to delete event");
    }

    @Test
    void deleteEvent_WhenExceptionThrown_ShouldWrapException() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        String externalEventId = "event-123";
        when(encryptionUtility.decrypt(encryptedToken)).thenThrow(new RuntimeException("Error"));

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.deleteEvent(encryptedToken, externalEventId))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Event deletion failed");
    }

    // ==================== refreshAccessToken ====================

    @Test
    void refreshAccessToken_Success_ShouldReturnNewAccessToken() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        String refreshToken = "refresh-token";
        String newAccessToken = "new-access-token";

        when(encryptionUtility.decrypt(encryptedToken)).thenReturn(refreshToken);
        
        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(newAccessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        // When
        String result = googleCalendarProvider.refreshAccessToken(encryptedToken);

        // Then
        assertThat(result).isEqualTo(newAccessToken);
        verify(googleOAuthService).refreshAccessToken(refreshToken);
    }

    @Test
    void refreshAccessToken_WhenOAuthServiceFails_ShouldThrowException() throws Exception {
        // Given
        String encryptedToken = "encrypted-token";
        String refreshToken = "refresh-token";

        when(encryptionUtility.decrypt(encryptedToken)).thenReturn(refreshToken);
        when(googleOAuthService.refreshAccessToken(refreshToken))
            .thenThrow(new CalendarProvider.CalendarProviderException("Token expired"));

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.refreshAccessToken(encryptedToken))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Token refresh failed");
    }

    // ==================== verifyCalendarAccess ====================

    @Test
    void verifyCalendarAccess_WithValidAccess_ShouldReturnTrue() throws Exception {
        // Given
        String refreshToken = "valid-refresh-token";
        String accessToken = "access-token";

        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        ResponseEntity<String> response = ResponseEntity.ok("{}");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(response);

        // When
        boolean result = googleCalendarProvider.verifyCalendarAccess(refreshToken);

        // Then
        assertThat(result).isTrue();
        verify(googleOAuthService).refreshAccessToken(refreshToken);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.GET), any(), eq(String.class));
    }

    @Test
    void verifyCalendarAccess_WithInvalidAccess_ShouldReturnFalse() throws Exception {
        // Given
        String refreshToken = "valid-refresh-token";
        String accessToken = "access-token";

        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        ResponseEntity<String> response = ResponseEntity.status(HttpStatus.FORBIDDEN).body("{}");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(response);

        // When
        boolean result = googleCalendarProvider.verifyCalendarAccess(refreshToken);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void verifyCalendarAccess_WithInvalidGrantError_ShouldThrowException() throws Exception {
        // Given
        String refreshToken = "invalid-refresh-token";
        when(googleOAuthService.refreshAccessToken(refreshToken))
            .thenThrow(new CalendarProvider.CalendarProviderException("invalid_grant"));

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.verifyCalendarAccess(refreshToken))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("invalid_grant");
    }

    @Test
    void verifyCalendarAccess_WithNetworkError_ShouldThrowException() throws Exception {
        // Given
        String refreshToken = "refresh-token";
        when(googleOAuthService.refreshAccessToken(refreshToken))
            .thenThrow(new RuntimeException("Network error"));

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.verifyCalendarAccess(refreshToken))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Verification failed");
    }

    // ==================== fetchCalendarSettings ====================

    @Test
    void fetchCalendarSettings_Success_ShouldReturnSettings() throws Exception {
        // Given
        String refreshToken = "refresh-token";
        String accessToken = "access-token";

        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        String settingsJson = "{\"id\":\"cal-123\",\"summary\":\"My Calendar\",\"timeZone\":\"America/New_York\"}";
        ResponseEntity<String> response = ResponseEntity.ok(settingsJson);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(response);

        GoogleCalendarSettingsResponse settings = new GoogleCalendarSettingsResponse();
        settings.setId("cal-123");
        settings.setSummary("My Calendar");
        settings.setTimeZone("America/New_York");
        when(objectMapper.readValue(settingsJson, GoogleCalendarSettingsResponse.class))
            .thenReturn(settings);

        // When
        GoogleCalendarSettingsResponse result = googleCalendarProvider.fetchCalendarSettings(refreshToken);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("cal-123");
        verify(googleOAuthService).refreshAccessToken(refreshToken);
    }

    @Test
    void fetchCalendarSettings_WhenApiReturnsError_ShouldThrowException() throws Exception {
        // Given
        String refreshToken = "refresh-token";
        String accessToken = "access-token";

        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken(accessToken);
        when(googleOAuthService.refreshAccessToken(refreshToken)).thenReturn(tokenResponse);

        ResponseEntity<String> response = ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
            .thenReturn(response);

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.fetchCalendarSettings(refreshToken))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Failed to fetch calendar settings");
    }

    @Test
    void fetchCalendarSettings_WhenExceptionThrown_ShouldWrapException() throws Exception {
        // Given
        String refreshToken = "refresh-token";
        when(googleOAuthService.refreshAccessToken(refreshToken))
            .thenThrow(new RuntimeException("Network error"));

        // When/Then
        assertThatThrownBy(() -> googleCalendarProvider.fetchCalendarSettings(refreshToken))
            .isInstanceOf(CalendarProvider.CalendarProviderException.class)
            .hasMessageContaining("Failed to fetch calendar settings");
    }
}
