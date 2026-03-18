package com.example.foodflow.service;

import com.example.foodflow.model.entity.ImpactConfiguration;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ImpactConfigurationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Comprehensive unit tests for ImpactCalculationService
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ImpactCalculationService Tests")
class ImpactCalculationServiceTest {

    @Mock
    private ImpactConfigurationRepository configRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ImpactCalculationService service;

    private SurplusPost testPost;

    @BeforeEach
    void setUp() {
        testPost = new SurplusPost();
        testPost.setId(1L);
        testPost.setTitle("Test Food");
    }

    @Nested
    @DisplayName("Configuration Loading Tests")
    class ConfigurationLoadingTests {

        @Test
        @DisplayName("Should load configuration from database on init")
        void shouldLoadConfigurationFromDatabase() throws Exception {
            // Given
            ImpactConfiguration config = new ImpactConfiguration("1.0-test");
            config.setEmissionFactorsJson("{\"BREAD\":0.8,\"DAIRY\":2.5}");
            config.setWaterFactorsJson("{\"BREAD\":800.0,\"DAIRY\":1000.0}");
            config.setMinMealWeightKg(0.4);
            config.setMaxMealWeightKg(0.6);
            config.setDefaultEmissionFactor(1.9);
            config.setDefaultWaterFactor(500.0);
            config.setIsActive(true);
            config.setDisclosureText("Test disclosure");

            when(configRepository.findByIsActiveTrue()).thenReturn(Optional.of(config));

            // When
            service.loadConfiguration();

            // Then
            assertEquals("1.0-test", service.getCurrentVersion());
            assertEquals("Test disclosure", service.getDisclosureText());
            assertEquals(0.4, service.getMinMealWeightKg());
            assertEquals(0.6, service.getMaxMealWeightKg());
        }

        @Test
        @DisplayName("Should use defaults when no configuration exists")
        void shouldUseDefaultsWhenNoConfiguration() {
            // Given
            when(configRepository.findByIsActiveTrue()).thenReturn(Optional.empty());

            // When
            service.loadConfiguration();

            // Then
            assertNotNull(service.getCurrentVersion());
            assertNotNull(service.getDisclosureText());
            verify(configRepository, times(1)).save(any(ImpactConfiguration.class));
        }

        @Test
        @DisplayName("Should handle configuration loading errors gracefully")
        void shouldHandleConfigurationLoadingErrors() {
            // Given
            when(configRepository.findByIsActiveTrue()).thenThrow(new RuntimeException("DB Error"));

            // When/Then - Should not throw
            assertDoesNotThrow(() -> service.loadConfiguration());
        }
    }

    @Nested
    @DisplayName("CO2 Calculation Tests")
    class CO2CalculationTests {

        @Test
        @DisplayName("Should calculate CO2 for BREAD category")
        void shouldCalculateCO2ForBread() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.BREAD);
            testPost.setFoodCategories(categories);

            // When - Using default factor 0.8 for BREAD
            double co2 = service.calculateCO2Avoided(testPost, 10.0);

