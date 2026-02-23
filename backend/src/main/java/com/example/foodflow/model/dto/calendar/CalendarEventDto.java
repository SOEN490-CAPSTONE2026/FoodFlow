package com.example.foodflow.model.dto.calendar;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for synced calendar event response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDto {
    
    @JsonProperty("id")
    private Long id;
    
    @JsonProperty("event_type")
    private String eventType; // 'PICKUP', 'DELIVERY', 'CLAIM'
    
    @JsonProperty("event_title")
    private String eventTitle;
    
    @JsonProperty("event_description")
    private String eventDescription;
    
    @JsonProperty("start_time")
    private LocalDateTime startTime;
    
    @JsonProperty("end_time")
    private LocalDateTime endTime;
    
    @JsonProperty("timezone")
    private String timezone;
    
    @JsonProperty("sync_status")
    private String syncStatus; // 'SYNCED', 'PENDING', 'FAILED'
    
    @JsonProperty("external_event_id")
    private String externalEventId;
    
    @JsonProperty("last_sync_error")
    private String lastSyncError;
}
