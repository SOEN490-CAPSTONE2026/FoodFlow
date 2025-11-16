package com.example.foodflow.model.types;

public enum ClaimStatus {
    ACTIVE,
    CANCELLED,
    COMPLETED,
    NOT_COMPLETED;
    
    public String getDisplayName() {
        String name = this.name();
        return name.charAt(0) + name.substring(1).toLowerCase().replace('_', ' ');
    }
}
