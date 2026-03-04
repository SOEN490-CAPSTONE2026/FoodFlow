package com.example.foodflow.service.calendar;

import org.springframework.stereotype.Component;

import java.time.*;
import java.time.format.DateTimeFormatter;

@Component
public class TimezoneUtility {

    /**
     * Convert a LocalDateTime from one timezone to another
     */
    public LocalDateTime convertTimeZone(LocalDateTime dateTime, String fromTimeZone, String toTimeZone) {
        try {
            ZoneId fromZone = ZoneId.of(fromTimeZone);
            ZoneId toZone = ZoneId.of(toTimeZone);
            
            // Treat the input as if it's in fromTimeZone
            ZonedDateTime sourceZoned = dateTime.atZone(fromZone);
            // Convert to target timezone
            ZonedDateTime targetZoned = sourceZoned.withZoneSameInstant(toZone);
            
            return targetZoned.toLocalDateTime();
        } catch (Exception e) {
            // Fall back to UTC if timezone is invalid
            return dateTime;
        }
    }

    /**
     * Get user's timezone, fallback to UTC
     */
    public String getUserTimeZone(String userTimeZone) {
        if (userTimeZone == null || userTimeZone.isBlank()) {
            return "UTC";
        }
        try {
            ZoneId.of(userTimeZone);
            return userTimeZone;
        } catch (Exception e) {
            return "UTC";
        }
    }

    /**
     * Convert LocalDateTime to ISO 8601 format for calendar APIs
     */
    public String toIso8601(LocalDateTime dateTime) {
        return dateTime.format(DateTimeFormatter.ISO_DATE_TIME);
    }

    /**
     * Convert LocalDateTime with timezone to Instant (UTC)
     */
    public Instant toInstant(LocalDateTime dateTime, String timeZone) {
        try {
            ZoneId zone = ZoneId.of(timeZone);
            return dateTime.atZone(zone).toInstant();
        } catch (Exception e) {
            return dateTime.atZone(ZoneId.of("UTC")).toInstant();
        }
    }

    /**
     * Get current time in user's timezone
     */
    public LocalDateTime getCurrentTimeInUserTimeZone(String userTimeZone) {
        String tz = getUserTimeZone(userTimeZone);
        return LocalDateTime.now(ZoneId.of(tz));
    }

    /**
     * Check if a time is in the future
     */
    public boolean isFuture(LocalDateTime dateTime, String timeZone) {
        LocalDateTime nowInUserTimeZone = getCurrentTimeInUserTimeZone(timeZone);
        return dateTime.isAfter(nowInUserTimeZone);
    }

    /**
     * Calculate minutes until an event starts
     */
    public long minutesUntilEvent(LocalDateTime eventStart, String timeZone) {
        LocalDateTime nowInUserTimeZone = getCurrentTimeInUserTimeZone(timeZone);
        Duration duration = Duration.between(nowInUserTimeZone, eventStart);
        return duration.toMinutes();
    }
}
