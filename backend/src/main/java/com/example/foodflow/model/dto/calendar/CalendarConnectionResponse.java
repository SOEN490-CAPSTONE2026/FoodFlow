package com.example.foodflow.model.dto.calendar;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    
    private LocalDateTime connectedSince;
    
    private String googleAccountEmail;
    
    private String primaryCalendarName;
    
    private String calendarTimeZone;
    
    private String grantedScopes;
    
    private LocalDateTime lastSuccessfulSync;
    
    private LocalDateTime lastFailedRefresh;
}
