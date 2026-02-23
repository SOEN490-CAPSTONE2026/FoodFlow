package com.example.foodflow.service.calendar;

import com.example.foodflow.model.entity.CalendarIntegration;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.CalendarIntegrationRepository;
import com.example.foodflow.repository.CalendarConsentHistoryRepository;
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
    private EncryptionUtility encryptionUtility;

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
        
        // Encrypt the refresh token before storing
        String encryptedToken = encryptionUtility.encrypt(refreshToken);
        integration.setRefreshToken(encryptedToken);
        integration.setAccessTokenExpiry(accessTokenExpiry);
        integration.setIsConnected(true);
        
        CalendarIntegration saved = calendarIntegrationRepository.save(integration);
        
        // Log consent action for audit trail
        logConsentAction(user, calendarProvider, "GRANTED");
        
        logger.info("OAuth tokens stored for user {} with provider {}", user.getId(), calendarProvider);
        return saved;
    }

    /**
     * Disconnect a calendar provider
     */
    public void disconnectCalendar(User user, String calendarProvider) {
        Optional<CalendarIntegration> integration = calendarIntegrationRepository
            .findByUserIdAndCalendarProvider(user.getId(), calendarProvider);
        
        if (integration.isPresent()) {
            CalendarIntegration cal = integration.get();
            cal.setIsConnected(false);
            cal.setRefreshToken(null);
            cal.setAccessTokenExpiry(null);
            calendarIntegrationRepository.save(cal);
            
            // Log revocation for audit trail
            logConsentAction(user, calendarProvider, "REVOKED");
            
            logger.info("Calendar disconnected for user {} with provider {}", user.getId(), calendarProvider);
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
     * Get decrypted refresh token
     */
    public String getDecryptedRefreshToken(CalendarIntegration integration) {
        if (integration.getRefreshToken() == null) {
            throw new RuntimeException("No refresh token available for calendar integration");
        }
        return encryptionUtility.decrypt(integration.getRefreshToken());
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
        CalendarConsentHistory history = new CalendarConsentHistory(user, action);
        history.setCalendarProvider(calendarProvider);
        calendarConsentHistoryRepository.save(history);
        logger.info("Consent action {} logged for user {} with provider {}", action, user.getId(), calendarProvider);
    }

    /**
     * Get user's consent history
     */
    public java.util.List<CalendarConsentHistory> getConsentHistory(User user) {
        return calendarConsentHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }
}
