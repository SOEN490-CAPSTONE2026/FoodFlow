package com.example.foodflow.exception.domain;
/**
 * Exception thrown when a conversation is not found for a given post or user.
 */
public class ConversationNotFoundException extends RuntimeException {
    public ConversationNotFoundException(String message) {
        super(message);
    }
}