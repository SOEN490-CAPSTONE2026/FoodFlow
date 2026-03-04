package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ApiResponse;
import com.example.foodflow.model.dto.calendar.CalendarConnectionRequest;
import com.example.foodflow.model.dto.calendar.CalendarConnectionResponse;
import com.example.foodflow.model.dto.calendar.CalendarEventDto;
import com.example.foodflow.model.dto.calendar.CalendarSyncPreferenceDto;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.service.calendar.CalendarIntegrationService;
import com.example.foodflow.service.calendar.CalendarEventService;
import com.example.foodflow.service.calendar.CalendarSyncService;
import com.example.foodflow.service.calendar.provider.GoogleOAuthService;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;

    @Value("${frontend.url}")
    private String frontendUrl;

    /**
     * Get calendar integration status for current user
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<CalendarConnectionResponse>> getCalendarStatus(
            @AuthenticationPrincipal User currentUser) {
        try {
            // Verify connection status before returning (checks if user revoked permissions)
            calendarIntegrationService.verifyAndUpdateConnectionStatus(currentUser);
            
            Optional<CalendarIntegration> integration = calendarIntegrationService.getUserIntegration(currentUser);

            CalendarConnectionResponse response = new CalendarConnectionResponse();
            if (integration.isPresent()) {
                CalendarIntegration cal = integration.get();
                response.setIsConnected(cal.getIsConnected());
                response.setCalendarProvider(cal.getCalendarProvider());
                response.setMessage(cal.getIsConnected() ? 
                    "Calendar is connected" : "Calendar is disconnected");
                
                // Add connection details
                response.setConnectedSince(cal.getCreatedAt());
                response.setGoogleAccountEmail(cal.getGoogleAccountEmail());
                response.setPrimaryCalendarName(cal.getPrimaryCalendarName());
                response.setCalendarTimeZone(cal.getCalendarTimeZone());
                response.setGrantedScopes(cal.getGrantedScopes());
                response.setLastSuccessfulSync(cal.getLastSuccessfulSync());
                response.setLastFailedRefresh(cal.getLastFailedRefresh());
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
     * This endpoint is PUBLIC - called by Google's OAuth redirect
     */
    @GetMapping("/oauth/google/callback")
    public ResponseEntity<?> handleGoogleOAuthCallback(
            @RequestParam("code") String authCode,
            @RequestParam(value = "state", required = true) String state) {
        try {
            // Extract user ID from state token (format: UUID_userId)
            String[] stateParts = state.split("_");
            if (stateParts.length < 2) {
                logger.error("Invalid state token format: {}", state);
                return ResponseEntity.badRequest()
                    .body("<html><body><h2>Invalid authentication state</h2><p>Please close this window and try again.</p></body></html>");
            }

            Long userId = Long.parseLong(stateParts[1]);
            logger.info("Google OAuth callback received for user ID {}", userId);

            // Fetch the user from database
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                logger.error("User not found for ID: {}", userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("<html><body><h2>User not found</h2><p>Please close this window and try again.</p></body></html>");
            }

            User user = userOpt.get();

            // Exchange the authorization code for tokens
            GoogleOAuthService.GoogleTokenResponse tokenResponse = 
                googleOAuthService.exchangeCodeForTokens(authCode);

            // Store the tokens in the database
            calendarIntegrationService.storeOAuthTokens(user, "GOOGLE", tokenResponse);

            // Redirect to frontend success page
            String redirectUrl = frontendUrl + "/calendar/oauth-success";
            return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", redirectUrl)
                .build();
        } catch (NumberFormatException e) {
            logger.error("Invalid user ID in state token", e);
            return ResponseEntity.badRequest()
                .body("<html><body><h2>Invalid state parameter</h2><p>Please close this window and try again.</p></body></html>");
        } catch (Exception e) {
            logger.error("Error handling Google OAuth callback", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("<html><body><h2>Connection Failed</h2><p>Error: " + e.getMessage() + "</p><p>Please close this window and try again.</p></body></html>");
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
            if (currentUser == null) {
                logger.error("User is null in disconnect endpoint");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "User not authenticated", null));
            }
            
            if (calendarProvider == null || calendarProvider.isBlank()) {
                logger.error("Calendar provider is null or empty");
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Calendar provider is required", null));
            }

            logger.info("Attempting to disconnect calendar for user {} from provider {}", 
                       currentUser.getId(), calendarProvider);

            calendarIntegrationService.disconnectCalendar(currentUser, calendarProvider);

            logger.info("Calendar disconnected for user {} from provider {}", 
                       currentUser.getId(), calendarProvider);

            return ResponseEntity.ok(new ApiResponse<>(true, 
                "Calendar disconnected successfully", null));
        } catch (Exception e) {
            logger.error("Error disconnecting calendar for user {} from provider {}: {}", 
                        currentUser != null ? currentUser.getId() : "null", 
                        calendarProvider, 
                        e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Error disconnecting: " + e.getMessage(), null));
        }
    }

    /**
     * Get user's calendar sync preferences
     * Auto-creates default preferences if they don't exist
     */
    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<CalendarSyncPreferenceDto>> getSyncPreferences(
            @AuthenticationPrincipal User currentUser) {
        try {
            Optional<CalendarSyncPreference> preferences = 
                calendarEventService.getUserSyncPreferences(currentUser.getId());

            CalendarSyncPreference pref;
            if (preferences.isPresent()) {
                pref = preferences.get();
            } else {
                // Auto-create default preferences for first-time users
                logger.info("Creating default sync preferences for user {}", currentUser.getId());
                pref = calendarIntegrationService.createDefaultSyncPreferencesIfNeeded(currentUser);
            }

            // Map to DTO for response
            CalendarSyncPreferenceDto dto = new CalendarSyncPreferenceDto();
            dto.setSyncEnabled(pref.getSyncEnabled());
            dto.setAutoCreateReminders(pref.getAutoCreateReminders());
            dto.setReminderSecondsBefore(pref.getReminderMinutesBefore());
            dto.setReminderType(pref.getReminderType());
            dto.setEventColor(pref.getEventColor());
            dto.setEventVisibility(pref.getEventVisibility());
            dto.setEventDuration(pref.getEventDuration());

            return ResponseEntity.ok(new ApiResponse<>(true, 
                "Sync preferences retrieved", dto));
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

            // Update fields from request
            if (request.getSyncEnabled() != null) pref.setSyncEnabled(request.getSyncEnabled());
            if (request.getAutoCreateReminders() != null) pref.setAutoCreateReminders(request.getAutoCreateReminders());
            if (request.getReminderSecondsBefore() != null) pref.setReminderMinutesBefore(request.getReminderSecondsBefore());
            if (request.getReminderType() != null) pref.setReminderType(request.getReminderType());
            if (request.getEventColor() != null) pref.setEventColor(request.getEventColor());
            if (request.getEventVisibility() != null) pref.setEventVisibility(request.getEventVisibility());
            if (request.getEventDuration() != null) pref.setEventDuration(request.getEventDuration());

            // Save to database
            CalendarSyncPreference savedPref = calendarSyncPreferenceRepository.save(pref);
            logger.info("Sync preferences saved for user {}", currentUser.getId());

            // Map back to DTO for response
            CalendarSyncPreferenceDto responseDto = new CalendarSyncPreferenceDto();
            responseDto.setSyncEnabled(savedPref.getSyncEnabled());
            responseDto.setAutoCreateReminders(savedPref.getAutoCreateReminders());
            responseDto.setReminderSecondsBefore(savedPref.getReminderMinutesBefore());
            responseDto.setReminderType(savedPref.getReminderType());
            responseDto.setEventColor(savedPref.getEventColor());
            responseDto.setEventVisibility(savedPref.getEventVisibility());
            responseDto.setEventDuration(savedPref.getEventDuration());

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
     * Trigger manual sync of all upcoming pickups and pending events
     * Creates calendar events for active claims that don't have them yet
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Object>> manualSync(
            @AuthenticationPrincipal User currentUser) {
        try {
            // First, create calendar events for any active claims that don't have them
            int eventsCreated = calendarSyncService.syncAllUpcomingPickups(currentUser);
            
            // Then sync all pending events (including newly created ones)
            calendarSyncService.syncUserPendingEvents(currentUser);

            String message = eventsCreated > 0 
                ? String.format("Sync triggered successfully. Created %d new calendar event(s) for upcoming pickups.", eventsCreated)
                : "Sync triggered successfully. All pickups already have calendar events.";

            logger.info("Manual sync triggered for user {} - created {} events", currentUser.getId(), eventsCreated);

            return ResponseEntity.ok(new ApiResponse<>(true, message, null));
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
            calendarSyncService.testCalendarConnection(currentUser, provider);

            return ResponseEntity.ok(new ApiResponse<>(true, 
                "Calendar connection test successful", null));
        } catch (Exception e) {
            logger.error("Calendar connection test failed for user {}: {}", 
                        currentUser.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /**
     * Generate a state token for OAuth flow (anti-CSRF)
     */
    private String generateStateToken(Long userId) {
        return java.util.UUID.randomUUID().toString() + "_" + userId;
    }
}
