package com.example.foodflow.service.calendar;

import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SyncedCalendarEventRepository;
import com.example.foodflow.service.calendar.provider.CalendarProvider;
import com.example.foodflow.service.calendar.provider.GoogleCalendarProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarSyncServiceTest {

    @Mock
    private CalendarIntegrationService calendarIntegrationService;

    @Mock
    private CalendarEventService calendarEventService;

    @Mock
    private GoogleCalendarProvider googleCalendarProvider;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;

    @Mock
    private SyncedCalendarEventRepository syncedCalendarEventRepository;

    @InjectMocks
    private CalendarSyncService calendarSyncService;

    private User testUser;
    private CalendarIntegration testIntegration;
    private SyncedCalendarEvent testEvent;
    private Claim testClaim;
    private SurplusPost testDonation;
    private CalendarSyncPreference testPrefs;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setTimezone("America/New_York");

        testIntegration = new CalendarIntegration();
        testIntegration.setId(1L);
        testIntegration.setUser(testUser);
        testIntegration.setCalendarProvider("GOOGLE");
        testIntegration.setRefreshToken("refresh-token-123");
        testIntegration.setIsConnected(true);

        testEvent = new SyncedCalendarEvent();
        testEvent.setId(1L);
        testEvent.setUser(testUser);
        testEvent.setEventType("CLAIM");
        testEvent.setEventTitle("Test Event");
        testEvent.setStartTime(LocalDateTime.now().plusDays(1));
        testEvent.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        testEvent.setSyncStatus("PENDING");
        testEvent.setTimezone("America/New_York");

        testDonation = new SurplusPost();
        testDonation.setId(1L);
        testDonation.setTitle("Test Food");

        User donor = new User();
        donor.setId(2L);
        donor.setEmail("donor@example.com");
        testDonation.setDonor(donor);

        testClaim = new Claim();
        testClaim.setId(1L);
        testClaim.setSurplusPost(testDonation);
        testClaim.setReceiver(testUser);
        testClaim.setConfirmedPickupDate(LocalDate.now().plusDays(1));
        testClaim.setConfirmedPickupStartTime(LocalTime.of(10, 0));
        testClaim.setConfirmedPickupEndTime(LocalTime.of(11, 0));

        testPrefs = new CalendarSyncPreference();
        testPrefs.setId(1L);
        testPrefs.setUser(testUser);
        testPrefs.setSyncEnabled(true);
        testPrefs.setSyncClaimEvents(true);
        testPrefs.setSyncPickupEvents(true);
        testPrefs.setEventDuration(60);
    }

    // ==================== Tests for syncUserPendingEvents ====================

    @Test
    void syncUserPendingEvents_WhenNoIntegration() throws Exception {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.empty());

        // When
        calendarSyncService.syncUserPendingEvents(testUser);

        // Then
        verify(calendarEventService, never()).getUserPendingSyncEvents(anyLong());
        verify(googleCalendarProvider, never()).createEvent(anyString(), any());
    }

    @Test
    void syncUserPendingEvents_WhenNotConnected() throws Exception {
        // Given
        testIntegration.setIsConnected(false);
        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.of(testIntegration));

        // When
        calendarSyncService.syncUserPendingEvents(testUser);

        // Then
        verify(calendarEventService, never()).getUserPendingSyncEvents(anyLong());
        verify(googleCalendarProvider, never()).createEvent(anyString(), any());
    }

    @Test
    void syncUserPendingEvents_WithNoPendingEvents() throws Exception {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarEventService.getUserPendingSyncEvents(1L)).thenReturn(Collections.emptyList());

        // When
        calendarSyncService.syncUserPendingEvents(testUser);

        // Then
        verify(calendarEventService).getUserPendingSyncEvents(1L);
        verify(googleCalendarProvider, never()).createEvent(anyString(), any());
    }

    @Test
    void syncUserPendingEvents_WithPendingEvents() throws Exception {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarEventService.getUserPendingSyncEvents(1L)).thenReturn(Arrays.asList(testEvent));
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        when(googleCalendarProvider.createEvent("refresh-token-123", testEvent)).thenReturn("google-event-123");
        doNothing().when(calendarEventService).markEventAsSynced(testEvent, "google-event-123");
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncUserPendingEvents(testUser);

        // Then
        verify(googleCalendarProvider).createEvent("refresh-token-123", testEvent);
        verify(calendarEventService).markEventAsSynced(testEvent, "google-event-123");
        verify(calendarIntegrationService).updateLastSuccessfulSync(testUser);
    }

    // ==================== Tests for syncAllUpcomingPickups ====================

    @Test
    void syncAllUpcomingPickups_WhenCalendarNotConnected() {
        // Given
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(false);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then
        assertThat(result).isEqualTo(0);
        verify(claimRepository, never()).findActiveClaimsForUser(any());
    }

    @Test
    void syncAllUpcomingPickups_WhenClaimSyncDisabled() {
        // Given
        testPrefs.setSyncClaimEvents(false);
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then
        assertThat(result).isEqualTo(0);
        verify(claimRepository, never()).findActiveClaimsForUser(any());
    }

    @Test
    void syncAllUpcomingPickups_WhenNoPreferences() {
        // Given
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.empty());

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then
        assertThat(result).isEqualTo(0);
        verify(claimRepository, never()).findActiveClaimsForUser(any());
    }

    @Test
    void syncAllUpcomingPickups_WhenNoActiveClaims() {
        // Given
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Collections.emptyList());

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then
        assertThat(result).isEqualTo(0);
    }

    @Test
    void syncAllUpcomingPickups_SkipsClaimWithExistingEvent() {
        // Given
        SyncedCalendarEvent existingEvent = new SyncedCalendarEvent();
        existingEvent.setUser(testUser);
        existingEvent.setIsDeleted(false);

        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Arrays.asList(existingEvent));

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then
        assertThat(result).isEqualTo(0);
        verify(calendarEventService, never()).createCalendarEvent(any(), anyString(), anyString(), anyString(), any(), any(), anyString());
    }

    @Test
    void syncAllUpcomingPickups_SkipsClaimWithoutConfirmedPickupTime() {
        // Given
        testClaim.setConfirmedPickupDate(null);
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then
        assertThat(result).isEqualTo(0);
        verify(calendarEventService, never()).createCalendarEvent(any(), anyString(), anyString(), anyString(), any(), any(), anyString());
    }

    // ==================== Tests for syncEventToCalendar ====================

    @Test
    void syncEventToCalendar_CreateNewEvent_Success() throws Exception {
        // Given
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        when(googleCalendarProvider.createEvent("refresh-token-123", testEvent)).thenReturn("google-event-123");
        doNothing().when(calendarEventService).markEventAsSynced(testEvent, "google-event-123");
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncEventToCalendar(testUser, testIntegration, testEvent);

        // Then
        verify(googleCalendarProvider).createEvent("refresh-token-123", testEvent);
        verify(calendarEventService).markEventAsSynced(testEvent, "google-event-123");
        verify(calendarIntegrationService).updateLastSuccessfulSync(testUser);
    }

    @Test
    void syncEventToCalendar_UpdateExistingEvent_Success() throws Exception {
        // Given
        testEvent.setExternalEventId("existing-google-event");
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        doNothing().when(googleCalendarProvider).updateEvent("refresh-token-123", testEvent);
        doNothing().when(calendarEventService).markEventAsSynced(testEvent, "existing-google-event");
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncEventToCalendar(testUser, testIntegration, testEvent);

        // Then
        verify(googleCalendarProvider).updateEvent("refresh-token-123", testEvent);
        verify(calendarEventService).markEventAsSynced(testEvent, "existing-google-event");
        verify(googleCalendarProvider, never()).createEvent(anyString(), any());
    }

    @Test
    void syncEventToCalendar_DeleteEvent_Success() throws Exception {
        // Given
        testEvent.setIsDeleted(true);
        testEvent.setExternalEventId("google-event-to-delete");
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        doNothing().when(googleCalendarProvider).deleteEvent("refresh-token-123", "google-event-to-delete");
        doNothing().when(calendarEventService).markEventAsSynced(testEvent, "google-event-to-delete");
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncEventToCalendar(testUser, testIntegration, testEvent);

        // Then
        verify(googleCalendarProvider).deleteEvent("refresh-token-123", "google-event-to-delete");
        verify(calendarEventService).markEventAsSynced(testEvent, "google-event-to-delete");
        verify(googleCalendarProvider, never()).createEvent(anyString(), any());
    }

    @Test
    void syncEventToCalendar_DeleteEventNeverSynced_SkipsExternalDelete() throws Exception {
        // Given
        testEvent.setIsDeleted(true);
        testEvent.setExternalEventId(null); // Never synced
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        doNothing().when(calendarEventService).markEventAsSynced(testEvent, null);
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncEventToCalendar(testUser, testIntegration, testEvent);

        // Then
        verify(googleCalendarProvider, never()).deleteEvent(anyString(), anyString());
        verify(calendarEventService).markEventAsSynced(testEvent, null);
    }

    @Test
    void syncEventToCalendar_HandlesProviderException() throws Exception {
        // Given
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        when(googleCalendarProvider.createEvent("refresh-token-123", testEvent))
            .thenThrow(new CalendarProvider.CalendarProviderException("API Error"));
        doNothing().when(calendarEventService).markEventAsFailed(testEvent, "API Error");

        // When
        calendarSyncService.syncEventToCalendar(testUser, testIntegration, testEvent);

        // Then
        verify(calendarEventService).markEventAsFailed(testEvent, "API Error");
        verify(calendarIntegrationService, never()).updateLastSuccessfulSync(testUser);
    }

    @Test
    void syncEventToCalendar_UnsupportedProvider_FailsEvent() throws Exception {
        // Given
        testIntegration.setCalendarProvider("UNSUPPORTED");

        // When
        calendarSyncService.syncEventToCalendar(testUser, testIntegration, testEvent);

        // Then
        verify(calendarEventService).markEventAsFailed(testEvent, "Unsupported calendar provider: UNSUPPORTED");
        verify(googleCalendarProvider, never()).createEvent(anyString(), any());
    }

    // ==================== Tests for testCalendarConnection ====================

    @Test
    void testCalendarConnection_Success() throws Exception {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        when(googleCalendarProvider.refreshAccessToken("refresh-token-123"))
            .thenReturn("new-access-token");

        // When
        boolean result = calendarSyncService.testCalendarConnection(testUser, "GOOGLE");

        // Then
        assertThat(result).isTrue();
        verify(googleCalendarProvider).refreshAccessToken("refresh-token-123");
    }

    @Test
    void testCalendarConnection_NoIntegration_ThrowsException() throws Exception {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.empty());

        // When/Then
        try {
            calendarSyncService.testCalendarConnection(testUser, "GOOGLE");
        } catch (RuntimeException e) {
            assertThat(e.getMessage()).contains("Calendar not connected");
        }

        verify(googleCalendarProvider, never()).refreshAccessToken(anyString());
    }

    @Test
    void testCalendarConnection_NotConnected_ThrowsException() throws Exception {
        // Given
        testIntegration.setIsConnected(false);
        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.of(testIntegration));

        // When/Then
        try {
            calendarSyncService.testCalendarConnection(testUser, "GOOGLE");
        } catch (RuntimeException e) {
            assertThat(e.getMessage()).contains("Calendar is disconnected");
        }

        verify(googleCalendarProvider, never()).refreshAccessToken(anyString());
    }

    @Test
    void testCalendarConnection_UnsupportedProvider_ThrowsException() throws Exception {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.of(testIntegration));

        // When/Then
        try {
            calendarSyncService.testCalendarConnection(testUser, "UNSUPPORTED");
        } catch (RuntimeException e) {
            assertThat(e.getMessage()).contains("Unsupported calendar provider");
        }

        verify(googleCalendarProvider, never()).refreshAccessToken(anyString());
    }

    @Test
    void testCalendarConnection_ProviderError_ThrowsException() throws Exception {
        // Given
        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        when(googleCalendarProvider.refreshAccessToken("refresh-token-123"))
            .thenThrow(new CalendarProvider.CalendarProviderException("Invalid token"));

        // When/Then
        try {
            calendarSyncService.testCalendarConnection(testUser, "GOOGLE");
        } catch (RuntimeException e) {
            assertThat(e.getMessage()).contains("Connection test failed");
        }
    }

    // ==================== Tests for provider selection ====================

    @Test
    void getCalendarProvider_ReturnsGoogleProvider() throws Exception {
        // Given - provider is GOOGLE
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        when(googleCalendarProvider.createEvent("refresh-token-123", testEvent)).thenReturn("google-event-123");
        doNothing().when(calendarEventService).markEventAsSynced(testEvent, "google-event-123");
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncEventToCalendar(testUser, testIntegration, testEvent);

        // Then - Google provider should be used
        verify(googleCalendarProvider).createEvent("refresh-token-123", testEvent);
    }

    @Test
    void getCalendarProvider_CaseInsensitive() throws Exception {
        // Given - provider is lowercase 'google'
        testIntegration.setCalendarProvider("google");
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        when(googleCalendarProvider.createEvent("refresh-token-123", testEvent)).thenReturn("google-event-123");
        doNothing().when(calendarEventService).markEventAsSynced(testEvent, "google-event-123");
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncEventToCalendar(testUser, testIntegration, testEvent);

        // Then - Should still work with case insensitivity
        verify(googleCalendarProvider).createEvent("refresh-token-123", testEvent);
    }

    // ==================== Edge case tests ====================

    @Test
    void syncEventToCalendar_HandlesNullTimezone() throws Exception {
        // Given
        testEvent.setTimezone(null);
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        when(googleCalendarProvider.createEvent("refresh-token-123", testEvent)).thenReturn("google-event-123");
        doNothing().when(calendarEventService).markEventAsSynced(testEvent, "google-event-123");
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncEventToCalendar(testUser, testIntegration, testEvent);

        // Then - should still sync successfully
        verify(googleCalendarProvider).createEvent("refresh-token-123", testEvent);
    }

    @Test
    void syncUserPendingEvents_HandlesMultipleEvents() throws Exception {
        // Given
        SyncedCalendarEvent event1 = new SyncedCalendarEvent();
        event1.setId(1L);
        event1.setUser(testUser);
        event1.setSyncStatus("PENDING");
        event1.setEventType("CLAIM");
        event1.setStartTime(LocalDateTime.now().plusDays(1));
        event1.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));

        SyncedCalendarEvent event2 = new SyncedCalendarEvent();
        event2.setId(2L);
        event2.setUser(testUser);
        event2.setSyncStatus("PENDING");
        event2.setEventType("PICKUP");
        event2.setStartTime(LocalDateTime.now().plusDays(2));
        event2.setEndTime(LocalDateTime.now().plusDays(2).plusHours(1));

        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarEventService.getUserPendingSyncEvents(1L)).thenReturn(Arrays.asList(event1, event2));
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        when(googleCalendarProvider.createEvent("refresh-token-123", event1)).thenReturn("google-event-1");
        when(googleCalendarProvider.createEvent("refresh-token-123", event2)).thenReturn("google-event-2");
        doNothing().when(calendarEventService).markEventAsSynced(any(), anyString());
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncUserPendingEvents(testUser);

        // Then - both events should be synced
        verify(googleCalendarProvider).createEvent("refresh-token-123", event1);
        verify(googleCalendarProvider).createEvent("refresh-token-123", event2);
        verify(calendarEventService).markEventAsSynced(event1, "google-event-1");
        verify(calendarEventService).markEventAsSynced(event2, "google-event-2");
        verify(calendarIntegrationService, times(2)).updateLastSuccessfulSync(testUser);
    }

    @Test
    void syncUserPendingEvents_ContinuesOnPartialFailure() throws Exception {
        // Given
        SyncedCalendarEvent event1 = new SyncedCalendarEvent();
        event1.setId(1L);
        event1.setUser(testUser);
        event1.setSyncStatus("PENDING");
        event1.setStartTime(LocalDateTime.now().plusDays(1));
        event1.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));

        SyncedCalendarEvent event2 = new SyncedCalendarEvent();
        event2.setId(2L);
        event2.setUser(testUser);
        event2.setSyncStatus("PENDING");
        event2.setStartTime(LocalDateTime.now().plusDays(2));
        event2.setEndTime(LocalDateTime.now().plusDays(2).plusHours(1));

        when(calendarIntegrationService.getUserIntegration(testUser)).thenReturn(Optional.of(testIntegration));
        when(calendarEventService.getUserPendingSyncEvents(1L)).thenReturn(Arrays.asList(event1, event2));
        when(calendarIntegrationService.getDecryptedRefreshToken(testIntegration)).thenReturn("refresh-token-123");
        
        // First event fails, second succeeds
        when(googleCalendarProvider.createEvent("refresh-token-123", event1))
            .thenThrow(new CalendarProvider.CalendarProviderException("API Error"));
        when(googleCalendarProvider.createEvent("refresh-token-123", event2)).thenReturn("google-event-2");
        
        doNothing().when(calendarEventService).markEventAsFailed(any(), anyString());
        doNothing().when(calendarEventService).markEventAsSynced(any(), anyString());
        doNothing().when(calendarIntegrationService).updateLastSuccessfulSync(testUser);

        // When
        calendarSyncService.syncUserPendingEvents(testUser);

        // Then - first should fail, second should succeed
        verify(calendarEventService).markEventAsFailed(event1, "API Error");
        verify(calendarEventService).markEventAsSynced(event2, "google-event-2");
        verify(calendarIntegrationService, times(1)).updateLastSuccessfulSync(testUser);
    }
}
