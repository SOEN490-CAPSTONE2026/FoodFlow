package com.example.foodflow.service.calendar;

import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing synced calendar events and their lifecycle
 */
@Service
@Transactional
public class CalendarEventService {

    private static final Logger logger = LoggerFactory.getLogger(CalendarEventService.class);

    @Autowired
    private SyncedCalendarEventRepository syncedCalendarEventRepository;

    @Autowired
    private CalendarSyncLogRepository calendarSyncLogRepository;

    @Autowired
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;

    /**
     * Create a new synced calendar event
     */
    public SyncedCalendarEvent createCalendarEvent(User user, String eventType, String eventTitle,
                                                    String eventDescription, LocalDateTime startTime,
                                                    LocalDateTime endTime, String timezone) {
        SyncedCalendarEvent event = new SyncedCalendarEvent(user, eventType, eventTitle, startTime);
        event.setEventDescription(eventDescription);
        event.setEndTime(endTime);
        event.setTimezone(timezone);
        event.setSyncStatus("PENDING");
        
        SyncedCalendarEvent saved = syncedCalendarEventRepository.save(event);
        logSyncAction(user, "EVENT_CREATED", null, saved.getId(), eventType, "PENDING");
        logger.info("Calendar event created: {} for user {}", eventTitle, user.getId());
        return saved;
    }

    /**
     * Link a synced event to a donation (SurplusPost)
     */
    public void linkEventToDonation(SyncedCalendarEvent event, SurplusPost donation) {
        event.setDonation(donation);
        syncedCalendarEventRepository.save(event);
        logger.info("Calendar event {} linked to donation {}", event.getId(), donation.getId());
    }

    /**
     * Link a synced event to a claim
     */
    public void linkEventToClaim(SyncedCalendarEvent event, Claim claim) {
        event.setClaim(claim);
        syncedCalendarEventRepository.save(event);
        logger.info("Calendar event {} linked to claim {}", event.getId(), claim.getId());
    }

    /**
     * Update event details (title, description, time, etc.)
     */
    public SyncedCalendarEvent updateCalendarEvent(SyncedCalendarEvent event, String eventTitle,
                                                    String eventDescription, LocalDateTime startTime,
                                                    LocalDateTime endTime, String timezone) {
        event.setEventTitle(eventTitle);
        event.setEventDescription(eventDescription);
        event.setStartTime(startTime);
        event.setEndTime(endTime);
        event.setTimezone(timezone);
        event.setSyncStatus("PENDING"); // Mark as needing re-sync
        
        SyncedCalendarEvent updated = syncedCalendarEventRepository.save(event);
        logSyncAction(event.getUser(), "EVENT_UPDATED", event.getExternalEventId(), 
                     event.getId(), event.getEventType(), "PENDING");
        logger.info("Calendar event {} updated for user {}", event.getId(), event.getUser().getId());
        return updated;
    }

    /**
     * Mark event as successfully synced with external calendar
     */
    public void markEventAsSynced(SyncedCalendarEvent event, String externalEventId) {
        event.setExternalEventId(externalEventId);
        event.setSyncStatus("SYNCED");
        event.setLastSyncError(null);
        
        syncedCalendarEventRepository.save(event);
        logSyncAction(event.getUser(), "EVENT_SYNCED", externalEventId, event.getId(), 
                     event.getEventType(), "SUCCESS");
        logger.info("Calendar event {} marked as synced with external ID {}", event.getId(), externalEventId);
    }

    /**
     * Mark event as failed to sync
     */
    public void markEventAsFailed(SyncedCalendarEvent event, String errorMessage) {
        event.setSyncStatus("FAILED");
        event.setLastSyncError(errorMessage);
        
        syncedCalendarEventRepository.save(event);
        logSyncAction(event.getUser(), "SYNC_FAILED", event.getExternalEventId(), event.getId(),
                     event.getEventType(), "FAILED", errorMessage);
        logger.warn("Calendar event {} sync failed: {}", event.getId(), errorMessage);
    }

