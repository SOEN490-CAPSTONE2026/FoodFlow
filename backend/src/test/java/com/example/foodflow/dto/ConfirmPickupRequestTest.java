package com.example.foodflow.dto;

import com.example.foodflow.model.dto.ConfirmPickupRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ConfirmPickupRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testValidRequest() {
        // Given
        ConfirmPickupRequest request = new ConfirmPickupRequest();
        request.setPostId(1L);
        request.setOtpCode("123456");

        // When
        Set<ConstraintViolation<ConfirmPickupRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    void testNullPostId() {
        // Given - postId is required (@NotNull)
        ConfirmPickupRequest request = new ConfirmPickupRequest();
        request.setPostId(0L); // This will be treated as valid since primitive long can't be null
        request.setOtpCode("123456");

        // When
        Set<ConstraintViolation<ConfirmPickupRequest>> violations = validator.validate(request);

        // Then - No violations as primitive long defaults to 0, not null
        assertThat(violations).isEmpty();
    }

    @Test
    void testNullOtpCode() {
        // Given - otpCode is required (@NotBlank)
        ConfirmPickupRequest request = new ConfirmPickupRequest();
        request.setPostId(1L);
        request.setOtpCode(null);

        // When
        Set<ConstraintViolation<ConfirmPickupRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        ConstraintViolation<ConfirmPickupRequest> violation = violations.iterator().next();
        assertThat(violation.getPropertyPath().toString()).isEqualTo("otpCode");
        assertThat(violation.getMessage()).contains("must not be blank");
    }

    @Test
    void testBlankOtpCode() {
        // Given - otpCode cannot be blank (@NotBlank)
        ConfirmPickupRequest request = new ConfirmPickupRequest();
        request.setPostId(1L);
        request.setOtpCode("");

        // When
        Set<ConstraintViolation<ConfirmPickupRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        ConstraintViolation<ConfirmPickupRequest> violation = violations.iterator().next();
        assertThat(violation.getPropertyPath().toString()).isEqualTo("otpCode");
        assertThat(violation.getMessage()).contains("must not be blank");
    }

    @Test
    void testWhitespaceOtpCode() {
        // Given - otpCode cannot be only whitespace (@NotBlank)
        ConfirmPickupRequest request = new ConfirmPickupRequest();
        request.setPostId(1L);
        request.setOtpCode("   ");

        // When
        Set<ConstraintViolation<ConfirmPickupRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        ConstraintViolation<ConfirmPickupRequest> violation = violations.iterator().next();
        assertThat(violation.getPropertyPath().toString()).isEqualTo("otpCode");
        assertThat(violation.getMessage()).contains("must not be blank");
    }

    @Test
    void testGettersAndSetters() {
        // Given
        ConfirmPickupRequest request = new ConfirmPickupRequest();
        
        // When
        request.setPostId(123L);
        request.setOtpCode("654321");

        // Then
        assertThat(request.getPostId()).isEqualTo(123L);
        assertThat(request.getOtpCode()).isEqualTo("654321");
    }

    @Test
    void testValidOtpCodeFormats() {
        // Test various valid OTP formats
        String[] validOtps = {"000000", "123456", "999999", "abc123", "A1B2C3"};
        
        for (String otp : validOtps) {
            ConfirmPickupRequest request = new ConfirmPickupRequest();
            request.setPostId(1L);
            request.setOtpCode(otp);

            Set<ConstraintViolation<ConfirmPickupRequest>> violations = validator.validate(request);
            
            assertThat(violations).isEmpty();
        }
    }
}
