package com.example.foodflow.model.dto;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class ClaimRequestTest {

    @Test
    void constructor_NoArgs_CreatesEmptyRequest() {
        // When
        ClaimRequest request = new ClaimRequest();

        // Then
        assertThat(request.getSurplusPostId()).isNull();
        assertThat(request.getPickupSlotId()).isNull();
        assertThat(request.getPickupSlot()).isNull();
    }

    @Test
    void constructor_WithSurplusPostId_SetsSurplusPostId() {
        // When
        ClaimRequest request = new ClaimRequest(123L);

        // Then
        assertThat(request.getSurplusPostId()).isEqualTo(123L);
        assertThat(request.getPickupSlotId()).isNull();
        assertThat(request.getPickupSlot()).isNull();
    }

    @Test
    void setSurplusPostId_SetsValue() {
        // Given
        ClaimRequest request = new ClaimRequest();

        // When
        request.setSurplusPostId(456L);

        // Then
        assertThat(request.getSurplusPostId()).isEqualTo(456L);
    }

    @Test
    void setPickupSlotId_SetsValue() {
        // Given
        ClaimRequest request = new ClaimRequest();

        // When
        request.setPickupSlotId(789L);

        // Then
        assertThat(request.getPickupSlotId()).isEqualTo(789L);
    }

    @Test
    void setPickupSlot_WithInlineSlot_SetsValue() {
        // Given
        ClaimRequest request = new ClaimRequest();
        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        pickupSlot.setPickupDate(LocalDate.of(2025, 12, 25));
        pickupSlot.setStartTime(LocalTime.of(10, 0));
        pickupSlot.setEndTime(LocalTime.of(12, 0));

        // When
        request.setPickupSlot(pickupSlot);

        // Then
        assertThat(request.getPickupSlot()).isNotNull();
        assertThat(request.getPickupSlot().getPickupDate()).isEqualTo(LocalDate.of(2025, 12, 25));
        assertThat(request.getPickupSlot().getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(request.getPickupSlot().getEndTime()).isEqualTo(LocalTime.of(12, 0));
    }

    @Test
    void completeRequest_WithAllFields_AllFieldsSet() {
        // Given
        ClaimRequest request = new ClaimRequest();
        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        pickupSlot.setPickupDate(LocalDate.of(2025, 12, 25));
        pickupSlot.setStartTime(LocalTime.of(14, 30));
        pickupSlot.setEndTime(LocalTime.of(16, 30));

        // When
        request.setSurplusPostId(100L);
        request.setPickupSlotId(200L);
        request.setPickupSlot(pickupSlot);

        // Then
        assertThat(request.getSurplusPostId()).isEqualTo(100L);
        assertThat(request.getPickupSlotId()).isEqualTo(200L);
        assertThat(request.getPickupSlot()).isNotNull();
        assertThat(request.getPickupSlot().getPickupDate()).isEqualTo(LocalDate.of(2025, 12, 25));
    }

    @Test
    void setPickupSlot_WithNull_SetsNull() {
        // Given
        ClaimRequest request = new ClaimRequest();
        PickupSlotRequest pickupSlot = new PickupSlotRequest();
        request.setPickupSlot(pickupSlot);

        // When
        request.setPickupSlot(null);

        // Then
        assertThat(request.getPickupSlot()).isNull();
    }

    @Test
    void setPickupSlotId_WithNull_SetsNull() {
        // Given
        ClaimRequest request = new ClaimRequest();
        request.setPickupSlotId(123L);

        // When
        request.setPickupSlotId(null);

        // Then
        assertThat(request.getPickupSlotId()).isNull();
    }
}
