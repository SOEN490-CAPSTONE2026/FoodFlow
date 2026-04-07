package com.example.foodflow.service;

import com.example.foodflow.exception.AIServiceException;
import com.example.foodflow.exception.InvalidImageException;
import com.example.foodflow.model.dto.AIExtractionResponse;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.Quantity;
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
    private static final Set<String> GENERIC_TITLE_TERMS = Set.of(
            "food", "food item", "donation", "surplus food", "meal", "product", "item", "groceries"
    );
    
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
            errorResponse.setErrorCode("EXTRACTION_FAILED");
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
              "foodName": "short donor-friendly title, 3 to 8 words, specific and concise",
              "foodCategories": ["PREPARED_MEALS", "BAKERY_PASTRY"],
              "temperatureCategory": "FROZEN or REFRIGERATED or ROOM_TEMPERATURE or HOT_COOKED",
              "packagingType": "SEALED or LOOSE or REFRIGERATED_CONTAINER or FROZEN_CONTAINER or VACUUM_PACKED or BOXED or WRAPPED or BULK or OTHER",
              "expiryDate": "YYYY-MM-DD format only if visibly printed",
              "fabricationDate": "YYYY-MM-DD format only if visibly printed",
              "quantityValue": 12,
              "quantityUnit": "Use a Quantity.Unit enum such as KILOGRAM, GRAM, LITER, MILLILITER, ITEM, PIECE, BOX, BAG, PACKAGE, BOTTLE, CAN, CONTAINER, SERVING, DOZEN, POUND, OUNCE",
              "allergens": ["milk", "eggs", "peanuts", "tree nuts", "soy", "wheat", "fish", "shellfish"],
              "description": "Strong 1-2 sentence donation description based on visible product details",
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
            - If a field cannot be determined confidently, use null for that field
            - Confidence scores should be between 0.0 and 1.0
            - Food title must be concise, clear, donor-friendly, and not generic
            - Avoid titles like "Food item", "Donation", "Groceries", or brand-only titles
            - For foodCategories, choose 1-2 best categories only and prefer practical donation categories
            - For temperatureCategory, infer from storage instructions, packaging, and product type
            - For packagingType, observe the actual packaging in the image
            - For quantityValue and quantityUnit, only fill them when the amount is visible or strongly inferable
            - If quantity is uncertain, return null instead of guessing
            - Extract dates in YYYY-MM-DD format only
            - Only use expiryDate if the label clearly shows it
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
                                    "response_format": { "type": "json_object" },
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
            cleanedResponse = extractJsonObject(cleanedResponse);
            
            JsonNode root = objectMapper.readTree(cleanedResponse);
            
            PackagingType packagingType = normalizePackagingType(root.path("packagingType").asText(null));
            Set<FoodCategory> categories = normalizeFoodCategories(root.path("foodCategories"));
            TemperatureCategory temperatureCategory = normalizeTemperatureCategory(
                    root.path("temperatureCategory").asText(null),
                    packagingType,
                    categories,
                    root.path("foodName").asText("")
            );

            response.setPackagingType(packagingType);
            response.setFoodCategories(categories);
            response.setTemperatureCategory(temperatureCategory);

            LocalDate fabricationDate = parseDate(root.get("fabricationDate"));
            LocalDate expiryDate = parseDate(root.get("expiryDate"));
            if (fabricationDate != null && expiryDate != null && expiryDate.isBefore(fabricationDate)) {
                expiryDate = null;
            }
            response.setFabricationDate(fabricationDate);
            response.setExpiryDate(expiryDate);

            Double quantityValue = parseQuantityValue(root.get("quantityValue"));
            Quantity.Unit quantityUnit = normalizeQuantityUnit(root.path("quantityUnit").asText(null));
            if (quantityUnit != null && quantityValue != null && quantityUnit.isIntegerOnly()) {
                if (Math.abs(quantityValue - Math.rint(quantityValue)) < 0.05d) {
                    quantityValue = (double) Math.round(quantityValue);
                } else {
                    quantityValue = null;
                    quantityUnit = null;
                }
            }
            response.setQuantityValue(quantityValue);
            response.setQuantityUnit(quantityUnit != null ? quantityUnit.name() : null);
            
            // Extract allergens
            if (root.has("allergens") && root.get("allergens").isArray()) {
                List<String> allergens = new ArrayList<>();
                root.get("allergens").forEach(allergen -> allergens.add(allergen.asText()));
                response.setAllergens(allergens);
            }
            
            String description = root.has("description") && !root.get("description").isNull()
                    ? root.get("description").asText()
                    : null;
            response.setDescription(normalizeDescription(description, categories));
            response.setFoodName(normalizeFoodName(root.path("foodName").asText(null), categories, response.getDescription()));
            
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
     * Extract the first valid JSON object from a string response.
     * This guards against occasional model prefaces/suffixes around JSON payloads.
     */
    private String extractJsonObject(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Empty AI response");
        }

        String trimmed = raw.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return trimmed;
        }

        int start = trimmed.indexOf('{');
        if (start < 0) {
            throw new IllegalArgumentException("No JSON object found in AI response");
        }

        boolean inString = false;
        boolean escaping = false;
        int depth = 0;

        for (int i = start; i < trimmed.length(); i++) {
            char ch = trimmed.charAt(i);

            if (escaping) {
                escaping = false;
                continue;
            }

            if (ch == '\\' && inString) {
                escaping = true;
                continue;
            }

            if (ch == '"') {
                inString = !inString;
                continue;
            }

            if (inString) {
                continue;
            }

            if (ch == '{') {
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0) {
                    return trimmed.substring(start, i + 1);
                }
            }
        }

        throw new IllegalArgumentException("Unclosed JSON object in AI response");
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

    private Double parseQuantityValue(JsonNode quantityNode) {
        if (quantityNode == null || quantityNode.isNull()) {
            return null;
        }

        try {
            if (quantityNode.isNumber()) {
                double value = quantityNode.asDouble();
                return value > 0 ? value : null;
            }

            String text = quantityNode.asText();
            if (text == null || text.isBlank()) {
                return null;
            }

            String cleaned = text.replaceAll("[^0-9.,]", "").replace(",", ".");
            if (cleaned.isBlank()) {
                return null;
            }

            double value = Double.parseDouble(cleaned);
            return value > 0 ? value : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String normalizeFoodName(String rawFoodName, Set<FoodCategory> categories, String description) {
        String cleaned = cleanText(rawFoodName);
        if (cleaned != null) {
            String lowered = cleaned.toLowerCase(Locale.ROOT);
            if (!GENERIC_TITLE_TERMS.contains(lowered) && cleaned.length() >= 3) {
                return shortenTitle(cleaned);
            }
        }

        if (description != null && !description.isBlank()) {
            String[] phrases = description.split("[.!]");
            if (phrases.length > 0) {
                String candidate = cleanText(phrases[0]);
                if (candidate != null && candidate.length() >= 3) {
                    return shortenTitle(candidate);
                }
            }
        }

        FoodCategory primary = categories.stream().findFirst().orElse(null);
        if (primary == null) {
            return "Food Donation";
        }

        return switch (primary) {
            case PREPARED_MEALS, READY_TO_EAT, SANDWICHES, SALADS, SOUPS, STEWS, CASSEROLES -> "Prepared Meals";
            case FRUITS_VEGETABLES, LEAFY_GREENS, ROOT_VEGETABLES, BERRIES, CITRUS_FRUITS, TROPICAL_FRUITS -> "Fresh Produce";
            case BREAD, BAKERY_PASTRY, BAKED_GOODS, BAKERY_ITEMS, CAKES_PASTRIES -> "Bakery Items";
            case DAIRY_COLD, MILK, CHEESE, YOGURT, EGGS -> "Dairy Items";
            case FRESH_MEAT, GROUND_MEAT, POULTRY -> "Meat Donation";
            case FISH, SEAFOOD -> "Seafood Donation";
            case PACKAGED_PANTRY, CANNED_SOUP, CANNED_VEGETABLES, CANNED_FRUITS, PACKAGED -> "Pantry Items";
            case BEVERAGES, JUICE, WATER, SOFT_DRINKS, TEA, COFFEE, SMOOTHIES -> "Beverage Donation";
            default -> "Food Donation";
        };
    }

    private String normalizeDescription(String rawDescription, Set<FoodCategory> categories) {
        String cleaned = cleanText(rawDescription);
        if (cleaned != null && cleaned.length() >= 12) {
            return cleaned;
        }

        FoodCategory primary = categories.stream().findFirst().orElse(null);
        if (primary == null) {
            return "AI-generated donation draft. Please review the item details before submitting.";
        }

        return switch (primary) {
            case PREPARED_MEALS, READY_TO_EAT, SANDWICHES, SALADS, SOUPS, STEWS, CASSEROLES ->
                    "Prepared food donation ready for pickup. Please review ingredients, packaging, and storage details before submitting.";
            case FRUITS_VEGETABLES, LEAFY_GREENS, ROOT_VEGETABLES, BERRIES, CITRUS_FRUITS, TROPICAL_FRUITS ->
                    "Fresh produce donation identified from the uploaded image. Please confirm quantity, storage needs, and expiry details before submitting.";
            case BREAD, BAKERY_PASTRY, BAKED_GOODS, BAKERY_ITEMS, CAKES_PASTRIES ->
                    "Bakery donation identified from the uploaded image. Please review freshness, packaging, and pickup details before submitting.";
            default ->
                    "AI-generated donation draft based on the uploaded image. Please review the structured details before submitting.";
        };
    }

    private Set<FoodCategory> normalizeFoodCategories(JsonNode categoryNode) {
        LinkedHashSet<FoodCategory> normalized = new LinkedHashSet<>();
        if (categoryNode != null && categoryNode.isArray()) {
            categoryNode.forEach(cat -> {
                FoodCategory foodCategory = normalizeFoodCategory(cat.asText(null));
                if (foodCategory != null) {
                    normalized.add(foodCategory);
                }
            });
        } else if (categoryNode != null && !categoryNode.isMissingNode() && !categoryNode.isNull()) {
            FoodCategory foodCategory = normalizeFoodCategory(categoryNode.asText(null));
            if (foodCategory != null) {
                normalized.add(foodCategory);
            }
        }
        return normalized;
    }

    private FoodCategory normalizeFoodCategory(String rawValue) {
        String normalized = normalizeEnumKey(rawValue);
        if (normalized == null) {
            return null;
        }

        Map<String, FoodCategory> aliases = Map.ofEntries(
                Map.entry("FRUITS", FoodCategory.FRUITS_VEGETABLES),
                Map.entry("VEGETABLES", FoodCategory.FRUITS_VEGETABLES),
                Map.entry("PRODUCE", FoodCategory.FRUITS_VEGETABLES),
                Map.entry("PREPARED", FoodCategory.PREPARED_MEALS),
                Map.entry("PREPARED_FOOD", FoodCategory.PREPARED_MEALS),
                Map.entry("MEALS", FoodCategory.PREPARED_MEALS),
                Map.entry("BAKERY", FoodCategory.BAKERY_PASTRY),
                Map.entry("PASTRY", FoodCategory.BAKERY_PASTRY),
                Map.entry("BREADS", FoodCategory.BREAD),
                Map.entry("DAIRY", FoodCategory.DAIRY_COLD),
                Map.entry("DAIRY_EGGS", FoodCategory.DAIRY_COLD),
                Map.entry("EGG", FoodCategory.EGGS),
                Map.entry("MEAT", FoodCategory.FRESH_MEAT),
                Map.entry("POULTRY_MEAT", FoodCategory.POULTRY),
                Map.entry("FROZEN_MEAL", FoodCategory.FROZEN_MEALS),
                Map.entry("PANTRY", FoodCategory.PACKAGED_PANTRY),
                Map.entry("PACKAGED_PANTRY", FoodCategory.PACKAGED_PANTRY),
                Map.entry("PACKAGE", FoodCategory.PACKAGED_PANTRY),
                Map.entry("DRINKS", FoodCategory.BEVERAGES),
                Map.entry("DRINK", FoodCategory.BEVERAGES)
        );

        if (aliases.containsKey(normalized)) {
            return aliases.get(normalized);
        }

        try {
            return FoodCategory.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown food category: {}", rawValue);
            return null;
        }
    }

    private TemperatureCategory normalizeTemperatureCategory(
            String rawValue,
            PackagingType packagingType,
            Set<FoodCategory> categories,
            String foodName
    ) {
        String normalized = normalizeEnumKey(rawValue);
        if (normalized != null) {
            if (normalized.contains("FROZEN") || normalized.contains("FREEZER")) {
                return TemperatureCategory.FROZEN;
            }
            if (normalized.contains("REFRIGERATED") || normalized.contains("CHILLED") || normalized.contains("COLD")) {
                return TemperatureCategory.REFRIGERATED;
            }
            if (normalized.contains("ROOM") || normalized.contains("AMBIENT") || normalized.contains("SHELF")) {
                return TemperatureCategory.ROOM_TEMPERATURE;
            }
            if (normalized.contains("HOT") || normalized.contains("COOKED") || normalized.contains("WARM")) {
                return TemperatureCategory.HOT_COOKED;
            }
            try {
                return TemperatureCategory.valueOf(normalized);
            } catch (IllegalArgumentException ignored) {
            }
        }

        if (packagingType == PackagingType.FROZEN_CONTAINER) {
            return TemperatureCategory.FROZEN;
        }
        if (packagingType == PackagingType.REFRIGERATED_CONTAINER) {
            return TemperatureCategory.REFRIGERATED;
        }

        if (categories.contains(FoodCategory.DAIRY_COLD) || categories.contains(FoodCategory.MILK)
                || categories.contains(FoodCategory.CHEESE) || categories.contains(FoodCategory.YOGURT)
                || categories.contains(FoodCategory.EGGS) || categories.contains(FoodCategory.FRESH_MEAT)
                || categories.contains(FoodCategory.POULTRY) || categories.contains(FoodCategory.FISH)
                || categories.contains(FoodCategory.SEAFOOD)) {
            return TemperatureCategory.REFRIGERATED;
        }

        if (categories.contains(FoodCategory.FROZEN) || categories.contains(FoodCategory.FROZEN_FOOD)
                || categories.contains(FoodCategory.FROZEN_MEALS) || categories.contains(FoodCategory.ICE_CREAM)) {
            return TemperatureCategory.FROZEN;
        }

        String foodNameLower = foodName == null ? "" : foodName.toLowerCase(Locale.ROOT);
        if (foodNameLower.contains("hot") || foodNameLower.contains("cooked") || foodNameLower.contains("soup")) {
            return TemperatureCategory.HOT_COOKED;
        }

        return null;
    }

    private PackagingType normalizePackagingType(String rawValue) {
        String normalized = normalizeEnumKey(rawValue);
        if (normalized == null) {
            return null;
        }

        if (normalized.contains("VACUUM")) {
            return PackagingType.VACUUM_PACKED;
        }
        if (normalized.contains("FROZEN")) {
            return PackagingType.FROZEN_CONTAINER;
        }
        if (normalized.contains("REFRIGERATED") || normalized.contains("COLD_CONTAINER")) {
            return PackagingType.REFRIGERATED_CONTAINER;
        }
        if (normalized.contains("BOX")) {
            return PackagingType.BOXED;
        }
        if (normalized.contains("WRAP") || normalized.contains("FILM")) {
            return PackagingType.WRAPPED;
        }
        if (normalized.contains("SEAL")) {
            return PackagingType.SEALED;
        }
        if (normalized.contains("BULK")) {
            return PackagingType.BULK;
        }
        try {
            return PackagingType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown packaging type: {}", rawValue);
            return PackagingType.OTHER;
        }
    }

    private Quantity.Unit normalizeQuantityUnit(String rawValue) {
        String normalized = normalizeEnumKey(rawValue);
        if (normalized == null) {
            return null;
        }

        Map<String, Quantity.Unit> aliases = Map.ofEntries(
                Map.entry("KG", Quantity.Unit.KILOGRAM),
                Map.entry("KGS", Quantity.Unit.KILOGRAM),
                Map.entry("KILO", Quantity.Unit.KILOGRAM),
                Map.entry("KILOS", Quantity.Unit.KILOGRAM),
                Map.entry("G", Quantity.Unit.GRAM),
                Map.entry("GRAMS", Quantity.Unit.GRAM),
                Map.entry("LB", Quantity.Unit.POUND),
                Map.entry("LBS", Quantity.Unit.POUND),
                Map.entry("OZ", Quantity.Unit.OUNCE),
                Map.entry("L", Quantity.Unit.LITER),
                Map.entry("LITERS", Quantity.Unit.LITER),
                Map.entry("ML", Quantity.Unit.MILLILITER),
                Map.entry("PIECES", Quantity.Unit.PIECE),
                Map.entry("PCS", Quantity.Unit.PIECE),
                Map.entry("ITEMS", Quantity.Unit.ITEM),
                Map.entry("UNITS", Quantity.Unit.UNIT),
                Map.entry("PACK", Quantity.Unit.PACKAGE),
                Map.entry("PACKS", Quantity.Unit.PACKAGE),
                Map.entry("PACKAGES", Quantity.Unit.PACKAGE),
                Map.entry("BAGS", Quantity.Unit.BAG),
                Map.entry("BOTTLES", Quantity.Unit.BOTTLE),
                Map.entry("CANS", Quantity.Unit.CAN),
                Map.entry("JARS", Quantity.Unit.JAR),
                Map.entry("CONTAINERS", Quantity.Unit.CONTAINER),
                Map.entry("SERVINGS", Quantity.Unit.SERVING),
                Map.entry("PORTIONS", Quantity.Unit.PORTION),
                Map.entry("DOZENS", Quantity.Unit.DOZEN),
                Map.entry("CASES", Quantity.Unit.CASE),
                Map.entry("CARTONS", Quantity.Unit.CARTON),
                Map.entry("BOXES", Quantity.Unit.BOX),
                Map.entry("LOAVES", Quantity.Unit.LOAF)
        );

        if (aliases.containsKey(normalized)) {
            return aliases.get(normalized);
        }

        try {
            return Quantity.Unit.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown quantity unit: {}", rawValue);
            return null;
        }
    }

    private String normalizeEnumKey(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }
        return rawValue
                .trim()
                .toUpperCase(Locale.ROOT)
                .replace('&', '_')
                .replace('/', '_')
                .replace('-', '_')
                .replace(' ', '_');
    }

    private String cleanText(String rawValue) {
        if (rawValue == null) {
            return null;
        }
        String cleaned = rawValue
                .replaceAll("[\\r\\n]+", " ")
                .replaceAll("\\s{2,}", " ")
                .replaceAll("^[\"'\\s]+|[\"'\\s]+$", "")
                .trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private String shortenTitle(String value) {
        String cleaned = cleanText(value);
        if (cleaned == null) {
            return "Food Donation";
        }

        String[] words = cleaned.split("\\s+");
        if (words.length <= 8 && cleaned.length() <= 80) {
            return cleaned;
        }

        StringBuilder builder = new StringBuilder();
        int wordCount = 0;
        for (String word : words) {
            if (builder.length() + word.length() + 1 > 60 || wordCount >= 8) {
                break;
            }
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(word);
            wordCount++;
        }

        String shortened = builder.toString().trim();
        return shortened.isBlank() ? "Food Donation" : shortened;
    }
}
