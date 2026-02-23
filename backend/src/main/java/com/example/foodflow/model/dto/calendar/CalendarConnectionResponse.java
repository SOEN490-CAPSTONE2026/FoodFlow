package com.example.foodflow.model.dto.calendar;

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
    
    private Boolean isConnected;
    
    private String calendarProvider;
    
    private String message;
}
