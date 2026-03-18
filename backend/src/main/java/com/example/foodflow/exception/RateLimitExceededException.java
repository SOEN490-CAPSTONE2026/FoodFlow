package com.example.foodflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when a user exceeds rate limits for API calls.
 * Results in HTTP 429 Too Many Requests response.
 */
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class RateLimitExceededException extends RuntimeException {

    private final String rateLimitType;
    private final int retryAfterSeconds;

    public RateLimitExceededException(String rateLimitType, int retryAfterSeconds) {
        super("Rate limit exceeded for " + rateLimitType + ". Please try again in " + retryAfterSeconds + " seconds.");
        this.rateLimitType = rateLimitType;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public RateLimitExceededException(String message, String rateLimitType, int retryAfterSeconds) {
        super(message);
        this.rateLimitType = rateLimitType;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public String getRateLimitType() {
        return rateLimitType;
    }

    public int getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}