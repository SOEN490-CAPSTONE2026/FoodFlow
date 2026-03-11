package com.example.foodflow.model.types;

/**
 * Type of payment method
 */
public enum PaymentMethodType {
    CARD,           // Credit/Debit card
    ACH_DEBIT,      // ACH Direct Debit (US bank account)
    SEPA_DEBIT,     // SEPA Direct Debit (EU bank account)
    BANK_TRANSFER,  // Bank transfer
    OTHER           // Other payment method types
}
