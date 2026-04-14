package com.example.foodflow.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SensitiveFieldRegistryTest {

    private final SensitiveFieldRegistry registry = new SensitiveFieldRegistry();

    @Test
    void isSensitive_organizationName_returnsTrue() {
        assertTrue(registry.isSensitive("ORGANIZATION", "name"));
    }

    @Test
    void isSensitive_organizationAddress_returnsTrue() {
        assertTrue(registry.isSensitive("ORGANIZATION", "address"));
    }

    @Test
    void isSensitive_organizationPhone_returnsFalse() {
        assertFalse(registry.isSensitive("ORGANIZATION", "phone"));
    }

    @Test
    void isSensitive_unknownField_returnsFalse() {
        assertFalse(registry.isSensitive("ORGANIZATION", "unknown"));
    }

    @Test
    void isSensitive_userEntity_returnsFalse() {
        assertFalse(registry.isSensitive("USER", "email"));
    }

    @Test
    void isSensitive_unknownEntityType_returnsFalse() {
        assertFalse(registry.isSensitive("UNKNOWN", "name"));
    }
}