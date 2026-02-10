package com.example.foodflow.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.Resource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.InputStream;
import java.util.*;

/**
 * Simplified context-driven support service that provides comprehensive app
 * information
 * to AI for natural language responses instead of rigid intent classification
 */
@Service
public class ContextualSupportService {

    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    @Autowired
    private OpenAIService openAIService;

    private JsonNode appContext;

    public ContextualSupportService(ResourceLoader resourceLoader, ObjectMapper objectMapper) {
        this.resourceLoader = resourceLoader;
        this.objectMapper = objectMapper;
        loadAppContext();
    }

    /**
     * Load comprehensive app context from JSON file
     */
    private void loadAppContext() {
        try {
            Resource resource = resourceLoader.getResource("classpath:app_context.json");
            InputStream inputStream = resource.getInputStream();
            this.appContext = objectMapper.readTree(inputStream);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load app context", e);
        }
    }

    /**
     * Generate natural AI response using comprehensive context
     */
    public Map<String, Object> generateResponse(String userMessage, String userRole, String language,
            Map<String, Object> userContext) {

        // Build comprehensive context for AI
        String systemContext = buildSystemContext(userRole, language, userContext);

        // Create AI prompt with full context
        String prompt = buildAIPrompt(systemContext, userMessage, userRole);

        try {
            // Get natural AI response
            String aiResponse = openAIService.generateSupportResponse(
                    prompt, "", null, "en");

            // Parse response and add contextual actions
            Map<String, Object> response = new HashMap<>();
            response.put("reply", aiResponse);

            boolean escalationResponse = isEscalationResponse(aiResponse);
            if (escalationResponse) {
                List<Map<String, Object>> actions = new ArrayList<>();
                actions.add(createAction("contact", "Contact Support", "support@foodflow.com"));
                response.put("actions", actions);
            } else {
                response.put("actions", generateContextualActions(userMessage, userRole));
            }

            response.put("escalate", escalationResponse || shouldEscalate(userMessage, aiResponse));

            return response;

        } catch (Exception e) {
            // Fallback response
            return createFallbackResponse(userRole, language);
        }
    }

    /**
     * Build comprehensive system context including app info and user data
     */
    private String buildSystemContext(String userRole, String language, Map<String, Object> userContext) {
        StringBuilder context = new StringBuilder();

        // App overview
        context.append("# FoodFlow App Context\n\n");
        context.append("## App Overview\n");
        context.append(appContext.get("app_overview").toString()).append("\n\n");

        // User role-specific workflows
        context.append("## User Workflows\n");
        if ("DONOR".equals(userRole)) {
            context.append("### Donor Workflow (Current User)\n");
            context.append(appContext.get("user_workflows").get("donor_workflow").toString()).append("\n");
            context.append("### Receiver Workflow (For Reference)\n");
            context.append(appContext.get("user_workflows").get("receiver_workflow").toString()).append("\n\n");
        } else if ("RECEIVER".equals(userRole)) {
            context.append("### Receiver Workflow (Current User)\n");
            context.append(appContext.get("user_workflows").get("receiver_workflow").toString()).append("\n");
            context.append("### Donor Workflow (For Reference)\n");
            context.append(appContext.get("user_workflows").get("donor_workflow").toString()).append("\n\n");
        }

        // Key concepts
        context.append("## Key Concepts\n");
        context.append(appContext.get("key_concepts").toString()).append("\n\n");

        // Common questions
        context.append("## Common User Questions & Answers\n");
        context.append(appContext.get("common_user_questions").toString()).append("\n\n");

        // Troubleshooting
        context.append("## Troubleshooting Guide\n");
        context.append(appContext.get("troubleshooting").toString()).append("\n\n");

        // Policies
        context.append("## Platform Policies\n");
        context.append(appContext.get("policies_and_rules").toString()).append("\n\n");

        // User-specific context
        if (userContext != null && !userContext.isEmpty()) {
            context.append("## Current User Context\n");
            context.append("User Role: ").append(userRole).append("\n");
            context.append("Language Preference: ").append(language).append("\n");

            // Add detailed user context
            userContext.forEach((key, value) -> {
                if ("userPreferences".equals(key) && value instanceof Map) {
                    context.append("User Preferences:\n");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> prefs = (Map<String, Object>) value;
                    prefs.forEach((prefKey, prefValue) -> context.append("  - ").append(prefKey).append(": ")
                            .append(prefValue).append("\n"));
                } else {
                    context.append(key).append(": ").append(value).append("\n");
                }
            });

            // Add role-specific capabilities
            context.append("\nUser Capabilities based on role ").append(userRole).append(":\n");
            if ("DONOR".equals(userRole)) {
                context.append("- Can create and manage food donations\n");
                context.append("- Can verify pickup codes shown by receivers during pickup\n");
                context.append("- Cannot generate or view pickup codes\n");
                context.append("- Confirms pickup by entering the receiver's OTP in the app\n");
                context.append("- Can message receivers who claim their donations\n");
                context.append("- Can rate receivers after successful pickups\n");
            } else if ("RECEIVER".equals(userRole)) {
                context.append("- Can browse and claim available food donations\n");
                context.append("- Can message donors after claiming\n");
                context.append("- Sees pickup code in claim pickup steps during the active pickup window\n");
                context.append("- Can rate donors after successful pickups\n");
            } else if ("ADMIN".equals(userRole)) {
                context.append("- Can moderate all content and users\n");
                context.append("- Can handle user reports and disputes\n");
                context.append("- Has access to system administration features\n");
            }
        }

        return context.toString();
    }

