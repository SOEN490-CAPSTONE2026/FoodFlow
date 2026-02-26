package com.example.foodflow.service.calendar.provider;

import com.example.foodflow.model.entity.SyncedCalendarEvent;

/**
 * Interface for different calendar providers (Google, Outlook, etc.)
 * Allows easy extension to support multiple calendar platforms
 */
public interface CalendarProvider {

    /**
     * Get the provider name (e.g., 'GOOGLE', 'OUTLOOK')
     */
    String getProviderName();

    /**
     * Push a new event to the external calendar
     * Returns the external event ID from the provider
     */
    String createEvent(String refreshToken, SyncedCalendarEvent event) throws CalendarProviderException;

    /**
     * Update an existing event in the external calendar
     */
    void updateEvent(String refreshToken, SyncedCalendarEvent event) throws CalendarProviderException;

    /**
     * Delete an event from the external calendar
     */
    void deleteEvent(String refreshToken, String externalEventId) throws CalendarProviderException;

    /**
     * Refresh an expired access token using the refresh token
     * Returns new access token
     */
    String refreshAccessToken(String refreshToken) throws CalendarProviderException;

    /**
     * Custom exception for calendar provider errors
     */
    class CalendarProviderException extends Exception {
        public CalendarProviderException(String message) {
            super(message);
        }

        public CalendarProviderException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
