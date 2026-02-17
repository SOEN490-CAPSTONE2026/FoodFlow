package com.example.foodflow.model.types;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public final class FoodTaxonomyContract {

    private FoodTaxonomyContract() {
    }

    public static final List<String> FOOD_TYPE_VALUES = Arrays.stream(FoodType.values())
            .map(Enum::name)
            .toList();

    public static final List<String> DIETARY_TAG_VALUES = Arrays.stream(DietaryTag.values())
            .map(Enum::name)
            .toList();

    public static String allowedFoodTypes() {
        return FOOD_TYPE_VALUES.stream().collect(Collectors.joining(", "));
    }

    public static String allowedDietaryTags() {
        return DIETARY_TAG_VALUES.stream().collect(Collectors.joining(", "));
    }
}