            // Then
            assertTrue(co2 > 0);
            // Default BREAD factor is 0.8 kg CO2 per kg
            assertEquals(8.0, co2, 0.01);
        }

        @Test
        @DisplayName("Should calculate CO2 for DAIRY category")
        void shouldCalculateCO2ForDairy() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.DAIRY);
            testPost.setFoodCategories(categories);

            // When - Using default factor 2.5 for DAIRY
            double co2 = service.calculateCO2Avoided(testPost, 10.0);

            // Then
            assertTrue(co2 > 0);
            // Default DAIRY factor is 2.5 kg CO2 per kg
            assertEquals(25.0, co2, 0.01);
        }

        @Test
        @DisplayName("Should calculate CO2 for FRESH_MEAT category")
        void shouldCalculateCO2ForMeat() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.FRESH_MEAT);
            testPost.setFoodCategories(categories);

            // When - Using default factor 6.0 for FRESH_MEAT
            double co2 = service.calculateCO2Avoided(testPost, 10.0);

            // Then
            assertTrue(co2 > 0);
            // Default FRESH_MEAT factor is 6.0 kg CO2 per kg
            assertEquals(60.0, co2, 0.01);
        }

        @Test
        @DisplayName("Should calculate CO2 for FRUITS_VEGETABLES category")
        void shouldCalculateCO2ForVegetables() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.FRUITS_VEGETABLES);
            testPost.setFoodCategories(categories);

            // When - Using default factor 0.5 for FRUITS_VEGETABLES
            double co2 = service.calculateCO2Avoided(testPost, 10.0);

            // Then
            assertTrue(co2 > 0);
            // Default FRUITS_VEGETABLES factor is 0.5 kg CO2 per kg
            assertEquals(5.0, co2, 0.01);
        }

        @Test
        @DisplayName("Should use default factor when category is null")
        void shouldUseDefaultFactorWhenCategoryNull() {
            // Given
            testPost.setFoodCategories(null);

            // When
            double co2 = service.calculateCO2Avoided(testPost, 10.0);

            // Then
            assertTrue(co2 > 0);
            // Default factor is 1.9
            assertEquals(19.0, co2, 0.01);
        }

        @Test
        @DisplayName("Should use default factor for unknown category")
        void shouldUseDefaultFactorForUnknownCategory() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.VEGETARIAN); // Dietary label, not food type
            testPost.setFoodCategories(categories);

            // When
            double co2 = service.calculateCO2Avoided(testPost, 10.0);

            // Then
            assertTrue(co2 > 0);
            assertEquals(19.0, co2, 0.01); // Default factor
        }

        @Test
        @DisplayName("Should handle zero weight")
        void shouldHandleZeroWeight() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.BREAD);
            testPost.setFoodCategories(categories);

            // When
            double co2 = service.calculateCO2Avoided(testPost, 0.0);

            // Then
            assertEquals(0.0, co2);
        }
    }

    @Nested
    @DisplayName("Water Calculation Tests")
    class WaterCalculationTests {

        @Test
        @DisplayName("Should calculate water for BREAD category")
        void shouldCalculateWaterForBread() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.BREAD);
            testPost.setFoodCategories(categories);

            // When - Default BREAD factor is 800 liters per kg
            double water = service.calculateWaterSaved(testPost, 10.0);

            // Then
            assertEquals(8000.0, water, 0.01);
        }

        @Test
        @DisplayName("Should calculate water for DAIRY category")
        void shouldCalculateWaterForDairy() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.DAIRY);
            testPost.setFoodCategories(categories);

            // When - Default DAIRY factor is 1000 liters per kg
            double water = service.calculateWaterSaved(testPost, 10.0);

            // Then
            assertEquals(10000.0, water, 0.01);
        }

        @Test
        @DisplayName("Should calculate water for FRESH_MEAT category")
        void shouldCalculateWaterForMeat() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.FRESH_MEAT);
            testPost.setFoodCategories(categories);

            // When - Default FRESH_MEAT factor is 15000 liters per kg
            double water = service.calculateWaterSaved(testPost, 10.0);

            // Then
            assertEquals(150000.0, water, 0.01);
        }

        @Test
        @DisplayName("Should calculate water for FRUITS_VEGETABLES category")
        void shouldCalculateWaterForVegetables() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.FRUITS_VEGETABLES);
            testPost.setFoodCategories(categories);

            // When - Default FRUITS_VEGETABLES factor is 300 liters per kg
            double water = service.calculateWaterSaved(testPost, 10.0);

            // Then
            assertEquals(3000.0, water, 0.01);
        }

        @Test
        @DisplayName("Should use default factor when category is null")
        void shouldUseDefaultFactorWhenCategoryNull() {
            // Given
            testPost.setFoodCategories(null);

            // When
            double water = service.calculateWaterSaved(testPost, 10.0);

            // Then
            assertEquals(5000.0, water, 0.01); // Default factor is 500
        }
    }

    @Nested
    @DisplayName("Meal Range Calculation Tests")
    class MealRangeCalculationTests {

        @Test
        @DisplayName("Should calculate meal range for typical weight")
        void shouldCalculateMealRangeForTypicalWeight() {
            // Given - 10 kg of food
            // Default: minMealWeight = 0.4kg, maxMealWeight = 0.6kg

            // When
            int[] range = service.calculateMealRange(10.0);

            // Then
            assertEquals(2, range.length);
            int min = range[0];
            int max = range[1];

            // Min: floor(10 / 0.6) = 16
            // Max: ceil(10 / 0.4) = 25
            assertEquals(16, min);
            assertEquals(25, max);
            assertTrue(min < max);
        }

        @Test
        @DisplayName("Should calculate meal range for small weight")
        void shouldCalculateMealRangeForSmallWeight() {
            // Given - 1 kg of food

            // When
            int[] range = service.calculateMealRange(1.0);

            // Then
            int min = range[0];
            int max = range[1];

            // Min: floor(1 / 0.6) = 1
            // Max: ceil(1 / 0.4) = 3
            assertEquals(1, min);
            assertEquals(3, max);
        }

        @Test
        @DisplayName("Should calculate meal range for large weight")
        void shouldCalculateMealRangeForLargeWeight() {
            // Given - 100 kg of food

            // When
            int[] range = service.calculateMealRange(100.0);

            // Then
            int min = range[0];
            int max = range[1];

            // Min: floor(100 / 0.6) = 166
            // Max: ceil(100 / 0.4) = 250
            assertEquals(166, min);
            assertEquals(250, max);
        }

        @Test
        @DisplayName("Should handle zero weight")
        void shouldHandleZeroWeight() {
            // When
            int[] range = service.calculateMealRange(0.0);

            // Then
            assertEquals(0, range[0]);
            assertEquals(0, range[1]);
        }

        @Test
        @DisplayName("Should handle very small weight")
        void shouldHandleVerySmallWeight() {
            // Given - 0.1 kg of food (too small for a meal)

            // When
            int[] range = service.calculateMealRange(0.1);

            // Then
            int min = range[0];
            int max = range[1];

            // Should still return sensible values
            assertTrue(min >= 0);
            assertTrue(max >= min);
        }
    }

    @Nested
    @DisplayName("Quantity Conversion Tests")
    class QuantityConversionTests {

        @Test
        @DisplayName("Should convert kilograms correctly")
        void shouldConvertKilograms() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(10.0);
            quantity.setUnit(Quantity.Unit.KILOGRAM);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(10.0, kg);
        }

        @Test
        @DisplayName("Should convert grams to kilograms")
        void shouldConvertGrams() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(5000.0);
            quantity.setUnit(Quantity.Unit.GRAM);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(5.0, kg);
        }

        @Test
        @DisplayName("Should convert pounds to kilograms")
        void shouldConvertPounds() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(10.0);
            quantity.setUnit(Quantity.Unit.POUND);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(4.53592, kg, 0.001);
        }

        @Test
        @DisplayName("Should convert ounces to kilograms")
        void shouldConvertOunces() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(35.274);
            quantity.setUnit(Quantity.Unit.OUNCE);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(1.0, kg, 0.01);
        }

        @Test
        @DisplayName("Should convert tons to kilograms")
        void shouldConvertTons() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(1.0);
            quantity.setUnit(Quantity.Unit.TON);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(1000.0, kg);
        }

        @Test
        @DisplayName("Should convert liters to kilograms")
        void shouldConvertLiters() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(10.0);
            quantity.setUnit(Quantity.Unit.LITER);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(10.0, kg); // Approximation: 1L ≈ 1kg
        }

        @Test
        @DisplayName("Should convert milliliters to kilograms")
        void shouldConvertMilliliters() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(5000.0);
            quantity.setUnit(Quantity.Unit.MILLILITER);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(5.0, kg);
        }

        @Test
        @DisplayName("Should convert gallons to kilograms")
        void shouldConvertGallons() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(1.0);
            quantity.setUnit(Quantity.Unit.GALLON);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(3.78541, kg, 0.001);
        }

        @Test
        @DisplayName("Should convert pieces using estimate")
        void shouldConvertPieces() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(10.0);
            quantity.setUnit(Quantity.Unit.PIECE);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(5.0, kg); // 10 pieces * 0.5 kg/piece
        }

        @Test
        @DisplayName("Should convert servings using estimate")
        void shouldConvertServings() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(20.0);
            quantity.setUnit(Quantity.Unit.SERVING);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(10.0, kg); // 20 servings * 0.5 kg/serving
        }

        @Test
        @DisplayName("Should convert boxes using estimate")
        void shouldConvertBoxes() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(5.0);
            quantity.setUnit(Quantity.Unit.BOX);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(10.0, kg); // 5 boxes * 2 kg/box
        }

        @Test
        @DisplayName("Should convert cases using estimate")
        void shouldConvertCases() {
            // Given
            Quantity quantity = new Quantity();
            quantity.setValue(2.0);
            quantity.setUnit(Quantity.Unit.CASE);

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(20.0, kg); // 2 cases * 10 kg/case
        }

        @Test
        @DisplayName("Should handle null quantity")
        void shouldHandleNullQuantity() {
            // When
            double kg = service.convertToKg(null);

            // Then
            assertEquals(0.0, kg);
        }

        @Test
        @DisplayName("Should handle quantity with null value")
        void shouldHandleQuantityWithNullValue() {
            // Given - Create a Quantity with JPA no-args constructor (has null fields)
            Quantity quantity = new Quantity();
            // Note: Cannot set null value as setter validates, but JPA entities can have null fields

            // When
            double kg = service.convertToKg(quantity);

            // Then
            assertEquals(0.0, kg);
        }
    }

    @Nested
    @DisplayName("Metadata Getters Tests")
    class MetadataGettersTests {

        @Test
        @DisplayName("Should return current version")
        void shouldReturnCurrentVersion() {
            // When
            String version = service.getCurrentVersion();

            // Then
            assertNotNull(version);
            assertTrue(version.contains("default") || version.contains("test"));
        }

        @Test
        @DisplayName("Should return disclosure text")
        void shouldReturnDisclosureText() {
            // When
            String disclosure = service.getDisclosureText();

            // Then
            assertNotNull(disclosure);
            assertFalse(disclosure.isEmpty());
        }

        @Test
        @DisplayName("Should return min meal weight")
        void shouldReturnMinMealWeight() {
            // When
            Double minWeight = service.getMinMealWeightKg();

            // Then
            assertNotNull(minWeight);
            assertTrue(minWeight > 0);
            assertTrue(minWeight < 1.0); // Should be reasonable
        }

        @Test
        @DisplayName("Should return max meal weight")
        void shouldReturnMaxMealWeight() {
            // When
            Double maxWeight = service.getMaxMealWeightKg();

            // Then
            assertNotNull(maxWeight);
            assertTrue(maxWeight > 0);
            assertTrue(maxWeight < 2.0); // Should be reasonable
        }

        @Test
        @DisplayName("Min meal weight should be less than max meal weight")
        void minShouldBeLessThanMax() {
            // When
            Double minWeight = service.getMinMealWeightKg();
            Double maxWeight = service.getMaxMealWeightKg();

            // Then
            assertTrue(minWeight < maxWeight);
        }
    }

    @Nested
    @DisplayName("Category Priority Tests")
    class CategoryPriorityTests {

        @Test
        @DisplayName("Should prioritize food type over dietary labels")
        void shouldPrioritizeFoodTypeOverDietary() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.VEGETARIAN); // Dietary label
            categories.add(FoodCategory.BREAD); // Food type
            testPost.setFoodCategories(categories);

            // When
            double co2 = service.calculateCO2Avoided(testPost, 10.0);

            // Then
            // Should use BREAD factor (0.8), not default (1.9)
            assertEquals(8.0, co2, 0.01);
        }

        @Test
        @DisplayName("Should handle multiple food type categories")
        void shouldHandleMultipleFoodTypeCategories() {
            // Given
            Set<FoodCategory> categories = new HashSet<>();
            categories.add(FoodCategory.BREAD);
            categories.add(FoodCategory.DAIRY);
            testPost.setFoodCategories(categories);

            // When
            double co2 = service.calculateCO2Avoided(testPost, 10.0);

            // Then
            // Should use first food type found
            assertTrue(co2 > 0);
            // Could be BREAD (8.0) or DAIRY (25.0) depending on set iteration
            assertTrue(co2 == 8.0 || co2 == 25.0);
        }

        @Test
        @DisplayName("Should handle empty categories set")
        void shouldHandleEmptyCategoriesSet() {
            // Given
            testPost.setFoodCategories(new HashSet<>());

            // When
            double co2 = service.calculateCO2Avoided(testPost, 10.0);

            // Then
            // Should use default factor
            assertEquals(19.0, co2, 0.01);
        }
    }
}

