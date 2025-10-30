package com.example.foodflow.service;

import com.example.foodflow.model.dto.PickupSlotRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PickupSlotValidationServiceTest {

    private PickupSlotValidationService validationService;

    @BeforeEach
    void setUp() {
        validationService = new PickupSlotValidationService();
    }

    @Test
    void validateSlots_ValidSingleSlot_Success() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(9, 0));
        slot.setEndTime(LocalTime.of(12, 0));
        slots.add(slot);

        // When & Then - Should not throw
        validationService.validateSlots(slots);
    }

    @Test
    void validateSlots_ValidMultipleSlots_Success() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();
        
        PickupSlotRequest slot1 = new PickupSlotRequest();
        slot1.setPickupDate(LocalDate.now().plusDays(1));
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(12, 0));
        slots.add(slot1);
        
        PickupSlotRequest slot2 = new PickupSlotRequest();
        slot2.setPickupDate(LocalDate.now().plusDays(1));
        slot2.setStartTime(LocalTime.of(14, 0));
        slot2.setEndTime(LocalTime.of(17, 0));
        slots.add(slot2);

        // When & Then - Should not throw
        validationService.validateSlots(slots);
    }

    @Test
    void validateSlots_EmptyList_ThrowsException() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();

        // When & Then
        assertThatThrownBy(() -> validationService.validateSlots(slots))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("At least one pickup slot");
    }

    @Test
    void validateSlots_NullList_ThrowsException() {
        // When & Then
        assertThatThrownBy(() -> validationService.validateSlots(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("At least one pickup slot");
    }

    @Test
    void validateSlots_EndTimeBeforeStartTime_ThrowsException() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(14, 0));
        slot.setEndTime(LocalTime.of(9, 0)); // End before start
        slots.add(slot);

        // When & Then
        assertThatThrownBy(() -> validationService.validateSlots(slots))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("End time must be after start time");
    }

    @Test
    void validateSlots_EndTimeEqualsStartTime_ThrowsException() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(12, 0));
        slot.setEndTime(LocalTime.of(12, 0)); // Same time
        slots.add(slot);

        // When & Then
        assertThatThrownBy(() -> validationService.validateSlots(slots))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("End time must be after start time");
    }

    @Test
    void validateSlots_OverlappingSlotsOnSameDay_ThrowsException() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();
        LocalDate date = LocalDate.now().plusDays(1);
        
        PickupSlotRequest slot1 = new PickupSlotRequest();
        slot1.setPickupDate(date);
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(13, 0));
        slots.add(slot1);
        
        PickupSlotRequest slot2 = new PickupSlotRequest();
        slot2.setPickupDate(date); // Same day
        slot2.setStartTime(LocalTime.of(12, 0)); // Overlaps with slot1
        slot2.setEndTime(LocalTime.of(15, 0));
        slots.add(slot2);

        // When & Then
        assertThatThrownBy(() -> validationService.validateSlots(slots))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Pickup slots cannot overlap");
    }

    @Test
    void validateSlots_SlotsStartingWhenOtherEnds_Success() {
        // Given - Slot 2 starts exactly when slot 1 ends (this is allowed - no overlap)
        List<PickupSlotRequest> slots = new ArrayList<>();
        LocalDate date = LocalDate.now().plusDays(1);
        
        PickupSlotRequest slot1 = new PickupSlotRequest();
        slot1.setPickupDate(date);
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(12, 0));
        slots.add(slot1);
        
        PickupSlotRequest slot2 = new PickupSlotRequest();
        slot2.setPickupDate(date);
        slot2.setStartTime(LocalTime.of(12, 0)); // Starts when slot1 ends
        slot2.setEndTime(LocalTime.of(15, 0));
        slots.add(slot2);

        // When & Then - Should not throw since they don't overlap (boundary touching is OK)
        validationService.validateSlots(slots);
    }

    @Test
    void validateSlots_NonOverlappingSlotsOnSameDay_Success() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();
        LocalDate date = LocalDate.now().plusDays(1);
        
        PickupSlotRequest slot1 = new PickupSlotRequest();
        slot1.setPickupDate(date);
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(11, 59));
        slots.add(slot1);
        
        PickupSlotRequest slot2 = new PickupSlotRequest();
        slot2.setPickupDate(date);
        slot2.setStartTime(LocalTime.of(12, 0)); // Starts 1 minute after slot1 ends
        slot2.setEndTime(LocalTime.of(15, 0));
        slots.add(slot2);

        // When & Then - Should not throw with proper gap
        validationService.validateSlots(slots);
    }

    @Test
    void validateSlots_OverlappingTimesDifferentDates_Success() {
        // Given - Same times but different dates should be valid
        List<PickupSlotRequest> slots = new ArrayList<>();
        
        PickupSlotRequest slot1 = new PickupSlotRequest();
        slot1.setPickupDate(LocalDate.now().plusDays(1));
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(12, 0));
        slots.add(slot1);
        
        PickupSlotRequest slot2 = new PickupSlotRequest();
        slot2.setPickupDate(LocalDate.now().plusDays(2)); // Different date
        slot2.setStartTime(LocalTime.of(9, 0)); // Same times as slot1
        slot2.setEndTime(LocalTime.of(12, 0));
        slots.add(slot2);

        // When & Then - Should not throw since different dates
        validationService.validateSlots(slots);
    }

    @Test
    void validateSlots_ThreeSlotsOneOverlapping_ThrowsException() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();
        LocalDate date = LocalDate.now().plusDays(1);
        
        PickupSlotRequest slot1 = new PickupSlotRequest();
        slot1.setPickupDate(date);
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(12, 0));
        slots.add(slot1);
        
        PickupSlotRequest slot2 = new PickupSlotRequest();
        slot2.setPickupDate(date);
        slot2.setStartTime(LocalTime.of(13, 0));
        slot2.setEndTime(LocalTime.of(16, 0));
        slots.add(slot2);
        
        PickupSlotRequest slot3 = new PickupSlotRequest();
        slot3.setPickupDate(date);
        slot3.setStartTime(LocalTime.of(15, 0)); // Overlaps with slot2
        slot3.setEndTime(LocalTime.of(18, 0));
        slots.add(slot3);

        // When & Then
        assertThatThrownBy(() -> validationService.validateSlots(slots))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Pickup slots cannot overlap");
    }

    @Test
    void validateSlots_CompletelyContainedSlot_ThrowsException() {
        // Given - Slot 2 is completely inside slot 1
        List<PickupSlotRequest> slots = new ArrayList<>();
        LocalDate date = LocalDate.now().plusDays(1);
        
        PickupSlotRequest slot1 = new PickupSlotRequest();
        slot1.setPickupDate(date);
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(17, 0));
        slots.add(slot1);
        
        PickupSlotRequest slot2 = new PickupSlotRequest();
        slot2.setPickupDate(date);
        slot2.setStartTime(LocalTime.of(12, 0)); // Inside slot1
        slot2.setEndTime(LocalTime.of(14, 0)); // Inside slot1
        slots.add(slot2);

        // When & Then
        assertThatThrownBy(() -> validationService.validateSlots(slots))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Pickup slots cannot overlap");
    }

    @Test
    void validateSlots_WithNotes_Success() {
        // Given
        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(9, 0));
        slot.setEndTime(LocalTime.of(12, 0));
        slot.setNotes("Use back entrance");
        slots.add(slot);

        // When & Then - Should not throw
        validationService.validateSlots(slots);
    }
}
