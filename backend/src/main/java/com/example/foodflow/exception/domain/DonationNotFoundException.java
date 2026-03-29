package com.example.foodflow.exception.domain;

public class DonationNotFoundException extends RuntimeException {
    public DonationNotFoundException(Long postId) {
        super("Donation with ID " + postId + " not found");
    }
    public DonationNotFoundException(String message) {
        super(message);
    }
}