package com.example.foodflow.model.types;
/**
 * Status of a payment transaction
 */
public enum PaymentStatus {
    PENDING,           // Payment intent created but not confirmed
    PROCESSING,        // Payment is being processed by Stripe
    SUCCEEDED,         // Payment completed successfully
    FAILED,           // Payment failed
    CANCELED,         // Payment was canceled
    REQUIRES_ACTION,  // Payment requires additional action (e.g., 3D Secure)
    REFUNDED          // Payment was fully refunded
}
