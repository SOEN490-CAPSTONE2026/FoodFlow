package com.example.foodflow.service;

import com.example.foodflow.model.dto.SupportChatRequest;
import com.example.foodflow.model.dto.SupportChatResponse;
import com.example.foodflow.model.dto.SupportChatResponse.SupportAction;
import com.example.foodflow.model.dto.MessageRequest;
import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.Locale;

/**
 * Simplified support service using contextual AI responses.
 * Provides comprehensive app context to AI for natural language understanding
 * instead of rigid intent classification patterns.
 */
@Service
public class SupportService {
    private static final Logger logger = LoggerFactory.getLogger(SupportService.class);

    @Autowired
    private ContextualSupportService contextualSupportService;

    @Autowired
    private SupportContextBuilder contextBuilder;

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.support.email:foodflow.group@gmail.com}")
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
            String intent = "AI_RESPONSE";
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

            if (isDirectSupportRequest(request.getMessage())) {
                SupportEscalationResult escalation = escalateToHumanSupport(request, user, reply);
                if (escalation != null) {
                    actions.add(0, new SupportAction(
                            "link",
                            getOpenSupportChatLabel(userLanguage),
                            escalation.messagesRoute));
                    reply = reply + "\n\n" + getEscalationStartedMessage(userLanguage);
                    intent = "SUPPORT_ESCALATED";
                    shouldEscalate = true;
                }
            }

            return new SupportChatResponse(reply, intent, actions,
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

    private SupportEscalationResult escalateToHumanSupport(
            SupportChatRequest request,
            User requester,
            String assistantReply) {
        try {
            User supportAdmin = findSupportAdmin(requester);
            if (supportAdmin == null) {
                return null;
            }

            Conversation conversation = conversationService.createOrGetDirectConversation(requester, supportAdmin);
            String summaryMessage = buildSupportSummaryMessage(request, requester, assistantReply);
            messageService.sendMessage(new MessageRequest(conversation.getId(), summaryMessage), requester);

            return new SupportEscalationResult(
                    conversation.getId(),
                    buildMessagesRoute(requester.getRole(), conversation.getId()));
        } catch (Exception e) {
            logger.warn("Failed to escalate support chat for user {}: {}", requester.getId(), e.getMessage());
            return null;
        }
    }

    private User findSupportAdmin(User requester) {
        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        if (admins == null || admins.isEmpty()) {
            return null;
        }

        return admins.stream()
                .filter(admin -> admin.getId() != null && !admin.getId().equals(requester.getId()))
                .filter(admin -> admin.getAccountStatus() == AccountStatus.ACTIVE)
                .min(Comparator.comparing(User::getId))
                .orElseGet(() -> admins.stream()
                        .filter(admin -> admin.getId() != null && !admin.getId().equals(requester.getId()))
                        .min(Comparator.comparing(User::getId))
                        .orElse(null));
    }

    private String buildSupportSummaryMessage(SupportChatRequest request, User requester, String assistantReply) {
        String userName = requester.getOrganization() != null && requester.getOrganization().getName() != null
                ? requester.getOrganization().getName()
                : requester.getEmail();
        String route = request.getPageContext() != null ? request.getPageContext().getRoute() : null;
        String donationId = request.getPageContext() != null ? request.getPageContext().getDonationId() : null;
        String claimId = request.getPageContext() != null ? request.getPageContext().getClaimId() : null;

        String userStorySummary = summarizeUserStory(request);
        String latestUserMessage = safeText(request.getMessage());
        String assistantUnderstanding = safeText(assistantReply);
        String ticketTitle = buildSupportTicketTitle(latestUserMessage, userStorySummary);

        StringBuilder summary = new StringBuilder();
        summary.append("[Support Escalation Ticket]\n");
        summary.append("Title: ").append(ticketTitle).append("\n");
        summary.append("Requester: ").append(userName).append(" (").append(requester.getEmail()).append(")\n");
        summary.append("Role: ").append(requester.getRole()).append("\n");
        summary.append("Language: ").append(normalizeLanguage(requester.getLanguagePreference())).append("\n");
        summary.append("Needs human support: Yes\n");

        if (route != null && !route.isBlank()) {
            summary.append("Route: ").append(route).append("\n");
        }
        if (donationId != null && !donationId.isBlank()) {
            summary.append("Donation ID: ").append(donationId).append("\n");
        }
        if (claimId != null && !claimId.isBlank()) {
            summary.append("Claim ID: ").append(claimId).append("\n");
        }

        summary.append("\nContext Summary:\n").append(userStorySummary).append("\n");
        summary.append("\nWhat user asked (latest):\n").append(latestUserMessage).append("\n");
        summary.append("\nAssistant understanding so far:\n").append(assistantUnderstanding).append("\n");
        summary.append("\nExpected Support Action:\n");
        summary.append("- Continue with the user in this conversation.\n");
        summary.append("- Clarify issue details and provide direct resolution steps.\n");
        summary.append("- Escalate internally if account/data/status correction is required.");

        return summary.toString().trim();
    }

    private String buildSupportTicketTitle(String latestUserMessage, String userStorySummary) {
        String base = !latestUserMessage.isBlank() ? latestUserMessage : userStorySummary;
        if (base == null || base.isBlank()) {
            return "User requested direct support";
        }
        String cleaned = base.replaceAll("[\\r\\n]+", " ").trim();
        if (cleaned.length() > 90) {
            return cleaned.substring(0, 90) + "...";
        }
        return cleaned;
    }

    private String summarizeUserStory(SupportChatRequest request) {
        if (request == null || request.getChatHistory() == null || request.getChatHistory().isEmpty()) {
            return safeText(request != null ? request.getMessage() : "");
        }

        List<String> userMessages = request.getChatHistory().stream()
                .filter(msg -> msg != null && "user".equalsIgnoreCase(msg.getType()))
                .map(SupportChatRequest.ChatMessage::getContent)
                .filter(Objects::nonNull)
                .map(this::safeText)
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();

        if (userMessages.isEmpty()) {
            return safeText(request.getMessage());
        }

        // Keep the most recent user intent first, then supporting context.
        List<String> ordered = new ArrayList<>(userMessages);
        Collections.reverse(ordered);
        String combined = String.join(" | ", ordered);
        return safeText(combined);
    }

    private String safeText(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        if (normalized.length() > 400) {
            return normalized.substring(0, 400) + "...";
        }
        return normalized;
    }

    private String buildMessagesRoute(UserRole role, Long conversationId) {
        String baseRoute = switch (role) {
            case DONOR -> "/donor/messages";
            case RECEIVER -> "/receiver/messages";
            case ADMIN -> "/admin/messages";
        };
        return baseRoute + "?conversationId=" + conversationId;
    }

    private boolean isDirectSupportRequest(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        String lower = message.toLowerCase(Locale.ROOT);

        String[] directSupportPhrases = {
            "contact support directly",
            "talk to support",
            "talk to someone",
            "talk to a person",
            "speak to support",
            "speak to someone",
            "human agent",
            "real person",
            "open support chat",
            "contacter le support",
            "parler au support",
            "parler a quelqu",
            "je veux parler a quelqu",
            "hablar con soporte",
            "hablar con alguien",
            "falar com suporte",
            "falar com alguem",
            "التحدث مع الدعم",
            "اكلم الدعم",
            "اتكلم مع"
        };

        for (String phrase : directSupportPhrases) {
            if (lower.contains(phrase)) {
                return true;
            }
        }

        boolean mentionsSupport = lower.contains("support")
                || lower.contains("admin")
                || lower.contains("agent")
                || lower.contains("human")
                || lower.contains("person");
        boolean asksDirectContact = lower.contains("contact")
                || lower.contains("talk")
                || lower.contains("speak")
                || lower.contains("direct")
                || lower.contains("someone");
        return mentionsSupport && asksDirectContact;
    }

    private String getOpenSupportChatLabel(String language) {
        return switch (normalizeLanguage(language)) {
            case "fr" -> "Ouvrir le chat support";
            case "es" -> "Abrir chat de soporte";
            case "zh" -> "打开支持聊天";
            case "ar" -> "افتح محادثة الدعم";
            case "pt" -> "Abrir chat de suporte";
            default -> "Open Support Chat";
        };
    }

    private String getEscalationStartedMessage(String language) {
        return switch (normalizeLanguage(language)) {
            case "fr" -> "J'ai ouvert votre conversation avec le support et j'ai partage un resume de votre situation.";
            case "es" -> "Abrí tu conversación con soporte y compartí un resumen de tu situación.";
            case "zh" -> "我已为您打开支持对话，并分享了您情况的摘要。";
            case "ar" -> "لقد فتحت لك محادثة مع فريق الدعم وشاركت ملخصًا لحالتك.";
            case "pt" -> "Abri sua conversa com o suporte e compartilhei um resumo da sua situação.";
            default -> "I opened your support conversation and shared a summary of your situation.";
        };
    }


    /**
     * Build error fallback response
     */
    private SupportChatResponse buildErrorResponse(String language) {
        String errorMessage = switch (normalizeLanguage(language)) {
            case "fr" -> "Désolé, je rencontre des difficultés techniques. Veuillez contacter notre support.";
            case "es" -> "Lo siento, estoy teniendo dificultades tecnicas. Ponte en contacto con nuestro equipo de soporte.";
            case "zh" -> "Wo zheng zai yudao jishu wenti. Qing lianxi women de zhichi tuandui.";
            case "ar" -> "Asif, uwajih moshkilat taqniya. Yurja alttawasul mae fariq aldaem.";
            case "pt" -> "Desculpe, estou enfrentando dificuldades tecnicas. Entre em contato com nossa equipe de suporte.";
            default -> "Sorry, I'm experiencing technical difficulties. Please contact our support team.";
        };

        List<SupportAction> actions = Arrays.asList(
                new SupportAction("contact", "Contact Support", supportEmail));

        return new SupportChatResponse(errorMessage, "ERROR", actions, true);
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "en";
        }
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("-")) {
            normalized = normalized.substring(0, normalized.indexOf('-'));
        }
        return switch (normalized) {
            case "en", "fr", "es", "zh", "ar", "pt" -> normalized;
            default -> "en";
        };
    }

    private static class SupportEscalationResult {
        private final Long conversationId;
        private final String messagesRoute;

        private SupportEscalationResult(Long conversationId, String messagesRoute) {
            this.conversationId = conversationId;
            this.messagesRoute = messagesRoute;
        }
    }
}
