package com.example.foodflow.model.types;
/**
 * Status of a refund transaction
 */
public enum RefundStatus {
    PENDING,    // Refund requested but not processed
    PROCESSING, // Refund being processed
    SUCCEEDED,  // Refund completed successfully
    FAILED,     // Refund failed
    CANCELED    // Refund request canceled
}
