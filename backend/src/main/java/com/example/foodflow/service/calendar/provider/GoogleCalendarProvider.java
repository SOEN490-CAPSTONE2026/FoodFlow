package com.example.foodflow.service.calendar.provider;

import com.example.foodflow.model.dto.calendar.google.GoogleCalendarEventRequest;
import com.example.foodflow.model.dto.calendar.google.GoogleCalendarEventResponse;
import com.example.foodflow.model.dto.calendar.google.GoogleCalendarSettingsResponse;
import com.example.foodflow.model.entity.CalendarSyncPreference;
import com.example.foodflow.model.entity.SyncedCalendarEvent;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
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

import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Implementation for Google Calendar API integration
 * Uses Google Calendar v3 REST API
 */
@Component
public class GoogleCalendarProvider implements CalendarProvider {

    private static final Logger logger = LoggerFactory.getLogger(GoogleCalendarProvider.class);
    private static final String PROVIDER_NAME = "GOOGLE";
    private static final String GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    private static final String GOOGLE_CALENDAR_PRIMARY = "https://www.googleapis.com/calendar/v3/calendars/primary";
    private static final String GOOGLE_CALENDAR_LIST_PRIMARY = "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary";

    @Autowired
    private GoogleOAuthService googleOAuthService;

    @Autowired
    private EncryptionUtility encryptionUtility;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;

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
            
            // DEBUG: Log the request payload
            String requestJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(googleEvent);
            logger.info("=== GOOGLE CALENDAR CREATE EVENT REQUEST ===");
            logger.info("URL: {}", GOOGLE_CALENDAR_API_BASE);
            logger.info("Event Title: {}", event.getEventTitle());
            logger.info("User: {} (timezone: {})", event.getUser().getId(), event.getTimezone());
            logger.info("Request Payload:\n{}", requestJson);
            writeDebugLog("CREATE_EVENT_REQUEST", requestJson);

            HttpHeaders headers = createAuthHeaders(accessToken);
            HttpEntity<GoogleCalendarEventRequest> request = new HttpEntity<>(googleEvent, headers);

            String url = GOOGLE_CALENDAR_API_BASE;
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            // DEBUG: Log the response
            logger.info("=== GOOGLE CALENDAR CREATE EVENT RESPONSE ===");
            logger.info("Status Code: {}", response.getStatusCode());
            logger.info("Response Body:\n{}", response.getBody());
            writeDebugLog("CREATE_EVENT_RESPONSE", response.getBody());

