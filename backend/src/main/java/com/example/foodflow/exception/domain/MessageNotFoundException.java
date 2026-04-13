package com.example.foodflow.exception.domain;
/**
 * Exception thrown when a message is not found.
 */
public class MessageNotFoundException extends RuntimeException {
    public MessageNotFoundException(String message) {
        super(message);
    }
}