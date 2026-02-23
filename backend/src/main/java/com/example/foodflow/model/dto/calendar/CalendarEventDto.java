package com.example.foodflow.model.dto.calendar;

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
    
    private Long id;
    
    private String eventType; // 'PICKUP', 'DELIVERY', 'CLAIM'
    
    private String eventTitle;
    
    private String eventDescription;
    
    private LocalDateTime startTime;
    
    private LocalDateTime endTime;
    
    private String timezone;
    
    private String syncStatus; // 'SYNCED', 'PENDING', 'FAILED'
    
    private String externalEventId;
    
    private String lastSyncError;
}
