package com.example.foodflow.exception.domain;

public class ClaimNotFoundException extends RuntimeException {
    public ClaimNotFoundException(Long claimId) {
        super("Claim with ID " + claimId + " not found");
    }
    public ClaimNotFoundException(String message) {
        super(message);
    }
}