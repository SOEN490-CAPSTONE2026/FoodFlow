package com.example.foodflow.service;

import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.TemperatureCategory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;

@Service
public class ExpiryPredictionService {

    public static final String VERSION = "rules_v1";

    public PredictionResult predict(SurplusPost post) {
        FoodType foodType = post.getFoodType();
        TemperatureCategory temperatureCategory = post.getTemperatureCategory();
        PackagingType packagingType = post.getPackagingType();

        Instant baseInstant = resolveBaseTimestamp(post);
        Duration shelfLife = resolveBaseShelfLife(foodType, temperatureCategory);
        shelfLife = applyTemperatureAdjustments(shelfLife, temperatureCategory);
        shelfLife = applyPackagingAdjustments(shelfLife, packagingType);

        Instant predictedExpiry = baseInstant.plus(shelfLife);

        double confidence = 0.55d;
        if (post.getFabricationDate() != null) {
            confidence += 0.15d;
        }
        if (temperatureCategory != null) {
            confidence += 0.10d;
        }
        if (packagingType != null) {
            confidence += 0.10d;
        }
        if (foodType != null) {
            confidence += 0.10d;
        }
        confidence = Math.min(confidence, 0.95d);

        Map<String, Object> inputs = new HashMap<>();
        inputs.put("foodType", foodType != null ? foodType.name() : null);
        inputs.put("temperatureCategory", temperatureCategory != null ? temperatureCategory.name() : null);
        inputs.put("packagingType", packagingType != null ? packagingType.name() : null);
        inputs.put("fabricatedAtUsed", post.getFabricationDate() != null);
        inputs.put("baseTimestamp", baseInstant.toString());
        inputs.put("titlePresent", post.getTitle() != null && !post.getTitle().isBlank());
        inputs.put("descriptionPresent", post.getDescription() != null && !post.getDescription().isBlank());
        inputs.put("version", VERSION);

        return new PredictionResult(predictedExpiry, confidence, VERSION, inputs);
    }

    private Instant resolveBaseTimestamp(SurplusPost post) {
        if (post.getFabricationDate() != null) {
            return post.getFabricationDate().atStartOfDay().toInstant(ZoneOffset.UTC);
        }
        if (post.getCreatedAt() != null) {
            return post.getCreatedAt().toInstant(ZoneOffset.UTC);
        }
        return Instant.now();
    }

    private Duration resolveBaseShelfLife(FoodType foodType, TemperatureCategory temperatureCategory) {
        TemperatureCategory temp = temperatureCategory != null ? temperatureCategory : TemperatureCategory.ROOM_TEMPERATURE;
        FoodType type = foodType != null ? foodType : FoodType.PANTRY;

        return switch (type) {
            case PREPARED -> isAmbient(temp) ? Duration.ofHours(6) : Duration.ofDays(1);
            case PRODUCE -> isAmbient(temp) ? Duration.ofDays(1) : Duration.ofDays(3);
            case BAKERY -> isAmbient(temp) ? Duration.ofDays(2) : Duration.ofDays(4);
            case DAIRY_EGGS -> Duration.ofDays(5);
            case MEAT_POULTRY -> isAmbient(temp) ? Duration.ofHours(6) : Duration.ofDays(1);
            case SEAFOOD -> isAmbient(temp) ? Duration.ofHours(4) : Duration.ofDays(1);
            case PANTRY -> Duration.ofDays(30);
            case BEVERAGES -> isAmbient(temp) ? Duration.ofDays(30) : Duration.ofDays(7);
        };
    }

    private Duration applyTemperatureAdjustments(Duration baseShelfLife, TemperatureCategory temperatureCategory) {
        if (temperatureCategory == TemperatureCategory.FROZEN) {
            Duration extended = baseShelfLife.plus(Duration.ofDays(30));
            Duration maxCap = Duration.ofDays(60);
            return extended.compareTo(maxCap) > 0 ? maxCap : extended;
        }
        return baseShelfLife;
    }

    private Duration applyPackagingAdjustments(Duration baseShelfLife, PackagingType packagingType) {
        if (packagingType == null) {
            return baseShelfLife;
        }

        if (packagingType == PackagingType.SEALED || packagingType == PackagingType.VACUUM_PACKED) {
            return baseShelfLife.plusMinutes((long) (baseShelfLife.toMinutes() * 0.20d));
        }

        if (packagingType == PackagingType.LOOSE || packagingType == PackagingType.BULK || packagingType == PackagingType.OTHER) {
            long reducedMinutes = (long) (baseShelfLife.toMinutes() * 0.70d);
            return Duration.ofMinutes(Math.max(reducedMinutes, 60));
        }

        return baseShelfLife;
    }

    private boolean isAmbient(TemperatureCategory temperatureCategory) {
        return temperatureCategory == TemperatureCategory.ROOM_TEMPERATURE
                || temperatureCategory == TemperatureCategory.HOT_COOKED;
    }

    public record PredictionResult(
            Instant predictedExpiry,
            double confidence,
            String version,
            Map<String, Object> inputs
    ) {
    }
}
