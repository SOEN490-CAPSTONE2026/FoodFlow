package com.example.foodflow.model.types;

/**
 * Enum representing temperature storage categories for food safety compliance.
 */
public enum TemperatureCategory {
    FROZEN("Frozen (below 0°C)"),
    REFRIGERATED("Refrigerated (0–4°C)"),
    ROOM_TEMPERATURE("Room Temperature"),
    HOT_COOKED("Hot / Cooked");

    private final String displayName;

    TemperatureCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}


