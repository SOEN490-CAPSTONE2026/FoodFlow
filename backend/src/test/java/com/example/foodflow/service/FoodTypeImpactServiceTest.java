package com.example.foodflow.service;

import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.Quantity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.EnumMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FoodTypeImpactServiceTest {

    @Test
    void shouldUseFoodTypeFactorForImpactComputation() {
        FoodTypeImpactService service = new FoodTypeImpactService(new ObjectMapper());
        SurplusPost post = new SurplusPost();
        post.setFoodType(FoodType.PREPARED);
        post.setQuantity(new Quantity(2.0, Quantity.Unit.KILOGRAM));

        FoodTypeImpactService.ImpactSnapshot snapshot = service.compute(post);

        assertThat(snapshot.co2eAvoidedKg()).isEqualTo(4.4d);
        assertThat(snapshot.waterSavedLiters()).isEqualTo(1800.0d);
        assertThat(snapshot.factorVersion()).isEqualTo("impact_v1");
        assertThat(snapshot.inputsJson()).contains("\"foodType\":\"PREPARED\"");
    }

    @Test
    void shouldFailLoudlyWhenFoodTypeFactorIsMissing() {
        Map<FoodType, FoodTypeImpactService.ImpactFactor> partialFactors = new EnumMap<>(FoodType.class);
        partialFactors.put(FoodType.PANTRY, new FoodTypeImpactService.ImpactFactor(1.0, 600.0));
        FoodTypeImpactService service = new FoodTypeImpactService(partialFactors, new ObjectMapper());

        SurplusPost post = new SurplusPost();
        post.setFoodType(FoodType.PREPARED);
        post.setQuantity(new Quantity(1.0, Quantity.Unit.KILOGRAM));

        assertThatThrownBy(() -> service.compute(post))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No impact factor configured");
    }
}
