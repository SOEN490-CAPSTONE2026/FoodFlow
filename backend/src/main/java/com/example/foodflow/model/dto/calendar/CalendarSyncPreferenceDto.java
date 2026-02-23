package com.example.foodflow.model.dto.calendar;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @JsonProperty("sync_enabled")
    private Boolean syncEnabled;
    
    @JsonProperty("sync_pickup_events")
    private Boolean syncPickupEvents;
    
    @JsonProperty("sync_delivery_events")
    private Boolean syncDeliveryEvents;
    
    @JsonProperty("sync_claim_events")
    private Boolean syncClaimEvents;
    
    @JsonProperty("auto_create_reminders")
    private Boolean autoCreateReminders;
    
    @JsonProperty("reminder_minutes_before")
    private Integer reminderMinutesBefore;
}