    /**
     * Mark event as deleted (soft delete)
     */
    public void deleteCalendarEvent(SyncedCalendarEvent event) {
        event.setIsDeleted(true);
        event.setSyncStatus("PENDING"); // Mark for deletion sync
        
        syncedCalendarEventRepository.save(event);
        logSyncAction(event.getUser(), "EVENT_DELETED", event.getExternalEventId(), event.getId(),
                     event.getEventType(), "PENDING");
        logger.info("Calendar event {} marked as deleted for user {}", event.getId(), event.getUser().getId());
    }

    /**
     * Get all pending sync events for a user
     */
    public List<SyncedCalendarEvent> getUserPendingSyncEvents(Long userId) {
        return syncedCalendarEventRepository.findByUserIdAndSyncStatus(userId, "PENDING");
    }
    
    /**
     * Get all pending sync events across all users
     */
    public List<SyncedCalendarEvent> getAllPendingSyncEvents() {
        return syncedCalendarEventRepository.findBySyncStatus("PENDING");
    }

    /**
     * Get all synced events for a user
     */
    public List<SyncedCalendarEvent> getUserSyncedEvents(Long userId) {
        return syncedCalendarEventRepository.findByUserIdAndIsDeletedFalse(userId);
    }

    /**
     * Get events for a specific donation
     */
    public List<SyncedCalendarEvent> getDonationEvents(Long donationId) {
        return syncedCalendarEventRepository.findByDonationId(donationId);
    }

    /**
     * Get events for a specific claim
     */
    public List<SyncedCalendarEvent> getClaimEvents(Long claimId) {
        return syncedCalendarEventRepository.findByClaimId(claimId);
    }

    /**
     * Find event by external calendar ID (for updates from external calendar)
     */
    public Optional<SyncedCalendarEvent> findByExternalEventId(String externalEventId) {
        return syncedCalendarEventRepository.findByExternalEventId(externalEventId);
    }

    /**
     * Log a calendar sync action for monitoring/troubleshooting
     */
    private void logSyncAction(User user, String action, String externalEventId, Long eventId,
                              String eventType, String status) {
        logSyncAction(user, action, externalEventId, eventId, eventType, status, null);
    }

    /**
     * Log a calendar sync action with error details
     */
    private void logSyncAction(User user, String action, String externalEventId, Long eventId,
                              String eventType, String status, String errorMessage) {
        CalendarSyncLog log = new CalendarSyncLog(user, action, status);
        log.setExternalEventId(externalEventId);
        log.setEventId(eventId);
        log.setEventType(eventType);
        log.setErrorMessage(errorMessage);
        
        calendarSyncLogRepository.save(log);
    }

    /**
     * Check if user has sync enabled
     */
    public boolean isSyncEnabled(Long userId) {
        return calendarSyncPreferenceRepository.findByUserId(userId)
            .map(CalendarSyncPreference::getSyncEnabled)
            .orElse(true);
    }

    /**
     * Get user's sync preferences
     */
    public Optional<CalendarSyncPreference> getUserSyncPreferences(Long userId) {
        return calendarSyncPreferenceRepository.findByUserId(userId);
    }

    /**
     * Check if specific event type should be synced
     */
    public boolean shouldSyncEventType(Long userId, String eventType) {
        Optional<CalendarSyncPreference> prefs = calendarSyncPreferenceRepository.findByUserId(userId);
        
        if (!prefs.isPresent()) {
            return true; // Default: sync all if no prefs set
        }

        CalendarSyncPreference pref = prefs.get();
        return switch (eventType.toUpperCase()) {
            case "PICKUP" -> pref.getSyncPickupEvents();
            case "DELIVERY" -> pref.getSyncDeliveryEvents();
            case "CLAIM" -> pref.getSyncClaimEvents();
            default -> true;
        };
    }
}
