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
    
    private Boolean syncPickupEvents;
    
    private Boolean syncDeliveryEvents;
    
    private Boolean syncClaimEvents;
    
    private Boolean autoCreateReminders;
    
    private Integer reminderMinutesBefore;
}
