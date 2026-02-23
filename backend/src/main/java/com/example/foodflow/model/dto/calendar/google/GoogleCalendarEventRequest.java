package com.example.foodflow.model.dto.calendar.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating/updating Google Calendar events
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleCalendarEventRequest {
    
    @JsonProperty("summary")
    private String summary; // Event title
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("start")
    private GoogleDateTime start;
    
    @JsonProperty("end")
    private GoogleDateTime end;
    
    @JsonProperty("reminders")
    private RemindersConfig reminders;

    /**
     * Nested class for date/time with timezone
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoogleDateTime {
        @JsonProperty("dateTime")
        private String dateTime; // ISO 8601 format: "2023-05-30T15:00:00"
        
        @JsonProperty("timeZone")
        private String timeZone;
    }

    /**
     * Reminders configuration
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RemindersConfig {
        @JsonProperty("useDefault")
        private Boolean useDefault = false;
        
        @JsonProperty("overrides")
        private Reminder[] overrides;
    }

    /**
     * Individual reminder
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Reminder {
        @JsonProperty("method")
        private String method = "notification"; // "notification" or "email"
        
        @JsonProperty("minutes")
        private Integer minutes;
    }
}
