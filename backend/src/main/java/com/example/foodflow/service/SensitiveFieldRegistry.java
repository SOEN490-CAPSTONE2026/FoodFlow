package com.example.foodflow.service;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.Set;

@Component
public class SensitiveFieldRegistry {

    private static final Map<String, Set<String>> SENSITIVE_FIELDS = Map.of(
        "USER", Set.of(),
        "ORGANIZATION", Set.of(
                "name",
                "address"
        )
    );

    public boolean isSensitive(String entityType, String fieldName) {
        return SENSITIVE_FIELDS
                .getOrDefault(entityType, Set.of())
                .contains(fieldName);
    }
}
