package com.example.foodflow.service;

import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.TemperatureCategory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExpirySuggestionService {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    public SuggestionResult computeSuggestedExpiry(
            FoodType foodType,
            TemperatureCategory temperatureCategory,
            PackagingType packagingType,
            LocalDate fabricationDate) {

        if (foodType == null || temperatureCategory == null) {
            return new SuggestionResult(null, null, true, List.of(), null);
        }

        List<String> warnings = new ArrayList<>();
        appendPackagingMismatchWarnings(packagingType, temperatureCategory, warnings);

        boolean eligible = isEligible(foodType, temperatureCategory);
        Integer shelfLifeDays = resolveShelfLifeDays(foodType, temperatureCategory, warnings);

        LocalDate suggestedExpiryDate = fabricationDate != null && shelfLifeDays != null
                ? fabricationDate.plusDays(shelfLifeDays)
                : null;

        String explanation = suggestedExpiryDate != null
                ? "Suggested expiry: " + suggestedExpiryDate.format(ISO_DATE)
                + " (based on " + foodType.name() + " + " + temperatureCategory.name() + ")"
                : null;

        return new SuggestionResult(suggestedExpiryDate, shelfLifeDays, eligible, warnings, explanation);
    }

    private void appendPackagingMismatchWarnings(PackagingType packagingType,
            TemperatureCategory temperatureCategory,
            List<String> warnings) {
        if (packagingType == PackagingType.REFRIGERATED_CONTAINER
                && (temperatureCategory == TemperatureCategory.ROOM_TEMPERATURE
                || temperatureCategory == TemperatureCategory.HOT_COOKED)) {
            warnings.add("Packaging suggests cold storage, confirm temperature");
        }

        if (packagingType == PackagingType.FROZEN_CONTAINER
                && temperatureCategory != TemperatureCategory.FROZEN) {
            warnings.add("Packaging suggests frozen storage, confirm temperature");
        }
    }

    private boolean isEligible(FoodType foodType, TemperatureCategory temperatureCategory) {
        if (temperatureCategory == TemperatureCategory.ROOM_TEMPERATURE) {
            return foodType != FoodType.PREPARED
                    && foodType != FoodType.DAIRY_EGGS
                    && foodType != FoodType.MEAT_POULTRY
                    && foodType != FoodType.SEAFOOD;
        }

        if (temperatureCategory == TemperatureCategory.HOT_COOKED) {
            return foodType != FoodType.DAIRY_EGGS
                    && foodType != FoodType.MEAT_POULTRY
                    && foodType != FoodType.SEAFOOD;
        }

        return true;
    }

    private Integer resolveShelfLifeDays(FoodType foodType,
            TemperatureCategory temperatureCategory,
            List<String> warnings) {
        return switch (foodType) {
            case PREPARED -> switch (temperatureCategory) {
                case FROZEN -> 30;
                case REFRIGERATED -> 3;
                case ROOM_TEMPERATURE -> 0;
                case HOT_COOKED -> {
                    warnings.add("Hot food must be cooled and refrigerated to be eligible for donation");
                    yield 0;
                }
            };
            case PRODUCE -> switch (temperatureCategory) {
                case FROZEN -> 30;
                case REFRIGERATED -> 5;
                case ROOM_TEMPERATURE -> 2;
                case HOT_COOKED -> {
                    warnings.add("Produce is usually not hot/cooked");
                    yield 2;
                }
            };
            case BAKERY -> switch (temperatureCategory) {
                case FROZEN -> 30;
                case REFRIGERATED -> 3;
                case ROOM_TEMPERATURE -> 1;
                case HOT_COOKED -> 1;
            };
            case DAIRY_EGGS -> switch (temperatureCategory) {
                case FROZEN -> 30;
                case REFRIGERATED -> 3;
                case ROOM_TEMPERATURE, HOT_COOKED -> 0;
            };
            case MEAT_POULTRY -> switch (temperatureCategory) {
                case FROZEN -> 30;
                case REFRIGERATED -> 1;
                case ROOM_TEMPERATURE, HOT_COOKED -> 0;
            };
            case SEAFOOD -> switch (temperatureCategory) {
                case FROZEN -> 30;
                case REFRIGERATED -> 1;
                case ROOM_TEMPERATURE, HOT_COOKED -> 0;
            };
            case PANTRY -> switch (temperatureCategory) {
                case FROZEN -> 60;
                case REFRIGERATED, ROOM_TEMPERATURE -> 30;
                case HOT_COOKED -> {
                    warnings.add("Pantry items are usually stored at room temperature");
                    yield 30;
                }
            };
            case BEVERAGES -> switch (temperatureCategory) {
                case FROZEN -> 30;
                case REFRIGERATED, ROOM_TEMPERATURE -> 7;
                case HOT_COOKED -> {
                    warnings.add("Hot beverages are same-day donations");
                    yield 0;
                }
            };
        };
    }

    public record SuggestionResult(
            LocalDate suggestedExpiryDate,
            Integer shelfLifeDays,
            boolean eligible,
            List<String> warnings,
            String explanation) {
    }
}
