package com.example.foodflow.exception;

/**
 * Exception thrown when an uploaded image is invalid (wrong format, too large, corrupted, etc.)
 */
public class InvalidImageException extends RuntimeException {
    
    public InvalidImageException(String message) {
        super(message);
    }
    
    public InvalidImageException(String message, Throwable cause) {
        super(message, cause);
    }
}
