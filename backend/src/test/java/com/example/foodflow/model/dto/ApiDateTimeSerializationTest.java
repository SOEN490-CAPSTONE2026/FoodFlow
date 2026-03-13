package com.example.foodflow.model.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class ApiDateTimeSerializationTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Test
    void surplusResponse_SerializesAbsoluteMomentsWithUtcSuffix() throws Exception {
        SurplusResponse response = new SurplusResponse();
        response.setCreatedAt(LocalDateTime.of(2026, 3, 10, 12, 34, 56));
        response.setUpdatedAt(LocalDateTime.of(2026, 3, 10, 12, 35, 56));
        response.setExpiryDateEffective(LocalDateTime.of(2026, 3, 11, 6, 59, 59));

        String json = objectMapper.writeValueAsString(response);

        assertThat(json).contains("\"createdAt\":\"2026-03-10T12:34:56Z\"");
        assertThat(json).contains("\"updatedAt\":\"2026-03-10T12:35:56Z\"");
        assertThat(json).contains("\"expiryDateEffective\":\"2026-03-11T06:59:59Z\"");
    }

    @Test
    void claimResponse_SerializesClaimedAtWithUtcSuffix() throws Exception {
        ClaimResponse response = new ClaimResponse();
        response.setClaimedAt(LocalDateTime.of(2026, 3, 10, 13, 0, 1));

        String json = objectMapper.writeValueAsString(response);

        assertThat(json).contains("\"claimedAt\":\"2026-03-10T13:00:01Z\"");
    }

    @Test
    void donationTimelineDto_SerializesTimestampWithUtcSuffix() throws Exception {
        DonationTimelineDTO dto = new DonationTimelineDTO();
        dto.setTimestamp(LocalDateTime.of(2026, 3, 10, 14, 15, 16));

        String json = objectMapper.writeValueAsString(dto);

        assertThat(json).contains("\"timestamp\":\"2026-03-10T14:15:16Z\"");
    }
}
