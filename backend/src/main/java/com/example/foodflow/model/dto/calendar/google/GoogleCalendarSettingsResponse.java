package com.example.foodflow.model.dto.calendar.google;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * DTO for Google Calendar settings response
 * Represents the primary calendar metadata
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleCalendarSettingsResponse {
    
    /**
     * Calendar ID (typically the user's email)
     */
    private String id;
    
    /**
     * Calendar summary/name
     */
    private String summary;
    
    /**
     * Summary override (user's custom calendar name)
     */
    private String summaryOverride;
    
    /**
     * Calendar time zone
     */
    private String timeZone;
    
    /**
     * Calendar description
     */
    private String description;
    
    /**
     * Get the best available calendar name
     * Prefers summaryOverride if set, otherwise falls back to summary
     */
    public String getCalendarName() {
        if (summaryOverride != null && !summaryOverride.isEmpty()) {
            return summaryOverride;
        }
        return summary;
    }
}
