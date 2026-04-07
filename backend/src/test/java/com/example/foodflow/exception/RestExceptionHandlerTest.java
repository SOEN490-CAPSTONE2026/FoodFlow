package com.example.foodflow.exception;
import com.example.foodflow.model.dto.AuthResponse;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.VerificationStatus;
import com.example.foodflow.model.types.DietaryTag;
import com.example.foodflow.model.types.FoodType;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import static org.assertj.core.api.Assertions.assertThat;
class RestExceptionHandlerTest {
    private final RestExceptionHandler handler = new RestExceptionHandler();
    @Test
    void handleHttpMessageNotReadable_withOrganizationType_returnsAllowedValues() {
        InvalidFormatException ife = InvalidFormatException.from(
                null,
                "invalid enum",
                "INVALID_ORG",
                OrganizationType.class);
        ife.prependPath(new Object(), "organizationType");
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("bad", ife, null);
        ResponseEntity<AuthResponse> response = handler.handleHttpMessageNotReadable(ex);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("organizationType");
        assertThat(response.getBody().getMessage()).contains("Allowed values");
    }
    @Test
    void handleHttpMessageNotReadable_withVerificationStatus_returnsAllowedValues() {
        InvalidFormatException ife = InvalidFormatException.from(
                null,
                "invalid enum",
                "BAD_STATUS",
                VerificationStatus.class);
        ife.prependPath(new Object(), "verificationStatus");
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("bad", ife, null);
        ResponseEntity<AuthResponse> response = handler.handleHttpMessageNotReadable(ex);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("Allowed values");
    }
    @Test
    void handleHttpMessageNotReadable_withFoodType_returnsAllowedValues() {
        InvalidFormatException ife = InvalidFormatException.from(
                null,
                "invalid enum",
                "BAD_FOOD",
                FoodType.class);
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("bad", ife, null);
        ResponseEntity<AuthResponse> response = handler.handleHttpMessageNotReadable(ex);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("Allowed values");
    }
    @Test
    void handleHttpMessageNotReadable_withDietaryTag_returnsAllowedValues() {
        InvalidFormatException ife = InvalidFormatException.from(
                null,
                "invalid enum",
                "BAD_TAG",
                DietaryTag.class);
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("bad", ife, null);
        ResponseEntity<AuthResponse> response = handler.handleHttpMessageNotReadable(ex);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("Allowed values");
    }
    @Test
    void handleHttpMessageNotReadable_withNonInvalidFormat_returnsMalformedMessage() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("bad body");
        ResponseEntity<AuthResponse> response = handler.handleHttpMessageNotReadable(ex);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Malformed request body");
    }
    @Test
    void handleDataIntegrityViolation_withEnumViolation_returnsFriendlyMessage() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "boom",
                new RuntimeException("invalid input value for enum verification_status"));
        ResponseEntity<AuthResponse> response = handler.handleDataIntegrityViolation(ex);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("Invalid enum value provided");
    }
    @Test
    void handleDataIntegrityViolation_withOtherCause_returnsDefaultMessage() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException("duplicate key");
        ResponseEntity<AuthResponse> response = handler.handleDataIntegrityViolation(ex);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Data integrity violation");
    }
}
