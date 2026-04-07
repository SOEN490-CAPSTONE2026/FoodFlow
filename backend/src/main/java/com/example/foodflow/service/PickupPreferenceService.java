package com.example.foodflow.service;
import com.example.foodflow.model.dto.PickupPreferenceRequest;
import com.example.foodflow.model.dto.PickupPreferenceResponse;
import com.example.foodflow.model.entity.PickupPreference;
import com.example.foodflow.model.entity.PickupPreferenceSlot;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.PickupPreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
@Service
public class PickupPreferenceService {
    private final PickupPreferenceRepository pickupPreferenceRepository;
    public PickupPreferenceService(PickupPreferenceRepository pickupPreferenceRepository) {
        this.pickupPreferenceRepository = pickupPreferenceRepository;
    }
    public PickupPreferenceResponse getPreferences(User donor) {
        return pickupPreferenceRepository.findByDonorId(donor.getId())
                .map(PickupPreferenceResponse::fromEntity)
                .orElseGet(() -> {
                    PickupPreferenceResponse empty = new PickupPreferenceResponse();
                    return empty;
                });
    }
    @Transactional
    public PickupPreferenceResponse savePreferences(User donor, PickupPreferenceRequest request) {
        PickupPreference pref = pickupPreferenceRepository.findByDonorId(donor.getId())
                .orElseGet(() -> new PickupPreference(donor));
        pref.setAvailabilityWindowStart(request.getAvailabilityWindowStart());
        pref.setAvailabilityWindowEnd(request.getAvailabilityWindowEnd());
        pref.getSlots().clear();
        pickupPreferenceRepository.saveAndFlush(pref);
        if (request.getSlots() != null) {
            List<PickupPreferenceSlot> slots = new ArrayList<>();
            for (int i = 0; i < request.getSlots().size(); i++) {
                var slotReq = request.getSlots().get(i);
                PickupPreferenceSlot slot = new PickupPreferenceSlot(
                        pref,
                        slotReq.getStartTime(),
                        slotReq.getEndTime(),
                        slotReq.getNotes(),
                        i
                );
                slots.add(slot);
            }
            pref.getSlots().addAll(slots);
        }
        PickupPreference saved = pickupPreferenceRepository.save(pref);
        return PickupPreferenceResponse.fromEntity(saved);
    }
}
