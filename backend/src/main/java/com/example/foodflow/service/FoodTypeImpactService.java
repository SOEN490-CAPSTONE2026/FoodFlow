package com.example.foodflow.service;

import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.Quantity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class FoodTypeImpactService {

    private static final String FACTOR_VERSION = "impact_v1";

    private final Map<FoodType, ImpactFactor> factorsByFoodType;
    private final ObjectMapper objectMapper;

    @Autowired
    public FoodTypeImpactService(ObjectMapper objectMapper) {
        this(defaultFactors(), objectMapper);
    }

    FoodTypeImpactService(Map<FoodType, ImpactFactor> factorsByFoodType, ObjectMapper objectMapper) {
        this.factorsByFoodType = new EnumMap<>(factorsByFoodType);
        this.objectMapper = objectMapper;
    }

    public ImpactSnapshot compute(SurplusPost post) {
        if (post == null) {
            throw new IllegalArgumentException("Surplus post is required for impact computation");
        }
        if (post.getQuantity() == null || post.getQuantity().getValue() == null || post.getQuantity().getUnit() == null) {
            throw new IllegalArgumentException("Quantity is required to compute impact");
        }

        FoodType foodType = post.getFoodType() != null ? post.getFoodType() : FoodType.PANTRY;
        ImpactFactor factor = factorsByFoodType.get(foodType);
        if (factor == null) {
            throw new IllegalStateException("No impact factor configured for foodType=" + foodType);
        }

        double weightKg = convertToKg(post.getQuantity());
        if (weightKg <= 0) {
            throw new IllegalArgumentException("Computed weight must be positive to compute impact");
        }

        double co2eAvoided = weightKg * factor.co2eKgPerKg();
        double waterSaved = weightKg * factor.waterLitersPerKg();
        LocalDateTime computedAt = LocalDateTime.now();

        Map<String, Object> inputs = new LinkedHashMap<>();
        inputs.put("foodType", foodType.name());
        inputs.put("quantityValue", post.getQuantity().getValue());
        inputs.put("quantityUnit", post.getQuantity().getUnit().name());
        inputs.put("weightKg", weightKg);
        inputs.put("co2eKgPerKg", factor.co2eKgPerKg());
        inputs.put("waterLitersPerKg", factor.waterLitersPerKg());
        inputs.put("factorVersion", FACTOR_VERSION);

        return new ImpactSnapshot(
                co2eAvoided,
                waterSaved,
                FACTOR_VERSION,
                computedAt,
                serialize(inputs));
    }

    public void applyImpactSnapshot(SurplusPost post) {
        ImpactSnapshot snapshot = compute(post);
        post.setImpactCo2eKg(snapshot.co2eAvoidedKg());
        post.setImpactWaterL(snapshot.waterSavedLiters());
        post.setImpactFactorVersion(snapshot.factorVersion());
        post.setImpactComputedAt(snapshot.computedAt());
        post.setImpactInputs(snapshot.inputsJson());
    }

    public String getFactorVersion() {
        return FACTOR_VERSION;
    }

    private String serialize(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{\"serializationError\":true}";
        }
    }

    private double convertToKg(Quantity quantity) {
        double value = quantity.getValue();
        return switch (quantity.getUnit()) {
            case KILOGRAM -> value;
            case GRAM -> value / 1000.0;
            case POUND -> value * 0.453592;
            case OUNCE -> value * 0.0283495;
            case TON -> value * 1000.0;
            case LITER -> value;
            case MILLILITER -> value / 1000.0;
            case GALLON -> value * 3.78541;
            case QUART -> value * 0.946353;
            case PINT -> value * 0.473176;
            case FLUID_OUNCE -> value * 0.0295735;
            case CUP -> value * 0.236588;
            case PIECE, ITEM, UNIT, CAN, BOTTLE, JAR, PACKAGE, BOX, BAG, CARTON, CONTAINER, CASE, DOZEN, SERVING,
                    PORTION, LOAF, BUNCH, HEAD -> value * 0.5;
        };
    }

    private static Map<FoodType, ImpactFactor> defaultFactors() {
        Map<FoodType, ImpactFactor> factors = new EnumMap<>(FoodType.class);
        factors.put(FoodType.PREPARED, new ImpactFactor(2.2, 900.0));
        factors.put(FoodType.PRODUCE, new ImpactFactor(0.5, 300.0));
        factors.put(FoodType.BAKERY, new ImpactFactor(0.8, 800.0));
        factors.put(FoodType.DAIRY_EGGS, new ImpactFactor(2.5, 1000.0));
        factors.put(FoodType.MEAT_POULTRY, new ImpactFactor(5.5, 9000.0));
        factors.put(FoodType.SEAFOOD, new ImpactFactor(3.2, 3500.0));
        factors.put(FoodType.PANTRY, new ImpactFactor(1.0, 600.0));
        factors.put(FoodType.BEVERAGES, new ImpactFactor(0.7, 250.0));
        return factors;
    }

    record ImpactFactor(double co2eKgPerKg, double waterLitersPerKg) {
    }

    public record ImpactSnapshot(
            double co2eAvoidedKg,
            double waterSavedLiters,
            String factorVersion,
            LocalDateTime computedAt,
            String inputsJson) {
    }
}
