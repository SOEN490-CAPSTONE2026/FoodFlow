package com.example.foodflow.service.calendar;

import com.example.foodflow.model.entity.CalendarIntegration;
import com.example.foodflow.model.entity.CalendarSyncPreference;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.CalendarIntegrationRepository;
import com.example.foodflow.repository.CalendarConsentHistoryRepository;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.model.entity.CalendarConsentHistory;
import com.example.foodflow.service.calendar.provider.GoogleOAuthService;
import com.example.foodflow.service.calendar.provider.GoogleCalendarProvider;
import com.example.foodflow.service.calendar.provider.CalendarProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for managing calendar integrations (OAuth connections, disconnections)
 */
@Service
@Transactional
public class CalendarIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(CalendarIntegrationService.class);

    @Autowired
    private CalendarIntegrationRepository calendarIntegrationRepository;

    @Autowired
    private CalendarConsentHistoryRepository calendarConsentHistoryRepository;

    @Autowired
    private CalendarSyncPreferenceRepository calendarSyncPreferenceRepository;

    @Autowired
    private GoogleOAuthService googleOAuthService;

    @Autowired
    private GoogleCalendarProvider googleCalendarProvider;

    /**
     * Get or create a calendar integration for a user
     */
    public CalendarIntegration getOrCreateIntegration(User user, String calendarProvider) {
        return calendarIntegrationRepository.findByUserIdAndCalendarProvider(user.getId(), calendarProvider)
            .orElseGet(() -> {
                CalendarIntegration integration = new CalendarIntegration(user, calendarProvider);
                return calendarIntegrationRepository.save(integration);
            });
    }

    /**
     * Store OAuth tokens after successful authentication (overload for GoogleTokenResponse)
     */
    public CalendarIntegration storeOAuthTokens(User user, String calendarProvider, 
                                                GoogleOAuthService.GoogleTokenResponse tokenResponse) {
        CalendarIntegration integration = storeOAuthTokens(user, calendarProvider, 
            tokenResponse.getRefreshToken(), tokenResponse.getAccessTokenExpiry());
        
        // Store granted scopes
        if (tokenResponse.getScope() != null) {
            integration.setGrantedScopes(tokenResponse.getScope());
        }
        
        // Fetch and store calendar metadata for Google Calendar
        if ("GOOGLE".equalsIgnoreCase(calendarProvider)) {
            try {
                logger.info("Fetching calendar metadata for user {}", user.getId());
                var settings = googleCalendarProvider.fetchCalendarSettings(tokenResponse.getRefreshToken());
                
                integration.setGoogleAccountEmail(settings.getId());
                integration.setPrimaryCalendarName(settings.getCalendarName()); // Use helper method
                integration.setCalendarTimeZone(settings.getTimeZone());
                
                logger.info("Calendar metadata stored: email={}, name={}, timezone={}", 
                           settings.getId(), settings.getSummary(), settings.getTimeZone());
            } catch (Exception e) {
                logger.error("Failed to fetch calendar metadata for user {}: {}", 
                           user.getId(), e.getMessage(), e);
                // Don't fail the entire connection if metadata fetch fails
            }
        }
        
        return calendarIntegrationRepository.save(integration);
    }

    /**
     * Store OAuth tokens after successful authentication
     */
    public CalendarIntegration storeOAuthTokens(User user, String calendarProvider, 
                                                 String refreshToken, LocalDateTime accessTokenExpiry) {
        CalendarIntegration integration = getOrCreateIntegration(user, calendarProvider);
        
        // Store the refresh token in plain text (for local development)
        // In production, consider database-level encryption or column encryption
        integration.setRefreshToken(refreshToken);
        integration.setAccessTokenExpiry(accessTokenExpiry);
        integration.setIsConnected(true);
        
        CalendarIntegration saved = calendarIntegrationRepository.save(integration);
        
        // Log consent action for audit trail
        logConsentAction(user, calendarProvider, "GRANTED");
        
        // Create default sync preferences if they don't exist
        createDefaultSyncPreferencesIfNeeded(user);
        
        logger.info("OAuth tokens stored for user {} with provider {}", user.getId(), calendarProvider);
        return saved;
    }

    /**
     * Disconnect a calendar provider
     * This method ensures proper revocation with Google before clearing local tokens
     */
    public void disconnectCalendar(User user, String calendarProvider) {
        try {
            logger.info("Disconnecting calendar for user {} from provider {}", user.getId(), calendarProvider);
            
            Optional<CalendarIntegration> integration = calendarIntegrationRepository
                .findByUserIdAndCalendarProvider(user.getId(), calendarProvider);
            
            if (integration.isPresent()) {
                logger.info("Found calendar integration to disconnect: {}", integration.get().getId());
                CalendarIntegration cal = integration.get();
                
                // Step 1: Revoke the token with Google first
                String refreshToken = cal.getRefreshToken();
                if (refreshToken != null && !refreshToken.isBlank()) {
                    try {
                        logger.info("Revoking refresh token with Google for user {}", user.getId());
                        googleOAuthService.revokeRefreshToken(refreshToken);
                        logger.info("Successfully revoked refresh token with Google");
                    } catch (Exception revokeException) {
                        // Log the error but continue with local cleanup
                        // The token might already be revoked or invalid
                        logger.warn("Failed to revoke token with Google (may already be revoked): {}", 
                                   revokeException.getMessage());
                    }
                } else {
                    logger.warn("No refresh token found for user {}, skipping Google revocation", user.getId());
                }
                
                // Step 2: Clear tokens and mark as disconnected in our database
                cal.setIsConnected(false);
                cal.setRefreshToken(null);
                cal.setAccessTokenExpiry(null);
                calendarIntegrationRepository.save(cal);
                logger.info("Calendar integration updated in database - tokens cleared");
                
                // Step 3: Log revocation for audit trail
                logger.info("Logging consent action REVOKED for user {}", user.getId());
                logConsentAction(user, calendarProvider, "REVOKED");
                
                logger.info("Calendar disconnected successfully for user {} with provider {}", 
                           user.getId(), calendarProvider);
            } else {
                logger.warn("No calendar integration found for user {} with provider {}", user.getId(), calendarProvider);
            }
        } catch (Exception e) {
            logger.error("Error in disconnectCalendar for user {} provider {}: {}", 
                        user.getId(), calendarProvider, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Check if a user has an active calendar connection
     */
    public boolean isCalendarConnected(User user, String calendarProvider) {
        return calendarIntegrationRepository.findByUserIdAndCalendarProvider(user.getId(), calendarProvider)
            .map(CalendarIntegration::getIsConnected)
            .orElse(false);
    }

    /**
     * Verify and update calendar connection status
     * This checks if the user still has valid permissions with Google
     * If permissions have been revoked, it cleans up the local database
     */
    public void verifyAndUpdateConnectionStatus(User user) {
        try {
            logger.info("Verifying calendar connection status for user {}", user.getId());
            
            Optional<CalendarIntegration> integrationOpt = getUserIntegration(user);
            
            if (!integrationOpt.isPresent()) {
                logger.info("No calendar integration found for user {}", user.getId());
                return;
            }
            
            CalendarIntegration integration = integrationOpt.get();
            
            // Only verify if marked as connected and has a refresh token
            if (!integration.getIsConnected() || integration.getRefreshToken() == null) {
                logger.info("Calendar not connected or no refresh token for user {}", user.getId());
                return;
            }
            
            String refreshToken = integration.getRefreshToken();
            
            try {
                // Verify access by calling Google's calendar API
                boolean isValid = googleCalendarProvider.verifyCalendarAccess(refreshToken);
                
                if (!isValid) {
                    logger.warn("Calendar access verification returned false for user {}", user.getId());
                    updateLastFailedRefresh(user);
                    cleanupInvalidIntegration(integration, user);
                }
            } catch (CalendarProvider.CalendarProviderException e) {
                // Check if it's an invalid_grant error (user revoked permissions)
                if (e.getMessage() != null && e.getMessage().contains("invalid_grant")) {
                    logger.warn("Calendar permissions revoked by user {} (invalid_grant)", user.getId());
                    updateLastFailedRefresh(user);
                    cleanupInvalidIntegration(integration, user);
                } else {
                    // Log other errors but don't clean up (might be temporary)
                    logger.error("Error verifying calendar access for user {}: {}", 
                               user.getId(), e.getMessage());
                    // Still update last failed refresh for any token-related errors
                    if (e.getMessage() != null && (e.getMessage().contains("token") || e.getMessage().contains("refresh"))) {
                        updateLastFailedRefresh(user);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Unexpected error verifying calendar connection for user {}: {}", 
                       user.getId(), e.getMessage(), e);
        }
    }

    /**
     * Clean up integration when permissions are invalid/revoked
     * Does NOT call Google revoke endpoint (already revoked by user)
     */
    private void cleanupInvalidIntegration(CalendarIntegration integration, User user) {
        logger.info("Cleaning up invalid calendar integration for user {}", user.getId());
        
        // Mark as disconnected and clear tokens
        integration.setIsConnected(false);
        integration.setRefreshToken(null);
        integration.setAccessTokenExpiry(null);
        calendarIntegrationRepository.save(integration);
        
        // Log the automatic revocation
        logConsentAction(user, integration.getCalendarProvider(), "AUTO_REVOKED");
        
        logger.info("Invalid calendar integration cleaned up for user {}", user.getId());
    }

    /**
     * Get user's calendar integration
     */
    public Optional<CalendarIntegration> getUserIntegration(User user) {
        return calendarIntegrationRepository.findByUser(user);
    }

    /**
     * Get refresh token (plain text for local development)
     */
    public String getDecryptedRefreshToken(CalendarIntegration integration) {
        if (integration.getRefreshToken() == null) {
            throw new RuntimeException("No refresh token available for calendar integration");
        }
        // Return the token as-is (no decryption needed)
        return integration.getRefreshToken();
    }

    /**
     * Update access token expiry time (called when refreshing tokens)
     */
    public void updateAccessTokenExpiry(CalendarIntegration integration, LocalDateTime newExpiry) {
        integration.setAccessTokenExpiry(newExpiry);
        calendarIntegrationRepository.save(integration);
    }

    /**
     * Update last successful sync timestamp
     * Called after successfully syncing an event to external calendar
     */
    public void updateLastSuccessfulSync(User user) {
        Optional<CalendarIntegration> integrationOpt = getUserIntegration(user);
        if (integrationOpt.isPresent()) {
            CalendarIntegration integration = integrationOpt.get();
            integration.setLastSuccessfulSync(LocalDateTime.now());
            calendarIntegrationRepository.save(integration);
            logger.debug("Updated lastSuccessfulSync for user {}", user.getId());
        }
    }

    /**
     * Update last failed refresh timestamp
     * Called when token refresh fails (e.g., invalid_grant error)
     */
    public void updateLastFailedRefresh(User user) {
        Optional<CalendarIntegration> integrationOpt = getUserIntegration(user);
        if (integrationOpt.isPresent()) {
            CalendarIntegration integration = integrationOpt.get();
            integration.setLastFailedRefresh(LocalDateTime.now());
            calendarIntegrationRepository.save(integration);
            logger.debug("Updated lastFailedRefresh for user {}", user.getId());
        }
    }

    /**
     * Log consent action for GDPR compliance
     */
    private void logConsentAction(User user, String calendarProvider, String action) {
        try {
            logger.debug("Creating consent history: user={}, provider={}, action={}", 
                        user.getId(), calendarProvider, action);
            CalendarConsentHistory history = new CalendarConsentHistory(user, action);
            history.setCalendarProvider(calendarProvider);
            logger.debug("Saving consent history to database");
            calendarConsentHistoryRepository.save(history);
            logger.info("Consent action {} logged for user {} with provider {}", action, user.getId(), calendarProvider);
        } catch (Exception e) {
            logger.error("Failed to log consent action for user {}: {}", user.getId(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get user's consent history
     */
    public java.util.List<CalendarConsentHistory> getConsentHistory(User user) {
        return calendarConsentHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    /**
     * Create default sync preferences for a user if they don't exist
     * This ensures users have sensible defaults when first connecting their calendar
     */
    public CalendarSyncPreference createDefaultSyncPreferencesIfNeeded(User user) {
        Optional<CalendarSyncPreference> existing = calendarSyncPreferenceRepository.findByUserId(user.getId());
        
        if (existing.isPresent()) {
            logger.debug("Sync preferences already exist for user {}", user.getId());
            return existing.get();
        }
        
        // Create new preferences with default values
        // Defaults are set in the entity: all sync options enabled, 30-minute reminders
        CalendarSyncPreference preferences = new CalendarSyncPreference(user);
        CalendarSyncPreference saved = calendarSyncPreferenceRepository.save(preferences);
        
        logger.info("Default sync preferences created for user {}", user.getId());
        return saved;
    }
}