            if (!response.getStatusCode().is2xxSuccessful()) {
                logger.error("Failed to create event. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new CalendarProviderException("Failed to create event: " + response.getStatusCode());
            }

            GoogleCalendarEventResponse createdEvent = objectMapper.readValue(
                response.getBody(), GoogleCalendarEventResponse.class);

            logger.info("✅ Event created on Google Calendar with ID: {}", createdEvent.getId());
            return createdEvent.getId();
        } catch (CalendarProviderException e) {
            throw e;
        } catch (Exception e) {
            logger.error("❌ Failed to create event on Google Calendar", e);
            writeDebugLog("CREATE_EVENT_ERROR", e.getMessage() + "\n" + getStackTrace(e));
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
     * Verify calendar access by calling a lightweight endpoint
     * Returns true if access is valid, false if permissions have been revoked
     * @throws CalendarProviderException with "invalid_grant" message if refresh token is invalid
     */
    public boolean verifyCalendarAccess(String refreshToken) throws CalendarProviderException {
        try {
            logger.info("Verifying calendar access");
            
            // Get access token (will attempt refresh)
            GoogleOAuthService.GoogleTokenResponse tokenResponse = 
                googleOAuthService.refreshAccessToken(refreshToken);
            String accessToken = tokenResponse.getAccessToken();
            
            // Make lightweight API call to verify permissions
            HttpHeaders headers = createAuthHeaders(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                GOOGLE_CALENDAR_PRIMARY, 
                HttpMethod.GET, 
                request, 
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Calendar access verified successfully");
                return true;
            }
            
            logger.warn("Calendar access verification returned non-2xx status: {}", response.getStatusCode());
            return false;
        } catch (Exception e) {
            String errorMessage = e.getMessage();
            logger.error("Calendar access verification failed: {}", errorMessage);
            
            // Check if it's an invalid_grant error (user revoked permissions)
            if (errorMessage != null && errorMessage.contains("invalid_grant")) {
                throw new CalendarProviderException("invalid_grant");
            }
            
            // Other errors might be temporary network issues
            throw new CalendarProviderException("Verification failed: " + errorMessage, e);
        }
    }

    /**
     * Fetch calendar settings (name, timezone) from Google Calendar API
     * @param refreshToken Refresh token (NOT encrypted)
     * @return GoogleCalendarSettingsResponse containing calendar metadata
     * @throws CalendarProviderException if the API call fails
     */
    public GoogleCalendarSettingsResponse fetchCalendarSettings(String refreshToken) throws CalendarProviderException {
        try {
            logger.info("Fetching Google Calendar settings");
            
            // Get access token
            GoogleOAuthService.GoogleTokenResponse tokenResponse = 
                googleOAuthService.refreshAccessToken(refreshToken);
            String accessToken = tokenResponse.getAccessToken();
            
            // Call Google Calendar List API to get primary calendar settings with better metadata
            // This endpoint returns more complete information including proper calendar name
            HttpHeaders headers = createAuthHeaders(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                GOOGLE_CALENDAR_LIST_PRIMARY, 
                HttpMethod.GET, 
                request, 
                String.class
            );
            
            if (!response.getStatusCode().is2xxSuccessful()) {
                logger.error("Failed to fetch calendar settings. Status: {}", response.getStatusCode());
                throw new CalendarProviderException("Failed to fetch calendar settings: " + response.getStatusCode());
            }
            
            GoogleCalendarSettingsResponse settings = objectMapper.readValue(
                response.getBody(), GoogleCalendarSettingsResponse.class);
            
            logger.info("✅ Calendar settings fetched - id={}, summary={}, summaryOverride={}, timezone={}", 
                       settings.getId(), settings.getSummary(), settings.getSummaryOverride(), settings.getTimeZone());
            logger.info("Final calendar name will be: {}", settings.getCalendarName());
            
            return settings;
        } catch (CalendarProviderException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to fetch calendar settings", e);
            throw new CalendarProviderException("Failed to fetch calendar settings: " + e.getMessage(), e);
        }
    }

    /**
     * Map FoodFlow event to Google Calendar event with user preferences applied
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
        
        // Apply user preferences
        Optional<CalendarSyncPreference> prefsOpt = calendarSyncPreferenceRepository.findByUserId(event.getUser().getId());
        if (prefsOpt.isPresent()) {
            CalendarSyncPreference prefs = prefsOpt.get();
            
            // Apply color
            googleEvent.setColorId(mapColorToGoogleColorId(prefs.getEventColor()));
            
            // Apply visibility
            googleEvent.setVisibility(prefs.getEventVisibility() != null ? 
                prefs.getEventVisibility().toLowerCase() : "private");
            
            // Apply reminders
            if (prefs.getAutoCreateReminders()) {
                googleEvent.setReminders(buildReminders(prefs));
            }
            
            // Add location if this is a claim event with pickup location
            if (event.getClaim() != null && 
                event.getClaim().getSurplusPost() != null && 
                event.getClaim().getSurplusPost().getPickupLocation() != null) {
                googleEvent.setLocation(event.getClaim().getSurplusPost().getPickupLocation().getAddress());
            }
        }

        return googleEvent;
    }
    
    /**
     * Map color preference to Google Calendar color ID
     */
    private String mapColorToGoogleColorId(String color) {
        if (color == null) return "1"; // Default blue
        return switch(color.toUpperCase()) {
            case "BLUE" -> "1";
            case "GREEN" -> "2";
            case "PURPLE" -> "3";
            case "RED" -> "11";
            case "YELLOW" -> "5";
            case "ORANGE" -> "6";
            case "GRAY" -> "8";
            default -> "1"; // Default blue
        };
    }
    
    /**
     * Build reminders configuration from preferences
     */
    private GoogleCalendarEventRequest.RemindersConfig buildReminders(CalendarSyncPreference prefs) {
        List<GoogleCalendarEventRequest.Reminder> reminders = new ArrayList<>();
        int minutes = prefs.getReminderMinutesBefore();
        String type = prefs.getReminderType();
        
        if ("EMAIL".equals(type)) {
            reminders.add(new GoogleCalendarEventRequest.Reminder("email", minutes));
        } else if ("POPUP".equals(type)) {
            reminders.add(new GoogleCalendarEventRequest.Reminder("popup", minutes));
        } else if ("BOTH".equals(type)) {
            reminders.add(new GoogleCalendarEventRequest.Reminder("email", minutes));
            reminders.add(new GoogleCalendarEventRequest.Reminder("popup", minutes));
        }
        
        return new GoogleCalendarEventRequest.RemindersConfig(
            false, 
            reminders.toArray(new GoogleCalendarEventRequest.Reminder[0])
        );
    }

    /**
     * Format LocalDateTime to ISO 8601 string
     */
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        return dateTime.format(DateTimeFormatter.ISO_DATE_TIME);
    }
    
    /**
     * Write debug information to file for troubleshooting
     */
    private void writeDebugLog(String prefix, String content) {
        try {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss-SSS"));
            String filename = "logs/google-calendar-debug-" + prefix + "-" + timestamp + ".json";
            Files.write(Paths.get(filename), content.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            logger.info("📝 Debug log written to: {}", filename);
        } catch (Exception e) {
            logger.warn("Failed to write debug log: {}", e.getMessage());
        }
    }
    
    /**
     * Get stack trace as string
     */
    private String getStackTrace(Exception e) {
        java.io.StringWriter sw = new java.io.StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        return sw.toString();
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
