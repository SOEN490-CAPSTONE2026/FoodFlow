package com.example.foodflow.config.jackson;

import com.example.foodflow.model.entity.OrganizationType;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OrganizationTypeDeserializerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final OrganizationTypeDeserializer deserializer = new OrganizationTypeDeserializer();

    @Test
    void deserialize_ReturnsEnumForKnownValue() throws Exception {
        JsonParser parser = objectMapper.createParser("\"RESTAURANT\"");
        parser.nextToken();

        assertThat(deserializer.deserialize(parser, objectMapper.getDeserializationContext()))
                .isEqualTo(OrganizationType.RESTAURANT);
    }

    @Test
    void deserialize_ReturnsNullForBlankOrInvalidValues() throws Exception {
        JsonParser blankParser = objectMapper.createParser("\"   \"");
        blankParser.nextToken();

        JsonParser invalidParser = objectMapper.createParser("\"NOT_A_TYPE\"");
        invalidParser.nextToken();

        assertThat(deserializer.deserialize(blankParser, objectMapper.getDeserializationContext()))
                .isNull();
        assertThat(deserializer.deserialize(invalidParser, objectMapper.getDeserializationContext()))
                .isNull();
    }
}
