package com.example.foodflow.service;

import com.example.foodflow.model.types.FoodCategory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

/**
 * Service for calculating expiry dates based on fabrication date and food category.
 * Uses configurable shelf-life rules per food category to ensure food safety.
 */
@Service
public class ExpiryCalculationService {

    @Value("${foodflow.expiry.default-days:7}")
    private int defaultShelfLifeDays;

    // Shelf-life mapping by food category (in days)
    private static final Map<FoodCategory, Integer> SHELF_LIFE_DAYS = new EnumMap<>(FoodCategory.class);

    static {
        // Prepared Meals & Cooked Foods (3 days)
        SHELF_LIFE_DAYS.put(FoodCategory.PREPARED_MEALS, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.READY_TO_EAT, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.SOUPS, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.STEWS, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.SANDWICHES, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.SALADS, 2);

        // Fresh Bakery (2-3 days)
        SHELF_LIFE_DAYS.put(FoodCategory.BREAD, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.BAKERY_PASTRY, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.BAKED_GOODS, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.BAKERY_ITEMS, 3);

        // Fresh Fruits & Vegetables (5-7 days)
        SHELF_LIFE_DAYS.put(FoodCategory.FRUITS_VEGETABLES, 7);
        SHELF_LIFE_DAYS.put(FoodCategory.LEAFY_GREENS, 5);
        SHELF_LIFE_DAYS.put(FoodCategory.ROOT_VEGETABLES, 14);
        SHELF_LIFE_DAYS.put(FoodCategory.BERRIES, 5);
        SHELF_LIFE_DAYS.put(FoodCategory.CITRUS_FRUITS, 14);
        SHELF_LIFE_DAYS.put(FoodCategory.TROPICAL_FRUITS, 7);

        // Fresh Proteins (2-3 days refrigerated)
        SHELF_LIFE_DAYS.put(FoodCategory.FRESH_MEAT, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.GROUND_MEAT, 2);
        SHELF_LIFE_DAYS.put(FoodCategory.POULTRY, 3);
        SHELF_LIFE_DAYS.put(FoodCategory.FISH, 2);
        SHELF_LIFE_DAYS.put(FoodCategory.SEAFOOD, 2);
        SHELF_LIFE_DAYS.put(FoodCategory.EGGS, 14);

        // Dairy (7-14 days)
        SHELF_LIFE_DAYS.put(FoodCategory.MILK, 7);
        SHELF_LIFE_DAYS.put(FoodCategory.CHEESE, 14);
        SHELF_LIFE_DAYS.put(FoodCategory.YOGURT, 14);
        SHELF_LIFE_DAYS.put(FoodCategory.BUTTER, 21);
        SHELF_LIFE_DAYS.put(FoodCategory.CREAM, 7);
        SHELF_LIFE_DAYS.put(FoodCategory.DAIRY_COLD, 10);
        SHELF_LIFE_DAYS.put(FoodCategory.MILK_ALTERNATIVES, 10);
        SHELF_LIFE_DAYS.put(FoodCategory.PLANT_BASED_DAIRY, 10);

        // Frozen Foods (30 days for donation context)
        SHELF_LIFE_DAYS.put(FoodCategory.FROZEN, 30);
        SHELF_LIFE_DAYS.put(FoodCategory.FROZEN_MEALS, 30);
        SHELF_LIFE_DAYS.put(FoodCategory.FROZEN_VEGETABLES, 30);
        SHELF_LIFE_DAYS.put(FoodCategory.FROZEN_FRUITS, 30);

        // Dry Goods & Pantry (90 days)
        SHELF_LIFE_DAYS.put(FoodCategory.PACKAGED_PANTRY, 90);
        SHELF_LIFE_DAYS.put(FoodCategory.WHOLE_GRAINS, 90);
        SHELF_LIFE_DAYS.put(FoodCategory.CEREALS, 90);
        SHELF_LIFE_DAYS.put(FoodCategory.PASTA, 180);
        SHELF_LIFE_DAYS.put(FoodCategory.RICE, 180);
        SHELF_LIFE_DAYS.put(FoodCategory.FLOUR_BAKING_MIXES, 90);

        // Canned & Jarred (180 days)
        SHELF_LIFE_DAYS.put(FoodCategory.CANNED_VEGETABLES, 180);
        SHELF_LIFE_DAYS.put(FoodCategory.CANNED_FRUITS, 180);
        SHELF_LIFE_DAYS.put(FoodCategory.CANNED_BEANS, 180);
        SHELF_LIFE_DAYS.put(FoodCategory.CANNED_SOUP, 180);
        SHELF_LIFE_DAYS.put(FoodCategory.CANNED_MEAT_FISH, 180);

        // Legumes & Plant Proteins (60 days)
        SHELF_LIFE_DAYS.put(FoodCategory.LEGUMES, 90);
        SHELF_LIFE_DAYS.put(FoodCategory.BEANS, 90);
        SHELF_LIFE_DAYS.put(FoodCategory.LENTILS, 90);
        SHELF_LIFE_DAYS.put(FoodCategory.CHICKPEAS, 90);
        SHELF_LIFE_DAYS.put(FoodCategory.TOFU_TEMPEH, 7);
        SHELF_LIFE_DAYS.put(FoodCategory.PLANT_BASED_PROTEIN, 14);

        // Beverages (30 days)
        SHELF_LIFE_DAYS.put(FoodCategory.BEVERAGES, 30);
        SHELF_LIFE_DAYS.put(FoodCategory.JUICE, 14);

        // Snacks (60 days)
        SHELF_LIFE_DAYS.put(FoodCategory.CHIPS_CRACKERS, 60);
        SHELF_LIFE_DAYS.put(FoodCategory.COOKIES, 60);
        SHELF_LIFE_DAYS.put(FoodCategory.NUTS, 60);
        SHELF_LIFE_DAYS.put(FoodCategory.SEEDS, 60);

        // Condiments (90 days)
        SHELF_LIFE_DAYS.put(FoodCategory.CONDIMENTS, 90);
        SHELF_LIFE_DAYS.put(FoodCategory.SAUCES, 90);
        SHELF_LIFE_DAYS.put(FoodCategory.SPICES, 180);
        SHELF_LIFE_DAYS.put(FoodCategory.SEASONINGS, 180);
    }

