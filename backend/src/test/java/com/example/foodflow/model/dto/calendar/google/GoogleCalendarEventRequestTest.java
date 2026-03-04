package com.example.foodflow.model.dto.calendar.google;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class GoogleCalendarEventRequestTest {

    @Test
    void googleCalendarEventRequest_NoArgConstructor_ShouldWork() {
        // When
        GoogleCalendarEventRequest request = new GoogleCalendarEventRequest();

        // Then
        assertThat(request).isNotNull();
    }

    @Test
    void googleCalendarEventRequest_AllArgsConstructor_ShouldWork() {
        // Given
        GoogleCalendarEventRequest.GoogleDateTime start = new GoogleCalendarEventRequest.GoogleDateTime();
        GoogleCalendarEventRequest.GoogleDateTime end = new GoogleCalendarEventRequest.GoogleDateTime();
        GoogleCalendarEventRequest.RemindersConfig reminders = new GoogleCalendarEventRequest.RemindersConfig();

        // When
        GoogleCalendarEventRequest request = new GoogleCalendarEventRequest(
            "Summary", "Description", start, end, "Location", "1", "private", null, reminders
        );

        // Then
        assertThat(request.getSummary()).isEqualTo("Summary");
        assertThat(request.getDescription()).isEqualTo("Description");
        assertThat(request.getStart()).isEqualTo(start);
        assertThat(request.getEnd()).isEqualTo(end);
        assertThat(request.getLocation()).isEqualTo("Location");
        assertThat(request.getColorId()).isEqualTo("1");
        assertThat(request.getVisibility()).isEqualTo("private");
        assertThat(request.getReminders()).isEqualTo(reminders);
    }

    @Test
    void googleDateTime_NoArgConstructor_ShouldWork() {
        // When
        GoogleCalendarEventRequest.GoogleDateTime dateTime = new GoogleCalendarEventRequest.GoogleDateTime();

        // Then
        assertThat(dateTime).isNotNull();
    }

    @Test
    void googleDateTime_AllArgsConstructor_ShouldWork() {
        // When
        GoogleCalendarEventRequest.GoogleDateTime dateTime = 
            new GoogleCalendarEventRequest.GoogleDateTime("2026-03-01T10:00:00", "America/New_York");

        // Then
        assertThat(dateTime.getDateTime()).isEqualTo("2026-03-01T10:00:00");
        assertThat(dateTime.getTimeZone()).isEqualTo("America/New_York");
    }

    @Test
    void googleDateTime_SettersAndGetters_ShouldWork() {
        // Given
        GoogleCalendarEventRequest.GoogleDateTime dateTime = new GoogleCalendarEventRequest.GoogleDateTime();

        // When
        dateTime.setDateTime("2026-03-01T10:00:00");
        dateTime.setTimeZone("America/New_York");

        // Then
        assertThat(dateTime.getDateTime()).isEqualTo("2026-03-01T10:00:00");
        assertThat(dateTime.getTimeZone()).isEqualTo("America/New_York");
    }

    @Test
    void reminder_NoArgConstructor_ShouldWork() {
        // When
        GoogleCalendarEventRequest.Reminder reminder = new GoogleCalendarEventRequest.Reminder();

        // Then
        assertThat(reminder).isNotNull();
    }

    @Test
    void reminder_AllArgsConstructor_ShouldWork() {
        // When
        GoogleCalendarEventRequest.Reminder reminder = 
            new GoogleCalendarEventRequest.Reminder("popup", 30);

        // Then
        assertThat(reminder.getMethod()).isEqualTo("popup");
        assertThat(reminder.getMinutes()).isEqualTo(30);
    }

    @Test
    void reminder_SettersAndGetters_ShouldWork() {
        // Given
        GoogleCalendarEventRequest.Reminder reminder = new GoogleCalendarEventRequest.Reminder();

        // When
        reminder.setMethod("email");
        reminder.setMinutes(15);

        // Then
        assertThat(reminder.getMethod()).isEqualTo("email");
        assertThat(reminder.getMinutes()).isEqualTo(15);
    }

    @Test
    void remindersConfig_NoArgConstructor_ShouldWork() {
        // When
        GoogleCalendarEventRequest.RemindersConfig config = new GoogleCalendarEventRequest.RemindersConfig();

        // Then
        assertThat(config).isNotNull();
    }

    @Test
    void remindersConfig_AllArgsConstructor_ShouldWork() {
        // Given
        GoogleCalendarEventRequest.Reminder[] reminders = new GoogleCalendarEventRequest.Reminder[]{
            new GoogleCalendarEventRequest.Reminder("popup", 30)
        };

        // When
        GoogleCalendarEventRequest.RemindersConfig config = 
            new GoogleCalendarEventRequest.RemindersConfig(false, reminders);

        // Then
        assertThat(config.getUseDefault()).isFalse();
        assertThat(config.getOverrides()).hasSize(1);
        assertThat(config.getOverrides()[0].getMethod()).isEqualTo("popup");
    }

    @Test
    void remindersConfig_SettersAndGetters_ShouldWork() {
        // Given
        GoogleCalendarEventRequest.RemindersConfig config = new GoogleCalendarEventRequest.RemindersConfig();
        GoogleCalendarEventRequest.Reminder[] reminders = new GoogleCalendarEventRequest.Reminder[]{
            new GoogleCalendarEventRequest.Reminder("email", 15)
        };

        // When
        config.setUseDefault(true);
        config.setOverrides(reminders);

        // Then
        assertThat(config.getUseDefault()).isTrue();
        assertThat(config.getOverrides()).hasSize(1);
    }

    @Test
    void attendee_NoArgConstructor_ShouldWork() {
        // When
        GoogleCalendarEventRequest.Attendee attendee = new GoogleCalendarEventRequest.Attendee();

        // Then
        assertThat(attendee).isNotNull();
    }

    @Test
    void attendee_AllArgsConstructor_ShouldWork() {
        // When
        GoogleCalendarEventRequest.Attendee attendee = 
            new GoogleCalendarEventRequest.Attendee("test@example.com", "Test User", true);

        // Then
        assertThat(attendee.getEmail()).isEqualTo("test@example.com");
        assertThat(attendee.getDisplayName()).isEqualTo("Test User");
        assertThat(attendee.getOptional()).isTrue();
    }

    @Test
    void attendee_SettersAndGetters_ShouldWork() {
        // Given
        GoogleCalendarEventRequest.Attendee attendee = new GoogleCalendarEventRequest.Attendee();

        // When
        attendee.setEmail("attendee@example.com");
        attendee.setDisplayName("Attendee Name");
        attendee.setOptional(false);

        // Then
        assertThat(attendee.getEmail()).isEqualTo("attendee@example.com");
        assertThat(attendee.getDisplayName()).isEqualTo("Attendee Name");
        assertThat(attendee.getOptional()).isFalse();
    }

    @Test
    void googleCalendarEventRequest_SettersAndGetters_ShouldWork() {
        // Given
        GoogleCalendarEventRequest request = new GoogleCalendarEventRequest();
        GoogleCalendarEventRequest.GoogleDateTime start = new GoogleCalendarEventRequest.GoogleDateTime();
        GoogleCalendarEventRequest.GoogleDateTime end = new GoogleCalendarEventRequest.GoogleDateTime();
        GoogleCalendarEventRequest.Attendee attendee = new GoogleCalendarEventRequest.Attendee();
        GoogleCalendarEventRequest.RemindersConfig reminders = new GoogleCalendarEventRequest.RemindersConfig();

        // When
        request.setSummary("Event Title");
        request.setDescription("Event Description");
        request.setStart(start);
        request.setEnd(end);
        request.setLocation("123 Main St");
        request.setColorId("2");
        request.setVisibility("public");
        request.setAttendees(Arrays.asList(attendee));
        request.setReminders(reminders);

        // Then
        assertThat(request.getSummary()).isEqualTo("Event Title");
        assertThat(request.getDescription()).isEqualTo("Event Description");
        assertThat(request.getStart()).isEqualTo(start);
        assertThat(request.getEnd()).isEqualTo(end);
        assertThat(request.getLocation()).isEqualTo("123 Main St");
        assertThat(request.getColorId()).isEqualTo("2");
        assertThat(request.getVisibility()).isEqualTo("public");
        assertThat(request.getAttendees()).hasSize(1);
        assertThat(request.getReminders()).isEqualTo(reminders);
    }
}
