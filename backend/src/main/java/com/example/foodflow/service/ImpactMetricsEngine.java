package com.example.foodflow.service;

import com.example.foodflow.model.types.FoodType;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class ImpactMetricsEngine {

    private static final double KG_PER_MEAL = 0.544d;

    private static final Map<FoodType, Double> CO2_KG_PER_KG_BY_FOOD_TYPE;
    private static final Map<FoodType, Double> WATER_L_PER_KG_BY_FOOD_TYPE;

    static {
        Map<FoodType, Double> co2 = new EnumMap<>(FoodType.class);
        co2.put(FoodType.PREPARED, 2.5d);
        co2.put(FoodType.PRODUCE, 0.8d);
        co2.put(FoodType.BAKERY, 1.5d);
        co2.put(FoodType.DAIRY_EGGS, 3.0d);
        co2.put(FoodType.MEAT_POULTRY, 6.0d);
        co2.put(FoodType.SEAFOOD, 5.0d);
        co2.put(FoodType.PANTRY, 1.2d);
        co2.put(FoodType.BEVERAGES, 0.7d);
        CO2_KG_PER_KG_BY_FOOD_TYPE = Collections.unmodifiableMap(co2);

        Map<FoodType, Double> water = new EnumMap<>(FoodType.class);
        water.put(FoodType.MEAT_POULTRY, 15000d);
        water.put(FoodType.SEAFOOD, 9000d);
        water.put(FoodType.DAIRY_EGGS, 5000d);
        water.put(FoodType.PREPARED, 2500d);
        water.put(FoodType.BAKERY, 1600d);
        water.put(FoodType.PRODUCE, 322d);
        water.put(FoodType.PANTRY, 1800d);
        water.put(FoodType.BEVERAGES, 250d);
        WATER_L_PER_KG_BY_FOOD_TYPE = Collections.unmodifiableMap(water);
    }

    public ImpactComputationResult computeImpactMetrics(
            List<DonationImpactRecord> donations,
            LocalDateTime periodStart,
            LocalDateTime periodEnd,
            LocalDateTime previousPeriodStart,
            LocalDateTime previousPeriodEnd) {

        List<DonationImpactRecord> safeDonations = donations == null ? List.of() : donations;
        List<DonationImpactRecord> currentWindow = safeDonations.stream()
                .filter(record -> isWithinRange(record.eventTime(), periodStart, periodEnd))
                .collect(Collectors.toList());
        List<DonationImpactRecord> previousWindow = safeDonations.stream()
                .filter(record -> isWithinRange(record.eventTime(), previousPeriodStart, previousPeriodEnd))
                .collect(Collectors.toList());

        List<ExcludedDonation> excluded = new ArrayList<>();
        ImpactTotals currentTotals = aggregate(currentWindow, excluded);
        ImpactTotals previousTotals = aggregate(previousWindow, excluded);

        ImpactDelta delta = new ImpactDelta(
                currentTotals.weightKg() - previousTotals.weightKg(),
                currentTotals.co2Kg() - previousTotals.co2Kg(),
                currentTotals.meals() - previousTotals.meals(),
                currentTotals.waterLiters() - previousTotals.waterLiters(),
                toPercent(currentTotals.weightKg(), previousTotals.weightKg()),
                toPercent(currentTotals.co2Kg(), previousTotals.co2Kg()),
                toPercent((double) currentTotals.meals(), (double) previousTotals.meals()),
                toPercent(currentTotals.waterLiters(), previousTotals.waterLiters()));

        ImpactAudit audit = new ImpactAudit(
                currentTotals.includedDonationIds(),
                excluded,
                new FactorSet(CO2_KG_PER_KG_BY_FOOD_TYPE, WATER_L_PER_KG_BY_FOOD_TYPE, KG_PER_MEAL));

        return new ImpactComputationResult(currentTotals, previousTotals, delta, audit);
    }

    private ImpactTotals aggregate(List<DonationImpactRecord> records, List<ExcludedDonation> excluded) {
        List<String> includedIds = new ArrayList<>();
        double totalWeight = 0d;
        double totalCo2 = 0d;
        double totalWater = 0d;

        for (DonationImpactRecord record : records) {
            String exclusionReason = getExclusionReason(record);
            if (exclusionReason != null) {
                excluded.add(new ExcludedDonation(record.id(), exclusionReason));
                continue;
            }

            FoodType foodType = record.foodType() == null ? FoodType.PANTRY : record.foodType();
            Double co2Factor = CO2_KG_PER_KG_BY_FOOD_TYPE.get(foodType);
            Double waterFactor = WATER_L_PER_KG_BY_FOOD_TYPE.get(foodType);
            if (co2Factor == null || waterFactor == null) {
                throw new IllegalStateException("Missing impact factor for foodType=" + foodType);
            }

            double weightKg = record.weightKg();
            totalWeight += weightKg;
            totalCo2 += weightKg * co2Factor;
            totalWater += weightKg * waterFactor;
            includedIds.add(record.id());
        }

        int meals = (int) Math.round(totalWeight / KG_PER_MEAL);
        return new ImpactTotals(totalWeight, totalCo2, meals, totalWater, includedIds);
    }

    private String getExclusionReason(DonationImpactRecord record) {
        if (record == null) {
            return "invalid_record";
        }
        if (!"picked_up".equalsIgnoreCase(Objects.toString(record.status(), ""))) {
            return "status_not_picked_up";
        }
        if (record.weightKg() <= 0d) {
            return "invalid_weight";
        }
        if (record.pickupTime() == null) {
            return "missing_pickup_time";
        }
        if (record.expirationTime() == null) {
            return "missing_expiration_time";
        }
        if (record.pickupTime().isAfter(record.expirationTime())) {
            return "picked_up_after_expiry";
        }
        return null;
    }

    private boolean isWithinRange(LocalDateTime value, LocalDateTime start, LocalDateTime end) {
        if (value == null || start == null || end == null) {
            return false;
        }
        return !value.isBefore(start) && !value.isAfter(end);
    }

    private Double toPercent(double current, double previous) {
        if (previous == 0d) {
            return null;
        }
        double pct = ((current - previous) / previous) * 100d;
        return Math.round(pct * 10d) / 10d;
    }

    public Map<FoodType, Double> getCo2KgPerKgByFoodType() {
        return CO2_KG_PER_KG_BY_FOOD_TYPE;
    }

    public Map<FoodType, Double> getWaterLPerKgByFoodType() {
        return WATER_L_PER_KG_BY_FOOD_TYPE;
    }

    public double getKgPerMeal() {
        return KG_PER_MEAL;
    }

    public record DonationImpactRecord(
            String id,
            String status,
            FoodType foodType,
            double weightKg,
            LocalDateTime pickupTime,
            LocalDateTime expirationTime,
            LocalDateTime eventTime) {
    }

    public record ImpactComputationResult(
            ImpactTotals current,
            ImpactTotals previous,
            ImpactDelta deltas,
            ImpactAudit audit) {
    }

    public record ImpactTotals(
            double weightKg,
            double co2Kg,
            int meals,
            double waterLiters,
            List<String> includedDonationIds) {
    }

    public record ImpactDelta(
            double weightAbs,
            double co2Abs,
            int mealsAbs,
            double waterAbs,
            Double weightPct,
            Double co2Pct,
            Double mealsPct,
            Double waterPct) {
    }

    public record ExcludedDonation(String id, String reason) {
    }

    public record FactorSet(
            Map<FoodType, Double> co2KgPerKgByFoodType,
            Map<FoodType, Double> waterLPerKgByFoodType,
            double kgPerMeal) {
    }

    public record ImpactAudit(
            List<String> includedDonationIds,
            List<ExcludedDonation> excludedDonationIds,
            FactorSet factorsUsed) {
    }
}
