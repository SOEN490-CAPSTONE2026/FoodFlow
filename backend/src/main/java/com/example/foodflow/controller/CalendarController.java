package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ApiResponse;
import com.example.foodflow.model.dto.calendar.CalendarConnectionRequest;
import com.example.foodflow.model.dto.calendar.CalendarConnectionResponse;
import com.example.foodflow.model.dto.calendar.CalendarEventDto;
import com.example.foodflow.model.dto.calendar.CalendarSyncPreferenceDto;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.service.calendar.CalendarIntegrationService;
import com.example.foodflow.service.calendar.CalendarEventService;
import com.example.foodflow.service.calendar.CalendarSyncService;
import com.example.foodflow.service.calendar.provider.GoogleOAuthService;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * REST Controller for calendar integration endpoints
 */
@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private static final Logger logger = LoggerFactory.getLogger(CalendarController.class);

    @Autowired
    private CalendarIntegrationService calendarIntegrationService;

    @Autowired
    private CalendarEventService calendarEventService;

    @Autowired
    private CalendarSyncService calendarSyncService;

    @Autowired
    private GoogleOAuthService googleOAuthService;

    @Autowired
    private ModelMapper modelMapper;

    /**
     * Get calendar integration status for current user
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<CalendarConnectionResponse>> getCalendarStatus(
            @AuthenticationPrincipal User currentUser) {
        try {
            Optional<CalendarIntegration> integration = calendarIntegrationService.getUserIntegration(currentUser);

            CalendarConnectionResponse response = new CalendarConnectionResponse();
            if (integration.isPresent()) {
                response.setIsConnected(integration.get().getIsConnected());
                response.setCalendarProvider(integration.get().getCalendarProvider());
                response.setMessage(integration.get().getIsConnected() ? 
                    "Calendar is connected" : "Calendar is disconnected");
            } else {
                response.setIsConnected(false);
                response.setMessage("No calendar integration found");
            }

            return ResponseEntity.ok(new ApiResponse<>(true, "Calendar status retrieved", response));
        } catch (Exception e) {
            logger.error("Error retrieving calendar status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Error retrieving calendar status: " + e.getMessage(), null));
        }
    }

    /**
     * Start OAuth flow for calendar connection
     */
    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<Map<String, String>>> initiateCalendarConnection(
            @RequestBody CalendarConnectionRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            if (request.getCalendarProvider() == null || request.getCalendarProvider().isBlank()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Calendar provider is required", null));
            }

            logger.info("Initiating calendar connection for user {} with provider {}", 
                       currentUser.getId(), request.getCalendarProvider());

            String provider = request.getCalendarProvider().toUpperCase();

            if ("GOOGLE".equals(provider)) {
                // Generate OAuth URL for Google
                String state = generateStateToken(currentUser.getId());
                String authorizationUrl = googleOAuthService.getAuthorizationUrl(state);
                
                Map<String, String> response = new HashMap<>();
                response.put("authorizationUrl", authorizationUrl);
                response.put("provider", "GOOGLE");
                response.put("state", state);

                return ResponseEntity.ok(new ApiResponse<>(true, 
                    "OAuth flow initiated. Redirect to provider login.", response));
            } else {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Unsupported calendar provider: " + provider, null));
            }
        } catch (Exception e) {
            logger.error("Error initiating calendar connection", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Error initiating connection: " + e.getMessage(), null));
        }
    }

    /**
     * Handle OAuth callback from Google Calendar
     */
    @GetMapping("/oauth/google/callback")
    public ResponseEntity<ApiResponse<CalendarConnectionResponse>> handleGoogleOAuthCallback(
            @RequestParam("code") String authCode,
            @RequestParam(value = "state", required = false) String state,
            @AuthenticationPrincipal User currentUser) {
        try {
            logger.info("Google OAuth callback received for user {}", currentUser.getId());

            // Exchange the authorization code for tokens
            GoogleOAuthService.GoogleTokenResponse tokenResponse = 
                googleOAuthService.exchangeCodeForTokens(authCode);

            // Store the tokens in the database
            calendarIntegrationService.storeOAuthTokens(currentUser, "GOOGLE", tokenResponse);

            CalendarConnectionResponse response = new CalendarConnectionResponse();
            response.setIsConnected(true);
            response.setCalendarProvider("GOOGLE");
            response.setMessage("Calendar successfully connected!");

            return ResponseEntity.ok(new ApiResponse<>(true, 
                "Google Calendar connected successfully", response));
        } catch (Exception e) {
            logger.error("Error handling Google OAuth callback", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "OAuth callback failed: " + e.getMessage(), null));
        }
    }

    /**
     * Disconnect calendar
     */
    @PostMapping("/disconnect")
    public ResponseEntity<ApiResponse<Object>> disconnectCalendar(
            @RequestParam("provider") String calendarProvider,
            @AuthenticationPrincipal User currentUser) {
        try {
            calendarIntegrationService.disconnectCalendar(currentUser, calendarProvider);

            logger.info("Calendar disconnected for user {} from provider {}", 
                       currentUser.getId(), calendarProvider);

            return ResponseEntity.ok(new ApiResponse<>(true, 
                "Calendar disconnected successfully", null));
        } catch (Exception e) {
            logger.error("Error disconnecting calendar", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Error disconnecting: " + e.getMessage(), null));
        }
    }

    /**
     * Get user's calendar sync preferences
     */
    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> getSyncPreferences(
            @AuthenticationPrincipal User currentUser) {
        try {
            Optional<CalendarSyncPreference> preferences = 
                calendarEventService.getUserSyncPreferences(currentUser.getId());

            if (preferences.isPresent()) {
                CalendarSyncPreferenceDto dto = modelMapper.map(preferences.get(), 
                    CalendarSyncPreferenceDto.class);
                return ResponseEntity.ok(new ApiResponse<>(true, 
                    "Sync preferences retrieved", dto));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "No sync preferences found", null));
            }
        } catch (Exception e) {
            logger.error("Error retrieving sync preferences", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Error retrieving preferences: " + e.getMessage(), null));
        }
    }

    /**
     * Update user's calendar sync preferences
     */
    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> updateSyncPreferences(
            @RequestBody CalendarSyncPreferenceDto request,
            @AuthenticationPrincipal User currentUser) {
        try {
            Optional<CalendarSyncPreference> preferences = 
                calendarEventService.getUserSyncPreferences(currentUser.getId());

            CalendarSyncPreference pref;
            if (preferences.isPresent()) {
                pref = preferences.get();
            } else {
                pref = new CalendarSyncPreference(currentUser);
            }

            if (request.getSyncEnabled() != null) pref.setSyncEnabled(request.getSyncEnabled());
            if (request.getSyncPickupEvents() != null) pref.setSyncPickupEvents(request.getSyncPickupEvents());
            if (request.getSyncDeliveryEvents() != null) pref.setSyncDeliveryEvents(request.getSyncDeliveryEvents());
            if (request.getSyncClaimEvents() != null) pref.setSyncClaimEvents(request.getSyncClaimEvents());
            if (request.getAutoCreateReminders() != null) pref.setAutoCreateReminders(request.getAutoCreateReminders());
            if (request.getReminderMinutesBefore() != null) pref.setReminderMinutesBefore(request.getReminderMinutesBefore());

            logger.info("Sync preferences updated for user {}", currentUser.getId());

            CalendarSyncPreferenceDto responseDto = modelMapper.map(pref, CalendarSyncPreferenceDto.class);
            return ResponseEntity.ok(new ApiResponse<>(true, 
                "Sync preferences updated", responseDto));
        } catch (Exception e) {
            logger.error("Error updating sync preferences", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Error updating preferences: " + e.getMessage(), null));
        }
    }

    /**
     * Get all synced calendar events for current user
     */
    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<CalendarEventDto>>> getSyncedEvents(
            @AuthenticationPrincipal User currentUser) {
        try {
            List<SyncedCalendarEvent> events = 
                calendarEventService.getUserSyncedEvents(currentUser.getId());

            List<CalendarEventDto> dtos = events.stream()
                .map(e -> modelMapper.map(e, CalendarEventDto.class))
                .collect(Collectors.toList());

            return ResponseEntity.ok(new ApiResponse<>(true, 
                "Synced events retrieved", dtos));
        } catch (Exception e) {
            logger.error("Error retrieving synced events", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Error retrieving events: " + e.getMessage(), null));
        }
    }

    /**
     * Trigger manual sync of pending events
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Object>> manualSync(
            @AuthenticationPrincipal User currentUser) {
        try {
            calendarSyncService.syncUserPendingEvents(currentUser);

            logger.info("Manual sync triggered for user {}", currentUser.getId());

            return ResponseEntity.ok(new ApiResponse<>(true, 
                "Sync triggered successfully", null));
        } catch (Exception e) {
            logger.error("Error during manual sync", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Error during sync: " + e.getMessage(), null));
        }
    }

    /**
     * Test calendar connection
     */
    @PostMapping("/test")
    public ResponseEntity<ApiResponse<Object>> testConnection(
            @RequestParam("provider") String provider,
            @AuthenticationPrincipal User currentUser) {
        try {
            boolean isConnected = calendarSyncService.testCalendarConnection(currentUser, provider);

            if (isConnected) {
                return ResponseEntity.ok(new ApiResponse<>(true, 
                    "Calendar connection test successful", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "Calendar connection test failed", null));
            }
        } catch (Exception e) {
            logger.error("Error testing calendar connection", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Test failed: " + e.getMessage(), null));
        }
    }

    /**
     * Generate a state token for OAuth flow (anti-CSRF)
     */
    private String generateStateToken(Long userId) {
        return java.util.UUID.randomUUID().toString() + "_" + userId;
    }
}
