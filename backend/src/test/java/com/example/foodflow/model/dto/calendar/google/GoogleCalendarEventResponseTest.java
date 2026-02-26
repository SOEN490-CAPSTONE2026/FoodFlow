package com.example.foodflow.model.dto.calendar.google;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GoogleCalendarEventResponseTest {

    @Test
    void googleCalendarEventResponse_NoArgConstructor_ShouldWork() {
        // When
        GoogleCalendarEventResponse response = new GoogleCalendarEventResponse();

        // Then
        assertThat(response).isNotNull();
    }

    @Test
    void googleCalendarEventResponse_AllArgsConstructor_ShouldWork() {
        // Given
        GoogleCalendarEventResponse.GoogleDateTime start = new GoogleCalendarEventResponse.GoogleDateTime();
        GoogleCalendarEventResponse.GoogleDateTime end = new GoogleCalendarEventResponse.GoogleDateTime();
        GoogleCalendarEventResponse.Organizer organizer = new GoogleCalendarEventResponse.Organizer();

        // When
        GoogleCalendarEventResponse response = new GoogleCalendarEventResponse(
            "event-123", "Event Title", "Description", start, end, "https://link.com", organizer
        );

        // Then
        assertThat(response.getId()).isEqualTo("event-123");
        assertThat(response.getSummary()).isEqualTo("Event Title");
        assertThat(response.getDescription()).isEqualTo("Description");
        assertThat(response.getStart()).isEqualTo(start);
        assertThat(response.getEnd()).isEqualTo(end);
        assertThat(response.getHtmlLink()).isEqualTo("https://link.com");
        assertThat(response.getOrganizer()).isEqualTo(organizer);
    }

    @Test
    void googleCalendarEventResponse_SettersAndGetters_ShouldWork() {
        // Given
        GoogleCalendarEventResponse response = new GoogleCalendarEventResponse();
        GoogleCalendarEventResponse.GoogleDateTime start = new GoogleCalendarEventResponse.GoogleDateTime();
        GoogleCalendarEventResponse.GoogleDateTime end = new GoogleCalendarEventResponse.GoogleDateTime();
        GoogleCalendarEventResponse.Organizer organizer = new GoogleCalendarEventResponse.Organizer();

        // When
        response.setId("event-456");
        response.setSummary("Meeting");
        response.setDescription("Team Meeting");
        response.setStart(start);
        response.setEnd(end);
        response.setHtmlLink("https://calendar.google.com/event/123");
        response.setOrganizer(organizer);

        // Then
        assertThat(response.getId()).isEqualTo("event-456");
        assertThat(response.getSummary()).isEqualTo("Meeting");
        assertThat(response.getDescription()).isEqualTo("Team Meeting");
        assertThat(response.getStart()).isEqualTo(start);
        assertThat(response.getEnd()).isEqualTo(end);
        assertThat(response.getHtmlLink()).isEqualTo("https://calendar.google.com/event/123");
        assertThat(response.getOrganizer()).isEqualTo(organizer);
    }

    @Test
    void googleDateTime_NoArgConstructor_ShouldWork() {
        // When
        GoogleCalendarEventResponse.GoogleDateTime dateTime = new GoogleCalendarEventResponse.GoogleDateTime();

        // Then
        assertThat(dateTime).isNotNull();
    }

    @Test
    void googleDateTime_AllArgsConstructor_ShouldWork() {
        // When
        GoogleCalendarEventResponse.GoogleDateTime dateTime = 
            new GoogleCalendarEventResponse.GoogleDateTime("2026-03-01T10:00:00", "America/New_York", "2026-03-01");

        // Then
        assertThat(dateTime.getDateTime()).isEqualTo("2026-03-01T10:00:00");
        assertThat(dateTime.getTimeZone()).isEqualTo("America/New_York");
        assertThat(dateTime.getDate()).isEqualTo("2026-03-01");
    }

    @Test
    void googleDateTime_SettersAndGetters_ShouldWork() {
        // Given
        GoogleCalendarEventResponse.GoogleDateTime dateTime = new GoogleCalendarEventResponse.GoogleDateTime();

        // When
        dateTime.setDateTime("2026-03-01T15:00:00");
        dateTime.setTimeZone("Europe/London");
        dateTime.setDate("2026-03-01");

        // Then
        assertThat(dateTime.getDateTime()).isEqualTo("2026-03-01T15:00:00");
        assertThat(dateTime.getTimeZone()).isEqualTo("Europe/London");
        assertThat(dateTime.getDate()).isEqualTo("2026-03-01");
    }

    @Test
    void organizer_NoArgConstructor_ShouldWork() {
        // When
        GoogleCalendarEventResponse.Organizer organizer = new GoogleCalendarEventResponse.Organizer();

        // Then
        assertThat(organizer).isNotNull();
    }

    @Test
    void organizer_AllArgsConstructor_ShouldWork() {
        // When
        GoogleCalendarEventResponse.Organizer organizer = 
            new GoogleCalendarEventResponse.Organizer("organizer@example.com", "Organizer Name");

        // Then
        assertThat(organizer.getEmail()).isEqualTo("organizer@example.com");
        assertThat(organizer.getDisplayName()).isEqualTo("Organizer Name");
    }

    @Test
    void organizer_SettersAndGetters_ShouldWork() {
        // Given
        GoogleCalendarEventResponse.Organizer organizer = new GoogleCalendarEventResponse.Organizer();

        // When
        organizer.setEmail("admin@example.com");
        organizer.setDisplayName("Admin User");

        // Then
        assertThat(organizer.getEmail()).isEqualTo("admin@example.com");
        assertThat(organizer.getDisplayName()).isEqualTo("Admin User");
    }
}
