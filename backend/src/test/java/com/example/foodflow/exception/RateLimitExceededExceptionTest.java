package com.example.foodflow.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitExceededExceptionTest {

    @Test
    void constructor_WithTypeAndRetryAfter_ShouldSetCorrectValues() {
        // Given
        String rateLimitType = "user";
        int retryAfterSeconds = 60;

        // When
        RateLimitExceededException exception = new RateLimitExceededException(rateLimitType, retryAfterSeconds);

        // Then
        assertThat(exception.getRateLimitType()).isEqualTo("user");
        assertThat(exception.getRetryAfterSeconds()).isEqualTo(60);
        assertThat(exception.getMessage()).contains("Rate limit exceeded for user");
        assertThat(exception.getMessage()).contains("60 seconds");
    }

    @Test
    void constructor_WithCustomMessage_ShouldUseCustomMessage() {
        // Given
        String customMessage = "Custom rate limit exceeded message";
        String rateLimitType = "ip";
        int retryAfterSeconds = 120;

        // When
        RateLimitExceededException exception = new RateLimitExceededException(
                customMessage, rateLimitType, retryAfterSeconds);

        // Then
        assertThat(exception.getMessage()).isEqualTo(customMessage);
        assertThat(exception.getRateLimitType()).isEqualTo("ip");
        assertThat(exception.getRetryAfterSeconds()).isEqualTo(120);
    }

    @Test
    void exception_ShouldHaveCorrectResponseStatus() {
        // Given
        RateLimitExceededException exception = new RateLimitExceededException("user", 60);

        // When
        ResponseStatus responseStatus = exception.getClass().getAnnotation(ResponseStatus.class);

        // Then
        assertThat(responseStatus).isNotNull();
        assertThat(responseStatus.value()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void getMessage_ShouldIncludeAllRequiredInformation() {
        // Given
        String rateLimitType = "openai";
        int retryAfterSeconds = 30;

        // When
        RateLimitExceededException exception = new RateLimitExceededException(rateLimitType, retryAfterSeconds);
        String message = exception.getMessage();

        // Then
        assertThat(message).contains("Rate limit exceeded");
        assertThat(message).contains("openai");
        assertThat(message).contains("30 seconds");
        assertThat(message).contains("Please try again");
    }

    @Test
    void getters_ShouldReturnCorrectValues() {
        // Given
        String rateLimitType = "global";
        int retryAfterSeconds = 180;
        RateLimitExceededException exception = new RateLimitExceededException(rateLimitType, retryAfterSeconds);

        // When & Then
        assertThat(exception.getRateLimitType()).isEqualTo("global");
        assertThat(exception.getRetryAfterSeconds()).isEqualTo(180);
    }

    @Test
    void exception_WithZeroRetryAfter_ShouldHandleCorrectly() {
        // Given
        String rateLimitType = "test";
        int retryAfterSeconds = 0;

        // When
        RateLimitExceededException exception = new RateLimitExceededException(rateLimitType, retryAfterSeconds);

        // Then
        assertThat(exception.getRetryAfterSeconds()).isEqualTo(0);
        assertThat(exception.getMessage()).contains("0 seconds");
    }

    @Test
    void exception_WithNegativeRetryAfter_ShouldHandleCorrectly() {
        // Given
        String rateLimitType = "test";
        int retryAfterSeconds = -1;

        // When
        RateLimitExceededException exception = new RateLimitExceededException(rateLimitType, retryAfterSeconds);

        // Then
        assertThat(exception.getRetryAfterSeconds()).isEqualTo(-1);
    }

    @Test
    void exception_WithNullRateLimitType_ShouldHandleGracefully() {
        // Given
        String rateLimitType = null;
        int retryAfterSeconds = 60;

        // When
        RateLimitExceededException exception = new RateLimitExceededException(rateLimitType, retryAfterSeconds);

        // Then
        assertThat(exception.getRateLimitType()).isNull();
        assertThat(exception.getMessage()).contains("Rate limit exceeded for null");
    }

    @Test
    void exception_WithEmptyRateLimitType_ShouldHandleCorrectly() {
        // Given
        String rateLimitType = "";
        int retryAfterSeconds = 45;

        // When
        RateLimitExceededException exception = new RateLimitExceededException(rateLimitType, retryAfterSeconds);

        // Then
        assertThat(exception.getRateLimitType()).isEmpty();
        assertThat(exception.getMessage()).contains("Rate limit exceeded for ");
    }
}