package com.example.foodflow.service.calendar;

import com.example.foodflow.model.entity.CalendarIntegration;
import com.example.foodflow.model.entity.SyncedCalendarEvent;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.calendar.provider.GoogleCalendarProvider;
import com.example.foodflow.service.calendar.provider.CalendarProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for syncing events to external calendars
 * Orchestrates the sync process between FoodFlow and Google Calendar, Outlook, etc.
 */
@Service
@Transactional
public class CalendarSyncService {

    private static final Logger logger = LoggerFactory.getLogger(CalendarSyncService.class);

    @Autowired
    private CalendarIntegrationService calendarIntegrationService;

    @Autowired
    private CalendarEventService calendarEventService;

    @Autowired
    private GoogleCalendarProvider googleCalendarProvider;

    /**
     * Sync all pending events for a user to their connected calendars
     */
    public void syncUserPendingEvents(User user) {
        Optional<CalendarIntegration> integration = calendarIntegrationService.getUserIntegration(user);
        
        if (!integration.isPresent() || !integration.get().getIsConnected()) {
            logger.info("User {} has no active calendar integration", user.getId());
            return;
        }

        List<SyncedCalendarEvent> pendingEvents = calendarEventService.getUserPendingSyncEvents(user.getId());
        logger.info("Found {} pending events to sync for user {}", pendingEvents.size(), user.getId());

        for (SyncedCalendarEvent event : pendingEvents) {
            syncEventToCalendar(user, integration.get(), event);
        }
    }

    /**
     * Sync a single event to the user's connected calendar
     */
    public void syncEventToCalendar(User user, CalendarIntegration integration, SyncedCalendarEvent event) {
        try {
            // Get the appropriate calendar provider
            CalendarProvider provider = getCalendarProvider(integration.getCalendarProvider());
            if (provider == null) {
                calendarEventService.markEventAsFailed(event, "Unsupported calendar provider: " + integration.getCalendarProvider());
                return;
            }

            // Get decrypted refresh token
            String refreshToken = calendarIntegrationService.getDecryptedRefreshToken(integration);

            // Check if event is deleted
            if (event.getIsDeleted()) {
                deleteEventFromCalendar(provider, refreshToken, event);
            } else if (event.getExternalEventId() != null) {
                // Event already synced, update it
                updateEventOnCalendar(provider, refreshToken, event);
            } else {
                // New event, create it
                createEventOnCalendar(provider, refreshToken, event);
            }

        } catch (Exception e) {
            calendarEventService.markEventAsFailed(event, e.getMessage());
            logger.error("Error syncing event {} for user {}", event.getId(), user.getId(), e);
        }
    }

    /**
     * Create a new event on the external calendar
     */
    private void createEventOnCalendar(CalendarProvider provider, String refreshToken, 
                                      SyncedCalendarEvent event) throws CalendarProvider.CalendarProviderException {
        String externalEventId = provider.createEvent(refreshToken, event);
        calendarEventService.markEventAsSynced(event, externalEventId);
        logger.info("Event {} created on {} calendar with external ID {}", 
                   event.getId(), provider.getProviderName(), externalEventId);
    }

    /**
     * Update an existing event on the external calendar
     */
    private void updateEventOnCalendar(CalendarProvider provider, String refreshToken,
                                       SyncedCalendarEvent event) throws CalendarProvider.CalendarProviderException {
        provider.updateEvent(refreshToken, event);
        calendarEventService.markEventAsSynced(event, event.getExternalEventId());
        logger.info("Event {} updated on {} calendar", event.getId(), provider.getProviderName());
    }

    /**
     * Delete an event from the external calendar
     */
    private void deleteEventFromCalendar(CalendarProvider provider, String refreshToken,
                                        SyncedCalendarEvent event) throws CalendarProvider.CalendarProviderException {
        provider.deleteEvent(refreshToken, event.getExternalEventId());
        calendarEventService.markEventAsSynced(event, event.getExternalEventId());
        logger.info("Event {} deleted from {} calendar", event.getId(), provider.getProviderName());
    }

    /**
     * Get the appropriate calendar provider instance based on provider name
     */
    private CalendarProvider getCalendarProvider(String providerName) {
        return switch (providerName.toUpperCase()) {
            case "GOOGLE" -> googleCalendarProvider;
            // TODO: Add OutlookCalendarProvider once implemented
            // case "OUTLOOK" -> outlookCalendarProvider;
            default -> null;
        };
    }

    /**
     * Test connection to user's calendar
     */
    public boolean testCalendarConnection(User user, String calendarProvider) {
        try {
            Optional<CalendarIntegration> integration = calendarIntegrationService.getUserIntegration(user);
            
            if (!integration.isPresent() || !integration.get().getIsConnected()) {
                return false;
            }

            CalendarProvider provider = getCalendarProvider(calendarProvider);
            if (provider == null) {
                return false;
            }

            String refreshToken = calendarIntegrationService.getDecryptedRefreshToken(integration.get());
            provider.refreshAccessToken(refreshToken); // Test by refreshing token
            
            logger.info("Calendar connection test successful for user {}", user.getId());
            return true;
        } catch (Exception e) {
            logger.warn("Calendar connection test failed for user {}", user.getId(), e);
            return false;
        }
    }
}
