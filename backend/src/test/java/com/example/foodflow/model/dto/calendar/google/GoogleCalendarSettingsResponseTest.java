package com.example.foodflow.model.dto.calendar.google;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GoogleCalendarSettingsResponseTest {

    @Test
    void getCalendarName_WhenSummaryOverrideIsSet_ShouldReturnSummaryOverride() {
        // Given
        GoogleCalendarSettingsResponse response = new GoogleCalendarSettingsResponse();
        response.setSummary("user@gmail.com");
        response.setSummaryOverride("My Custom Calendar");

        // When
        String result = response.getCalendarName();

        // Then
        assertThat(result).isEqualTo("My Custom Calendar");
    }

    @Test
    void getCalendarName_WhenSummaryOverrideIsNull_ShouldReturnSummary() {
        // Given
        GoogleCalendarSettingsResponse response = new GoogleCalendarSettingsResponse();
        response.setSummary("user@gmail.com");
        response.setSummaryOverride(null);

        // When
        String result = response.getCalendarName();

        // Then
        assertThat(result).isEqualTo("user@gmail.com");
    }

    @Test
    void getCalendarName_WhenSummaryOverrideIsEmpty_ShouldReturnSummary() {
        // Given
        GoogleCalendarSettingsResponse response = new GoogleCalendarSettingsResponse();
        response.setSummary("user@gmail.com");
        response.setSummaryOverride("");

        // When
        String result = response.getCalendarName();

        // Then
        assertThat(result).isEqualTo("user@gmail.com");
    }

    @Test
    void getCalendarName_WhenBothAreNull_ShouldReturnNull() {
        // Given
        GoogleCalendarSettingsResponse response = new GoogleCalendarSettingsResponse();
        response.setSummary(null);
        response.setSummaryOverride(null);

        // When
        String result = response.getCalendarName();

        // Then
        assertThat(result).isNull();
    }

    @Test
    void testGettersAndSetters() {
        // Given
        GoogleCalendarSettingsResponse response = new GoogleCalendarSettingsResponse();

        // When
        response.setId("user@gmail.com");
        response.setSummary("Primary");
        response.setSummaryOverride("My Calendar");
        response.setTimeZone("America/New_York");
        response.setDescription("Calendar description");

        // Then
        assertThat(response.getId()).isEqualTo("user@gmail.com");
        assertThat(response.getSummary()).isEqualTo("Primary");
        assertThat(response.getSummaryOverride()).isEqualTo("My Calendar");
        assertThat(response.getTimeZone()).isEqualTo("America/New_York");
        assertThat(response.getDescription()).isEqualTo("Calendar description");
    }
}
