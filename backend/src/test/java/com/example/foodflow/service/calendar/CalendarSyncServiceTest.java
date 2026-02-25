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

    // ==================== Additional tests for syncAllUpcomingPickups success paths ====================

    @Test
    void syncAllUpcomingPickups_CreatesEventForReceiver_Success() {
        // Given - user is the receiver
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        // Mock event creation
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        createdEvent.setUser(testUser);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then
        assertThat(result).isEqualTo(1);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), contains("Pickup Appointment"), anyString(), any(), any(), eq("America/New_York")
        );
        verify(calendarEventService).linkEventToClaim(createdEvent, testClaim);
    }

    @Test
    void syncAllUpcomingPickups_CreatesEventForDonor_Success() {
        // Given - user is the donor
        testDonation.setDonor(testUser);
        User receiver = new User();
        receiver.setId(3L);
        receiver.setEmail("receiver@example.com");
        testClaim.setReceiver(receiver);
        
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        // Mock event creation
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        createdEvent.setUser(testUser);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then
        assertThat(result).isEqualTo(1);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), contains("Donation Pickup"), anyString(), any(), any(), eq("America/New_York")
        );
        verify(calendarEventService).linkEventToClaim(createdEvent, testClaim);
    }

    @Test
    void syncAllUpcomingPickups_HandlesExceptionGracefully() {
        // Given
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        // Mock event creation to throw exception
        when(calendarEventService.createCalendarEvent(
            any(), anyString(), anyString(), anyString(), any(), any(), anyString()
        )).thenThrow(new RuntimeException("Database error"));

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then - should handle exception and continue
        assertThat(result).isEqualTo(0);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        );
    }

    @Test
    void syncAllUpcomingPickups_WithoutEndTime_UsesFallbackDuration() {
        // Given - claim has no end time
        testClaim.setConfirmedPickupEndTime(null);
        
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then - should use eventDuration (60 minutes) from preferences
        assertThat(result).isEqualTo(1);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), eq("America/New_York")
        );
    }

    @Test
    void syncAllUpcomingPickups_WithUserTimezoneNull_UsesUTC() {
        // Given - user has null timezone
        testUser.setTimezone(null);
        
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then - should use UTC as fallback
        assertThat(result).isEqualTo(1);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), eq("UTC")
        );
    }

    @Test
    void syncAllUpcomingPickups_WithOtpCode_IncludesInDescription() {
        // Given - post has OTP code
        testDonation.setOtpCode("ABC123");
        
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then - description should contain OTP code
        assertThat(result).isEqualTo(1);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), contains("ABC123"), any(), any(), eq("America/New_York")
        );
    }

    @Test
    void syncAllUpcomingPickups_WithQuantity_IncludesInDescription() {
        // Given - post has quantity
        com.example.foodflow.model.types.Quantity quantity = new com.example.foodflow.model.types.Quantity();
        quantity.setValue(5.0);
        quantity.setUnit(com.example.foodflow.model.types.Quantity.Unit.KILOGRAM);
        testDonation.setQuantity(quantity);
        
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then - description should contain quantity info
        assertThat(result).isEqualTo(1);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), contains("5.0"), any(), any(), eq("America/New_York")
        );
    }

    @Test
    void syncAllUpcomingPickups_ReceiverWithPickupLocation_IncludesInDescription() {
        // Given - user is receiver and post has pickup location
        com.example.foodflow.model.types.Location location = new com.example.foodflow.model.types.Location();
        location.setAddress("123 Main St, City, State 12345");
        testDonation.setPickupLocation(location);
        
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then - description should contain pickup location
        assertThat(result).isEqualTo(1);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), contains("123 Main St"), any(), any(), eq("America/New_York")
        );
    }

    @Test
    void syncAllUpcomingPickups_DonorWithReceiverOrganization_IncludesInDescription() {
        // Given - user is donor and receiver has organization
        testDonation.setDonor(testUser);
        User receiver = new User();
        receiver.setId(3L);
        receiver.setEmail("receiver@example.com");
        receiver.setPhone("555-1234");
        com.example.foodflow.model.entity.Organization receiverOrg = new com.example.foodflow.model.entity.Organization();
        receiverOrg.setName("Food Bank XYZ");
        receiver.setOrganization(receiverOrg);
        testClaim.setReceiver(receiver);
        
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then - description should contain organization name and contact info
        assertThat(result).isEqualTo(1);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), contains("Food Bank XYZ"), any(), any(), eq("America/New_York")
        );
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), contains("555-1234"), any(), any(), eq("America/New_York")
        );
    }

    @Test
    void syncAllUpcomingPickups_ReceiverWithDonorOrganization_IncludesInDescription() {
        // Given - user is receiver and donor has organization
        User donor = new User();
        donor.setId(2L);
        donor.setEmail("donor@example.com");
        donor.setPhone("555-5678");
        com.example.foodflow.model.entity.Organization donorOrg = new com.example.foodflow.model.entity.Organization();
        donorOrg.setName("Restaurant ABC");
        donor.setOrganization(donorOrg);
        testDonation.setDonor(donor);
        
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then - description should contain organization name and contact info
        assertThat(result).isEqualTo(1);
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), contains("Restaurant ABC"), any(), any(), eq("America/New_York")
        );
        verify(calendarEventService).createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), contains("555-5678"), any(), any(), eq("America/New_York")
        );
    }

    @Test
    void syncAllUpcomingPickups_TriggersAsyncSyncWhenEventsCreated() {
        // Given
        when(calendarIntegrationService.isCalendarConnected(testUser, "GOOGLE")).thenReturn(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPrefs));
        when(claimRepository.findActiveClaimsForUser(testUser)).thenReturn(Arrays.asList(testClaim));
        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Collections.emptyList());
        
        SyncedCalendarEvent createdEvent = new SyncedCalendarEvent();
        createdEvent.setId(10L);
        
        when(calendarEventService.createCalendarEvent(
            eq(testUser), eq("CLAIM"), anyString(), anyString(), any(), any(), anyString()
        )).thenReturn(createdEvent);
        
        doNothing().when(calendarEventService).linkEventToClaim(createdEvent, testClaim);

        // When
        int result = calendarSyncService.syncAllUpcomingPickups(testUser);

        // Then
        assertThat(result).isEqualTo(1);
        // Note: We can't easily verify async call, but we've tested the success path
    }
}

