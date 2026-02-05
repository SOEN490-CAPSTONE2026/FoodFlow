package com.example.foodflow.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import okhttp3.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Service for making OpenAI API calls with enhanced security and monitoring.
 * Handles communication with OpenAI's Chat Completions API using gpt-4o-mini
 * model.
 * Includes input validation and usage logging for cost control.
 */
@Service
public class OpenAIService {

    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);

    @Value("${app.openai.api-key}")
    private String openAIApiKey;

    @Value("${app.openai.model:gpt-4o-mini}")
    private String model;

    @Value("${app.openai.max-tokens:500}")
    private int maxTokens;

    @Value("${app.openai.temperature:0.3}")
    private double temperature;

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    // Security limits
    private static final int MAX_MESSAGE_LENGTH = 2000; // Limit user input length
    private static final int MAX_CONTEXT_LENGTH = 5000; // Limit context size

    public OpenAIService() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Generate a support response using OpenAI with input validation and monitoring
     * 
     * @param userMessage     The user's message
     * @param helpPackContent The relevant help pack content for the intent  
     * @param supportContext  The user's context information
     * @param userLanguage    User's preferred language
     * @return OpenAI response or error message
     */
    public String generateSupportResponse(String userMessage, String helpPackContent,
            JsonNode supportContext, String userLanguage) {
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Input validation to prevent abuse
            if (!validateInput(userMessage, helpPackContent, supportContext)) {
                logger.warn("OpenAI request blocked due to invalid input");
                return userLanguage.equals("fr") 
                    ? "Message invalide. Veuillez reformuler votre question."
                    : "Invalid message. Please rephrase your question.";
            }
            
            // Log the request for monitoring
            logger.info("OpenAI API request initiated for user language: {}", userLanguage);
            
            // Build the messages array for OpenAI
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("temperature", temperature);

            // Create messages array
            var messagesArray = objectMapper.createArrayNode();

            // System message with FoodFlow assistant rules
            var systemMessage = objectMapper.createObjectNode();
            systemMessage.put("role", "system");
            systemMessage.put("content", buildSystemPrompt(userLanguage));
            messagesArray.add(systemMessage);

            // Developer message with formatting rules
            var developerMessage = objectMapper.createObjectNode();
            developerMessage.put("role", "system");
            developerMessage.put("content", buildFormattingRules());
            messagesArray.add(developerMessage);

            // Context message (truncated if too long)
            if (supportContext != null) {
                var contextMessage = objectMapper.createObjectNode();
                String contextStr = supportContext.toString();
                if (contextStr.length() > MAX_CONTEXT_LENGTH) {
                    contextStr = contextStr.substring(0, MAX_CONTEXT_LENGTH) + "...";
                }
                contextMessage.put("role", "system");
                contextMessage.put("content", "User context: " + contextStr);
                messagesArray.add(contextMessage);
            }

            // Help pack content message (truncated if too long)
            if (helpPackContent != null && !helpPackContent.trim().isEmpty()) {
                var helpMessage = objectMapper.createObjectNode();
                String content = helpPackContent.length() > MAX_CONTEXT_LENGTH 
                    ? helpPackContent.substring(0, MAX_CONTEXT_LENGTH) + "..."
                    : helpPackContent;
                helpMessage.put("role", "system");
                helpMessage.put("content", "Help pack information: " + content);
                messagesArray.add(helpMessage);
            }
                helpMessage.put("role", "system");
                helpMessage.put("content", "Help pack information: " + helpPackContent);
                messagesArray.add(helpMessage);
            }

            // User message
            var userMsg = objectMapper.createObjectNode();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);
            messagesArray.add(userMsg);

            requestBody.set("messages", messagesArray);

            // Create request
            // User message (sanitized)
            var userMsg = objectMapper.createObjectNode();
            userMsg.put("role", "user");
            userMsg.put("content", sanitizeInput(userMessage));
            messagesArray.add(userMsg);

            requestBody.set("messages", messagesArray);

            // Build request
            RequestBody body = RequestBody.create(
                    requestBody.toString(),
                    MediaType.get("application/json"));

            Request request = new Request.Builder()
                    .url(OPENAI_API_URL)
                    .addHeader("Authorization", "Bearer " + openAIApiKey)
                    .addHeader("Content-Type", "application/json")
                    .post(body)
                    .build();

            // Execute request
            try (Response response = httpClient.newCall(request).execute()) {
                long duration = System.currentTimeMillis() - startTime;
                
                if (!response.isSuccessful()) {
                    logger.warn("OpenAI API request failed with status: {} in {}ms", 
                        response.code(), duration);
                    return getEscalationMessage(userLanguage);
                }

                String responseBody = response.body().string();
                JsonNode responseJson = objectMapper.readTree(responseBody);

                // Extract the assistant's response
                JsonNode choices = responseJson.get("choices");
                if (choices != null && choices.size() > 0) {
                    JsonNode firstChoice = choices.get(0);
                    JsonNode message = firstChoice.get("message");
                    if (message != null && message.has("content")) {
                        String result = message.get("content").asText();
                        logger.info("OpenAI API request completed successfully in {}ms", duration);
                        return result;
                    }
                }

                logger.warn("OpenAI API returned unexpected response format");
                return getEscalationMessage(userLanguage);
            }

        }catch(

    Exception e)
    {
        long duration = System.currentTimeMillis() - startTime;
        logger.error("OpenAI API request failed after {}ms", duration, e);
        return getEscalationMessage(userLanguage);
    }
    }

    /**
     * Validate input to prevent abuse and oversized requests
     */
    private boolean validateInput(String userMessage, String helpPackContent, JsonNode supportContext) {
        // Check user message
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return false;
        }

        if (userMessage.length() > MAX_MESSAGE_LENGTH) {
            logger.warn("User message exceeds maximum length: {} characters", userMessage.length());
            return false;
        }

        // Check for suspicious patterns
        if (containsSuspiciousPatterns(userMessage)) {
            return false;
        }

        // Check help pack content size
        if (helpPackContent != null && helpPackContent.length() > MAX_CONTEXT_LENGTH * 2) {
            logger.warn("Help pack content exceeds maximum length");
            return false;
        }

        // Check support context size
        if (supportContext != null && supportContext.toString().length() > MAX_CONTEXT_LENGTH * 2) {
            logger.warn("Support context exceeds maximum length");
            return false;
        }

        return true;
    }

    /**
     * Check for suspicious patterns that might indicate abuse
     */
    private boolean containsSuspiciousPatterns(String input) {
        String lowercaseInput = input.toLowerCase();

        // Check for potential prompt injection attempts
        String[] suspiciousPatterns = {
                "ignore previous", "forget everything", "new instruction", "system:",
                "assistant:", "role:", "behave like", "pretend to be", "act as",
                "\\n\\n", "---", "###", "```"
        };

        for (String pattern : suspiciousPatterns) {
            if (lowercaseInput.contains(pattern)) {
                logger.warn("Suspicious pattern detected in user input: {}", pattern);
                return true;
            }
        }

        // Check for excessive repetition (potential spam)
        if (hasExcessiveRepetition(input)) {
            return true;
        }

        return false;
    }

    /**
     * Check for excessive character/word repetition
     */
    private boolean hasExcessiveRepetition(String input) {
        // Check for repeated characters (more than 10 in a row)
        for (int i = 0; i < input.length() - 10; i++) {
            char c = input.charAt(i);
            boolean isRepeated = true;
            for (int j = i + 1; j < i + 11; j++) {
                if (input.charAt(j) != c) {
                    isRepeated = false;
                    break;
                }
            }
            if (isRepeated) {
                logger.warn("Excessive character repetition detected");
                return true;
            }
        }

        return false;
    }

    /**
     * Sanitize user input to remove potentially harmful content
     */
    private String sanitizeInput(String input) {
        if (input == null) {
            return "";
        }

        // Remove excessive whitespace and normalize
        String sanitized = input.trim().replaceAll("\\s+", " ");

        // Limit length
        if (sanitized.length() > MAX_MESSAGE_LENGTH) {
            sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH) + "...";
        }

        return sanitized;
    }

    }

    /**
     * Build the system prompt for the FoodFlow assistant
     */
    private String buildSystemPrompt(String language) {
        return String.format(
                """
                        You are the FoodFlow Support Assistant, helping users with questions about using the FoodFlow food sharing platform.

                        CRITICAL RULES:
                        1. Only answer questions using the provided help pack information and user context
                        2. NEVER provide general advice outside FoodFlow (no legal, medical, or food safety guidance)
                        3. Stay within the scope of FoodFlow app usage only
                        4. If the answer is not in the help pack or context, say "Please contact support"
                        5. Always respond in %s language
                        6. Keep responses concise and actionable
                        7. Use step-by-step format when appropriate
                        8. Never invent or assume information not provided in context

                        SCOPE LIMITATIONS:
                        - Only FoodFlow app functionality and usage
                        - No legal advice about food regulations or liability
                        - No medical advice about food allergies or dietary needs
                        - No food safety guidelines beyond what's in the help pack
                        - No business or partnership advice

                        If asked about anything outside this scope, escalate to human support.
                        """,
                language.equals("fr") ? "French" : "English");
    }

    /**
     * Build formatting rules for responses
     */
    private String buildFormattingRules() {
        return """
                FORMAT YOUR RESPONSES:
                1. Start with a direct answer to the user's question
                2. Use numbered steps when providing instructions
                3. Keep language friendly but professional
                4. Highlight important warnings or requirements
                5. End with relevant next steps or actions when appropriate
                6. Maximum 4-5 sentences unless steps are needed
                7. Never claim you "looked up" information - you only use provided context
                """;
    }

    /**
     * Get escalation message in the appropriate language
     */
    private String getEscalationMessage(String language) {
        if ("fr".equals(language)) {
            return "Je ne peux pas répondre à cette question. Veuillez contacter notre équipe de support pour obtenir de l'aide.";
        } else {
            return "I'm unable to answer this question. Please contact our support team for assistance.";
        }
    }
}