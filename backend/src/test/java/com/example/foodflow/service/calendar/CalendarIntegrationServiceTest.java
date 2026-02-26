package com.example.foodflow.service.calendar;

import com.example.foodflow.model.dto.calendar.google.GoogleCalendarSettingsResponse;
import com.example.foodflow.model.entity.CalendarConsentHistory;
import com.example.foodflow.model.entity.CalendarIntegration;
import com.example.foodflow.model.entity.CalendarSyncPreference;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.CalendarConsentHistoryRepository;
import com.example.foodflow.repository.CalendarIntegrationRepository;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.service.calendar.provider.CalendarProvider;
import com.example.foodflow.service.calendar.provider.GoogleCalendarProvider;
import com.example.foodflow.service.calendar.provider.GoogleOAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarIntegrationServiceTest {

    @Mock
    private CalendarIntegrationRepository calendarIntegrationRepository;

    @Mock
    private CalendarConsentHistoryRepository calendarConsentHistoryRepository;

    @Mock
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;

    @Mock
    private GoogleOAuthService googleOAuthService;

    @Mock
    private GoogleCalendarProvider googleCalendarProvider;

    @InjectMocks
    private CalendarIntegrationService calendarIntegrationService;

    private User testUser;
    private CalendarIntegration testIntegration;
    private GoogleOAuthService.GoogleTokenResponse tokenResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testIntegration = new CalendarIntegration();
        testIntegration.setId(1L);
        testIntegration.setUser(testUser);
        testIntegration.setCalendarProvider("GOOGLE");
        testIntegration.setRefreshToken("refresh-token-123");
        testIntegration.setIsConnected(true);

        tokenResponse = new GoogleOAuthService.GoogleTokenResponse();
        tokenResponse.setRefreshToken("new-refresh-token");
        tokenResponse.setAccessTokenExpiry(LocalDateTime.now().plusHours(1));
        tokenResponse.setScope("https://www.googleapis.com/auth/calendar");
    }

    // ==================== Tests for getOrCreateIntegration ====================

    @Test
    void getOrCreateIntegration_ReturnsExistingIntegration() {
        // Given
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));

        // When
        CalendarIntegration result = calendarIntegrationService.getOrCreateIntegration(testUser, "GOOGLE");

        // Then
        assertThat(result).isEqualTo(testIntegration);
        verify(calendarIntegrationRepository).findByUserIdAndCalendarProvider(1L, "GOOGLE");
        verify(calendarIntegrationRepository, never()).save(any());
    }

    @Test
    void getOrCreateIntegration_CreatesNewIntegrationWhenNotExists() {
        // Given
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.empty());
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        CalendarIntegration result = calendarIntegrationService.getOrCreateIntegration(testUser, "GOOGLE");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUser()).isEqualTo(testUser);
        assertThat(result.getCalendarProvider()).isEqualTo("GOOGLE");
        verify(calendarIntegrationRepository).save(any(CalendarIntegration.class));
    }

    // ==================== Tests for storeOAuthTokens (with GoogleTokenResponse) ====================

    @Test
    void storeOAuthTokens_WithTokenResponse_Success() throws Exception {
        // Given
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarConsentHistoryRepository.save(any(CalendarConsentHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarSyncPreferenceRepository.findByUserId(1L))
            .thenReturn(Optional.empty());
        when(calendarSyncPreferenceRepository.save(any(CalendarSyncPreference.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        GoogleCalendarSettingsResponse settings = new GoogleCalendarSettingsResponse();
        settings.setId("user@gmail.com");
        settings.setSummary("Primary Calendar");
        settings.setTimeZone("America/New_York");
        when(googleCalendarProvider.fetchCalendarSettings(anyString())).thenReturn(settings);

        // When
        CalendarIntegration result = calendarIntegrationService.storeOAuthTokens(
            testUser, "GOOGLE", tokenResponse
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getRefreshToken()).isEqualTo("new-refresh-token");
        assertThat(result.getIsConnected()).isTrue();
        assertThat(result.getGrantedScopes()).isEqualTo("https://www.googleapis.com/auth/calendar");
        assertThat(result.getGoogleAccountEmail()).isEqualTo("user@gmail.com");
        assertThat(result.getCalendarTimeZone()).isEqualTo("America/New_York");

        verify(googleCalendarProvider).fetchCalendarSettings("new-refresh-token");
        verify(calendarConsentHistoryRepository).save(any(CalendarConsentHistory.class));
        verify(calendarSyncPreferenceRepository).save(any(CalendarSyncPreference.class));
    }

    @Test
    void storeOAuthTokens_WithTokenResponse_HandlesMetadataFetchFailure() throws Exception {
        // Given
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarConsentHistoryRepository.save(any(CalendarConsentHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarSyncPreferenceRepository.findByUserId(1L))
            .thenReturn(Optional.empty());
        when(calendarSyncPreferenceRepository.save(any(CalendarSyncPreference.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(googleCalendarProvider.fetchCalendarSettings(anyString()))
            .thenThrow(new RuntimeException("API Error"));

        // When
        CalendarIntegration result = calendarIntegrationService.storeOAuthTokens(
            testUser, "GOOGLE", tokenResponse
        );

        // Then - should still succeed despite metadata fetch failure
        assertThat(result).isNotNull();
        assertThat(result.getRefreshToken()).isEqualTo("new-refresh-token");
        assertThat(result.getIsConnected()).isTrue();
        verify(calendarIntegrationRepository, times(2)).save(any(CalendarIntegration.class));
    }

    // ==================== Tests for storeOAuthTokens (with refresh token and expiry) ====================

    @Test
    void storeOAuthTokens_WithRefreshToken_Success() {
        // Given
        LocalDateTime expiry = LocalDateTime.now().plusHours(1);
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarConsentHistoryRepository.save(any(CalendarConsentHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarSyncPreferenceRepository.findByUserId(1L))
            .thenReturn(Optional.empty());
        when(calendarSyncPreferenceRepository.save(any(CalendarSyncPreference.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        CalendarIntegration result = calendarIntegrationService.storeOAuthTokens(
            testUser, "GOOGLE", "refresh-token", expiry
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(result.getAccessTokenExpiry()).isEqualTo(expiry);
        assertThat(result.getIsConnected()).isTrue();

        verify(calendarConsentHistoryRepository).save(any(CalendarConsentHistory.class));
        verify(calendarSyncPreferenceRepository).save(any(CalendarSyncPreference.class));
    }

    @Test
    void storeOAuthTokens_LogsConsentAction() {
        // Given
        LocalDateTime expiry = LocalDateTime.now().plusHours(1);
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarConsentHistoryRepository.save(any(CalendarConsentHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarSyncPreferenceRepository.findByUserId(1L))
            .thenReturn(Optional.empty());
        when(calendarSyncPreferenceRepository.save(any(CalendarSyncPreference.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        calendarIntegrationService.storeOAuthTokens(testUser, "GOOGLE", "refresh-token", expiry);

        // Then
        ArgumentCaptor<CalendarConsentHistory> captor = ArgumentCaptor.forClass(CalendarConsentHistory.class);
        verify(calendarConsentHistoryRepository).save(captor.capture());
        CalendarConsentHistory history = captor.getValue();
        assertThat(history.getAction()).isEqualTo("GRANTED");
        assertThat(history.getCalendarProvider()).isEqualTo("GOOGLE");
        assertThat(history.getUser()).isEqualTo(testUser);
    }

    // ==================== Tests for disconnectCalendar ====================

    @Test
    void disconnectCalendar_Success() throws Exception {
        // Given
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarConsentHistoryRepository.save(any(CalendarConsentHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(googleOAuthService).revokeRefreshToken(anyString());

        // When
        calendarIntegrationService.disconnectCalendar(testUser, "GOOGLE");

        // Then
        assertThat(testIntegration.getIsConnected()).isFalse();
        assertThat(testIntegration.getRefreshToken()).isNull();
        assertThat(testIntegration.getAccessTokenExpiry()).isNull();

        verify(googleOAuthService).revokeRefreshToken("refresh-token-123");
        verify(calendarIntegrationRepository).save(testIntegration);

        ArgumentCaptor<CalendarConsentHistory> captor = ArgumentCaptor.forClass(CalendarConsentHistory.class);
        verify(calendarConsentHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getAction()).isEqualTo("REVOKED");
    }

    @Test
    void disconnectCalendar_ContinuesOnRevokeFailure() throws Exception {
        // Given
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarConsentHistoryRepository.save(any(CalendarConsentHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new RuntimeException("Token already revoked"))
            .when(googleOAuthService).revokeRefreshToken(anyString());

        // When
        calendarIntegrationService.disconnectCalendar(testUser, "GOOGLE");

        // Then - should still clean up local database
        assertThat(testIntegration.getIsConnected()).isFalse();
        assertThat(testIntegration.getRefreshToken()).isNull();
        verify(calendarIntegrationRepository).save(testIntegration);
        verify(calendarConsentHistoryRepository).save(any(CalendarConsentHistory.class));
    }

    @Test
    void disconnectCalendar_WhenNoIntegrationExists() throws Exception {
        // Given
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.empty());

        // When
        calendarIntegrationService.disconnectCalendar(testUser, "GOOGLE");

        // Then - should complete without errors
        verify(googleOAuthService, never()).revokeRefreshToken(anyString());
        verify(calendarIntegrationRepository, never()).save(any());
    }

    @Test
    void disconnectCalendar_WhenNoRefreshToken() throws Exception {
        // Given
        testIntegration.setRefreshToken(null);
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarConsentHistoryRepository.save(any(CalendarConsentHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        calendarIntegrationService.disconnectCalendar(testUser, "GOOGLE");

        // Then - should skip Google revocation but still clean up
        verify(googleOAuthService, never()).revokeRefreshToken(anyString());
        assertThat(testIntegration.getIsConnected()).isFalse();
        verify(calendarIntegrationRepository).save(testIntegration);
    }

    // ==================== Tests for isCalendarConnected ====================

    @Test
    void isCalendarConnected_ReturnsTrue() {
        // Given
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));

        // When
        boolean result = calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE");

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void isCalendarConnected_ReturnsFalseWhenNotConnected() {
        // Given
        testIntegration.setIsConnected(false);
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.of(testIntegration));

        // When
        boolean result = calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE");

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void isCalendarConnected_ReturnsFalseWhenNoIntegration() {
        // Given
        when(calendarIntegrationRepository.findByUserIdAndCalendarProvider(1L, "GOOGLE"))
            .thenReturn(Optional.empty());

        // When
        boolean result = calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE");

        // Then
        assertThat(result).isFalse();
    }

    // ==================== Tests for verifyAndUpdateConnectionStatus ====================

    @Test
    void verifyAndUpdateConnectionStatus_WhenNoIntegration() throws Exception {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.empty());

        // When
        calendarIntegrationService.verifyAndUpdateConnectionStatus(testUser);

        // Then - should complete without errors
        verify(googleCalendarProvider, never()).verifyCalendarAccess(anyString());
    }

    @Test
    void verifyAndUpdateConnectionStatus_WhenNotConnected() throws Exception {
        // Given
        testIntegration.setIsConnected(false);
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.of(testIntegration));

        // When
        calendarIntegrationService.verifyAndUpdateConnectionStatus(testUser);

        // Then - should skip verification
        verify(googleCalendarProvider, never()).verifyCalendarAccess(anyString());
    }

    @Test
    void verifyAndUpdateConnectionStatus_WhenNoRefreshToken() throws Exception {
        // Given
        testIntegration.setRefreshToken(null);
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.of(testIntegration));

        // When
        calendarIntegrationService.verifyAndUpdateConnectionStatus(testUser);

        // Then - should skip verification
        verify(googleCalendarProvider, never()).verifyCalendarAccess(anyString());
    }

    @Test
    void verifyAndUpdateConnectionStatus_WhenValidAccess() throws Exception {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.of(testIntegration));
        when(googleCalendarProvider.verifyCalendarAccess("refresh-token-123")).thenReturn(true);

        // When
        calendarIntegrationService.verifyAndUpdateConnectionStatus(testUser);

        // Then - should verify and not clean up
        verify(googleCalendarProvider).verifyCalendarAccess("refresh-token-123");
        verify(calendarIntegrationRepository, never()).save(any());
    }

    @Test
    void verifyAndUpdateConnectionStatus_WhenAccessInvalid() throws Exception {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarConsentHistoryRepository.save(any(CalendarConsentHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(googleCalendarProvider.verifyCalendarAccess("refresh-token-123")).thenReturn(false);

        // When
        calendarIntegrationService.verifyAndUpdateConnectionStatus(testUser);

        // Then - should clean up integration
        assertThat(testIntegration.getIsConnected()).isFalse();
        assertThat(testIntegration.getRefreshToken()).isNull();
        verify(calendarIntegrationRepository, times(2)).save(testIntegration);

        ArgumentCaptor<CalendarConsentHistory> captor = ArgumentCaptor.forClass(CalendarConsentHistory.class);
        verify(calendarConsentHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getAction()).isEqualTo("AUTO_REVOKED");
    }

    @Test
    void verifyAndUpdateConnectionStatus_WhenInvalidGrantError() throws Exception {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(calendarConsentHistoryRepository.save(any(CalendarConsentHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(googleCalendarProvider.verifyCalendarAccess("refresh-token-123"))
            .thenThrow(new CalendarProvider.CalendarProviderException("invalid_grant"));

        // When
        calendarIntegrationService.verifyAndUpdateConnectionStatus(testUser);

        // Then - should clean up integration
        assertThat(testIntegration.getIsConnected()).isFalse();
        verify(calendarIntegrationRepository, times(2)).save(testIntegration);
    }

    // ==================== Tests for getUserIntegration ====================

    @Test
    void getUserIntegration_ReturnsIntegration() {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.of(testIntegration));

        // When
        Optional<CalendarIntegration> result = calendarIntegrationService.getUserIntegration(testUser);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(testIntegration);
    }

    @Test
    void getUserIntegration_ReturnsEmptyWhenNotFound() {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.empty());

        // When
        Optional<CalendarIntegration> result = calendarIntegrationService.getUserIntegration(testUser);

        // Then
        assertThat(result).isEmpty();
    }

    // ==================== Tests for getDecryptedRefreshToken ====================

    @Test
    void getDecryptedRefreshToken_ReturnsToken() {
        // When
        String result = calendarIntegrationService.getDecryptedRefreshToken(testIntegration);

        // Then
        assertThat(result).isEqualTo("refresh-token-123");
    }

    @Test
    void getDecryptedRefreshToken_ThrowsWhenNoToken() {
        // Given
        testIntegration.setRefreshToken(null);

        // When/Then
        assertThatThrownBy(() -> calendarIntegrationService.getDecryptedRefreshToken(testIntegration))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("No refresh token available");
    }

    // ==================== Tests for updateAccessTokenExpiry ====================

    @Test
    void updateAccessTokenExpiry_Success() {
        // Given
        LocalDateTime newExpiry = LocalDateTime.now().plusHours(2);
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        calendarIntegrationService.updateAccessTokenExpiry(testIntegration, newExpiry);

        // Then
        assertThat(testIntegration.getAccessTokenExpiry()).isEqualTo(newExpiry);
        verify(calendarIntegrationRepository).save(testIntegration);
    }

    // ==================== Tests for updateLastSuccessfulSync ====================

    @Test
    void updateLastSuccessfulSync_Success() {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        calendarIntegrationService.updateLastSuccessfulSync(testUser);

        // Then
        assertThat(testIntegration.getLastSuccessfulSync()).isNotNull();
        verify(calendarIntegrationRepository).save(testIntegration);
    }

    @Test
    void updateLastSuccessfulSync_WhenNoIntegration() {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.empty());

        // When
        calendarIntegrationService.updateLastSuccessfulSync(testUser);

        // Then - should complete without errors
        verify(calendarIntegrationRepository, never()).save(any());
    }

    // ==================== Tests for updateLastFailedRefresh ====================

    @Test
    void updateLastFailedRefresh_Success() {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationRepository.save(any(CalendarIntegration.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        calendarIntegrationService.updateLastFailedRefresh(testUser);

        // Then
        assertThat(testIntegration.getLastFailedRefresh()).isNotNull();
        verify(calendarIntegrationRepository).save(testIntegration);
    }

    @Test
    void updateLastFailedRefresh_WhenNoIntegration() {
        // Given
        when(calendarIntegrationRepository.findByUser(testUser)).thenReturn(Optional.empty());

        // When
        calendarIntegrationService.updateLastFailedRefresh(testUser);

        // Then - should complete without errors
        verify(calendarIntegrationRepository, never()).save(any());
    }

    // ==================== Tests for getConsentHistory ====================

    @Test
    void getConsentHistory_ReturnsHistory() {
        // Given
        CalendarConsentHistory history1 = new CalendarConsentHistory(testUser, "GRANTED");
        CalendarConsentHistory history2 = new CalendarConsentHistory(testUser, "REVOKED");
        List<CalendarConsentHistory> historyList = Arrays.asList(history1, history2);

        when(calendarConsentHistoryRepository.findByUserIdOrderByCreatedAtDesc(1L))
            .thenReturn(historyList);

        // When
        List<CalendarConsentHistory> result = calendarIntegrationService.getConsentHistory(testUser);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(history1, history2);
    }

    // ==================== Tests for createDefaultSyncPreferencesIfNeeded ====================

    @Test
    void createDefaultSyncPreferencesIfNeeded_CreatesWhenNotExists() {
        // Given
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(calendarSyncPreferenceRepository.save(any(CalendarSyncPreference.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        CalendarSyncPreference result = calendarIntegrationService.createDefaultSyncPreferencesIfNeeded(testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUser()).isEqualTo(testUser);
        verify(calendarSyncPreferenceRepository).save(any(CalendarSyncPreference.class));
    }

    @Test
    void createDefaultSyncPreferencesIfNeeded_ReturnsExistingWhenExists() {
        // Given
        CalendarSyncPreference existing = new CalendarSyncPreference();
        existing.setId(1L);
        existing.setUser(testUser);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(existing));

        // When
        CalendarSyncPreference result = calendarIntegrationService.createDefaultSyncPreferencesIfNeeded(testUser);

        // Then
        assertThat(result).isEqualTo(existing);
        verify(calendarSyncPreferenceRepository, never()).save(any());
    }
}
