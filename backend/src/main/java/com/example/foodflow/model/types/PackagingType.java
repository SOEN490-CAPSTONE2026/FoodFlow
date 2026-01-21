package com.example.foodflow.model.types;

/**
 * Enum representing packaging types for food safety compliance.
 */
public enum PackagingType {
    SEALED("Sealed"),
    LOOSE("Loose"),
    REFRIGERATED_CONTAINER("Refrigerated Container"),
    FROZEN_CONTAINER("Frozen Container"),
    VACUUM_PACKED("Vacuum Packed"),
    BOXED("Boxed"),
    WRAPPED("Wrapped"),
    BULK("Bulk"),
    OTHER("Other");

    private final String displayName;

    PackagingType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

