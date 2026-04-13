package com.example.foodflow.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class TimezoneResolverTest {

    @Test
    void resolveTimezone_UsesCityMappingWhenAvailable() {
        assertThat(TimezoneResolver.resolveTimezone("Toronto", "Canada"))
                .isEqualTo("America/Toronto");
        assertThat(TimezoneResolver.resolveTimezone(" Paris ", " France "))
                .isEqualTo("Europe/Paris");
    }

    @Test
    void resolveTimezone_FallsBackToCountryDefaultsAndUtc() {
        assertThat(TimezoneResolver.resolveTimezone("Unknown City", "USA"))
                .isEqualTo("America/New_York");
        assertThat(TimezoneResolver.resolveTimezone("Unknown City", "UK"))
                .isEqualTo("Europe/London");
        assertThat(TimezoneResolver.resolveTimezone("Unknown City", "Atlantis"))
                .isEqualTo("UTC");
        assertThat(TimezoneResolver.resolveTimezone(null, "Canada"))
                .isEqualTo("UTC");
    }

    @Test
    void getTimezoneOffset_ReturnsZeroOffsetForInvalidValues() {
        assertThat(TimezoneResolver.getTimezoneOffset(null)).isEqualTo("+00:00");
        assertThat(TimezoneResolver.getTimezoneOffset("")).isEqualTo("+00:00");
        assertThat(TimezoneResolver.getTimezoneOffset("Invalid/Timezone")).isEqualTo("+00:00");
    }

    @Test
    void isValidTimezone_ValidatesKnownAndUnknownTimezoneIds() {
        assertThat(TimezoneResolver.isValidTimezone("America/Toronto")).isTrue();
        assertThat(TimezoneResolver.isValidTimezone("UTC")).isTrue();
        assertThat(TimezoneResolver.isValidTimezone("Invalid/Timezone")).isFalse();
        assertThat(TimezoneResolver.isValidTimezone(" ")).isFalse();
    }

    @Test
    void convertOffsetToTimezone_MapsSupportedUtcOffsets() {
        assertThat(TimezoneResolver.convertOffsetToTimezone("UTC-05:00"))
                .isEqualTo("America/New_York");
        assertThat(TimezoneResolver.convertOffsetToTimezone("GMT+05:30"))
                .isEqualTo("Asia/Kolkata");
        assertThat(TimezoneResolver.convertOffsetToTimezone("UTC+00:00"))
                .isEqualTo("UTC");
        assertThat(TimezoneResolver.convertOffsetToTimezone("PST"))
                .isEqualTo("UTC");
        assertThat(TimezoneResolver.convertOffsetToTimezone(null))
                .isEqualTo("UTC");
    }

    @Test
    void convertTimezone_ConvertsBetweenZonesAndFallsBackOnInvalidTimezone() {
        LocalDateTime dateTime = LocalDateTime.of(2026, 1, 15, 12, 0);

        assertThat(TimezoneResolver.convertTimezone(
                dateTime,
                "America/Toronto",
                "UTC"))
                .isEqualTo(LocalDateTime.of(2026, 1, 15, 17, 0));

        assertThat(TimezoneResolver.convertTimezone(
                dateTime,
                "Invalid/Timezone",
                "UTC"))
                .isEqualTo(dateTime);

        assertThat(TimezoneResolver.convertTimezone(null, "UTC", "America/Toronto"))
                .isNull();
    }

    @Test
    void convertDateTime_ComposesDateAndTimeBeforeConversion() {
        assertThat(TimezoneResolver.convertDateTime(
                LocalDate.of(2026, 6, 1),
                LocalTime.of(9, 30),
                "America/Toronto",
                "UTC"))
                .isEqualTo(LocalDateTime.of(2026, 6, 1, 13, 30));

        assertThat(TimezoneResolver.convertDateTime(null, LocalTime.NOON, "UTC", "UTC"))
                .isNull();
        assertThat(TimezoneResolver.convertDateTime(LocalDate.now(), null, "UTC", "UTC"))
                .isNull();
    }
}
