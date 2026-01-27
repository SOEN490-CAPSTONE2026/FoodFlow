package com.example.foodflow.service;

import com.example.foodflow.model.types.FoodCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ExpiryCalculationServiceTest {

    private ExpiryCalculationService expiryCalculationService;

    @BeforeEach
    void setUp() {
        expiryCalculationService = new ExpiryCalculationService();
        ReflectionTestUtils.setField(expiryCalculationService, "defaultShelfLifeDays", 7);
    }

    @Test
    void testCalculateExpiryDate_PreparedMeals() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        Set<FoodCategory> categories = Set.of(FoodCategory.PREPARED_MEALS);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 23), expiryDate, "Prepared meals should have 3 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_Frozen() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 1);
        Set<FoodCategory> categories = Set.of(FoodCategory.FROZEN);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 31), expiryDate, "Frozen food should have 30 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_PackagedPantry() {
        LocalDate fabricationDate = LocalDate.of(2025, 10, 1);
        Set<FoodCategory> categories = Set.of(FoodCategory.PACKAGED_PANTRY);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 30), expiryDate, "Packaged pantry should have 90 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_MultipleCategories_UsesMinimum() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        Set<FoodCategory> categories = Set.of(FoodCategory.PREPARED_MEALS, FoodCategory.FROZEN);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 23), expiryDate,
            "Should use shortest shelf life (3 days) when multiple categories");
    }

    @Test
    void testCalculateExpiryDate_NoCategories_UsesDefault() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        Set<FoodCategory> categories = Set.of();

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 27), expiryDate, "Should use default 7 days when no categories");
    }

    @Test
    void testCalculateExpiryDate_NullFabricationDate_ThrowsException() {
        Set<FoodCategory> categories = Set.of(FoodCategory.PREPARED_MEALS);

        assertThrows(IllegalArgumentException.class, () -> {
            expiryCalculationService.calculateExpiryDate(null, categories);
        }, "Should throw exception for null fabrication date");
    }

    @Test
    void testIsValidFabricationDate_PastDate() {
        LocalDate pastDate = LocalDate.now().minusDays(5);
        assertTrue(expiryCalculationService.isValidFabricationDate(pastDate),
            "Past fabrication date should be valid");
    }

    @Test
    void testIsValidFabricationDate_Today() {
        LocalDate today = LocalDate.now();
        assertTrue(expiryCalculationService.isValidFabricationDate(today),
            "Today's fabrication date should be valid");
    }

    @Test
    void testIsValidFabricationDate_FutureDate() {
        LocalDate futureDate = LocalDate.now().plusDays(1);
        assertFalse(expiryCalculationService.isValidFabricationDate(futureDate),
            "Future fabrication date should be invalid");
    }

    @Test
    void testIsValidFabricationDate_Null() {
        assertTrue(expiryCalculationService.isValidFabricationDate(null),
            "Null fabrication date should be valid (optional field)");
    }

    @Test
    void testIsValidExpiryDate_AfterFabrication() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        LocalDate expiryDate = LocalDate.of(2025, 12, 25);

        assertTrue(expiryCalculationService.isValidExpiryDate(fabricationDate, expiryDate),
            "Expiry date after fabrication should be valid");
    }

    @Test
    void testIsValidExpiryDate_BeforeFabrication() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        LocalDate expiryDate = LocalDate.of(2025, 12, 15);

        assertFalse(expiryCalculationService.isValidExpiryDate(fabricationDate, expiryDate),
            "Expiry date before fabrication should be invalid");
    }

    @Test
    void testIsValidExpiryDate_MoreThanOneYear() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        LocalDate expiryDate = LocalDate.of(2027, 1, 1);

        assertFalse(expiryCalculationService.isValidExpiryDate(fabricationDate, expiryDate),
            "Expiry date more than 1 year after fabrication should be invalid");
    }

    @Test
    void testGetShelfLifeDays_PreparedMeals() {
        int days = expiryCalculationService.getShelfLifeDays(FoodCategory.PREPARED_MEALS);
        assertEquals(3, days, "Prepared meals should have 3 days shelf life");
    }

    @Test
    void testGetShelfLifeDays_UnknownCategory() {
        // Use a category that might not be in the map
        int days = expiryCalculationService.getShelfLifeDays(FoodCategory.LEAFY_GREENS);
        assertTrue(days > 0, "Unknown category should return a positive shelf life");
    }

    @Test
    void testGetMinShelfLifeDays() {
        Set<FoodCategory> categories = Set.of(
            FoodCategory.PREPARED_MEALS,  // 3 days
            FoodCategory.FROZEN,           // 30 days
            FoodCategory.BAKERY_PASTRY     // 3 days
        );

        int minDays = expiryCalculationService.getMinShelfLifeDays(categories);
        assertEquals(3, minDays, "Should return minimum shelf life from all categories");
    }

    // ==================== Additional Edge Case Tests ====================

    @Test
    void testCalculateExpiryDate_Salads_ShortestShelfLife() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        Set<FoodCategory> categories = Set.of(FoodCategory.SALADS);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 22), expiryDate, "Salads should have 2 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_Fish_ShortShelfLife() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        Set<FoodCategory> categories = Set.of(FoodCategory.FISH);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 22), expiryDate, "Fish should have 2 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_GroundMeat_ShortShelfLife() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        Set<FoodCategory> categories = Set.of(FoodCategory.GROUND_MEAT);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 22), expiryDate, "Ground meat should have 2 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_CannedGoods_LongShelfLife() {
        LocalDate fabricationDate = LocalDate.of(2025, 6, 1);
        Set<FoodCategory> categories = Set.of(FoodCategory.CANNED_VEGETABLES);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 11, 28), expiryDate, "Canned vegetables should have 180 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_Pasta_LongShelfLife() {
        LocalDate fabricationDate = LocalDate.of(2025, 6, 1);
        Set<FoodCategory> categories = Set.of(FoodCategory.PASTA);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 11, 28), expiryDate, "Pasta should have 180 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_Rice_LongShelfLife() {
        LocalDate fabricationDate = LocalDate.of(2025, 6, 1);
        Set<FoodCategory> categories = Set.of(FoodCategory.RICE);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 11, 28), expiryDate, "Rice should have 180 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_MixedPerishableAndNonPerishable() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        Set<FoodCategory> categories = Set.of(
            FoodCategory.SALADS,           // 2 days (shortest)
            FoodCategory.PACKAGED_PANTRY,  // 90 days
            FoodCategory.FROZEN            // 30 days
        );

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 22), expiryDate,
            "Should use shortest shelf life (2 days) for safety");
    }

    @Test
    void testCalculateExpiryDate_AllDairyProducts() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 15);
        Set<FoodCategory> categories = Set.of(
            FoodCategory.MILK,    // 7 days
            FoodCategory.CHEESE,  // 14 days
            FoodCategory.YOGURT   // 14 days
        );

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 22), expiryDate, "Should use shortest dairy shelf life (7 days)");
    }

    @Test
    void testCalculateExpiryDate_NullCategories_UsesDefault() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, null);

        assertEquals(LocalDate.of(2025, 12, 27), expiryDate, "Should use default 7 days for null categories");
    }

    @Test
    void testIsValidExpiryDate_SameDay() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        LocalDate expiryDate = LocalDate.of(2025, 12, 20);

        assertFalse(expiryCalculationService.isValidExpiryDate(fabricationDate, expiryDate),
            "Expiry date same as fabrication should be invalid");
    }

    @Test
    void testIsValidExpiryDate_OneYearExactly() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        LocalDate expiryDate = LocalDate.of(2026, 12, 20);

        assertTrue(expiryCalculationService.isValidExpiryDate(fabricationDate, expiryDate),
            "Expiry date exactly one year after should be valid");
    }

    @Test
    void testIsValidExpiryDate_NullFabricationDate() {
        LocalDate expiryDate = LocalDate.of(2025, 12, 25);

        assertTrue(expiryCalculationService.isValidExpiryDate(null, expiryDate),
            "Null fabrication date should be valid");
    }

    @Test
    void testIsValidExpiryDate_NullExpiryDate() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);

        assertTrue(expiryCalculationService.isValidExpiryDate(fabricationDate, null),
            "Null expiry date should be valid");
    }

    @Test
    void testIsValidExpiryDate_BothNull() {
        assertTrue(expiryCalculationService.isValidExpiryDate(null, null),
            "Both null dates should be valid");
    }

    @Test
    void testGetShelfLifeDays_AllFreshMeatCategories() {
        assertEquals(3, expiryCalculationService.getShelfLifeDays(FoodCategory.FRESH_MEAT));
        assertEquals(2, expiryCalculationService.getShelfLifeDays(FoodCategory.GROUND_MEAT));
        assertEquals(3, expiryCalculationService.getShelfLifeDays(FoodCategory.POULTRY));
        assertEquals(2, expiryCalculationService.getShelfLifeDays(FoodCategory.FISH));
        assertEquals(2, expiryCalculationService.getShelfLifeDays(FoodCategory.SEAFOOD));
    }

    @Test
    void testGetShelfLifeDays_AllBakeryCategories() {
        assertEquals(3, expiryCalculationService.getShelfLifeDays(FoodCategory.BREAD));
        assertEquals(3, expiryCalculationService.getShelfLifeDays(FoodCategory.BAKERY_PASTRY));
        assertEquals(3, expiryCalculationService.getShelfLifeDays(FoodCategory.BAKED_GOODS));
        assertEquals(3, expiryCalculationService.getShelfLifeDays(FoodCategory.BAKERY_ITEMS));
    }

    @Test
    void testGetShelfLifeDays_AllFrozenCategories() {
        assertEquals(30, expiryCalculationService.getShelfLifeDays(FoodCategory.FROZEN));
        assertEquals(30, expiryCalculationService.getShelfLifeDays(FoodCategory.FROZEN_MEALS));
        assertEquals(30, expiryCalculationService.getShelfLifeDays(FoodCategory.FROZEN_VEGETABLES));
        assertEquals(30, expiryCalculationService.getShelfLifeDays(FoodCategory.FROZEN_FRUITS));
    }

    @Test
    void testGetMinShelfLifeDays_EmptySet() {
        Set<FoodCategory> categories = Set.of();

        int minDays = expiryCalculationService.getMinShelfLifeDays(categories);

        assertEquals(7, minDays, "Empty set should return default shelf life");
    }

    @Test
    void testGetMinShelfLifeDays_NullSet() {
        int minDays = expiryCalculationService.getMinShelfLifeDays(null);

        assertEquals(7, minDays, "Null set should return default shelf life");
    }

    @Test
    void testGetMinShelfLifeDays_SingleCategory() {
        Set<FoodCategory> categories = Set.of(FoodCategory.PREPARED_MEALS);

        int minDays = expiryCalculationService.getMinShelfLifeDays(categories);

        assertEquals(3, minDays, "Single category should return its shelf life");
    }

    @Test
    void testGetMinShelfLifeDays_AllShortShelfLife() {
        Set<FoodCategory> categories = Set.of(
            FoodCategory.SALADS,       // 2 days
            FoodCategory.FISH,         // 2 days
            FoodCategory.GROUND_MEAT   // 2 days
        );

        int minDays = expiryCalculationService.getMinShelfLifeDays(categories);

        assertEquals(2, minDays, "Should return 2 days for all short shelf life items");
    }

    @Test
    void testCalculateExpiryDate_LeapYearHandling() {
        // Test around February 29 in a leap year
        LocalDate fabricationDate = LocalDate.of(2024, 2, 28);
        Set<FoodCategory> categories = Set.of(FoodCategory.PREPARED_MEALS); // 3 days

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2024, 3, 2), expiryDate, "Should correctly handle leap year calculation");
    }

    @Test
    void testCalculateExpiryDate_MonthBoundary() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 30);
        Set<FoodCategory> categories = Set.of(FoodCategory.PREPARED_MEALS); // 3 days

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2026, 1, 2), expiryDate, "Should correctly handle year boundary");
    }

    @Test
    void testCalculateExpiryDate_VeryOldFabricationDate() {
        LocalDate fabricationDate = LocalDate.of(2020, 1, 1);
        Set<FoodCategory> categories = Set.of(FoodCategory.FROZEN);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2020, 1, 31), expiryDate,
            "Should calculate expiry even for old fabrication dates");
    }

    @Test
    void testIsValidFabricationDate_FarPastDate() {
        LocalDate farPastDate = LocalDate.now().minusYears(2);

        assertTrue(expiryCalculationService.isValidFabricationDate(farPastDate),
            "Far past fabrication date should be valid");
    }

    @Test
    void testIsValidFabricationDate_FarFutureDate() {
        LocalDate farFutureDate = LocalDate.now().plusYears(1);

        assertFalse(expiryCalculationService.isValidFabricationDate(farFutureDate),
            "Far future fabrication date should be invalid");
    }

    @Test
    void testGetShelfLifeDays_Eggs_MediumShelfLife() {
        int days = expiryCalculationService.getShelfLifeDays(FoodCategory.EGGS);
        assertEquals(14, days, "Eggs should have 14 days shelf life");
    }

    @Test
    void testGetShelfLifeDays_TofuTempeh() {
        int days = expiryCalculationService.getShelfLifeDays(FoodCategory.TOFU_TEMPEH);
        assertEquals(7, days, "Tofu/Tempeh should have 7 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_PlantBasedProtein() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 15);
        Set<FoodCategory> categories = Set.of(FoodCategory.PLANT_BASED_PROTEIN);

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 29), expiryDate,
            "Plant-based protein should have 14 days shelf life");
    }

    @Test
    void testCalculateExpiryDate_ComplexMixedMeal() {
        LocalDate fabricationDate = LocalDate.of(2025, 12, 20);
        Set<FoodCategory> categories = Set.of(
            FoodCategory.PREPARED_MEALS,  // 3 days
            FoodCategory.LEAFY_GREENS,    // 5 days
            FoodCategory.DAIRY_COLD,      // 10 days
            FoodCategory.ROOT_VEGETABLES  // Not in map, uses default 7
        );

        LocalDate expiryDate = expiryCalculationService.calculateExpiryDate(fabricationDate, categories);

        assertEquals(LocalDate.of(2025, 12, 23), expiryDate,
            "Should use shortest shelf life (3 days) for complex meal");
    }
}

