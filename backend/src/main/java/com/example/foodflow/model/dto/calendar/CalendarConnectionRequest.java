package com.example.foodflow.model.dto.calendar;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for calendar connection request (OAuth callback)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarConnectionRequest {
    
    private String calendarProvider; // 'GOOGLE', 'OUTLOOK'
    
    private String authCode; // OAuth authorization code from provider
    
    private String[] scopes; // Requested permission scopes
}
