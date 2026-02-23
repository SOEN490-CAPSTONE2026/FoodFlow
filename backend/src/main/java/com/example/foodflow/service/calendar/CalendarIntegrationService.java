package com.example.foodflow.service.calendar;

import com.example.foodflow.model.entity.CalendarIntegration;
import com.example.foodflow.model.entity.CalendarSyncPreference;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.CalendarIntegrationRepository;
import com.example.foodflow.repository.CalendarConsentHistoryRepository;
import com.example.foodflow.repository.CalendarSyncPreferenceRepository;
import com.example.foodflow.model.entity.CalendarConsentHistory;
import com.example.foodflow.service.calendar.provider.GoogleOAuthService;
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
        return storeOAuthTokens(user, calendarProvider, tokenResponse.getRefreshToken(), 
                               tokenResponse.getAccessTokenExpiry());
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
     */
    public void disconnectCalendar(User user, String calendarProvider) {
        try {
            logger.info("Disconnecting calendar for user {} from provider {}", user.getId(), calendarProvider);
            
            Optional<CalendarIntegration> integration = calendarIntegrationRepository
                .findByUserIdAndCalendarProvider(user.getId(), calendarProvider);
            
            if (integration.isPresent()) {
                logger.info("Found calendar integration to disconnect: {}", integration.get().getId());
                CalendarIntegration cal = integration.get();
                cal.setIsConnected(false);
                cal.setRefreshToken(null);
                cal.setAccessTokenExpiry(null);
                calendarIntegrationRepository.save(cal);
                logger.info("Calendar integration updated in database");
                
                // Log revocation for audit trail
                logger.info("Logging consent action REVOKED for user {}", user.getId());
                logConsentAction(user, calendarProvider, "REVOKED");
                
                logger.info("Calendar disconnected for user {} with provider {}", user.getId(), calendarProvider);
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