    /**
     * Build AI prompt with instructions for natural support responses
     */
    private String buildAIPrompt(String systemContext, String userMessage, String userRole) {
        return String.format(
                """
                        You are the FoodFlow support assistant. You help users with questions about the food sharing platform.

                        CRITICAL INSTRUCTIONS:
                        1. Provide helpful, accurate answers based on the comprehensive app context below
                        2. Be conversational and friendly, like a knowledgeable product assistant
                        3. ALWAYS tailor responses to the user's specific role (%s) and their capabilities
                        4. Give specific, actionable guidance with exact steps when possible
                        5. Always respond entirely in the user's preferred language (no mixing) and prioritize the language he speaks to you with. If the user asks to change language, explain how to update language preferences.
                        6. Reference specific UI elements, pages, and features mentioned in the context
                        7. For workflows, break down steps clearly with numbered instructions
                        8. Keep responses concise but complete (2-5 sentences for simple questions, more for complex workflows)
                        9. If multiple solutions exist, mention the most common/easiest first
                        10. Always be aware of what the user CAN and CANNOT do based on their role
                        11. Pickup codes are only visible to receivers; donors never generate or view them (they only verify).
                        12. If explaining donor pickup steps, state that the receiver shows the OTP and the donor enters it in the app to confirm pickup.

                        SPECIAL HANDLING - CONTACT SUPPORT QUESTIONS:
                        When users ask about "contact support" or "reach support team":
                        - Provide direct contact information (email: support@foodflow.com)
                        - Mention support hours and response time
                        - Suggest what information to include when contacting
                        - Be direct and helpful, not generic
                        - Action buttons will be automatically provided for direct contact

                        ROLE-SPECIFIC GUIDANCE:
                        - For DONORS: Focus on donation creation, management, messaging receivers, and verifying pickup codes by entering the receiver's OTP
                        - For RECEIVERS: Focus on finding/claiming food, messaging donors, pickup process
                        - For ADMINS: Focus on moderation, user management, system features

                        ESCALATION RULES (be very conservative):
                        - Only suggest contacting support for: safety/security issues, technical bugs, account lockouts, user disputes
                        - Do NOT escalate for: how-to questions, feature explanations, workflow guidance, common troubleshooting

                        COMPREHENSIVE APP CONTEXT:
                        %s

                        USER QUESTION: "%s"

                        Based on the user's role (%s) and the context above, provide a helpful, specific response:
                        """,
                userRole, systemContext, userMessage, userRole);
    }

