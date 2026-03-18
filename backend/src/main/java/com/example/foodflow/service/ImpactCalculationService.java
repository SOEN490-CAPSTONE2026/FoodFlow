package com.example.foodflow.service;

import com.example.foodflow.model.entity.ImpactConfiguration;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ImpactConfigurationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Service for category-weighted environmental impact calculations
 */
@Service
public class ImpactCalculationService {

    private static final Logger logger = LoggerFactory.getLogger(ImpactCalculationService.class);

    private final ImpactConfigurationRepository configRepository;
    private final ObjectMapper objectMapper;

    // Default factors (used when no configuration exists)
    private static final Map<String, Double> DEFAULT_EMISSION_FACTORS = new HashMap<>();
    private static final Map<String, Double> DEFAULT_WATER_FACTORS = new HashMap<>();

    static {
        // Emission factors (kg CO2e per kg food)
        DEFAULT_EMISSION_FACTORS.put("FRUITS_VEGETABLES", 0.5);
        DEFAULT_EMISSION_FACTORS.put("LEAFY_GREENS", 0.4);
        DEFAULT_EMISSION_FACTORS.put("ROOT_VEGETABLES", 0.4);
        DEFAULT_EMISSION_FACTORS.put("BERRIES", 0.6);
        DEFAULT_EMISSION_FACTORS.put("CITRUS_FRUITS", 0.5);
        DEFAULT_EMISSION_FACTORS.put("TROPICAL_FRUITS", 0.7);

        DEFAULT_EMISSION_FACTORS.put("BREAD", 0.8);
        DEFAULT_EMISSION_FACTORS.put("BAKERY_PASTRY", 0.8);
        DEFAULT_EMISSION_FACTORS.put("BAKED_GOODS", 0.8);
        DEFAULT_EMISSION_FACTORS.put("WHOLE_GRAINS", 0.6);
        DEFAULT_EMISSION_FACTORS.put("RICE", 0.7);
        DEFAULT_EMISSION_FACTORS.put("PASTA", 0.7);

        DEFAULT_EMISSION_FACTORS.put("DAIRY", 2.5);
        DEFAULT_EMISSION_FACTORS.put("DAIRY_COLD", 2.5);
        DEFAULT_EMISSION_FACTORS.put("MILK", 2.5);
        DEFAULT_EMISSION_FACTORS.put("CHEESE", 3.0);
        DEFAULT_EMISSION_FACTORS.put("YOGURT", 2.2);
        DEFAULT_EMISSION_FACTORS.put("BUTTER", 3.5);

        DEFAULT_EMISSION_FACTORS.put("FRESH_MEAT", 6.0);
        DEFAULT_EMISSION_FACTORS.put("GROUND_MEAT", 6.0);
        DEFAULT_EMISSION_FACTORS.put("POULTRY", 4.5);
        DEFAULT_EMISSION_FACTORS.put("FISH", 3.0);
        DEFAULT_EMISSION_FACTORS.put("SEAFOOD", 3.5);
        DEFAULT_EMISSION_FACTORS.put("EGGS", 2.0);

        DEFAULT_EMISSION_FACTORS.put("PREPARED_MEALS", 1.5);
        DEFAULT_EMISSION_FACTORS.put("READY_TO_EAT", 1.5);
        DEFAULT_EMISSION_FACTORS.put("FROZEN_FOOD", 1.8);
        DEFAULT_EMISSION_FACTORS.put("FROZEN", 1.8);

        DEFAULT_EMISSION_FACTORS.put("CANNED_VEGETABLES", 0.9);
        DEFAULT_EMISSION_FACTORS.put("CANNED_FRUITS", 0.9);

        // Water factors (liters per kg food)
        DEFAULT_WATER_FACTORS.put("FRUITS_VEGETABLES", 300.0);
        DEFAULT_WATER_FACTORS.put("LEAFY_GREENS", 250.0);
        DEFAULT_WATER_FACTORS.put("ROOT_VEGETABLES", 300.0);
        DEFAULT_WATER_FACTORS.put("BERRIES", 400.0);
        DEFAULT_WATER_FACTORS.put("CITRUS_FRUITS", 500.0);
        DEFAULT_WATER_FACTORS.put("TROPICAL_FRUITS", 600.0);

        DEFAULT_WATER_FACTORS.put("BREAD", 800.0);
        DEFAULT_WATER_FACTORS.put("BAKERY_PASTRY", 800.0);
        DEFAULT_WATER_FACTORS.put("BAKED_GOODS", 800.0);
        DEFAULT_WATER_FACTORS.put("WHOLE_GRAINS", 1000.0);
        DEFAULT_WATER_FACTORS.put("RICE", 1200.0);
        DEFAULT_WATER_FACTORS.put("PASTA", 900.0);

        DEFAULT_WATER_FACTORS.put("DAIRY", 1000.0);
        DEFAULT_WATER_FACTORS.put("DAIRY_COLD", 1000.0);
        DEFAULT_WATER_FACTORS.put("MILK", 1000.0);
        DEFAULT_WATER_FACTORS.put("CHEESE", 1500.0);
        DEFAULT_WATER_FACTORS.put("YOGURT", 900.0);
        DEFAULT_WATER_FACTORS.put("BUTTER", 1300.0);

        DEFAULT_WATER_FACTORS.put("FRESH_MEAT", 15000.0);
        DEFAULT_WATER_FACTORS.put("GROUND_MEAT", 15000.0);
        DEFAULT_WATER_FACTORS.put("POULTRY", 4300.0);
        DEFAULT_WATER_FACTORS.put("FISH", 3000.0);
        DEFAULT_WATER_FACTORS.put("SEAFOOD", 3500.0);
        DEFAULT_WATER_FACTORS.put("EGGS", 3300.0);

        DEFAULT_WATER_FACTORS.put("PREPARED_MEALS", 800.0);
        DEFAULT_WATER_FACTORS.put("READY_TO_EAT", 800.0);
        DEFAULT_WATER_FACTORS.put("FROZEN_FOOD", 900.0);
        DEFAULT_WATER_FACTORS.put("FROZEN", 900.0);

        DEFAULT_WATER_FACTORS.put("CANNED_VEGETABLES", 400.0);
        DEFAULT_WATER_FACTORS.put("CANNED_FRUITS", 400.0);
    }

