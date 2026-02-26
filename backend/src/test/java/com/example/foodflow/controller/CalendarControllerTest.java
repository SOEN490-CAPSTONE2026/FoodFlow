package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ApiResponse;
import com.example.foodflow.model.dto.calendar.CalendarConnectionRequest;
import com.example.foodflow.model.dto.calendar.CalendarConnectionResponse;
import com.example.foodflow.model.dto.calendar.CalendarEventDto;
import com.example.foodflow.model.dto.calendar.CalendarSyncPreferenceDto;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.service.calendar.CalendarIntegrationService;
import com.example.foodflow.service.calendar.CalendarEventService;
import com.example.foodflow.service.calendar.CalendarSyncService;
import com.example.foodflow.service.calendar.provider.GoogleOAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarControllerTest {

    @Mock
    private CalendarIntegrationService calendarIntegrationService;

    @Mock
    private CalendarEventService calendarEventService;

    @Mock
    private CalendarSyncService calendarSyncService;

    @Mock
    private GoogleOAuthService googleOAuthService;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;

    @InjectMocks
    private CalendarController calendarController;

    private User testUser;
    private CalendarIntegration testIntegration;
    private CalendarSyncPreference testPreferences;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testIntegration = new CalendarIntegration(testUser, "GOOGLE");
        testIntegration.setIsConnected(true);
        testIntegration.setGoogleAccountEmail("test@gmail.com");
        testIntegration.setPrimaryCalendarName("Primary");
        testIntegration.setCalendarTimeZone("America/New_York");
        testIntegration.setGrantedScopes("calendar");
        testIntegration.setLastSuccessfulSync(LocalDateTime.now().minusHours(1));

        testPreferences = new CalendarSyncPreference(testUser);
        testPreferences.setSyncEnabled(true);
        testPreferences.setAutoCreateReminders(true);
        testPreferences.setReminderMinutesBefore(30);
        testPreferences.setReminderType("POPUP");
        testPreferences.setEventColor("BLUE");
        testPreferences.setEventVisibility("PRIVATE");
        testPreferences.setEventDuration(60);

        ReflectionTestUtils.setField(calendarController, "frontendUrl", "http://localhost:3000");
    }

    // ==================== getCalendarStatus ====================

    @Test
    void getCalendarStatus_WhenIntegrationExists_ShouldReturnConnectionDetails() {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser))
            .thenReturn(Optional.of(testIntegration));

        // When
        ResponseEntity<ApiResponse<CalendarConnectionResponse>> response = 
            calendarController.getCalendarStatus(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getData().getIsConnected()).isTrue();
        assertThat(response.getBody().getData().getCalendarProvider()).isEqualTo("GOOGLE");
        assertThat(response.getBody().getData().getGoogleAccountEmail()).isEqualTo("test@gmail.com");
        assertThat(response.getBody().getData().getPrimaryCalendarName()).isEqualTo("Primary");
        assertThat(response.getBody().getData().getCalendarTimeZone()).isEqualTo("America/New_York");

        verify(calendarIntegrationService).verifyAndUpdateConnectionStatus(testUser);
        verify(calendarIntegrationService).getUserIntegration(testUser);
    }

    @Test
    void getCalendarStatus_WhenNoIntegration_ShouldReturnNotConnected() {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser))
            .thenReturn(Optional.empty());

        // When
        ResponseEntity<ApiResponse<CalendarConnectionResponse>> response = 
            calendarController.getCalendarStatus(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getData().getIsConnected()).isFalse();
        assertThat(response.getBody().getData().getMessage()).contains("No calendar integration found");

        verify(calendarIntegrationService).verifyAndUpdateConnectionStatus(testUser);
    }

    @Test
    void getCalendarStatus_WhenIntegrationDisconnected_ShouldReturnDisconnected() {
        // Given
        testIntegration.setIsConnected(false);
        when(calendarIntegrationService.getUserIntegration(testUser))
            .thenReturn(Optional.of(testIntegration));

        // When
        ResponseEntity<ApiResponse<CalendarConnectionResponse>> response = 
            calendarController.getCalendarStatus(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getIsConnected()).isFalse();
        assertThat(response.getBody().getData().getMessage()).contains("Calendar is disconnected");
    }

    @Test
    void getCalendarStatus_WhenExceptionOccurs_ShouldReturnError() {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser))
            .thenThrow(new RuntimeException("Database error"));

        // When
        ResponseEntity<ApiResponse<CalendarConnectionResponse>> response = 
            calendarController.getCalendarStatus(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Error retrieving calendar status");
    }

    // ==================== initiateCalendarConnection ====================

    @Test
    void initiateCalendarConnection_WithGoogleProvider_ShouldReturnAuthUrl() {
        // Given
        CalendarConnectionRequest request = new CalendarConnectionRequest();
        request.setCalendarProvider("GOOGLE");

        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=test";
        when(googleOAuthService.getAuthorizationUrl(anyString())).thenReturn(authUrl);

        // When
        ResponseEntity<ApiResponse<Map<String, String>>> response = 
            calendarController.initiateCalendarConnection(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getData()).containsKey("authorizationUrl");
        assertThat(response.getBody().getData()).containsKey("provider");
        assertThat(response.getBody().getData()).containsKey("state");
        assertThat(response.getBody().getData().get("authorizationUrl")).isEqualTo(authUrl);
        assertThat(response.getBody().getData().get("provider")).isEqualTo("GOOGLE");

        verify(googleOAuthService).getAuthorizationUrl(anyString());
    }

    @Test
    void initiateCalendarConnection_WithLowercaseProvider_ShouldWork() {
        // Given
        CalendarConnectionRequest request = new CalendarConnectionRequest();
        request.setCalendarProvider("google");

        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=test";
        when(googleOAuthService.getAuthorizationUrl(anyString())).thenReturn(authUrl);

        // When
        ResponseEntity<ApiResponse<Map<String, String>>> response = 
            calendarController.initiateCalendarConnection(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
    }

    @Test
    void initiateCalendarConnection_WithNullProvider_ShouldReturnBadRequest() {
        // Given
        CalendarConnectionRequest request = new CalendarConnectionRequest();
        request.setCalendarProvider(null);

        // When
        ResponseEntity<ApiResponse<Map<String, String>>> response = 
            calendarController.initiateCalendarConnection(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Calendar provider is required");

        verify(googleOAuthService, never()).getAuthorizationUrl(anyString());
    }

    @Test
    void initiateCalendarConnection_WithEmptyProvider_ShouldReturnBadRequest() {
        // Given
        CalendarConnectionRequest request = new CalendarConnectionRequest();
        request.setCalendarProvider("");

        // When
        ResponseEntity<ApiResponse<Map<String, String>>> response = 
            calendarController.initiateCalendarConnection(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
    }

    @Test
    void initiateCalendarConnection_WithUnsupportedProvider_ShouldReturnBadRequest() {
        // Given
        CalendarConnectionRequest request = new CalendarConnectionRequest();
        request.setCalendarProvider("OUTLOOK");

        // When
        ResponseEntity<ApiResponse<Map<String, String>>> response = 
            calendarController.initiateCalendarConnection(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Unsupported calendar provider");

        verify(googleOAuthService, never()).getAuthorizationUrl(anyString());
    }

    @Test
    void initiateCalendarConnection_WhenExceptionOccurs_ShouldReturnError() {
        // Given
        CalendarConnectionRequest request = new CalendarConnectionRequest();
        request.setCalendarProvider("GOOGLE");

        when(googleOAuthService.getAuthorizationUrl(anyString()))
            .thenThrow(new RuntimeException("OAuth error"));

        // When
        ResponseEntity<ApiResponse<Map<String, String>>> response = 
            calendarController.initiateCalendarConnection(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Error initiating connection");
    }

    // ==================== handleGoogleOAuthCallback ====================

    @Test
    void handleGoogleOAuthCallback_WithValidCodeAndState_ShouldRedirectToSuccess() throws Exception {
        // Given
        String authCode = "auth-code-123";
        String state = "uuid-123_1";

        GoogleOAuthService.GoogleTokenResponse tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setAccessToken("access-token");
        tokenResponse.setRefreshToken("refresh-token");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(googleOAuthService.exchangeCodeForTokens(authCode)).thenReturn(tokenResponse);

        // When
        ResponseEntity<?> response = calendarController.handleGoogleOAuthCallback(authCode, state);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(response.getHeaders().getLocation()).hasToString("http://localhost:3000/calendar/oauth-success");

        verify(userRepository).findById(1L);
        verify(googleOAuthService).exchangeCodeForTokens(authCode);
        verify(calendarIntegrationService).storeOAuthTokens(testUser, "GOOGLE", tokenResponse);
    }

    @Test
    void handleGoogleOAuthCallback_WithInvalidStateFormat_ShouldReturnBadRequest() throws Exception {
        // Given
        String authCode = "auth-code-123";
        String state = "invalid-state";

        // When
        ResponseEntity<?> response = calendarController.handleGoogleOAuthCallback(authCode, state);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isInstanceOf(String.class);
        assertThat((String) response.getBody()).contains("Invalid authentication state");

        verify(userRepository, never()).findById(anyLong());
        verify(googleOAuthService, never()).exchangeCodeForTokens(anyString());
    }

    @Test
    void handleGoogleOAuthCallback_WithNonNumericUserId_ShouldReturnBadRequest() throws Exception {
        // Given
        String authCode = "auth-code-123";
        String state = "uuid-123_abc";

        // When
        ResponseEntity<?> response = calendarController.handleGoogleOAuthCallback(authCode, state);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isInstanceOf(String.class);
        assertThat((String) response.getBody()).contains("Invalid state parameter");

        verify(userRepository, never()).findById(anyLong());
    }

    @Test
    void handleGoogleOAuthCallback_WithNonExistentUser_ShouldReturnNotFound() throws Exception {
        // Given
        String authCode = "auth-code-123";
        String state = "uuid-123_999";

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        ResponseEntity<?> response = calendarController.handleGoogleOAuthCallback(authCode, state);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isInstanceOf(String.class);
        assertThat((String) response.getBody()).contains("User not found");

        verify(userRepository).findById(999L);
        verify(googleOAuthService, never()).exchangeCodeForTokens(anyString());
    }

    @Test
    void handleGoogleOAuthCallback_WhenTokenExchangeFails_ShouldReturnError() throws Exception {
        // Given
        String authCode = "auth-code-123";
        String state = "uuid-123_1";

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(googleOAuthService.exchangeCodeForTokens(authCode))
            .thenThrow(new RuntimeException("Token exchange failed"));

        // When
        ResponseEntity<?> response = calendarController.handleGoogleOAuthCallback(authCode, state);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isInstanceOf(String.class);
        assertThat((String) response.getBody()).contains("Connection Failed");

        verify(googleOAuthService).exchangeCodeForTokens(authCode);
    }

    // ==================== disconnectCalendar ====================

    @Test
    void disconnectCalendar_WithValidProvider_ShouldDisconnect() {
        // Given
        String provider = "GOOGLE";

        // When
        ResponseEntity<ApiResponse<Object>> response = 
            calendarController.disconnectCalendar(provider, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).contains("Calendar disconnected successfully");

        verify(calendarIntegrationService).disconnectCalendar(testUser, provider);
    }

    @Test
    void disconnectCalendar_WithNullUser_ShouldReturnUnauthorized() {
        // Given
        String provider = "GOOGLE";

        // When
        ResponseEntity<ApiResponse<Object>> response = 
            calendarController.disconnectCalendar(provider, null);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("User not authenticated");

        verify(calendarIntegrationService, never()).disconnectCalendar(any(), anyString());
    }

    @Test
    void disconnectCalendar_WithNullProvider_ShouldReturnBadRequest() {
        // When
        ResponseEntity<ApiResponse<Object>> response = 
            calendarController.disconnectCalendar(null, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Calendar provider is required");

        verify(calendarIntegrationService, never()).disconnectCalendar(any(), anyString());
    }

    @Test
    void disconnectCalendar_WithEmptyProvider_ShouldReturnBadRequest() {
        // When
        ResponseEntity<ApiResponse<Object>> response = 
            calendarController.disconnectCalendar("", testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();

        verify(calendarIntegrationService, never()).disconnectCalendar(any(), anyString());
    }

    @Test
    void disconnectCalendar_WhenExceptionOccurs_ShouldReturnError() {
        // Given
        String provider = "GOOGLE";
        doThrow(new RuntimeException("Disconnect failed"))
            .when(calendarIntegrationService).disconnectCalendar(testUser, provider);

        // When
        ResponseEntity<ApiResponse<Object>> response = 
            calendarController.disconnectCalendar(provider, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Error disconnecting");
    }

    // ==================== getSyncPreferences ====================

    @Test
    void getSyncPreferences_WhenPreferencesExist_ShouldReturnThem() {
        // Given
        when(calendarEventService.getUserSyncPreferences(testUser.getId()))
            .thenReturn(Optional.of(testPreferences));

        // When
        ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> response = 
            calendarController.getSyncPreferences(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getData().getSyncEnabled()).isTrue();
        assertThat(response.getBody().getData().getAutoCreateReminders()).isTrue();
        assertThat(response.getBody().getData().getReminderSecondsBefore()).isEqualTo(30);
        assertThat(response.getBody().getData().getReminderType()).isEqualTo("POPUP");
        assertThat(response.getBody().getData().getEventColor()).isEqualTo("BLUE");
        assertThat(response.getBody().getData().getEventVisibility()).isEqualTo("PRIVATE");
        assertThat(response.getBody().getData().getEventDuration()).isEqualTo(60);

        verify(calendarEventService).getUserSyncPreferences(testUser.getId());
        verify(calendarIntegrationService, never()).createDefaultSyncPreferencesIfNeeded(any());
    }

    @Test
    void getSyncPreferences_WhenNoPreferences_ShouldCreateDefaults() {
        // Given
        when(calendarEventService.getUserSyncPreferences(testUser.getId()))
            .thenReturn(Optional.empty());
        when(calendarIntegrationService.createDefaultSyncPreferencesIfNeeded(testUser))
            .thenReturn(testPreferences);

        // When
        ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> response = 
            calendarController.getSyncPreferences(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();

        verify(calendarEventService).getUserSyncPreferences(testUser.getId());
        verify(calendarIntegrationService).createDefaultSyncPreferencesIfNeeded(testUser);
    }

    @Test
    void getSyncPreferences_WhenExceptionOccurs_ShouldReturnError() {
        // Given
        when(calendarEventService.getUserSyncPreferences(testUser.getId()))
            .thenThrow(new RuntimeException("Database error"));

        // When
        ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> response = 
            calendarController.getSyncPreferences(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Error retrieving preferences");
    }

    // ==================== updateSyncPreferences ====================

    @Test
    void updateSyncPreferences_WhenPreferencesExist_ShouldUpdate() {
        // Given
        CalendarSyncPreferenceDto request = new CalendarSyncPreferenceDto();
        request.setSyncEnabled(false);
        request.setAutoCreateReminders(false);
        request.setReminderSecondsBefore(15);
        request.setReminderType("EMAIL");
        request.setEventColor("RED");
        request.setEventVisibility("PUBLIC");
        request.setEventDuration(90);

        when(calendarEventService.getUserSyncPreferences(testUser.getId()))
            .thenReturn(Optional.of(testPreferences));

        CalendarSyncPreference updatedPref = new CalendarSyncPreference(testUser);
        updatedPref.setSyncEnabled(false);
        updatedPref.setAutoCreateReminders(false);
        updatedPref.setReminderMinutesBefore(15);
        updatedPref.setReminderType("EMAIL");
        updatedPref.setEventColor("RED");
        updatedPref.setEventVisibility("PUBLIC");
        updatedPref.setEventDuration(90);

        when(calendarSyncPreferenceRepository.save(any(CalendarSyncPreference.class)))
            .thenReturn(updatedPref);

        // When
        ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> response = 
            calendarController.updateSyncPreferences(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getData().getSyncEnabled()).isFalse();
        assertThat(response.getBody().getData().getAutoCreateReminders()).isFalse();
        assertThat(response.getBody().getData().getReminderSecondsBefore()).isEqualTo(15);
        assertThat(response.getBody().getData().getReminderType()).isEqualTo("EMAIL");
        assertThat(response.getBody().getData().getEventColor()).isEqualTo("RED");
        assertThat(response.getBody().getData().getEventVisibility()).isEqualTo("PUBLIC");
        assertThat(response.getBody().getData().getEventDuration()).isEqualTo(90);

        verify(calendarEventService).getUserSyncPreferences(testUser.getId());
        verify(calendarSyncPreferenceRepository).save(any(CalendarSyncPreference.class));
    }

    @Test
    void updateSyncPreferences_WhenNoPreferences_ShouldCreateNew() {
        // Given
        CalendarSyncPreferenceDto request = new CalendarSyncPreferenceDto();
        request.setSyncEnabled(true);
        request.setEventColor("GREEN");

        when(calendarEventService.getUserSyncPreferences(testUser.getId()))
            .thenReturn(Optional.empty());

        CalendarSyncPreference newPref = new CalendarSyncPreference(testUser);
        newPref.setSyncEnabled(true);
        newPref.setEventColor("GREEN");

        when(calendarSyncPreferenceRepository.save(any(CalendarSyncPreference.class)))
            .thenReturn(newPref);

        // When
        ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> response = 
            calendarController.updateSyncPreferences(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();

        verify(calendarSyncPreferenceRepository).save(any(CalendarSyncPreference.class));
    }

    @Test
    void updateSyncPreferences_WithPartialUpdate_ShouldOnlyUpdateSpecifiedFields() {
        // Given
        CalendarSyncPreferenceDto request = new CalendarSyncPreferenceDto();
        request.setEventColor("YELLOW"); // Only updating color

        when(calendarEventService.getUserSyncPreferences(testUser.getId()))
            .thenReturn(Optional.of(testPreferences));
        when(calendarSyncPreferenceRepository.save(any(CalendarSyncPreference.class)))
            .thenReturn(testPreferences);

        // When
        ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> response = 
            calendarController.updateSyncPreferences(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();

        verify(calendarSyncPreferenceRepository).save(any(CalendarSyncPreference.class));
    }

    @Test
    void updateSyncPreferences_WhenExceptionOccurs_ShouldReturnError() {
        // Given
        CalendarSyncPreferenceDto request = new CalendarSyncPreferenceDto();
        request.setSyncEnabled(true);

        when(calendarEventService.getUserSyncPreferences(testUser.getId()))
            .thenThrow(new RuntimeException("Database error"));

        // When
        ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> response = 
            calendarController.updateSyncPreferences(request, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Error updating preferences");
    }

    // ==================== getSyncedEvents ====================

    @Test
    void getSyncedEvents_WhenEventsExist_ShouldReturnThem() {
        // Given
        List<SyncedCalendarEvent> events = new ArrayList<>();

        SyncedCalendarEvent event1 = new SyncedCalendarEvent();
        event1.setId(1L);
        event1.setEventTitle("Event 1");
        events.add(event1);

        SyncedCalendarEvent event2 = new SyncedCalendarEvent();
        event2.setId(2L);
        event2.setEventTitle("Event 2");
        events.add(event2);

        CalendarEventDto dto1 = new CalendarEventDto();
        dto1.setEventTitle("Event 1");

        CalendarEventDto dto2 = new CalendarEventDto();
        dto2.setEventTitle("Event 2");

        when(calendarEventService.getUserSyncedEvents(testUser.getId())).thenReturn(events);
        when(modelMapper.map(event1, CalendarEventDto.class)).thenReturn(dto1);
        when(modelMapper.map(event2, CalendarEventDto.class)).thenReturn(dto2);

        // When
        ResponseEntity<ApiResponse<List<CalendarEventDto>>> response = 
            calendarController.getSyncedEvents(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getData()).hasSize(2);
        assertThat(response.getBody().getData().get(0).getEventTitle()).isEqualTo("Event 1");
        assertThat(response.getBody().getData().get(1).getEventTitle()).isEqualTo("Event 2");

        verify(calendarEventService).getUserSyncedEvents(testUser.getId());
    }

    @Test
    void getSyncedEvents_WhenNoEvents_ShouldReturnEmptyList() {
        // Given
        when(calendarEventService.getUserSyncedEvents(testUser.getId()))
            .thenReturn(Collections.emptyList());

        // When
        ResponseEntity<ApiResponse<List<CalendarEventDto>>> response = 
            calendarController.getSyncedEvents(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getData()).isEmpty();

        verify(calendarEventService).getUserSyncedEvents(testUser.getId());
    }

    @Test
    void getSyncedEvents_WhenExceptionOccurs_ShouldReturnError() {
        // Given
        when(calendarEventService.getUserSyncedEvents(testUser.getId()))
            .thenThrow(new RuntimeException("Database error"));

        // When
        ResponseEntity<ApiResponse<List<CalendarEventDto>>> response = 
            calendarController.getSyncedEvents(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Error retrieving events");
    }

    // ==================== manualSync ====================

    @Test
    void manualSync_WhenEventsCreated_ShouldReturnSuccessWithCount() {
        // Given
        when(calendarSyncService.syncAllUpcomingPickups(testUser)).thenReturn(3);

        // When
        ResponseEntity<ApiResponse<Object>> response = calendarController.manualSync(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).contains("Created 3 new calendar event(s)");

        verify(calendarSyncService).syncAllUpcomingPickups(testUser);
        verify(calendarSyncService).syncUserPendingEvents(testUser);
    }

    @Test
    void manualSync_WhenNoEventsCreated_ShouldReturnSuccessMessage() {
        // Given
        when(calendarSyncService.syncAllUpcomingPickups(testUser)).thenReturn(0);

        // When
        ResponseEntity<ApiResponse<Object>> response = calendarController.manualSync(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).contains("All pickups already have calendar events");

        verify(calendarSyncService).syncAllUpcomingPickups(testUser);
        verify(calendarSyncService).syncUserPendingEvents(testUser);
    }

    @Test
    void manualSync_WhenExceptionOccurs_ShouldReturnError() {
        // Given
        when(calendarSyncService.syncAllUpcomingPickups(testUser))
            .thenThrow(new RuntimeException("Sync failed"));

        // When
        ResponseEntity<ApiResponse<Object>> response = calendarController.manualSync(testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Error during sync");
    }

    // ==================== testConnection ====================

    @Test
    void testConnection_WhenSuccessful_ShouldReturnSuccess() {
        // Given
        String provider = "GOOGLE";

        // When
        ResponseEntity<ApiResponse<Object>> response = 
            calendarController.testConnection(provider, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).contains("Calendar connection test successful");

        verify(calendarSyncService).testCalendarConnection(testUser, provider);
    }

    @Test
    void testConnection_WhenTestFails_ShouldReturnBadRequest() {
        // Given
        String provider = "GOOGLE";
        doThrow(new RuntimeException("Connection test failed"))
            .when(calendarSyncService).testCalendarConnection(testUser, provider);

        // When
        ResponseEntity<ApiResponse<Object>> response = 
            calendarController.testConnection(provider, testUser);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Connection test failed");

        verify(calendarSyncService).testCalendarConnection(testUser, provider);
    }

    @Test
    void testConnection_WithDifferentProvider_ShouldPassProviderToService() {
        // Given
        String provider = "OUTLOOK";

        // When
        calendarController.testConnection(provider, testUser);

        // Then
        verify(calendarSyncService).testCalendarConnection(testUser, provider);
    }
}
