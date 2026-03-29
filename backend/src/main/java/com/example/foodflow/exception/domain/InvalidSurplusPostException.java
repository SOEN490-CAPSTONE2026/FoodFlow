package com.example.foodflow.exception.domain;

public class InvalidSurplusPostException extends RuntimeException {
    public InvalidSurplusPostException(String message) {
        super(message);
    }
}