    private Map<String, Double> emissionFactors;
    private Map<String, Double> waterFactors;
    private Double minMealWeightKg = 0.4;
    private Double maxMealWeightKg = 0.6;
    private Double defaultEmissionFactor = 1.9;
    private Double defaultWaterFactor = 500.0;
    private String currentVersion = "1.0-default";
    private String disclosureText = "Estimates are calculated using industry-standard environmental conversion factors. Results represent conservative approximations.";

    public ImpactCalculationService(ImpactConfigurationRepository configRepository, ObjectMapper objectMapper) {
        this.configRepository = configRepository;
        this.objectMapper = objectMapper;
        this.emissionFactors = new HashMap<>(DEFAULT_EMISSION_FACTORS);
        this.waterFactors = new HashMap<>(DEFAULT_WATER_FACTORS);
    }

    @PostConstruct
    public void loadConfiguration() {
        try {
            var configOpt = configRepository.findByIsActiveTrue();
            if (configOpt.isPresent()) {
                ImpactConfiguration config = configOpt.get();
                loadFactorsFromConfig(config);
                logger.info("Loaded impact configuration version: {}", config.getVersion());
            } else {
                logger.info("No active impact configuration found, using defaults");
                initializeDefaultConfiguration();
            }
        } catch (Exception e) {
            logger.error("Error loading impact configuration, using defaults", e);
        }
    }

    private void loadFactorsFromConfig(ImpactConfiguration config) {
        try {
            this.emissionFactors = objectMapper.readValue(
                config.getEmissionFactorsJson(),
                new TypeReference<Map<String, Double>>() {}
            );
            this.waterFactors = objectMapper.readValue(
                config.getWaterFactorsJson(),
                new TypeReference<Map<String, Double>>() {}
            );
            this.minMealWeightKg = config.getMinMealWeightKg();
            this.maxMealWeightKg = config.getMaxMealWeightKg();
            this.defaultEmissionFactor = config.getDefaultEmissionFactor();
            this.defaultWaterFactor = config.getDefaultWaterFactor();
            this.currentVersion = config.getVersion();
            this.disclosureText = config.getDisclosureText();
        } catch (Exception e) {
            logger.error("Error parsing configuration JSON", e);
        }
    }

