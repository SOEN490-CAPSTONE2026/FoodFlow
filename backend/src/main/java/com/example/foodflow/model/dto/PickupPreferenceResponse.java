package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.PickupPreference;
import com.example.foodflow.model.entity.PickupPreferenceSlot;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

public class PickupPreferenceResponse {

    @JsonFormat(pattern = "HH:mm")
    private LocalTime availabilityWindowStart;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime availabilityWindowEnd;

    private List<SlotResponse> slots;

    public static PickupPreferenceResponse fromEntity(PickupPreference pref) {
        PickupPreferenceResponse response = new PickupPreferenceResponse();
        response.availabilityWindowStart = pref.getAvailabilityWindowStart();
        response.availabilityWindowEnd = pref.getAvailabilityWindowEnd();
        response.slots = pref.getSlots().stream()
                .map(SlotResponse::fromEntity)
                .collect(Collectors.toList());
        return response;
    }

    public LocalTime getAvailabilityWindowStart() { return availabilityWindowStart; }
    public LocalTime getAvailabilityWindowEnd() { return availabilityWindowEnd; }
    public List<SlotResponse> getSlots() { return slots; }

    public static class SlotResponse {
        private Long id;

        @JsonFormat(pattern = "HH:mm")
        private LocalTime startTime;

        @JsonFormat(pattern = "HH:mm")
        private LocalTime endTime;

        private String notes;
        private Integer slotOrder;

        public static SlotResponse fromEntity(PickupPreferenceSlot slot) {
            SlotResponse r = new SlotResponse();
            r.id = slot.getId();
            r.startTime = slot.getStartTime();
            r.endTime = slot.getEndTime();
            r.notes = slot.getNotes();
            r.slotOrder = slot.getSlotOrder();
            return r;
        }

        public Long getId() { return id; }
        public LocalTime getStartTime() { return startTime; }
        public LocalTime getEndTime() { return endTime; }
        public String getNotes() { return notes; }
        public Integer getSlotOrder() { return slotOrder; }
    }
}
