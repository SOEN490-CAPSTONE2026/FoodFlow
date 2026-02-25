package com.example.foodflow.model.dto.calendar;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for calendar sync preferences request/response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarSyncPreferenceDto {
    
    private Boolean syncEnabled;
    
    private Boolean autoCreateReminders;
    
    private Integer reminderSecondsBefore; // Frontend sends in seconds, we'll store as minutes
    
    private String reminderType; // EMAIL, POPUP, etc.
    
    private String eventColor; // BLUE, RED, GREEN, etc.
    
    private String eventVisibility; // PRIVATE, PUBLIC
    
    private Integer eventDuration; // in minutes
}
