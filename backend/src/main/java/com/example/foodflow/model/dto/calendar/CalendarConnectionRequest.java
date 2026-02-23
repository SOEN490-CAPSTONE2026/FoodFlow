package com.example.foodflow.model.dto.calendar;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @JsonProperty("calendar_provider")
    private String calendarProvider; // 'GOOGLE', 'OUTLOOK'
    
    @JsonProperty("auth_code")
    private String authCode; // OAuth authorization code from provider
    
    @JsonProperty("scopes")
    private String[] scopes; // Requested permission scopes
}
