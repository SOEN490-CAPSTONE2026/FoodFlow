package com.example.foodflow.service;

import com.example.foodflow.model.types.FoodType;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ImpactMetricsEngineTest {

    private final ImpactMetricsEngine engine = new ImpactMetricsEngine();

    @Test
    void shouldIncludeOnlyEligibleDonationsAndReturnExclusionReasons() {
        LocalDateTime currentStart = LocalDateTime.of(2026, 2, 1, 0, 0);
        LocalDateTime currentEnd = LocalDateTime.of(2026, 2, 28, 23, 59);
        LocalDateTime previousStart = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime previousEnd = LocalDateTime.of(2026, 1, 31, 23, 59);

        List<ImpactMetricsEngine.DonationImpactRecord> donations = List.of(
                donation("1", "picked_up", FoodType.PREPARED, 10d, t("2026-02-10T12:00"), t("2026-02-11T00:00"), t("2026-02-10T12:00")),
                donation("2", "picked_up", FoodType.MEAT_POULTRY, 5d, t("2026-02-15T09:00"), t("2026-02-15T10:00"), t("2026-02-15T09:00")),
                donation("3", "picked_up", FoodType.PANTRY, 4d, t("2026-02-20T12:00"), t("2026-02-19T12:00"), t("2026-02-20T12:00")),
                donation("4", "available", FoodType.PRODUCE, 6d, t("2026-02-16T10:00"), t("2026-02-18T10:00"), t("2026-02-16T10:00")),
                donation("5", "picked_up", FoodType.SEAFOOD, 0d, t("2026-02-18T10:00"), t("2026-02-20T10:00"), t("2026-02-18T10:00")),
                donation("6", "picked_up", FoodType.BAKERY, 3d, t("2026-01-10T10:00"), t("2026-01-11T10:00"), t("2026-01-10T10:00")));

        ImpactMetricsEngine.ImpactComputationResult result = engine.computeImpactMetrics(
                donations, currentStart, currentEnd, previousStart, previousEnd);

        assertThat(result.current().weightKg()).isEqualTo(15d);
        assertThat(result.current().co2Kg()).isEqualTo(55d);
        assertThat(result.current().waterLiters()).isEqualTo(100000d);
        assertThat(result.current().meals()).isEqualTo(28);
        assertThat(result.current().includedDonationIds()).containsExactly("1", "2");

        assertThat(result.audit().excludedDonationIds())
                .extracting(ImpactMetricsEngine.ExcludedDonation::id)
                .contains("3", "4", "5");
        assertThat(result.audit().excludedDonationIds())
                .extracting(ImpactMetricsEngine.ExcludedDonation::reason)
                .contains("picked_up_after_expiry", "status_not_picked_up", "invalid_weight");
    }

    @Test
    void shouldCalculatePercentDeltasAndHandleZeroPrevious() {
        LocalDateTime currentStart = LocalDateTime.of(2026, 2, 1, 0, 0);
        LocalDateTime currentEnd = LocalDateTime.of(2026, 2, 28, 23, 59);
        LocalDateTime previousStart = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime previousEnd = LocalDateTime.of(2026, 1, 31, 23, 59);

        List<ImpactMetricsEngine.DonationImpactRecord> withPrevious = List.of(
                donation("1", "picked_up", FoodType.PRODUCE, 10d, t("2026-02-10T10:00"), t("2026-02-11T10:00"), t("2026-02-10T10:00")),
                donation("2", "picked_up", FoodType.PRODUCE, 5d, t("2026-01-10T10:00"), t("2026-01-11T10:00"), t("2026-01-10T10:00")));

        ImpactMetricsEngine.ImpactComputationResult withPreviousResult = engine.computeImpactMetrics(
                withPrevious, currentStart, currentEnd, previousStart, previousEnd);

        assertThat(withPreviousResult.deltas().weightAbs()).isEqualTo(5d);
        assertThat(withPreviousResult.deltas().weightPct()).isEqualTo(100d);
        assertThat(withPreviousResult.deltas().mealsPct()).isEqualTo(100d);

        List<ImpactMetricsEngine.DonationImpactRecord> noPrevious = List.of(
                donation("3", "picked_up", FoodType.BEVERAGES, 7d, t("2026-02-12T10:00"), t("2026-02-13T10:00"), t("2026-02-12T10:00")));

        ImpactMetricsEngine.ImpactComputationResult noPreviousResult = engine.computeImpactMetrics(
                noPrevious, currentStart, currentEnd, previousStart, previousEnd);

        assertThat(noPreviousResult.deltas().weightPct()).isNull();
        assertThat(noPreviousResult.deltas().co2Pct()).isNull();
        assertThat(noPreviousResult.deltas().mealsPct()).isNull();
        assertThat(noPreviousResult.deltas().waterPct()).isNull();
    }

    @Test
    void shouldExposeDeterministicFactorSet() {
        assertThat(engine.getKgPerMeal()).isEqualTo(0.544d);
        assertThat(engine.getCo2KgPerKgByFoodType().get(FoodType.PREPARED)).isEqualTo(2.5d);
        assertThat(engine.getWaterLPerKgByFoodType().get(FoodType.SEAFOOD)).isEqualTo(9000d);
    }

    private ImpactMetricsEngine.DonationImpactRecord donation(
            String id,
            String status,
            FoodType foodType,
            double weightKg,
            LocalDateTime pickupTime,
            LocalDateTime expirationTime,
            LocalDateTime eventTime) {
        return new ImpactMetricsEngine.DonationImpactRecord(
                id, status, foodType, weightKg, pickupTime, expirationTime, eventTime);
    }

    private LocalDateTime t(String value) {
        return LocalDateTime.parse(value);
    }
}