    /**
     * Generate contextual action buttons based on the question and user role
     */
    private List<Map<String, Object>> generateContextualActions(String userMessage, String userRole) {
        List<Map<String, Object>> actions = new ArrayList<>();

        String lowerMessage = userMessage.toLowerCase();

        // Contact support specific actions
        if (lowerMessage.contains("contact")
                && (lowerMessage.contains("support") || lowerMessage.contains("help team"))) {
            actions.add(createAction("contact", "Email Support", "support@foodflow.com"));

            // Add role-specific help center link
            if ("DONOR".equals(userRole)) {
                actions.add(createAction("link", "Help Center", "/donor/help"));
            } else if ("RECEIVER".equals(userRole)) {
                actions.add(createAction("link", "Help Center", "/receiver/help"));
            } else {
                actions.add(createAction("link", "Help Center", "/admin/help"));
            }

            return actions; // Return early for contact support requests
        }

        // Common actions based on message content
        if (lowerMessage.contains("donat") || lowerMessage.contains("create") || lowerMessage.contains("post")) {
            if ("DONOR".equals(userRole)) {
                actions.add(createAction("link", "Create Donation", "/donor/list"));
            }
        }

        if (lowerMessage.contains("claim") || lowerMessage.contains("get food") || lowerMessage.contains("receive")
                || lowerMessage.contains("browse")) {
            if ("RECEIVER".equals(userRole)) {
                actions.add(createAction("link", "Browse Food", "/receiver/browse"));
            }
        }

        if (lowerMessage.contains("messag") || lowerMessage.contains("text") || lowerMessage.contains("contact")
                || lowerMessage.contains("chat")) {
            if ("DONOR".equals(userRole)) {
                actions.add(createAction("link", "My Messages", "/donor/messages"));
            } else if ("RECEIVER".equals(userRole)) {
                actions.add(createAction("link", "My Messages", "/receiver/messages"));
            }
        }

        if (lowerMessage.contains("pickup") || lowerMessage.contains("code") || lowerMessage.contains("collect")) {
            if ("DONOR".equals(userRole)) {
                actions.add(createAction("link", "My Donations", "/donor/list"));
            } else if ("RECEIVER".equals(userRole)) {
                actions.add(createAction("link", "My Claims", "/receiver/my-claims"));
            }
        }

        if (lowerMessage.contains("setting") || lowerMessage.contains("language") || lowerMessage.contains("profile")) {
            if ("DONOR".equals(userRole)) {
                actions.add(createAction("link", "Settings", "/donor/settings"));
            } else if ("RECEIVER".equals(userRole)) {
                actions.add(createAction("link", "Settings", "/receiver/settings"));
            }
        }

        // Default helpful actions if no specific ones match
        if (actions.isEmpty()) {
            if ("DONOR".equals(userRole)) {
                actions.add(createAction("link", "Create Donation", "/donor/list"));
                actions.add(createAction("link", "My Messages", "/donor/messages"));
                actions.add(createAction("link", "Settings", "/donor/settings"));
            } else if ("RECEIVER".equals(userRole)) {
                actions.add(createAction("link", "Browse Food", "/receiver/browse"));
                actions.add(createAction("link", "My Claims", "/receiver/my-claims"));
                actions.add(createAction("link", "Settings", "/receiver/settings"));
            } else {
                actions.add(createAction("link", "Dashboard", "/admin"));
                actions.add(createAction("link", "Settings", "/admin/settings"));
            }
        }

        return actions;
    }

    /**
     * Helper to create action objects
     */
    private Map<String, Object> createAction(String type, String label, String value) {
        Map<String, Object> action = new HashMap<>();
        action.put("type", type);
        action.put("label", label);
        action.put("value", value);
        return action;
    }

    /**
     * Determine if the question requires human support escalation
     * (Conservative approach - keep conversation open unless critical)
     */
    private boolean shouldEscalate(String userMessage, String aiResponse) {
        String lowerMessage = userMessage.toLowerCase();
        String lowerResponse = aiResponse.toLowerCase();

        // Only escalate for critical safety/security issues
        if (lowerMessage.contains("abuse") || lowerMessage.contains("harassment") ||
                lowerMessage.contains("unsafe") || lowerMessage.contains("emergency")) {
            return true;
        }

        // Only escalate for severe technical issues
        if (lowerMessage.contains("can't login") || lowerMessage.contains("account locked") ||
                lowerMessage.contains("payment") || lowerMessage.contains("billing")) {
            return true;
        }

        // Only escalate if AI explicitly says it cannot help
        if (lowerResponse.contains("i cannot") || lowerResponse.contains("unable to assist") ||
                lowerResponse.contains("unable to answer") ||
                lowerResponse.contains("contact support immediately")) {
            return true;
        }

        // Default: Keep conversation open for further questions
        return false;
    }

    /**
     * Detect escalation-style responses to attach contact actions.
     */
    private boolean isEscalationResponse(String aiResponse) {
        if (aiResponse == null || aiResponse.isBlank()) {
            return false;
        }

        String lower = aiResponse.toLowerCase();
        // Only treat explicit "unable to answer" escalation messages as escalation responses.
        return lower.contains("unable to answer") ||
                lower.contains("unable to assist") ||
                lower.contains("i cannot") ||
                lower.contains("je ne peux pas répondre") ||
                lower.contains("je ne peux pas repondre");
    }

    /**
     * Fallback response when AI service fails
     */
    private Map<String, Object> createFallbackResponse(String userRole, String language) {
        Map<String, Object> response = new HashMap<>();
        response.put("reply",
                "I'm having trouble processing your request right now. Here are some helpful links, or you can contact our support team directly.");
        response.put("actions", generateContextualActions("general help", userRole));
        response.put("escalate", true);
        return response;
    }
}
