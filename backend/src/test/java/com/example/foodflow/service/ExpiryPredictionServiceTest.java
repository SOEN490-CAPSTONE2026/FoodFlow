package com.example.foodflow.service;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.TemperatureCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import static org.assertj.core.api.Assertions.*;
@ExtendWith(MockitoExtension.class)
@DisplayName("ExpiryPredictionService Tests")
class ExpiryPredictionServiceTest {
    @InjectMocks
    private ExpiryPredictionService expiryPredictionService;
    private SurplusPost surplusPost;
    @BeforeEach
    void setUp() {
        surplusPost = new SurplusPost();
        surplusPost.setId(1L);
        surplusPost.setTitle("Test Food Item");
        surplusPost.setDescription("Test Description");
    }
    @Test
    @DisplayName("Should predict expiry for prepared food at room temperature")
    void predictPreparedFoodRoomTemperature() {
        surplusPost.setFoodType(FoodType.PREPARED);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.predictedExpiry()).isNotNull();
        assertThat(result.confidence()).isGreaterThan(0.55d);
        assertThat(result.version()).isEqualTo("rules_v1");
    }
    @Test
    @DisplayName("Should predict expiry for prepared food when refrigerated")
    void predictPreparedFoodRefrigerated() {
        surplusPost.setFoodType(FoodType.PREPARED);
        surplusPost.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThanOrEqualTo(0.75d);
    }
    @Test
    @DisplayName("Should predict expiry for produce at room temperature")
    void predictProduceRoomTemperature() {
        surplusPost.setFoodType(FoodType.PRODUCE);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThanOrEqualTo(0.65d);
    }
    @Test
    @DisplayName("Should predict expiry for produce when refrigerated")
    void predictProduceRefrigerated() {
        surplusPost.setFoodType(FoodType.PRODUCE);
        surplusPost.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThanOrEqualTo(0.75d);
    }
    @Test
    @DisplayName("Should predict expiry for bakery items")
    void predictBakeryItems() {
        surplusPost.setFoodType(FoodType.BAKERY);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThan(0.65d);
    }
    @Test
    @DisplayName("Should predict expiry for dairy and eggs")
    void predictDairyEggs() {
        surplusPost.setFoodType(FoodType.DAIRY_EGGS);
        surplusPost.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThanOrEqualTo(0.75d);
    }
    @Test
    @DisplayName("Should predict expiry for meat and poultry")
    void predictMeatPoultry() {
        surplusPost.setFoodType(FoodType.MEAT_POULTRY);
        surplusPost.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThanOrEqualTo(0.75d);
    }
    @Test
    @DisplayName("Should predict expiry for seafood")
    void predictSeafood() {
        surplusPost.setFoodType(FoodType.SEAFOOD);
        surplusPost.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThanOrEqualTo(0.75d);
    }
    @Test
    @DisplayName("Should predict expiry for pantry items")
    void predictPantryItems() {
        surplusPost.setFoodType(FoodType.PANTRY);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThan(0.65d);
    }
    @Test
    @DisplayName("Should predict expiry for beverages")
    void predictBeverages() {
        surplusPost.setFoodType(FoodType.BEVERAGES);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThan(0.65d);
    }
    @Test
    @DisplayName("Should apply frozen temperature extension")
    void predictFrozenFood() {
        surplusPost.setFoodType(FoodType.PRODUCE);
        surplusPost.setTemperatureCategory(TemperatureCategory.FROZEN);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThanOrEqualTo(0.75d);
    }
    @Test
    @DisplayName("Should apply sealed packaging adjustment")
    void predictWithSealedPackaging() {
        surplusPost.setFoodType(FoodType.PANTRY);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        surplusPost.setPackagingType(PackagingType.SEALED);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isEqualTo(0.85d); // Base + temperature + packaging + foodtype
    }
    @Test
    @DisplayName("Should apply vacuum packed packaging adjustment")
    void predictWithVacuumPackedPackaging() {
        surplusPost.setFoodType(FoodType.MEAT_POULTRY);
        surplusPost.setTemperatureCategory(TemperatureCategory.FROZEN);
        surplusPost.setPackagingType(PackagingType.VACUUM_PACKED);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isEqualTo(0.85d); // Base + temperature + packaging + foodtype
    }
    @Test
    @DisplayName("Should apply loose packaging adjustment (reduction)")
    void predictWithLoosePackaging() {
        surplusPost.setFoodType(FoodType.PRODUCE);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        surplusPost.setPackagingType(PackagingType.LOOSE);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThanOrEqualTo(0.65d);
    }
    @Test
    @DisplayName("Should use fabrication date when available")
    void predictWithFabricationDate() {
        surplusPost.setFoodType(FoodType.BAKERY);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        surplusPost.setFabricationDate(LocalDate.now().minusDays(1));
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThan(0.70d); // Increased due to fabrication date
    }
    @Test
    @DisplayName("Should handle null food type with default pantry")
    void predictWithNullFoodType() {
        surplusPost.setFoodType(null);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThan(0.55d);
    }
    @Test
    @DisplayName("Should handle null temperature with default room temperature")
    void predictWithNullTemperature() {
        surplusPost.setFoodType(FoodType.PANTRY);
        surplusPost.setTemperatureCategory(null);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThanOrEqualTo(0.65d);
    }
    @Test
    @DisplayName("Should handle null packaging type")
    void predictWithNullPackagingType() {
        surplusPost.setFoodType(FoodType.PANTRY);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        surplusPost.setPackagingType(null);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThan(0.65d);
    }
    @Test
    @DisplayName("Should include inputs in prediction result")
    void predictIncludesInputs() {
        surplusPost.setFoodType(FoodType.PRODUCE);
        surplusPost.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        surplusPost.setPackagingType(PackagingType.SEALED);
        surplusPost.setFabricationDate(LocalDate.now());
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result.inputs()).isNotEmpty();
        assertThat(result.inputs()).containsKey("foodType");
        assertThat(result.inputs()).containsKey("temperatureCategory");
        assertThat(result.inputs()).containsKey("packagingType");
        assertThat(result.inputs()).containsKey("fabricatedAtUsed");
        assertThat(result.inputs().get("fabricatedAtUsed")).isEqualTo(true);
    }
    @Test
    @DisplayName("Should cap confidence at 95 percent")
    void predictCapConfidenceAt95Percent() {
        surplusPost.setFoodType(FoodType.PANTRY);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        surplusPost.setPackagingType(PackagingType.SEALED);
        surplusPost.setFabricationDate(LocalDate.now());
        surplusPost.setTitle("Test");
        surplusPost.setDescription("Test Description");
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result.confidence()).isEqualTo(0.95d);
    }
    @Test
    @DisplayName("Should apply bulk packaging adjustment")
    void predictWithBulkPackaging() {
        surplusPost.setFoodType(FoodType.PANTRY);
        surplusPost.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        surplusPost.setPackagingType(PackagingType.BULK);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThan(0.65d);
    }
    @Test
    @DisplayName("Should apply other packaging adjustment")
    void predictWithOtherPackaging() {
        surplusPost.setFoodType(FoodType.BEVERAGES);
        surplusPost.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        surplusPost.setPackagingType(PackagingType.OTHER);
        ExpiryPredictionService.PredictionResult result = expiryPredictionService.predict(surplusPost);
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isGreaterThan(0.75d);
    }
}
