package com.example.foodflow.config.jackson;

import com.example.foodflow.model.entity.OrganizationType;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;

public class OrganizationTypeDeserializer extends JsonDeserializer<OrganizationType> {

    @Override
    public OrganizationType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getValueAsString();
        if (value == null || value.trim().isEmpty()) return null;
        try {
            return OrganizationType.valueOf(value);
        } catch (IllegalArgumentException ex) {
            // Let the higher-level validation/exception handler deal with invalid labels
            return null;
        }
    }
}
