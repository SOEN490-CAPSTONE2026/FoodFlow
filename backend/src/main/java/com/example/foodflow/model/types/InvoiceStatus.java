package com.example.foodflow.model.types;

/**
 * Status of an invoice
 */
public enum InvoiceStatus {
    DRAFT,   // Invoice created but not sent
    SENT,    // Invoice sent to customer
    PAID,    // Invoice paid
    VOID,    // Invoice voided/canceled
    OVERDUE  // Invoice past due date
}
