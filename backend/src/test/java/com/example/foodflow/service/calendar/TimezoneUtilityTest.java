package com.example.foodflow.service.calendar;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class TimezoneUtilityTest {

    private TimezoneUtility timezoneUtility;

    @BeforeEach
    void setUp() {
        timezoneUtility = new TimezoneUtility();
    }

    // ==================== convertTimeZone ====================

    @Test
    void convertTimeZone_ShouldConvertBetweenTimezones() {
        // Given
        LocalDateTime sourceTime = LocalDateTime.of(2026, 2, 25, 10, 0); // 10 AM
        String fromZone = "America/New_York";
        String toZone = "America/Los_Angeles"; // 3 hours behind

        // When
        LocalDateTime result = timezoneUtility.convertTimeZone(sourceTime, fromZone, toZone);

        // Then - 10 AM EST is 7 AM PST
        assertThat(result).isEqualTo(LocalDateTime.of(2026, 2, 25, 7, 0));
    }

    @Test
    void convertTimeZone_ShouldConvertToUTC() {
        // Given
        LocalDateTime sourceTime = LocalDateTime.of(2026, 2, 25, 15, 0); // 3 PM
        String fromZone = "America/New_York"; // EST is UTC-5
        String toZone = "UTC";

        // When
        LocalDateTime result = timezoneUtility.convertTimeZone(sourceTime, fromZone, toZone);

        // Then - 3 PM EST is 8 PM UTC
        assertThat(result).isEqualTo(LocalDateTime.of(2026, 2, 25, 20, 0));
    }

    @Test
    void convertTimeZone_WithInvalidTimezone_ShouldReturnOriginalTime() {
        // Given
        LocalDateTime sourceTime = LocalDateTime.of(2026, 2, 25, 10, 0);
        String invalidZone = "Invalid/Timezone";

        // When
        LocalDateTime result = timezoneUtility.convertTimeZone(sourceTime, invalidZone, "UTC");

        // Then - should return original time when exception occurs
        assertThat(result).isEqualTo(sourceTime);
    }

    @Test
    void convertTimeZone_AcrossDSTBoundary_ShouldHandleCorrectly() {
        // Given - March 10, 2024 is when DST starts in US
        LocalDateTime sourceTime = LocalDateTime.of(2024, 3, 10, 10, 0);
        String fromZone = "America/New_York";
        String toZone = "America/Los_Angeles";

        // When
        LocalDateTime result = timezoneUtility.convertTimeZone(sourceTime, fromZone, toZone);

        // Then - should still be 3 hours difference
        assertThat(result).isEqualTo(LocalDateTime.of(2024, 3, 10, 7, 0));
    }

    // ==================== getUserTimeZone ====================

    @Test
    void getUserTimeZone_WithValidTimezone_ShouldReturnTimezone() {
        // Given
        String validTimezone = "America/New_York";

        // When
        String result = timezoneUtility.getUserTimeZone(validTimezone);

        // Then
        assertThat(result).isEqualTo("America/New_York");
    }

    @Test
    void getUserTimeZone_WithNull_ShouldReturnUTC() {
        // When
        String result = timezoneUtility.getUserTimeZone(null);

        // Then
        assertThat(result).isEqualTo("UTC");
    }

    @Test
    void getUserTimeZone_WithBlankString_ShouldReturnUTC() {
        // When
        String result = timezoneUtility.getUserTimeZone("   ");

        // Then
        assertThat(result).isEqualTo("UTC");
    }

    @Test
    void getUserTimeZone_WithInvalidTimezone_ShouldReturnUTC() {
        // Given
        String invalidTimezone = "Invalid/Timezone";

        // When
        String result = timezoneUtility.getUserTimeZone(invalidTimezone);

        // Then
        assertThat(result).isEqualTo("UTC");
    }

    // ==================== toIso8601 ====================

    @Test
    void toIso8601_ShouldFormatToIsoDateTime() {
        // Given
        LocalDateTime dateTime = LocalDateTime.of(2026, 2, 25, 14, 30, 45);

        // When
        String result = timezoneUtility.toIso8601(dateTime);

        // Then
        assertThat(result).isEqualTo("2026-02-25T14:30:45");
    }

    @Test
    void toIso8601_WithMidnight_ShouldFormatCorrectly() {
        // Given
        LocalDateTime dateTime = LocalDateTime.of(2026, 2, 25, 0, 0, 0);

        // When
        String result = timezoneUtility.toIso8601(dateTime);

        // Then
        assertThat(result).isEqualTo("2026-02-25T00:00:00");
    }

    // ==================== toInstant ====================

    @Test
    void toInstant_WithValidTimezone_ShouldConvertToInstant() {
        // Given
        LocalDateTime dateTime = LocalDateTime.of(2026, 2, 25, 12, 0);
        String timezone = "UTC";

        // When
        Instant result = timezoneUtility.toInstant(dateTime, timezone);

        // Then
        assertThat(result).isEqualTo(dateTime.atZone(ZoneId.of("UTC")).toInstant());
    }

    @Test
    void toInstant_WithInvalidTimezone_ShouldFallbackToUTC() {
        // Given
        LocalDateTime dateTime = LocalDateTime.of(2026, 2, 25, 12, 0);
        String invalidTimezone = "Invalid/Timezone";

        // When
        Instant result = timezoneUtility.toInstant(dateTime, invalidTimezone);

        // Then - should use UTC as fallback
        assertThat(result).isEqualTo(dateTime.atZone(ZoneId.of("UTC")).toInstant());
    }

    @Test
    void toInstant_WithEST_ShouldConvertCorrectly() {
        // Given
        LocalDateTime dateTime = LocalDateTime.of(2026, 2, 25, 15, 0); // 3 PM EST
        String timezone = "America/New_York";

        // When
        Instant result = timezoneUtility.toInstant(dateTime, timezone);

        // Then - 3 PM EST should be 8 PM UTC
        Instant expected = LocalDateTime.of(2026, 2, 25, 20, 0).atZone(ZoneId.of("UTC")).toInstant();
        assertThat(result).isEqualTo(expected);
    }

    // ==================== getCurrentTimeInUserTimeZone ====================

    @Test
    void getCurrentTimeInUserTimeZone_WithValidTimezone_ShouldReturnCurrentTime() {
        // Given
        String timezone = "America/New_York";

        // When
        LocalDateTime result = timezoneUtility.getCurrentTimeInUserTimeZone(timezone);

        // Then - should be approximately now (within 1 second)
        LocalDateTime expectedNow = LocalDateTime.now(ZoneId.of(timezone));
        assertThat(result).isCloseTo(expectedNow, within(1, java.time.temporal.ChronoUnit.SECONDS));
    }

    @Test
    void getCurrentTimeInUserTimeZone_WithUTC_ShouldReturnUTCTime() {
        // When
        LocalDateTime result = timezoneUtility.getCurrentTimeInUserTimeZone("UTC");

        // Then
        LocalDateTime expectedNow = LocalDateTime.now(ZoneId.of("UTC"));
        assertThat(result).isCloseTo(expectedNow, within(1, java.time.temporal.ChronoUnit.SECONDS));
    }

    @Test
    void getCurrentTimeInUserTimeZone_WithInvalidTimezone_ShouldReturnUTCTime() {
        // When
        LocalDateTime result = timezoneUtility.getCurrentTimeInUserTimeZone("Invalid/Timezone");

        // Then - should fallback to UTC
        LocalDateTime expectedNow = LocalDateTime.now(ZoneId.of("UTC"));
        assertThat(result).isCloseTo(expectedNow, within(1, java.time.temporal.ChronoUnit.SECONDS));
    }

    // ==================== isFuture ====================

    @Test
    void isFuture_WithFutureTime_ShouldReturnTrue() {
        // Given
        LocalDateTime futureTime = LocalDateTime.now(ZoneId.of("UTC")).plusHours(1);
        String timezone = "UTC";

        // When
        boolean result = timezoneUtility.isFuture(futureTime, timezone);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void isFuture_WithPastTime_ShouldReturnFalse() {
        // Given
        LocalDateTime pastTime = LocalDateTime.now(ZoneId.of("UTC")).minusHours(1);
        String timezone = "UTC";

        // When
        boolean result = timezoneUtility.isFuture(pastTime, timezone);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void isFuture_WithCurrentTime_ShouldReturnFalse() {
        // Given
        LocalDateTime now = LocalDateTime.now(ZoneId.of("UTC"));
        String timezone = "UTC";

        // When
        boolean result = timezoneUtility.isFuture(now, timezone);

        // Then - "after" means strictly after, not equal
        assertThat(result).isFalse();
    }

    @Test
    void isFuture_WithDifferentTimezone_ShouldCheckCorrectly() {
        // Given - future time in EST
        LocalDateTime futureTime = LocalDateTime.now(ZoneId.of("America/New_York")).plusHours(2);
        String timezone = "America/New_York";

        // When
        boolean result = timezoneUtility.isFuture(futureTime, timezone);

        // Then
        assertThat(result).isTrue();
    }

    // ==================== minutesUntilEvent ====================

    @Test
    void minutesUntilEvent_WithFutureEvent_ShouldReturnPositiveMinutes() {
        // Given
        LocalDateTime eventStart = LocalDateTime.now(ZoneId.of("UTC")).plusMinutes(30);
        String timezone = "UTC";

        // When
        long result = timezoneUtility.minutesUntilEvent(eventStart, timezone);

        // Then - should be approximately 30 minutes (within 1 minute for test execution time)
        assertThat(result).isBetween(29L, 31L);
    }

    @Test
    void minutesUntilEvent_WithPastEvent_ShouldReturnNegativeMinutes() {
        // Given
        LocalDateTime eventStart = LocalDateTime.now(ZoneId.of("UTC")).minusMinutes(15);
        String timezone = "UTC";

        // When
        long result = timezoneUtility.minutesUntilEvent(eventStart, timezone);

        // Then
        assertThat(result).isBetween(-16L, -14L);
    }

    @Test
    void minutesUntilEvent_WithEventInOneHour_ShouldReturn60Minutes() {
        // Given
        LocalDateTime eventStart = LocalDateTime.now(ZoneId.of("UTC")).plusHours(1);
        String timezone = "UTC";

        // When
        long result = timezoneUtility.minutesUntilEvent(eventStart, timezone);

        // Then
        assertThat(result).isBetween(59L, 61L);
    }

    @Test
    void minutesUntilEvent_WithDifferentTimezone_ShouldCalculateCorrectly() {
        // Given
        LocalDateTime eventStart = LocalDateTime.now(ZoneId.of("America/New_York")).plusMinutes(45);
        String timezone = "America/New_York";

        // When
        long result = timezoneUtility.minutesUntilEvent(eventStart, timezone);

        // Then
        assertThat(result).isBetween(44L, 46L);
    }

    @Test
    void minutesUntilEvent_WithEventStartingNow_ShouldReturnZero() {
        // Given
        LocalDateTime eventStart = LocalDateTime.now(ZoneId.of("UTC"));
        String timezone = "UTC";

        // When
        long result = timezoneUtility.minutesUntilEvent(eventStart, timezone);

        // Then - should be very close to 0
        assertThat(result).isBetween(-1L, 1L);
    }
}