    private void initializeDefaultConfiguration() {
        try {
            ImpactConfiguration config = new ImpactConfiguration("1.0-default");
            config.setEmissionFactorsJson(objectMapper.writeValueAsString(DEFAULT_EMISSION_FACTORS));
            config.setWaterFactorsJson(objectMapper.writeValueAsString(DEFAULT_WATER_FACTORS));
            config.setMinMealWeightKg(0.4);
            config.setMaxMealWeightKg(0.6);
            config.setDefaultEmissionFactor(1.9);
            config.setDefaultWaterFactor(500.0);
            config.setIsActive(true);
            config.setDisclosureText(disclosureText);
            configRepository.save(config);
            logger.info("Initialized default impact configuration");
        } catch (Exception e) {
            logger.error("Error initializing default configuration", e);
        }
    }

    /**
     * Calculate CO2 emissions avoided for a surplus post based on food category
     */
    public double calculateCO2Avoided(SurplusPost post, double weightKg) {
        FoodCategory primaryCategory = getPrimaryFoodCategory(post.getFoodCategories());
        double factor = getEmissionFactor(primaryCategory);
        return weightKg * factor;
    }

    /**
     * Calculate water saved for a surplus post based on food category
     */
    public double calculateWaterSaved(SurplusPost post, double weightKg) {
        FoodCategory primaryCategory = getPrimaryFoodCategory(post.getFoodCategories());
        double factor = getWaterFactor(primaryCategory);
        return weightKg * factor;
    }

    /**
     * Calculate bounded meal estimates (min/max)
     */
    public int[] calculateMealRange(double weightKg) {
        int minMeals = (int) Math.floor(weightKg / maxMealWeightKg);
        int maxMeals = (int) Math.ceil(weightKg / minMealWeightKg);
        return new int[]{minMeals, maxMeals};
    }

    /**
     * Convert quantity to kg
     */
    public double convertToKg(Quantity quantity) {
        if (quantity == null || quantity.getValue() == null) {
            return 0.0;
        }

        double value = quantity.getValue();
        Quantity.Unit unit = quantity.getUnit();

        switch (unit) {
            case KILOGRAM:
                return value;
            case GRAM:
                return value / 1000.0;
            case POUND:
                return value * 0.453592;
            case OUNCE:
                return value * 0.0283495;
            case TON:
                return value * 1000.0;
            case LITER:
                return value; // Approximate: 1L ≈ 1kg for food
            case MILLILITER:
                return value / 1000.0;
            case GALLON:
                return value * 3.78541;
            // For count-based units, estimate based on average meal size
            case PIECE:
            case ITEM:
            case UNIT:
            case SERVING:
            case PORTION:
                return value * 0.5; // Mid-point meal estimate
            case BOX:
            case PACKAGE:
            case BAG:
            case CONTAINER:
                return value * 2.0; // Estimate 2kg per container
            case CASE:
            case CARTON:
                return value * 10.0; // Estimate 10kg per case
            default:
                return value * 0.5; // Default estimate
        }
    }

    /**
     * Get emission factor for a food category
     */
    private double getEmissionFactor(FoodCategory category) {
        if (category == null) {
            return defaultEmissionFactor;
        }
        return emissionFactors.getOrDefault(category.name(), defaultEmissionFactor);
    }

    /**
     * Get water factor for a food category
     */
    private double getWaterFactor(FoodCategory category) {
        if (category == null) {
            return defaultWaterFactor;
        }
        return waterFactors.getOrDefault(category.name(), defaultWaterFactor);
    }

    /**
     * Get primary food category (first food-type category, excluding dietary labels)
     */
    private FoodCategory getPrimaryFoodCategory(Set<FoodCategory> categories) {
        if (categories == null || categories.isEmpty()) {
            return null;
        }

        return categories.stream()
            .filter(FoodCategory::isFoodType)
            .findFirst()
            .orElse(null);
    }

    // Getters for metadata
    public String getCurrentVersion() {
        return currentVersion;
    }

    public String getDisclosureText() {
        return disclosureText;
    }

    public Double getMinMealWeightKg() {
        return minMealWeightKg;
    }

    public Double getMaxMealWeightKg() {
        return maxMealWeightKg;
    }
}

