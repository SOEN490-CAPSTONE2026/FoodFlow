package com.example.foodflow.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalTime;
import java.util.List;

public class PickupPreferenceRequest {

    @JsonFormat(pattern = "HH:mm")
    private LocalTime availabilityWindowStart;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime availabilityWindowEnd;

    private List<PickupPreferenceSlotRequest> slots;

    public LocalTime getAvailabilityWindowStart() { return availabilityWindowStart; }
    public void setAvailabilityWindowStart(LocalTime availabilityWindowStart) {
        this.availabilityWindowStart = availabilityWindowStart;
    }

    public LocalTime getAvailabilityWindowEnd() { return availabilityWindowEnd; }
    public void setAvailabilityWindowEnd(LocalTime availabilityWindowEnd) {
        this.availabilityWindowEnd = availabilityWindowEnd;
    }

    public List<PickupPreferenceSlotRequest> getSlots() { return slots; }
    public void setSlots(List<PickupPreferenceSlotRequest> slots) { this.slots = slots; }
}
