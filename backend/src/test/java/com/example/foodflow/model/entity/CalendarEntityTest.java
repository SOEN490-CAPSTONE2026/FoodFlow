package com.example.foodflow.model.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CalendarEntityTest {

    @Test
    void calendarIntegration_Constructor_ShouldInitializeCorrectly() {
        // Given
        User user = new User();
        user.setId(1L);

        // When
        CalendarIntegration integration = new CalendarIntegration(user, "GOOGLE");

        // Then
        assertThat(integration.getUser()).isEqualTo(user);
        assertThat(integration.getCalendarProvider()).isEqualTo("GOOGLE");
        assertThat(integration.getIsConnected()).isFalse();
    }

    @Test
    void calendarIntegration_NoArgConstructor_ShouldWork() {
        // When
        CalendarIntegration integration = new CalendarIntegration();

        // Then
        assertThat(integration).isNotNull();
    }

    @Test
    void calendarSyncPreference_Constructor_ShouldInitializeWithUser() {
        // Given
        User user = new User();
        user.setId(1L);

        // When
        CalendarSyncPreference preference = new CalendarSyncPreference(user);

        // Then
        assertThat(preference.getUser()).isEqualTo(user);
    }

    @Test
    void calendarSyncPreference_NoArgConstructor_ShouldWork() {
        // When
        CalendarSyncPreference preference = new CalendarSyncPreference();

        // Then
        assertThat(preference).isNotNull();
    }

    @Test
    void syncedCalendarEvent_Constructor_ShouldInitializeCorrectly() {
        // Given
        User user = new User();
        user.setId(1L);
        String eventType = "PICKUP";
        String eventTitle = "Food Pickup";
        LocalDateTime startTime = LocalDateTime.now();

        // When
        SyncedCalendarEvent event = new SyncedCalendarEvent(user, eventType, eventTitle, startTime);

        // Then
        assertThat(event.getUser()).isEqualTo(user);
        assertThat(event.getEventType()).isEqualTo(eventType);
        assertThat(event.getEventTitle()).isEqualTo(eventTitle);
        assertThat(event.getStartTime()).isEqualTo(startTime);
        assertThat(event.getSyncStatus()).isEqualTo("PENDING");
    }

    @Test
    void syncedCalendarEvent_NoArgConstructor_ShouldWork() {
        // When
        SyncedCalendarEvent event = new SyncedCalendarEvent();

        // Then
        assertThat(event).isNotNull();
    }

    @Test
    void calendarSyncLog_NoArgConstructor_ShouldWork() {
        // When
        CalendarSyncLog log = new CalendarSyncLog();

        // Then
        assertThat(log).isNotNull();
    }

    @Test
    void calendarConsentHistory_NoArgConstructor_ShouldWork() {
        // When
        CalendarConsentHistory history = new CalendarConsentHistory();

        // Then
        assertThat(history).isNotNull();
    }

    @Test
    void calendarIntegration_SettersAndGetters_ShouldWork() {
        // Given
        CalendarIntegration integration = new CalendarIntegration();
        User user = new User();
        user.setId(1L);

        // When
        integration.setId(1L);
        integration.setUser(user);
        integration.setCalendarProvider("GOOGLE");
        integration.setIsConnected(true);
        integration.setRefreshToken("refresh-token");
        integration.setAccessTokenExpiry(LocalDateTime.now());
        integration.setGoogleAccountEmail("test@gmail.com");
        integration.setPrimaryCalendarName("Primary");
        integration.setCalendarTimeZone("America/New_York");
        integration.setGrantedScopes("calendar");
        integration.setLastSuccessfulSync(LocalDateTime.now());
        integration.setLastFailedRefresh(LocalDateTime.now());

        // Then
        assertThat(integration.getId()).isEqualTo(1L);
        assertThat(integration.getUser()).isEqualTo(user);
        assertThat(integration.getCalendarProvider()).isEqualTo("GOOGLE");
        assertThat(integration.getIsConnected()).isTrue();
        assertThat(integration.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(integration.getAccessTokenExpiry()).isNotNull();
        assertThat(integration.getGoogleAccountEmail()).isEqualTo("test@gmail.com");
        assertThat(integration.getPrimaryCalendarName()).isEqualTo("Primary");
        assertThat(integration.getCalendarTimeZone()).isEqualTo("America/New_York");
        assertThat(integration.getGrantedScopes()).isEqualTo("calendar");
        assertThat(integration.getLastSuccessfulSync()).isNotNull();
        assertThat(integration.getLastFailedRefresh()).isNotNull();
    }

    @Test
    void syncedCalendarEvent_SettersAndGetters_ShouldWork() {
        // Given
        SyncedCalendarEvent event = new SyncedCalendarEvent();
        User user = new User();
        user.setId(1L);
        SurplusPost donation = new SurplusPost();
        Claim claim = new Claim();

        // When
        event.setId(1L);
        event.setUser(user);
        event.setDonation(donation);
        event.setClaim(claim);
        event.setExternalEventId("ext-123");
        event.setEventType("PICKUP");
        event.setEventTitle("Food Pickup");
        event.setEventDescription("Description");
        event.setStartTime(LocalDateTime.now());
        event.setEndTime(LocalDateTime.now().plusHours(1));
        event.setTimezone("America/New_York");
        event.setSyncStatus("SYNCED");
        event.setLastSyncError("error");
        event.setIsDeleted(true);

        // Then
        assertThat(event.getId()).isEqualTo(1L);
        assertThat(event.getUser()).isEqualTo(user);
        assertThat(event.getDonation()).isEqualTo(donation);
        assertThat(event.getClaim()).isEqualTo(claim);
        assertThat(event.getExternalEventId()).isEqualTo("ext-123");
        assertThat(event.getEventType()).isEqualTo("PICKUP");
        assertThat(event.getEventTitle()).isEqualTo("Food Pickup");
        assertThat(event.getEventDescription()).isEqualTo("Description");
        assertThat(event.getStartTime()).isNotNull();
        assertThat(event.getEndTime()).isNotNull();
        assertThat(event.getTimezone()).isEqualTo("America/New_York");
        assertThat(event.getSyncStatus()).isEqualTo("SYNCED");
        assertThat(event.getLastSyncError()).isEqualTo("error");
        assertThat(event.getIsDeleted()).isTrue();
    }
}