    /**
     * Calculate expiry date based on fabrication date and food categories.
     * Uses the shortest shelf-life if multiple categories are present.
     *
     * @param fabricationDate The date the food was produced
     * @param foodCategories Set of food categories
     * @return Calculated expiry date
     */
    public LocalDate calculateExpiryDate(LocalDate fabricationDate, Set<FoodCategory> foodCategories) {
        if (fabricationDate == null) {
            throw new IllegalArgumentException("Fabrication date cannot be null");
        }

        if (foodCategories == null || foodCategories.isEmpty()) {
            // Use default shelf life if no categories specified
            return fabricationDate.plusDays(defaultShelfLifeDays);
        }

        // Find the shortest shelf-life among all categories (most conservative approach)
        int minShelfLifeDays = foodCategories.stream()
            .map(category -> SHELF_LIFE_DAYS.getOrDefault(category, defaultShelfLifeDays))
            .min(Integer::compareTo)
            .orElse(defaultShelfLifeDays);

        return fabricationDate.plusDays(minShelfLifeDays);
    }

    /**
     * Get the shelf-life in days for a specific food category.
     *
     * @param category The food category
     * @return Shelf-life in days
     */
    public int getShelfLifeDays(FoodCategory category) {
        return SHELF_LIFE_DAYS.getOrDefault(category, defaultShelfLifeDays);
    }

    /**
     * Get the minimum shelf-life in days for a set of food categories.
     *
     * @param foodCategories Set of food categories
     * @return Minimum shelf-life in days
     */
    public int getMinShelfLifeDays(Set<FoodCategory> foodCategories) {
        if (foodCategories == null || foodCategories.isEmpty()) {
            return defaultShelfLifeDays;
        }

        return foodCategories.stream()
            .map(category -> SHELF_LIFE_DAYS.getOrDefault(category, defaultShelfLifeDays))
            .min(Integer::compareTo)
            .orElse(defaultShelfLifeDays);
    }

    /**
     * Validate that fabrication date is not in the future.
     *
     * @param fabricationDate The date to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidFabricationDate(LocalDate fabricationDate) {
        if (fabricationDate == null) {
            return true; // Null is acceptable (optional field)
        }
        return !fabricationDate.isAfter(LocalDate.now());
    }

    /**
     * Validate that expiry date makes sense relative to fabrication date.
     * Should be after fabrication date and within reasonable limits.
     *
     * @param fabricationDate The fabrication date
     * @param expiryDate The expiry date
     * @return true if valid, false otherwise
     */
    public boolean isValidExpiryDate(LocalDate fabricationDate, LocalDate expiryDate) {
        if (fabricationDate == null || expiryDate == null) {
            return true; // Both optional
        }

        // Expiry must be after fabrication
        if (expiryDate.isBefore(fabricationDate)) {
            return false;
        }

        // Expiry shouldn't be more than 1 year after fabrication (sanity check)
        LocalDate maxExpiry = fabricationDate.plusYears(1);
        return !expiryDate.isAfter(maxExpiry);
    }
}

