package com.example.foodflow.service.calendar;

import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.CalendarSyncLogRepository;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.repository.SyncedCalendarEventRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarEventServiceTest {

    @Mock
    private SyncedCalendarEventRepository syncedCalendarEventRepository;

    @Mock
    private CalendarSyncLogRepository calendarSyncLogRepository;

    @Mock
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;

    @InjectMocks
    private CalendarEventService calendarEventService;

    private User testUser;
    private SyncedCalendarEvent testEvent;
    private SurplusPost testDonation;
    private Claim testClaim;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testEvent = new SyncedCalendarEvent();
        testEvent.setId(1L);
        testEvent.setUser(testUser);
        testEvent.setEventType("CLAIM");
        testEvent.setEventTitle("Test Event");
        testEvent.setStartTime(LocalDateTime.now().plusDays(1));
        testEvent.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        testEvent.setSyncStatus("PENDING");

        testDonation = new SurplusPost();
        testDonation.setId(1L);

        testClaim = new Claim();
        testClaim.setId(1L);
    }

    // ==================== Tests for createCalendarEvent ====================

    @Test
    void createCalendarEvent_Success() {
        // Given
        LocalDateTime startTime = LocalDateTime.now().plusDays(1);
        LocalDateTime endTime = startTime.plusHours(1);
        String timezone = "America/New_York";

        SyncedCalendarEvent savedEvent = new SyncedCalendarEvent(testUser, "CLAIM", "Pickup Event", startTime);
        savedEvent.setId(1L);
        savedEvent.setSyncStatus("PENDING");

        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(savedEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        SyncedCalendarEvent result = calendarEventService.createCalendarEvent(
            testUser, "CLAIM", "Pickup Event", "Test Description", startTime, endTime, timezone
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSyncStatus()).isEqualTo("PENDING");

        verify(syncedCalendarEventRepository).save(any(SyncedCalendarEvent.class));
        verify(calendarSyncLogRepository).save(any(CalendarSyncLog.class));

        ArgumentCaptor<SyncedCalendarEvent> eventCaptor = ArgumentCaptor.forClass(SyncedCalendarEvent.class);
        verify(syncedCalendarEventRepository).save(eventCaptor.capture());
        SyncedCalendarEvent capturedEvent = eventCaptor.getValue();
        assertThat(capturedEvent.getEventTitle()).isEqualTo("Pickup Event");
        assertThat(capturedEvent.getEventDescription()).isEqualTo("Test Description");
        assertThat(capturedEvent.getTimezone()).isEqualTo(timezone);
    }

    @Test
    void createCalendarEvent_LogsCorrectly() {
        // Given
        LocalDateTime startTime = LocalDateTime.now().plusDays(1);
        LocalDateTime endTime = startTime.plusHours(1);

        SyncedCalendarEvent savedEvent = new SyncedCalendarEvent(testUser, "CLAIM", "Event", startTime);
        savedEvent.setId(5L);

        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(savedEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        calendarEventService.createCalendarEvent(
            testUser, "CLAIM", "Event", "Description", startTime, endTime, "UTC"
        );

        // Then
        ArgumentCaptor<CalendarSyncLog> logCaptor = ArgumentCaptor.forClass(CalendarSyncLog.class);
        verify(calendarSyncLogRepository).save(logCaptor.capture());
        CalendarSyncLog capturedLog = logCaptor.getValue();
        assertThat(capturedLog.getAction()).isEqualTo("EVENT_CREATED");
        assertThat(capturedLog.getStatus()).isEqualTo("PENDING");
        assertThat(capturedLog.getEventId()).isEqualTo(5L);
        assertThat(capturedLog.getEventType()).isEqualTo("CLAIM");
    }

    // ==================== Tests for linkEventToDonation ====================

    @Test
    void linkEventToDonation_Success() {
        // Given
        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);

        // When
        calendarEventService.linkEventToDonation(testEvent, testDonation);

        // Then
        assertThat(testEvent.getDonation()).isEqualTo(testDonation);
        verify(syncedCalendarEventRepository).save(testEvent);
    }

    // ==================== Tests for linkEventToClaim ====================

    @Test
    void linkEventToClaim_Success() {
        // Given
        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);

        // When
        calendarEventService.linkEventToClaim(testEvent, testClaim);

        // Then
        assertThat(testEvent.getClaim()).isEqualTo(testClaim);
        verify(syncedCalendarEventRepository).save(testEvent);
    }

    // ==================== Tests for updateCalendarEvent ====================

    @Test
    void updateCalendarEvent_Success() {
        // Given
        LocalDateTime newStartTime = LocalDateTime.now().plusDays(2);
        LocalDateTime newEndTime = newStartTime.plusHours(2);
        String newTimezone = "Europe/London";

        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        SyncedCalendarEvent result = calendarEventService.updateCalendarEvent(
            testEvent, "Updated Title", "Updated Description", newStartTime, newEndTime, newTimezone
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(testEvent.getEventTitle()).isEqualTo("Updated Title");
        assertThat(testEvent.getEventDescription()).isEqualTo("Updated Description");
        assertThat(testEvent.getStartTime()).isEqualTo(newStartTime);
        assertThat(testEvent.getEndTime()).isEqualTo(newEndTime);
        assertThat(testEvent.getTimezone()).isEqualTo(newTimezone);
        assertThat(testEvent.getSyncStatus()).isEqualTo("PENDING");

        verify(syncedCalendarEventRepository).save(testEvent);
        verify(calendarSyncLogRepository).save(any(CalendarSyncLog.class));
    }

    @Test
    void updateCalendarEvent_LogsCorrectly() {
        // Given
        testEvent.setExternalEventId("ext-123");
        LocalDateTime newStartTime = LocalDateTime.now().plusDays(2);
        LocalDateTime newEndTime = newStartTime.plusHours(2);

        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        calendarEventService.updateCalendarEvent(
            testEvent, "New Title", "New Description", newStartTime, newEndTime, "UTC"
        );

        // Then
        ArgumentCaptor<CalendarSyncLog> logCaptor = ArgumentCaptor.forClass(CalendarSyncLog.class);
        verify(calendarSyncLogRepository).save(logCaptor.capture());
        CalendarSyncLog capturedLog = logCaptor.getValue();
        assertThat(capturedLog.getAction()).isEqualTo("EVENT_UPDATED");
        assertThat(capturedLog.getExternalEventId()).isEqualTo("ext-123");
    }

    // ==================== Tests for markEventAsSynced ====================

    @Test
    void markEventAsSynced_Success() {
        // Given
        String externalEventId = "google-event-123";
        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        calendarEventService.markEventAsSynced(testEvent, externalEventId);

        // Then
        assertThat(testEvent.getExternalEventId()).isEqualTo(externalEventId);
        assertThat(testEvent.getSyncStatus()).isEqualTo("SYNCED");
        assertThat(testEvent.getLastSyncError()).isNull();

        verify(syncedCalendarEventRepository).save(testEvent);
        verify(calendarSyncLogRepository).save(any(CalendarSyncLog.class));
    }

    @Test
    void markEventAsSynced_LogsCorrectly() {
        // Given
        String externalEventId = "google-event-456";
        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        calendarEventService.markEventAsSynced(testEvent, externalEventId);

        // Then
        ArgumentCaptor<CalendarSyncLog> logCaptor = ArgumentCaptor.forClass(CalendarSyncLog.class);
        verify(calendarSyncLogRepository).save(logCaptor.capture());
        CalendarSyncLog capturedLog = logCaptor.getValue();
        assertThat(capturedLog.getAction()).isEqualTo("EVENT_SYNCED");
        assertThat(capturedLog.getStatus()).isEqualTo("SUCCESS");
        assertThat(capturedLog.getExternalEventId()).isEqualTo(externalEventId);
    }

    // ==================== Tests for markEventAsFailed ====================

    @Test
    void markEventAsFailed_Success() {
        // Given
        String errorMessage = "Invalid access token";
        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        calendarEventService.markEventAsFailed(testEvent, errorMessage);

        // Then
        assertThat(testEvent.getSyncStatus()).isEqualTo("FAILED");
        assertThat(testEvent.getLastSyncError()).isEqualTo(errorMessage);

        verify(syncedCalendarEventRepository).save(testEvent);
        verify(calendarSyncLogRepository).save(any(CalendarSyncLog.class));
    }

    @Test
    void markEventAsFailed_LogsWithError() {
        // Given
        String errorMessage = "Network timeout";
        testEvent.setExternalEventId("ext-789");
        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        calendarEventService.markEventAsFailed(testEvent, errorMessage);

        // Then
        ArgumentCaptor<CalendarSyncLog> logCaptor = ArgumentCaptor.forClass(CalendarSyncLog.class);
        verify(calendarSyncLogRepository).save(logCaptor.capture());
        CalendarSyncLog capturedLog = logCaptor.getValue();
        assertThat(capturedLog.getAction()).isEqualTo("SYNC_FAILED");
        assertThat(capturedLog.getStatus()).isEqualTo("FAILED");
        assertThat(capturedLog.getErrorMessage()).isEqualTo(errorMessage);
    }

    // ==================== Tests for deleteCalendarEvent ====================

    @Test
    void deleteCalendarEvent_Success() {
        // Given
        testEvent.setExternalEventId("ext-delete-123");
        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        calendarEventService.deleteCalendarEvent(testEvent);

        // Then
        assertThat(testEvent.getIsDeleted()).isTrue();
        assertThat(testEvent.getSyncStatus()).isEqualTo("PENDING");

        verify(syncedCalendarEventRepository).save(testEvent);
        verify(calendarSyncLogRepository).save(any(CalendarSyncLog.class));
    }

    @Test
    void deleteCalendarEvent_LogsCorrectly() {
        // Given
        testEvent.setExternalEventId("ext-delete-456");
        when(syncedCalendarEventRepository.save(any(SyncedCalendarEvent.class))).thenReturn(testEvent);
        when(calendarSyncLogRepository.save(any(CalendarSyncLog.class))).thenReturn(new CalendarSyncLog());

        // When
        calendarEventService.deleteCalendarEvent(testEvent);

        // Then
        ArgumentCaptor<CalendarSyncLog> logCaptor = ArgumentCaptor.forClass(CalendarSyncLog.class);
        verify(calendarSyncLogRepository).save(logCaptor.capture());
        CalendarSyncLog capturedLog = logCaptor.getValue();
        assertThat(capturedLog.getAction()).isEqualTo("EVENT_DELETED");
        assertThat(capturedLog.getStatus()).isEqualTo("PENDING");
    }

    // ==================== Tests for getUserPendingSyncEvents ====================

    @Test
    void getUserPendingSyncEvents_ReturnsEvents() {
        // Given
        SyncedCalendarEvent event1 = new SyncedCalendarEvent();
        event1.setId(1L);
        event1.setSyncStatus("PENDING");

        SyncedCalendarEvent event2 = new SyncedCalendarEvent();
        event2.setId(2L);
        event2.setSyncStatus("PENDING");

        List<SyncedCalendarEvent> pendingEvents = Arrays.asList(event1, event2);
        when(syncedCalendarEventRepository.findByUserIdAndSyncStatus(1L, "PENDING")).thenReturn(pendingEvents);

        // When
        List<SyncedCalendarEvent> result = calendarEventService.getUserPendingSyncEvents(1L);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(event1, event2);
        verify(syncedCalendarEventRepository).findByUserIdAndSyncStatus(1L, "PENDING");
    }

    @Test
    void getUserPendingSyncEvents_ReturnsEmptyListWhenNone() {
        // Given
        when(syncedCalendarEventRepository.findByUserIdAndSyncStatus(1L, "PENDING")).thenReturn(Arrays.asList());

        // When
        List<SyncedCalendarEvent> result = calendarEventService.getUserPendingSyncEvents(1L);

        // Then
        assertThat(result).isEmpty();
        verify(syncedCalendarEventRepository).findByUserIdAndSyncStatus(1L, "PENDING");
    }

    // ==================== Tests for getAllPendingSyncEvents ====================

    @Test
    void getAllPendingSyncEvents_ReturnsEvents() {
        // Given
        SyncedCalendarEvent event1 = new SyncedCalendarEvent();
        event1.setId(1L);

        SyncedCalendarEvent event2 = new SyncedCalendarEvent();
        event2.setId(2L);

        List<SyncedCalendarEvent> allPending = Arrays.asList(event1, event2);
        when(syncedCalendarEventRepository.findBySyncStatus("PENDING")).thenReturn(allPending);

        // When
        List<SyncedCalendarEvent> result = calendarEventService.getAllPendingSyncEvents();

        // Then
        assertThat(result).hasSize(2);
        verify(syncedCalendarEventRepository).findBySyncStatus("PENDING");
    }

    // ==================== Tests for getUserSyncedEvents ====================

    @Test
    void getUserSyncedEvents_ReturnsNonDeletedEvents() {
        // Given
        SyncedCalendarEvent event1 = new SyncedCalendarEvent();
        event1.setId(1L);
        event1.setIsDeleted(false);

        SyncedCalendarEvent event2 = new SyncedCalendarEvent();
        event2.setId(2L);
        event2.setIsDeleted(false);

        List<SyncedCalendarEvent> events = Arrays.asList(event1, event2);
        when(syncedCalendarEventRepository.findByUserIdAndIsDeletedFalse(1L)).thenReturn(events);

        // When
        List<SyncedCalendarEvent> result = calendarEventService.getUserSyncedEvents(1L);

        // Then
        assertThat(result).hasSize(2);
        verify(syncedCalendarEventRepository).findByUserIdAndIsDeletedFalse(1L);
    }

    // ==================== Tests for getDonationEvents ====================

    @Test
    void getDonationEvents_ReturnsEvents() {
        // Given
        SyncedCalendarEvent event = new SyncedCalendarEvent();
        event.setId(1L);
        event.setDonation(testDonation);

        when(syncedCalendarEventRepository.findByDonationId(1L)).thenReturn(Arrays.asList(event));

        // When
        List<SyncedCalendarEvent> result = calendarEventService.getDonationEvents(1L);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDonation()).isEqualTo(testDonation);
        verify(syncedCalendarEventRepository).findByDonationId(1L);
    }

    // ==================== Tests for getClaimEvents ====================

    @Test
    void getClaimEvents_ReturnsEvents() {
        // Given
        SyncedCalendarEvent event = new SyncedCalendarEvent();
        event.setId(1L);
        event.setClaim(testClaim);

        when(syncedCalendarEventRepository.findByClaimId(1L)).thenReturn(Arrays.asList(event));

        // When
        List<SyncedCalendarEvent> result = calendarEventService.getClaimEvents(1L);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getClaim()).isEqualTo(testClaim);
        verify(syncedCalendarEventRepository).findByClaimId(1L);
    }

    // ==================== Tests for findByExternalEventId ====================

    @Test
    void findByExternalEventId_ReturnsEvent() {
        // Given
        testEvent.setExternalEventId("ext-123");
        when(syncedCalendarEventRepository.findByExternalEventId("ext-123")).thenReturn(Optional.of(testEvent));

        // When
        Optional<SyncedCalendarEvent> result = calendarEventService.findByExternalEventId("ext-123");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getExternalEventId()).isEqualTo("ext-123");
        verify(syncedCalendarEventRepository).findByExternalEventId("ext-123");
    }

    @Test
    void findByExternalEventId_ReturnsEmptyWhenNotFound() {
        // Given
        when(syncedCalendarEventRepository.findByExternalEventId("nonexistent")).thenReturn(Optional.empty());

        // When
        Optional<SyncedCalendarEvent> result = calendarEventService.findByExternalEventId("nonexistent");

        // Then
        assertThat(result).isEmpty();
        verify(syncedCalendarEventRepository).findByExternalEventId("nonexistent");
    }

    // ==================== Tests for isSyncEnabled ====================

    @Test
    void isSyncEnabled_ReturnsTrueWhenEnabled() {
        // Given
        CalendarSyncPreference prefs = new CalendarSyncPreference();
        prefs.setSyncEnabled(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(prefs));

        // When
        boolean result = calendarEventService.isSyncEnabled(1L);

        // Then
        assertThat(result).isTrue();
        verify(calendarSyncPreferenceRepository).findByUserId(1L);
    }

    @Test
    void isSyncEnabled_ReturnsFalseWhenDisabled() {
        // Given
        CalendarSyncPreference prefs = new CalendarSyncPreference();
        prefs.setSyncEnabled(false);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(prefs));

        // When
        boolean result = calendarEventService.isSyncEnabled(1L);

        // Then
        assertThat(result).isFalse();
        verify(calendarSyncPreferenceRepository).findByUserId(1L);
    }

    @Test
    void isSyncEnabled_ReturnsTrueWhenNoPreferencesSet() {
        // Given
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.empty());

        // When
        boolean result = calendarEventService.isSyncEnabled(1L);

        // Then
        assertThat(result).isTrue(); // Default is enabled
        verify(calendarSyncPreferenceRepository).findByUserId(1L);
    }

    // ==================== Tests for getUserSyncPreferences ====================

    @Test
    void getUserSyncPreferences_ReturnsPreferences() {
        // Given
        CalendarSyncPreference prefs = new CalendarSyncPreference();
        prefs.setId(1L);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(prefs));

        // When
        Optional<CalendarSyncPreference> result = calendarEventService.getUserSyncPreferences(1L);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1L);
        verify(calendarSyncPreferenceRepository).findByUserId(1L);
    }

    @Test
    void getUserSyncPreferences_ReturnsEmptyWhenNotFound() {
        // Given
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.empty());

        // When
        Optional<CalendarSyncPreference> result = calendarEventService.getUserSyncPreferences(1L);

        // Then
        assertThat(result).isEmpty();
        verify(calendarSyncPreferenceRepository).findByUserId(1L);
    }

    // ==================== Tests for shouldSyncEventType ====================

    @Test
    void shouldSyncEventType_ReturnsTrueForPickupWhenEnabled() {
        // Given
        CalendarSyncPreference prefs = new CalendarSyncPreference();
        prefs.setSyncPickupEvents(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(prefs));

        // When
        boolean result = calendarEventService.shouldSyncEventType(1L, "PICKUP");

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void shouldSyncEventType_ReturnsFalseForPickupWhenDisabled() {
        // Given
        CalendarSyncPreference prefs = new CalendarSyncPreference();
        prefs.setSyncPickupEvents(false);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(prefs));

        // When
        boolean result = calendarEventService.shouldSyncEventType(1L, "PICKUP");

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void shouldSyncEventType_ReturnsTrueForDeliveryWhenEnabled() {
        // Given
        CalendarSyncPreference prefs = new CalendarSyncPreference();
        prefs.setSyncDeliveryEvents(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(prefs));

        // When
        boolean result = calendarEventService.shouldSyncEventType(1L, "DELIVERY");

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void shouldSyncEventType_ReturnsTrueForClaimWhenEnabled() {
        // Given
        CalendarSyncPreference prefs = new CalendarSyncPreference();
        prefs.setSyncClaimEvents(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(prefs));

        // When
        boolean result = calendarEventService.shouldSyncEventType(1L, "CLAIM");

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void shouldSyncEventType_ReturnsTrueWhenNoPreferences() {
        // Given
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.empty());

        // When
        boolean result = calendarEventService.shouldSyncEventType(1L, "PICKUP");

        // Then
        assertThat(result).isTrue(); // Default behavior
    }

    @Test
    void shouldSyncEventType_ReturnsTrueForUnknownEventType() {
        // Given
        CalendarSyncPreference prefs = new CalendarSyncPreference();
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(prefs));

        // When
        boolean result = calendarEventService.shouldSyncEventType(1L, "UNKNOWN");

        // Then
        assertThat(result).isTrue(); // Default for unknown types
    }

    @Test
    void shouldSyncEventType_CaseInsensitive() {
        // Given
        CalendarSyncPreference prefs = new CalendarSyncPreference();
        prefs.setSyncPickupEvents(true);
        when(calendarSyncPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(prefs));

        // When
        boolean result = calendarEventService.shouldSyncEventType(1L, "pickup");

        // Then
        assertThat(result).isTrue();
    }
}
