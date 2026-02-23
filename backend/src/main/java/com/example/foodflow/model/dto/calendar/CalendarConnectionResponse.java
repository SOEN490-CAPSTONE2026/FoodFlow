package com.example.foodflow.model.dto.calendar;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for calendar connection response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarConnectionResponse {
    
    @JsonProperty("is_connected")
    private Boolean isConnected;
    
    @JsonProperty("calendar_provider")
    private String calendarProvider;
    
    @JsonProperty("message")
    private String message;
}
