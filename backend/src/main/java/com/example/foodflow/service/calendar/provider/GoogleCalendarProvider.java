package com.example.foodflow.service.calendar.provider;

import com.example.foodflow.model.dto.calendar.google.GoogleCalendarEventRequest;
import com.example.foodflow.model.dto.calendar.google.GoogleCalendarEventResponse;
import com.example.foodflow.model.entity.SyncedCalendarEvent;
import com.example.foodflow.service.calendar.EncryptionUtility;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Implementation for Google Calendar API integration
 * Uses Google Calendar v3 REST API
 */
@Component
public class GoogleCalendarProvider implements CalendarProvider {

    private static final Logger logger = LoggerFactory.getLogger(GoogleCalendarProvider.class);
    private static final String PROVIDER_NAME = "GOOGLE";
    private static final String GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

    @Autowired
    private GoogleOAuthService googleOAuthService;

    @Autowired
    private EncryptionUtility encryptionUtility;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public String createEvent(String encryptedRefreshToken, SyncedCalendarEvent event) throws CalendarProviderException {
        try {
            String refreshToken = encryptionUtility.decrypt(encryptedRefreshToken);
            String accessToken = getValidAccessToken(refreshToken);

            GoogleCalendarEventRequest googleEvent = mapToGoogleEvent(event);

            HttpHeaders headers = createAuthHeaders(accessToken);
            HttpEntity<GoogleCalendarEventRequest> request = new HttpEntity<>(googleEvent, headers);

            String url = GOOGLE_CALENDAR_API_BASE;
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new CalendarProviderException("Failed to create event: " + response.getStatusCode());
            }

            GoogleCalendarEventResponse createdEvent = objectMapper.readValue(
                response.getBody(), GoogleCalendarEventResponse.class);

            logger.info("Event created on Google Calendar with ID: {}", createdEvent.getId());
            return createdEvent.getId();
        } catch (CalendarProviderException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to create event on Google Calendar", e);
            throw new CalendarProviderException("Event creation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void updateEvent(String encryptedRefreshToken, SyncedCalendarEvent event) throws CalendarProviderException {
        try {
            if (event.getExternalEventId() == null) {
                throw new CalendarProviderException("Cannot update event without external event ID");
            }

            String refreshToken = encryptionUtility.decrypt(encryptedRefreshToken);
            String accessToken = getValidAccessToken(refreshToken);

            GoogleCalendarEventRequest googleEvent = mapToGoogleEvent(event);

            HttpHeaders headers = createAuthHeaders(accessToken);
            HttpEntity<GoogleCalendarEventRequest> request = new HttpEntity<>(googleEvent, headers);

            String url = GOOGLE_CALENDAR_API_BASE + "/" + event.getExternalEventId();
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.PATCH, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new CalendarProviderException("Failed to update event: " + response.getStatusCode());
            }

            logger.info("Event updated on Google Calendar: {}", event.getExternalEventId());
        } catch (CalendarProviderException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to update event on Google Calendar", e);
            throw new CalendarProviderException("Event update failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteEvent(String encryptedRefreshToken, String externalEventId) throws CalendarProviderException {
        try {
            String refreshToken = encryptionUtility.decrypt(encryptedRefreshToken);
            String accessToken = getValidAccessToken(refreshToken);

            HttpHeaders headers = createAuthHeaders(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            String url = GOOGLE_CALENDAR_API_BASE + "/" + externalEventId;
            ResponseEntity<Void> response = restTemplate.exchange(
                url, HttpMethod.DELETE, request, Void.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new CalendarProviderException("Failed to delete event: " + response.getStatusCode());
            }

            logger.info("Event deleted from Google Calendar: {}", externalEventId);
        } catch (CalendarProviderException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to delete event from Google Calendar", e);
            throw new CalendarProviderException("Event deletion failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String refreshAccessToken(String encryptedRefreshToken) throws CalendarProviderException {
        try {
            String refreshToken = encryptionUtility.decrypt(encryptedRefreshToken);
            GoogleOAuthService.GoogleTokenResponse tokenResponse = 
                googleOAuthService.refreshAccessToken(refreshToken);
            logger.info("Access token refreshed successfully");
            return tokenResponse.getAccessToken();
        } catch (Exception e) {
            logger.error("Failed to refresh access token", e);
            throw new CalendarProviderException("Token refresh failed: " + e.getMessage(), e);
        }
    }

    /**
     * Get a valid access token, refreshing if necessary
     */
    private String getValidAccessToken(String refreshToken) throws CalendarProviderException {
        // For now, just return a refreshed token
        // TODO: Implement token caching with expiry checking
        return refreshAccessToken(encryptionUtility.encrypt(refreshToken));
    }

    /**
     * Map FoodFlow event to Google Calendar event
     */
    private GoogleCalendarEventRequest mapToGoogleEvent(SyncedCalendarEvent event) {
        GoogleCalendarEventRequest googleEvent = new GoogleCalendarEventRequest();
        googleEvent.setSummary(event.getEventTitle());
        googleEvent.setDescription(event.getEventDescription());

        // Format times for Google Calendar API
        String startDateTime = formatDateTime(event.getStartTime());
        String endDateTime = formatDateTime(event.getEndTime());

        GoogleCalendarEventRequest.GoogleDateTime start = new GoogleCalendarEventRequest.GoogleDateTime();
        start.setDateTime(startDateTime);
        start.setTimeZone(event.getTimezone() != null ? event.getTimezone() : "UTC");
        googleEvent.setStart(start);

        if (event.getEndTime() != null) {
            GoogleCalendarEventRequest.GoogleDateTime end = new GoogleCalendarEventRequest.GoogleDateTime();
            end.setDateTime(endDateTime);
            end.setTimeZone(event.getTimezone() != null ? event.getTimezone() : "UTC");
            googleEvent.setEnd(end);
        }

        return googleEvent;
    }

    /**
     * Format LocalDateTime to ISO 8601 string
     */
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        return dateTime.format(DateTimeFormatter.ISO_DATE_TIME);
    }

    /**
     * Create HTTP headers with authorization
     */
    private HttpHeaders createAuthHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Content-Type", "application/json");
        return headers;
    }
}
