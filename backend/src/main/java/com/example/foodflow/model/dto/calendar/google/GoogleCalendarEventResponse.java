package com.example.foodflow.model.dto.calendar.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Google Calendar event response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleCalendarEventResponse {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("summary")
    private String summary;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("start")
    private GoogleDateTime start;
    
    @JsonProperty("end")
    private GoogleDateTime end;
    
    @JsonProperty("htmlLink")
    private String htmlLink;
    
    @JsonProperty("organizer")
    private Organizer organizer;

    /**
     * Date/time information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoogleDateTime {
        @JsonProperty("dateTime")
        private String dateTime;
        
        @JsonProperty("timeZone")
        private String timeZone;
        
        @JsonProperty("date")
        private String date;
    }

    /**
     * Organizer information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Organizer {
        @JsonProperty("email")
        private String email;
        
        @JsonProperty("displayName")
        private String displayName;
    }
}
