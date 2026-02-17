package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.TemperatureCategory;
import com.example.foodflow.model.types.PackagingType;

import java.time.LocalDate;
import java.util.*;

/**
 * Response DTO containing AI-extracted data from food label image analysis.
 * Includes confidence scores for each extracted field.
 */
public class AIExtractionResponse {
    
    private String foodName;
    private Set<FoodCategory> foodCategories = new HashSet<>();
    private TemperatureCategory temperatureCategory;
    private PackagingType packagingType;
    private LocalDate expiryDate;
    private LocalDate fabricationDate;
    private Double quantityValue;
    private String quantityUnit;
    private List<String> allergens = new ArrayList<>();
    private String description;
    
    // Confidence scores for each field (0.0 to 1.0)
    private Map<String, Double> confidenceScores = new HashMap<>();
    
    // Raw AI response for debugging
    private String rawAIResponse;
    
    // Success flag
    private boolean success = true;
    private String errorMessage;
    
    // Constructors
    public AIExtractionResponse() {}
    
    // Getters and Setters
    public String getFoodName() {
        return foodName;
    }
    
    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }
    
    public Set<FoodCategory> getFoodCategories() {
        return foodCategories;
    }
    
    public void setFoodCategories(Set<FoodCategory> foodCategories) {
        this.foodCategories = foodCategories;
    }
    
    public TemperatureCategory getTemperatureCategory() {
        return temperatureCategory;
    }
    
    public void setTemperatureCategory(TemperatureCategory temperatureCategory) {
        this.temperatureCategory = temperatureCategory;
    }
    
    public PackagingType getPackagingType() {
        return packagingType;
    }
    
    public void setPackagingType(PackagingType packagingType) {
        this.packagingType = packagingType;
    }
    
    public LocalDate getExpiryDate() {
        return expiryDate;
    }
    
    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }
    
    public LocalDate getFabricationDate() {
        return fabricationDate;
    }
    
    public void setFabricationDate(LocalDate fabricationDate) {
        this.fabricationDate = fabricationDate;
    }
    
    public Double getQuantityValue() {
        return quantityValue;
    }
    
    public void setQuantityValue(Double quantityValue) {
        this.quantityValue = quantityValue;
    }
    
    public String getQuantityUnit() {
        return quantityUnit;
    }
    
    public void setQuantityUnit(String quantityUnit) {
        this.quantityUnit = quantityUnit;
    }
    
    public List<String> getAllergens() {
        return allergens;
    }
    
    public void setAllergens(List<String> allergens) {
        this.allergens = allergens;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Map<String, Double> getConfidenceScores() {
        return confidenceScores;
    }
    
    public void setConfidenceScores(Map<String, Double> confidenceScores) {
        this.confidenceScores = confidenceScores;
    }
    
    public String getRawAIResponse() {
        return rawAIResponse;
    }
    
    public void setRawAIResponse(String rawAIResponse) {
        this.rawAIResponse = rawAIResponse;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    /**
     * Helper method to add a confidence score for a field
     */
    public void addConfidenceScore(String fieldName, Double confidence) {
        this.confidenceScores.put(fieldName, confidence);
    }
    
    /**
     * Get confidence level as a string (HIGH, MEDIUM, LOW)
     */
    public String getConfidenceLevel(String fieldName) {
        Double score = confidenceScores.get(fieldName);
        if (score == null) return "UNKNOWN";
        if (score >= 0.8) return "HIGH";
        if (score >= 0.5) return "MEDIUM";
        return "LOW";
    }
}
