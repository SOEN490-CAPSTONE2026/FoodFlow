package com.example.foodflow.model.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for CompleteSurplusRequest DTO validation
 * Story 8.1 - Update Donation Status (Donor-Side)
 */
class CompleteSurplusRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidOtpCode_Success() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest("123456");

        // When
        Set<ConstraintViolation<CompleteSurplusRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    void testOtpCode_Null_ShouldFail() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest(null);

        // When
        Set<ConstraintViolation<CompleteSurplusRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("OTP code is required");
    }

    @Test
    void testOtpCode_Empty_ShouldFail() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest("");

        // When
        Set<ConstraintViolation<CompleteSurplusRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isNotEmpty();
        assertThat(violations.stream()
            .anyMatch(v -> v.getMessage().contains("OTP code is required"))).isTrue();
    }

    @Test
    void testOtpCode_LessThan6Digits_ShouldFail() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest("12345");

        // When
        Set<ConstraintViolation<CompleteSurplusRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("OTP code must be exactly 6 digits");
    }

    @Test
    void testOtpCode_MoreThan6Digits_ShouldFail() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest("1234567");

        // When
        Set<ConstraintViolation<CompleteSurplusRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("OTP code must be exactly 6 digits");
    }

    @Test
    void testOtpCode_ContainsLetters_ShouldFail() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest("12345A");

        // When
        Set<ConstraintViolation<CompleteSurplusRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("OTP code must be exactly 6 digits");
    }

    @Test
    void testOtpCode_ContainsSpecialCharacters_ShouldFail() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest("12345!");

        // When
        Set<ConstraintViolation<CompleteSurplusRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("OTP code must be exactly 6 digits");
    }

    @Test
    void testOtpCode_ContainsSpaces_ShouldFail() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest("123 456");

        // When
        Set<ConstraintViolation<CompleteSurplusRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).contains("OTP code must be exactly 6 digits");
    }

    @Test
    void testOtpCode_OnlyZeros_Success() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest("000000");

        // When
        Set<ConstraintViolation<CompleteSurplusRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    void testDefaultConstructor() {
        // Given & When
        CompleteSurplusRequest request = new CompleteSurplusRequest();

        // Then
        assertThat(request.getOtpCode()).isNull();
    }

    @Test
    void testSetterGetter() {
        // Given
        CompleteSurplusRequest request = new CompleteSurplusRequest();

        // When
        request.setOtpCode("999999");

        // Then
        assertThat(request.getOtpCode()).isEqualTo("999999");
    }
}
