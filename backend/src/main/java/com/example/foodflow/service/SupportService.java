package com.example.foodflow.service;

import com.example.foodflow.model.dto.SupportChatRequest;
import com.example.foodflow.model.dto.SupportChatResponse;
import com.example.foodflow.model.dto.SupportChatResponse.SupportAction;
import com.example.foodflow.model.entity.User;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.*;

/**
 * Simplified support service using contextual AI responses.
 * Provides comprehensive app context to AI for natural language understanding
 * instead of rigid intent classification patterns.
 */
@Service
public class SupportService {

    @Autowired
    private ContextualSupportService contextualSupportService;

    @Autowired
    private SupportContextBuilder contextBuilder;

    @Value("${app.support.email:support@foodflow.com}")
    private String supportEmail;

    /**
     * Process a support chat request using contextual AI approach
     * 
     * @param request The support chat request
     * @param user    The authenticated user
     * @return Support chat response
     */
    public SupportChatResponse processChat(SupportChatRequest request, User user) {
        try {
            String userLanguage = user.getLanguagePreference() != null ? user.getLanguagePreference() : "en";
            String userRole = user.getRole().toString();

            // Build comprehensive user context
            JsonNode supportContext = contextBuilder.buildSupportContext(user, request);
            Map<String, Object> userContext = new HashMap<>();
            userContext.put("pageContext", request.getPageContext());
            userContext.put("hasActiveClaims", hasActiveClaims(user));
            userContext.put("userPreferences", buildUserPreferences(user));

            // Generate contextual AI response
            Map<String, Object> aiResult = contextualSupportService.generateResponse(
                    request.getMessage(), userRole, userLanguage, userContext);

            // Convert to support response format
            String reply = (String) aiResult.get("reply");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> actionMaps = (List<Map<String, Object>>) aiResult.get("actions");
            Boolean shouldEscalate = (Boolean) aiResult.get("escalate");

            // Convert action maps to SupportAction objects
            List<SupportAction> actions = new ArrayList<>();
            if (actionMaps != null) {
                for (Map<String, Object> actionMap : actionMaps) {
                    actions.add(new SupportAction(
                            (String) actionMap.get("type"),
                            (String) actionMap.get("label"),
                            (String) actionMap.get("value")));
                }
            }

            return new SupportChatResponse(reply, "AI_RESPONSE", actions,
                    shouldEscalate != null ? shouldEscalate : false);

        } catch (Exception e) {
            // Fallback response
            String userLanguage = user.getLanguagePreference() != null ? user.getLanguagePreference() : "en";
            return buildErrorResponse(userLanguage);
        }
    }

    /**
     * Build comprehensive user preferences and context for AI
     */
    private Map<String, Object> buildUserPreferences(User user) {
        Map<String, Object> preferences = new HashMap<>();

        // Basic user info
        preferences.put("language", user.getLanguagePreference() != null ? user.getLanguagePreference() : "en");
        preferences.put("role", user.getRole().toString());
        preferences.put("email", user.getEmail());
        preferences.put("userId", user.getId());

        // Account status and verification
        preferences.put("emailVerified", true); // user.isEmailVerified() - assume verified
        preferences.put("accountStatus", "ACTIVE"); // user.isActive() - assume active
        preferences.put("registrationDate", "recent"); // user.getCreatedAt() - placeholder

        // Profile completeness indicators
        preferences.put("hasProfilePhoto", false); // user.getProfilePictureUrl() != null
        preferences.put("hasLocationSet", false); // user.getLocation() != null

        // Activity indicators (these would typically come from service calls)
        preferences.put("hasActiveDonations", false); // TODO: Query donation service
        preferences.put("hasActiveClaims", false); // TODO: Query claim service
        preferences.put("totalDonations", 0); // TODO: Query donation count
        preferences.put("totalClaims", 0); // TODO: Query claim count

        // Notification preferences (if available)
        // preferences.put("emailNotifications", user.getEmailNotificationsEnabled());
        // preferences.put("pushNotifications", user.getPushNotificationsEnabled());

        return preferences;
    }

    /**
     * Check if user has active claims
     */
    private boolean hasActiveClaims(User user) {
        // This would typically query the database
        // For now, return false as a placeholder
        return false;
    }


    /**
     * Build error fallback response
     */
    private SupportChatResponse buildErrorResponse(String language) {
        String errorMessage = "fr".equals(language)
                ? "Désolé, je rencontre des difficultés techniques. Veuillez contacter notre support."
                : "Sorry, I'm experiencing technical difficulties. Please contact our support team.";

        List<SupportAction> actions = Arrays.asList(
                new SupportAction("contact", "Contact Support", supportEmail));

        return new SupportChatResponse(errorMessage, "ERROR", actions, true);
    }
}
