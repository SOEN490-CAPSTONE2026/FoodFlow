package com.example.foodflow.controller;

import com.example.foodflow.model.dto.SupportChatRequest;
import com.example.foodflow.model.dto.SupportChatResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.SupportService;
import com.example.foodflow.service.RateLimitingService;
import com.example.foodflow.exception.RateLimitExceededException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Locale;

/**
 * Controller for the support chat functionality.
 * Provides the single endpoint for in-app support assistance with rate limiting
 * protection.
 */
@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "http://localhost:3000")
public class SupportController {

    private static final Logger logger = LoggerFactory.getLogger(SupportController.class);

    @Autowired
    private SupportService supportService;

    @Autowired
    private RateLimitingService rateLimitingService;

    /**
     * Handle support chat requests with rate limiting
     * 
     * @param request     The chat request containing user message and page context
     * @param user        The authenticated user
     * @param httpRequest The HTTP request for IP extraction
     * @return Support response with reply, intent, actions, and escalation flag
     */
    @PostMapping("/chat")
    public ResponseEntity<SupportChatResponse> chat(
            @Valid @RequestBody SupportChatRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest) {

        try {
            // Extract client IP for rate limiting
            String clientIp = rateLimitingService.getClientIpAddress(httpRequest);

            // Check rate limits before processing
            if (!rateLimitingService.allowSupportRequest(user.getId(), clientIp)) {
                String errorMessage = getLocalizedMessage(user.getLanguagePreference(),
                        "Too many requests. Please wait before trying again.");

                SupportChatResponse rateLimitResponse = new SupportChatResponse(
                        errorMessage,
                        "RATE_LIMITED",
                        java.util.Arrays.asList(
                                new SupportChatResponse.SupportAction("contact", "Contact Support",
                                        "foodflow.group@gmail.com")),
                        false);

                // Add rate limit headers
                HttpHeaders headers = new HttpHeaders();
                headers.add("X-RateLimit-Limit", "10"); // User limit per minute
                headers.add("X-RateLimit-Remaining",
                        String.valueOf(rateLimitingService.getRemainingUserQuota(user.getId())));
                headers.add("Retry-After", "60"); // Seconds to wait

                logger.warn("Rate limit exceeded for user {} from IP {}", user.getId(), clientIp);
                return new ResponseEntity<>(rateLimitResponse, headers, HttpStatus.TOO_MANY_REQUESTS);
            }

            // Process the chat request
            SupportChatResponse response = supportService.processChat(request, user);

            // Add rate limit info to successful responses
            HttpHeaders headers = new HttpHeaders();
            headers.add("X-RateLimit-Limit", "10");
            headers.add("X-RateLimit-Remaining",
                    String.valueOf(rateLimitingService.getRemainingUserQuota(user.getId())));

            return new ResponseEntity<>(response, headers, HttpStatus.OK);

        } catch (RateLimitExceededException e) {
            // Handle specific rate limit exceptions
            String errorMessage = getLocalizedRateLimitExceeded(user.getLanguagePreference());

            SupportChatResponse rateLimitResponse = new SupportChatResponse(
                    errorMessage,
                    "RATE_LIMITED",
                    java.util.Arrays.asList(
                            new SupportChatResponse.SupportAction("contact", "Contact Support",
                                    "foodflow.group@gmail.com")),
                    false);

            HttpHeaders headers = new HttpHeaders();
            headers.add("Retry-After", String.valueOf(e.getRetryAfterSeconds()));

            return new ResponseEntity<>(rateLimitResponse, headers, HttpStatus.TOO_MANY_REQUESTS);

        } catch (Exception e) {
            // Return safe error response without exposing internal details
            String errorMessage = getLocalizedGenericError(user.getLanguagePreference());

            SupportChatResponse errorResponse = new SupportChatResponse(
                    errorMessage,
                    "ERROR",
                    java.util.Arrays.asList(
                            new SupportChatResponse.SupportAction("contact", "Contact Support",
                                    "foodflow.group@gmail.com")),
                    true);

            logger.error("Error processing support chat for user {}", user.getId(), e);
            return ResponseEntity.ok(errorResponse);
        }
    }

    /**
     * Get rate limiting stats for monitoring (admin only)
     */
    @GetMapping("/rate-limit-stats")
    public ResponseEntity<RateLimitingService.RateLimitStats> getRateLimitStats(
            @AuthenticationPrincipal User user) {

        // Only allow admins to view rate limit stats
        if (!"ADMIN".equals(user.getRole().toString())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        RateLimitingService.RateLimitStats stats = rateLimitingService.getStats();
        return ResponseEntity.ok(stats);
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

    private String getLocalizedMessage(String language, String englishDefault) {
        return switch (normalizeLanguage(language)) {
            case "fr" -> "Trop de demandes. Veuillez attendre avant de réessayer.";
            case "es" -> "Demasiadas solicitudes. Espera antes de volver a intentarlo.";
            case "zh" -> "Qingqiu guoduo. Qing shao hou zai shi.";
            case "ar" -> "Tama talabat kathira. Yurja alintizar qabl almuhawala maratan ukhra.";
            case "pt" -> "Muitas solicitacoes. Aguarde antes de tentar novamente.";
            default -> englishDefault;
        };
    }

    private String getLocalizedRateLimitExceeded(String language) {
        return switch (normalizeLanguage(language)) {
            case "fr" -> "Limite de requêtes dépassée. Veuillez réessayer plus tard.";
            case "es" -> "Limite de solicitudes superado. Intentalo de nuevo mas tarde.";
            case "zh" -> "Yichao chuxian qingqiu xianzhi. Qing shaohou zai shi.";
            case "ar" -> "Tatam tajawuz hadd altalabat. Yurja almuhawala lahiqan.";
            case "pt" -> "Limite de solicitacoes excedido. Tente novamente mais tarde.";
            default -> "Rate limit exceeded. Please try again later.";
        };
    }

    private String getLocalizedGenericError(String language) {
        return switch (normalizeLanguage(language)) {
            case "fr" -> "Une erreur est survenue. Veuillez contacter le support.";
            case "es" -> "Ocurrio un error. Ponte en contacto con soporte.";
            case "zh" -> "Fasheng cuowu. Qing lianxi zhichi.";
            case "ar" -> "Hadas khata. Yurja altawasul mae aldaem.";
            case "pt" -> "Ocorreu um erro. Entre em contato com o suporte.";
            default -> "An error occurred. Please contact support.";
        };
    }
}
