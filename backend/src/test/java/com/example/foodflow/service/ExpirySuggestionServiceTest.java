package com.example.foodflow.service;

import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.TemperatureCategory;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ExpirySuggestionServiceTest {

    private final ExpirySuggestionService service = new ExpirySuggestionService();

    @Test
    void preparedRefrigeratedShouldBeEligibleAndPlusThreeDays() {
        ExpirySuggestionService.SuggestionResult result = service.computeSuggestedExpiry(
                FoodType.PREPARED,
                TemperatureCategory.REFRIGERATED,
                PackagingType.SEALED,
                LocalDate.of(2026, 2, 17));

        assertThat(result.suggestedExpiryDate()).isEqualTo(LocalDate.of(2026, 2, 20));
        assertThat(result.eligible()).isTrue();
    }

    @Test
    void preparedRoomTemperatureShouldBeSameDayAndNotEligible() {
        ExpirySuggestionService.SuggestionResult result = service.computeSuggestedExpiry(
                FoodType.PREPARED,
                TemperatureCategory.ROOM_TEMPERATURE,
                PackagingType.SEALED,
                LocalDate.of(2026, 2, 17));

        assertThat(result.suggestedExpiryDate()).isEqualTo(LocalDate.of(2026, 2, 17));
        assertThat(result.eligible()).isFalse();
    }

    @Test
    void dairyRoomTemperatureShouldBeNotEligible() {
        ExpirySuggestionService.SuggestionResult result = service.computeSuggestedExpiry(
                FoodType.DAIRY_EGGS,
                TemperatureCategory.ROOM_TEMPERATURE,
                PackagingType.SEALED,
                LocalDate.of(2026, 2, 17));

        assertThat(result.eligible()).isFalse();
        assertThat(result.shelfLifeDays()).isEqualTo(0);
    }

    @Test
    void pantryRoomTemperatureShouldSuggestPlusThirtyDays() {
        ExpirySuggestionService.SuggestionResult result = service.computeSuggestedExpiry(
                FoodType.PANTRY,
                TemperatureCategory.ROOM_TEMPERATURE,
                PackagingType.BOXED,
                LocalDate.of(2026, 2, 17));

        assertThat(result.suggestedExpiryDate()).isEqualTo(LocalDate.of(2026, 3, 19));
        assertThat(result.eligible()).isTrue();
    }

    @Test
    void refrigeratedContainerAtRoomTemperatureShouldWarn() {
        ExpirySuggestionService.SuggestionResult result = service.computeSuggestedExpiry(
                FoodType.PRODUCE,
                TemperatureCategory.ROOM_TEMPERATURE,
                PackagingType.REFRIGERATED_CONTAINER,
                LocalDate.of(2026, 2, 17));

        assertThat(result.warnings()).contains("Packaging suggests cold storage, confirm temperature");
    }

    @Test
    void preparedHotCookedShouldStayEligibleWithWarningAndSameDay() {
        ExpirySuggestionService.SuggestionResult result = service.computeSuggestedExpiry(
                FoodType.PREPARED,
                TemperatureCategory.HOT_COOKED,
                PackagingType.OTHER,
                LocalDate.of(2026, 2, 17));

        assertThat(result.eligible()).isTrue();
        assertThat(result.suggestedExpiryDate()).isEqualTo(LocalDate.of(2026, 2, 17));
        assertThat(result.warnings()).contains("Hot food must be cooled and refrigerated to be eligible for donation");
    }
}
