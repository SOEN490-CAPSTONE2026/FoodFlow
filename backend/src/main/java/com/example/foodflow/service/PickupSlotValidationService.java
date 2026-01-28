package com.example.foodflow.service;

import com.example.foodflow.exception.BusinessException;
import com.example.foodflow.model.dto.PickupSlotRequest;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

@Service
public class PickupSlotValidationService {
    
    /**
     * Validates a list of pickup slots to ensure:
     * - At least one slot is provided
     * - No slots overlap
     * - Each slot has valid time range (end time after start time)
     */
    public void validateSlots(List<PickupSlotRequest> slots) {
        if (slots == null || slots.isEmpty()) {
            throw new BusinessException("error.pickupslot.required");
        }
        
        // Validate each individual slot
        for (PickupSlotRequest slot : slots) {
            validateSingleSlot(slot);
        }
        
        // Check for overlaps between slots
        checkForOverlaps(slots);
    }
    
    /**
     * Validates a single slot's time range
     */
    private void validateSingleSlot(PickupSlotRequest slot) {
        if (slot.getPickupDate() == null) {
            throw new BusinessException("validation.pickupSlot.date.required");
        }
        
        if (slot.getStartTime() == null) {
            throw new BusinessException("validation.pickupSlot.startTime.required");
        }
        
        if (slot.getEndTime() == null) {
            throw new BusinessException("validation.pickupSlot.endTime.required");
        }
        
        if (!slot.getEndTime().isAfter(slot.getStartTime())) {
            throw new BusinessException("error.pickupslot.invalid_time");
        }
    }
    
    /**
     * Checks for overlapping time slots on the same date
     */
    private void checkForOverlaps(List<PickupSlotRequest> slots) {
        for (int i = 0; i < slots.size(); i++) {
            for (int j = i + 1; j < slots.size(); j++) {
                PickupSlotRequest slot1 = slots.get(i);
                PickupSlotRequest slot2 = slots.get(j);
                
                if (slotsOverlap(slot1, slot2)) {
                    throw new BusinessException("validation.pickupSlot.overlap");
                }
            }
        }
    }
    
    /**
     * Determines if two slots overlap
     * Only checks slots on the same date
     */
    private boolean slotsOverlap(PickupSlotRequest slot1, PickupSlotRequest slot2) {
        // Only check overlap if same date
        if (!slot1.getPickupDate().equals(slot2.getPickupDate())) {
            return false;
        }
        
        // Check if time ranges overlap
        // Two ranges [a1, a2] and [b1, b2] overlap if a1 < b2 AND b1 < a2
        return slot1.getStartTime().isBefore(slot2.getEndTime()) &&
               slot2.getStartTime().isBefore(slot1.getEndTime());
    }
    
    /**
     * Formats a slot for error messages
     */
    private String formatSlot(PickupSlotRequest slot) {
        return String.format("%s from %s to %s",
            slot.getPickupDate(),
            slot.getStartTime(),
            slot.getEndTime());
    }
}
