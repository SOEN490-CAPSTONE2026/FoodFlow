package com.example.foodflow.service;

import com.example.foodflow.exception.AIServiceException;
import com.example.foodflow.exception.InvalidImageException;
import com.example.foodflow.model.dto.AIExtractionResponse;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.TemperatureCategory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * Service for AI-powered food label image analysis using OpenAI Vision API.
 * Extracts donation-related information from food product labels.
 */
@Service
public class AIExtractionService {
    
    private static final Logger log = LoggerFactory.getLogger(AIExtractionService.class);
    
    @Value("${app.openai.api-key}")
    private String openaiApiKey;
    
    private static final String VISION_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_FORMATS = Set.of("image/jpeg", "image/jpg", "image/png", "image/heic");
    private static final int API_TIMEOUT_SECONDS = 30;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(API_TIMEOUT_SECONDS))
            .build();
    
    /**
     * Analyze food label image and extract donation-related fields
     * @param image The uploaded image file
     * @return AIExtractionResponse with extracted data and confidence scores
     */
    public AIExtractionResponse analyzeFoodLabel(MultipartFile image) {
        log.info("Starting AI food label analysis for image: {}", image.getOriginalFilename());
        
        try {
            // Step 1: Validate image
            validateImage(image);
            
            // Step 2: Convert image to base64
            String base64Image = encodeImageToBase64(image);
            
            // Step 3: Build extraction prompt
            String prompt = buildExtractionPrompt();
            
            // Step 4: Call OpenAI Vision API
            String apiResponse = callOpenAIVision(base64Image, prompt);
            
            // Step 5: Parse response to AIExtractionResponse
            AIExtractionResponse result = parseAIResponse(apiResponse);
            
            log.info("AI extraction completed successfully. Food: {}", result.getFoodName());
            return result;
            
        } catch (InvalidImageException e) {
            log.error("Invalid image: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("AI extraction failed", e);
            AIExtractionResponse errorResponse = new AIExtractionResponse();
            errorResponse.setSuccess(false);
            errorResponse.setErrorMessage("Failed to analyze image: " + e.getMessage());
            return errorResponse;
        }
    }
    
    /**
     * Validate the uploaded image file
     */
    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new InvalidImageException("Image file is required");
        }
        
        if (image.getSize() > MAX_IMAGE_SIZE) {
            throw new InvalidImageException(
                String.format("Image size exceeds maximum allowed size of %d MB", MAX_IMAGE_SIZE / (1024 * 1024))
            );
        }
        
        String contentType = image.getContentType();
        if (contentType == null || !ALLOWED_FORMATS.contains(contentType.toLowerCase())) {
            throw new InvalidImageException(
                "Invalid image format. Allowed formats: JPG, JPEG, PNG, HEIC"
            );
        }
    }
    
    /**
     * Encode image to base64 string
     */
    private String encodeImageToBase64(MultipartFile image) {
        try {
            byte[] imageBytes = image.getBytes();
            return Base64.getEncoder().encodeToString(imageBytes);
        } catch (IOException e) {
            throw new InvalidImageException("Failed to read image file", e);
        }
    }
    
    /**
     * Build the prompt for OpenAI Vision API
     */
    private String buildExtractionPrompt() {
        return """
            Analyze this food product label image carefully and extract the following information.
            Return ONLY a valid JSON object with these exact fields:
            
            {
              "foodName": "exact product name from the label",
              "foodCategories": ["BREAD", "BAKERY_ITEMS"],
              "temperatureCategory": "FROZEN or REFRIGERATED or ROOM_TEMPERATURE or HOT_COOKED",
              "packagingType": "SEALED or LOOSE or REFRIGERATED_CONTAINER or FROZEN_CONTAINER or VACUUM_PACKED or BOXED or WRAPPED or BULK or OTHER",
              "expiryDate": "YYYY-MM-DD format if visible (Best Before, Use By, Expiry Date)",
              "fabricationDate": "YYYY-MM-DD format if visible (Production Date, Manufactured Date)",
              "quantityValue": 500.0,
              "quantityUnit": "g, kg, ml, l, lbs, oz, pieces, servings, etc.",
              "allergens": ["milk", "eggs", "peanuts", "tree nuts", "soy", "wheat", "fish", "shellfish"],
              "description": "Brief description of the product based on ingredients and label info",
              "confidence": {
                "foodName": 0.95,
                "foodCategories": 0.88,
                "temperatureCategory": 0.90,
                "packagingType": 0.85,
                "expiryDate": 0.92,
                "fabricationDate": 0.70,
                "quantity": 0.88,
                "allergens": 0.85,
                "description": 0.80
              }
            }
            
            Important instructions:
            - If a field cannot be determined, use null for that field
            - Confidence scores should be between 0.0 and 1.0
            - For foodCategories, choose the most appropriate categories from common food types
            - For temperatureCategory, infer from the packaging and product type
            - For packagingType, observe the actual packaging in the image
            - Extract dates in YYYY-MM-DD format only
            - Look for allergen warnings like "Contains:", "May contain:", "Allergens:"
            - Return ONLY the JSON, no additional text or explanation
            """;
    }
    
    /**
     * Call OpenAI Vision API
     */
    private String callOpenAIVision(String base64Image, String prompt) {
        try {
            String requestBody = String.format("""
                {
                  "model": "gpt-4o",
                  "messages": [
                    {
                      "role": "user",
                      "content": [
                        {
                          "type": "text",
                          "text": "%s"
                        },
                        {
                          "type": "image_url",
                          "image_url": {
                            "url": "data:image/jpeg;base64,%s"
                          }
                        }
                      ]
                    }
                  ],
                  "max_tokens": 1000
                }
                """, prompt.replace("\"", "\\\"").replace("\n", "\\n"), base64Image);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(VISION_API_URL))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + openaiApiKey)
                    .timeout(Duration.ofSeconds(API_TIMEOUT_SECONDS))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() != 200) {
                log.error("OpenAI API error: Status {}, Body: {}", response.statusCode(), response.body());
                throw new AIServiceException("OpenAI API returned status: " + response.statusCode());
            }
            
            // Extract content from response
            JsonNode jsonResponse = objectMapper.readTree(response.body());
            String content = jsonResponse
                    .path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();
            
            log.debug("OpenAI API response content: {}", content);
            return content;
            
        } catch (IOException | InterruptedException e) {
            throw new AIServiceException("Failed to communicate with OpenAI API", e);
        }
    }
    
    /**
     * Parse AI response JSON to AIExtractionResponse object
     */
    private AIExtractionResponse parseAIResponse(String aiResponse) {
        AIExtractionResponse response = new AIExtractionResponse();
        response.setRawAIResponse(aiResponse);
        
        try {
            // Clean response (remove markdown code blocks if present)
            String cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith("```json")) {
                cleanedResponse = cleanedResponse.substring(7);
            }
            if (cleanedResponse.startsWith("```")) {
                cleanedResponse = cleanedResponse.substring(3);
            }
            if (cleanedResponse.endsWith("```")) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length() - 3);
            }
            cleanedResponse = cleanedResponse.trim();
            
            JsonNode root = objectMapper.readTree(cleanedResponse);
            
            // Extract food name
            if (root.has("foodName") && !root.get("foodName").isNull()) {
                response.setFoodName(root.get("foodName").asText());
            }
            
            // Extract food categories
            if (root.has("foodCategories") && root.get("foodCategories").isArray()) {
                Set<FoodCategory> categories = new HashSet<>();
                root.get("foodCategories").forEach(cat -> {
                    try {
                        categories.add(FoodCategory.valueOf(cat.asText().toUpperCase()));
                    } catch (IllegalArgumentException e) {
                        log.warn("Unknown food category: {}", cat.asText());
                    }
                });
                response.setFoodCategories(categories);
            }
            
            // Extract temperature category
            if (root.has("temperatureCategory") && !root.get("temperatureCategory").isNull()) {
                try {
                    response.setTemperatureCategory(
                        TemperatureCategory.valueOf(root.get("temperatureCategory").asText().toUpperCase())
                    );
                } catch (IllegalArgumentException e) {
                    log.warn("Unknown temperature category: {}", root.get("temperatureCategory").asText());
                }
            }
            
            // Extract packaging type
            if (root.has("packagingType") && !root.get("packagingType").isNull()) {
                try {
                    response.setPackagingType(
                        PackagingType.valueOf(root.get("packagingType").asText().toUpperCase())
                    );
                } catch (IllegalArgumentException e) {
                    log.warn("Unknown packaging type: {}", root.get("packagingType").asText());
                }
            }
            
            // Extract dates
            response.setExpiryDate(parseDate(root.get("expiryDate")));
            response.setFabricationDate(parseDate(root.get("fabricationDate")));
            
            // Extract quantity
            if (root.has("quantityValue") && !root.get("quantityValue").isNull()) {
                response.setQuantityValue(root.get("quantityValue").asDouble());
            }
            if (root.has("quantityUnit") && !root.get("quantityUnit").isNull()) {
                response.setQuantityUnit(root.get("quantityUnit").asText());
            }
            
            // Extract allergens
            if (root.has("allergens") && root.get("allergens").isArray()) {
                List<String> allergens = new ArrayList<>();
                root.get("allergens").forEach(allergen -> allergens.add(allergen.asText()));
                response.setAllergens(allergens);
            }
            
            // Extract description
            if (root.has("description") && !root.get("description").isNull()) {
                response.setDescription(root.get("description").asText());
            }
            
            // Extract confidence scores
            if (root.has("confidence") && root.get("confidence").isObject()) {
                Map<String, Double> confidenceScores = new HashMap<>();
                root.get("confidence").fields().forEachRemaining(entry -> {
                    confidenceScores.put(entry.getKey(), entry.getValue().asDouble());
                });
                response.setConfidenceScores(confidenceScores);
            }
            
            response.setSuccess(true);
            
        } catch (Exception e) {
            log.error("Failed to parse AI response", e);
            response.setSuccess(false);
            response.setErrorMessage("Failed to parse AI response: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Parse date from JSON node
     */
    private LocalDate parseDate(JsonNode dateNode) {
        if (dateNode == null || dateNode.isNull()) {
            return null;
        }
        
        try {
            String dateStr = dateNode.asText();
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            log.warn("Failed to parse date: {}", dateNode.asText());
            return null;
        }
    }
}
