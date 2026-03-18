package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.DietaryTag;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.TemperatureCategory;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CreateSurplusRequestValidationTest {

    private Validator validator;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    @Test
    void shouldRejectDuplicateDietaryTags() {
        CreateSurplusRequest request = buildValidRequest();
        request.setDietaryTags(List.of(DietaryTag.VEGAN, DietaryTag.VEGAN));

        Set<ConstraintViolation<CreateSurplusRequest>> violations = validator.validate(request);

        assertThat(violations).anyMatch(v -> "validation.dietaryTags.unique".equals(v.getMessage()));
    }

    @Test
    void shouldRejectInvalidFoodTypeValueOnDeserialization() {
        String payload = """
                {
                  "title": "Test",
                  "foodCategories": ["PREPARED_MEALS"],
                  "foodType": "INVALID_TYPE",
                  "quantity": {"value": 5, "unit": "KILOGRAM"},
                  "expiryDate": "2099-01-10",
                  "description": "desc",
                  "pickupDate": "2099-01-10",
                  "pickupFrom": "10:00",
                  "pickupTo": "12:00",
                  "pickupLocation": {"latitude": 45.0, "longitude": -73.0, "address": "addr"},
                  "temperatureCategory": "REFRIGERATED",
                  "packagingType": "SEALED"
                }
                """;

        assertThatThrownBy(() -> objectMapper.readValue(payload, CreateSurplusRequest.class))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("INVALID_TYPE");
    }

    @Test
    void shouldRejectInvalidDietaryTagValueOnDeserialization() {
        String payload = """
                {
                  "title": "Test",
                  "foodCategories": ["PREPARED_MEALS"],
                  "foodType": "PREPARED",
                  "dietaryTags": ["INVALID_TAG"],
                  "quantity": {"value": 5, "unit": "KILOGRAM"},
                  "expiryDate": "2099-01-10",
                  "description": "desc",
                  "pickupDate": "2099-01-10",
                  "pickupFrom": "10:00",
                  "pickupTo": "12:00",
                  "pickupLocation": {"latitude": 45.0, "longitude": -73.0, "address": "addr"},
                  "temperatureCategory": "REFRIGERATED",
                  "packagingType": "SEALED"
                }
                """;

        assertThatThrownBy(() -> objectMapper.readValue(payload, CreateSurplusRequest.class))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("INVALID_TAG");
    }

    private CreateSurplusRequest buildValidRequest() {
        CreateSurplusRequest request = new CreateSurplusRequest();
        request.setTitle("Valid");
        request.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        request.setFoodType(FoodType.PREPARED);
        request.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(2));
        request.setDescription("Valid description");
        request.setPickupDate(LocalDate.now().plusDays(1));
        request.setPickupFrom(LocalTime.of(10, 0));
        request.setPickupTo(LocalTime.of(12, 0));
        request.setPickupLocation(new Location(45.0, -73.0, "addr"));
        request.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        request.setPackagingType(PackagingType.SEALED);
        return request;
    }
}
