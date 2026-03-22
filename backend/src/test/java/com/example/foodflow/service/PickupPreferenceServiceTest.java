package com.example.foodflow.service;

import com.example.foodflow.model.dto.PickupPreferenceRequest;
import com.example.foodflow.model.dto.PickupPreferenceResponse;
import com.example.foodflow.model.dto.PickupPreferenceSlotRequest;
import com.example.foodflow.model.entity.PickupPreference;
import com.example.foodflow.model.entity.PickupPreferenceSlot;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.PickupPreferenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PickupPreferenceServiceTest {

    @Mock
    private PickupPreferenceRepository pickupPreferenceRepository;

    @InjectMocks
    private PickupPreferenceService pickupPreferenceService;

    private User donor;
    private PickupPreference existingPreference;
    private PickupPreferenceRequest validRequest;

    @BeforeEach
    void setUp() {
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setPassword("password123");
        donor.setRole(UserRole.DONOR);

        existingPreference = new PickupPreference(donor);

        validRequest = new PickupPreferenceRequest();
        validRequest.setAvailabilityWindowStart(LocalTime.of(9, 0));
        validRequest.setAvailabilityWindowEnd(LocalTime.of(17, 0));
        validRequest.setSlots(new ArrayList<>());
    }

    // ==================== getPreferences ====================

    @Test
    void testGetPreferences_WhenExists_ReturnsCorrectResponse() {
        // Given
        existingPreference.setAvailabilityWindowStart(LocalTime.of(9, 0));
        existingPreference.setAvailabilityWindowEnd(LocalTime.of(17, 0));
        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.of(existingPreference));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.getPreferences(donor);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAvailabilityWindowStart()).isEqualTo(LocalTime.of(9, 0));
        assertThat(result.getAvailabilityWindowEnd()).isEqualTo(LocalTime.of(17, 0));
        assertThat(result.getSlots()).isEmpty();
        verify(pickupPreferenceRepository).findByDonorId(donor.getId());
    }

    @Test
    void testGetPreferences_WhenNotExists_ReturnsEmptyResponse() {
        // Given
        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.empty());

        // When
        PickupPreferenceResponse result = pickupPreferenceService.getPreferences(donor);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAvailabilityWindowStart()).isNull();
        assertThat(result.getAvailabilityWindowEnd()).isNull();
        assertThat(result.getSlots()).isNull();
        verify(pickupPreferenceRepository).findByDonorId(donor.getId());
    }

    // ==================== savePreferences - create/update ====================

    @Test
    void testSavePreferences_WhenNotExists_CreatesNewPreference() {
        // Given
        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.empty());
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAvailabilityWindowStart()).isEqualTo(LocalTime.of(9, 0));
        assertThat(result.getAvailabilityWindowEnd()).isEqualTo(LocalTime.of(17, 0));
        verify(pickupPreferenceRepository).findByDonorId(donor.getId());
        verify(pickupPreferenceRepository).saveAndFlush(any(PickupPreference.class));
        verify(pickupPreferenceRepository).save(any(PickupPreference.class));
    }

    @Test
    void testSavePreferences_WhenExists_UpdatesExistingPreference() {
        // Given
        existingPreference.setAvailabilityWindowStart(LocalTime.of(8, 0));
        existingPreference.setAvailabilityWindowEnd(LocalTime.of(16, 0));
        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.of(existingPreference));
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then
        assertThat(result.getAvailabilityWindowStart()).isEqualTo(LocalTime.of(9, 0));
        assertThat(result.getAvailabilityWindowEnd()).isEqualTo(LocalTime.of(17, 0));
        verify(pickupPreferenceRepository).saveAndFlush(existingPreference);
        verify(pickupPreferenceRepository).save(existingPreference);
    }

    // ==================== savePreferences - slots ====================

    @Test
    void testSavePreferences_WithSingleSlot_SavesSlotCorrectly() {
        // Given
        PickupPreferenceSlotRequest slotReq = new PickupPreferenceSlotRequest();
        slotReq.setStartTime(LocalTime.of(9, 0));
        slotReq.setEndTime(LocalTime.of(12, 0));
        slotReq.setNotes("Morning pickup");
        validRequest.setSlots(List.of(slotReq));

        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.empty());
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then
        assertThat(result.getSlots()).hasSize(1);
        assertThat(result.getSlots().get(0).getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(result.getSlots().get(0).getEndTime()).isEqualTo(LocalTime.of(12, 0));
        assertThat(result.getSlots().get(0).getNotes()).isEqualTo("Morning pickup");
    }

    @Test
    void testSavePreferences_WithMultipleSlots_AssignsCorrectSlotOrder() {
        // Given
        PickupPreferenceSlotRequest slot1 = new PickupPreferenceSlotRequest();
        slot1.setStartTime(LocalTime.of(9, 0));
        slot1.setEndTime(LocalTime.of(12, 0));

        PickupPreferenceSlotRequest slot2 = new PickupPreferenceSlotRequest();
        slot2.setStartTime(LocalTime.of(14, 0));
        slot2.setEndTime(LocalTime.of(17, 0));

        PickupPreferenceSlotRequest slot3 = new PickupPreferenceSlotRequest();
        slot3.setStartTime(LocalTime.of(18, 0));
        slot3.setEndTime(LocalTime.of(20, 0));

        validRequest.setSlots(List.of(slot1, slot2, slot3));

        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.empty());
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then
        assertThat(result.getSlots()).hasSize(3);
        assertThat(result.getSlots().get(0).getSlotOrder()).isEqualTo(0);
        assertThat(result.getSlots().get(1).getSlotOrder()).isEqualTo(1);
        assertThat(result.getSlots().get(2).getSlotOrder()).isEqualTo(2);
    }

    @Test
    void testSavePreferences_WithNullSlots_SavesWithEmptySlotList() {
        // Given
        validRequest.setSlots(null);
        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.empty());
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getSlots()).isEmpty();
    }

    @Test
    void testSavePreferences_WithEmptySlots_SavesWithEmptySlotList() {
        // Given
        validRequest.setSlots(new ArrayList<>());
        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.empty());
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then
        assertThat(result.getSlots()).isEmpty();
    }

    @Test
    void testSavePreferences_WithSlotHavingNullNotes_SavesNullNotesCorrectly() {
        // Given
        PickupPreferenceSlotRequest slotReq = new PickupPreferenceSlotRequest();
        slotReq.setStartTime(LocalTime.of(10, 0));
        slotReq.setEndTime(LocalTime.of(14, 0));
        slotReq.setNotes(null);
        validRequest.setSlots(List.of(slotReq));

        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.empty());
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then
        assertThat(result.getSlots()).hasSize(1);
        assertThat(result.getSlots().get(0).getNotes()).isNull();
    }

    // ==================== savePreferences - flush order fix ====================

    @Test
    void testSavePreferences_UpdateExisting_ClearsOldSlotsAndFlushesBeforeInserts() {
        // Given - existing preference with a slot
        PickupPreferenceSlot existingSlot = new PickupPreferenceSlot(
                existingPreference, LocalTime.of(8, 0), LocalTime.of(10, 0), "old slot", 0);
        existingPreference.getSlots().add(existingSlot);

        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.of(existingPreference));
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        PickupPreferenceSlotRequest newSlot = new PickupPreferenceSlotRequest();
        newSlot.setStartTime(LocalTime.of(10, 0));
        newSlot.setEndTime(LocalTime.of(14, 0));
        newSlot.setNotes("new slot");
        validRequest.setSlots(List.of(newSlot));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then - saveAndFlush is called after clear() to force DELETE before INSERT,
        // preventing the UNIQUE (preference_id, slot_order) constraint violation
        verify(pickupPreferenceRepository).saveAndFlush(existingPreference);
        assertThat(result.getSlots()).hasSize(1);
        assertThat(result.getSlots().get(0).getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(result.getSlots().get(0).getNotes()).isEqualTo("new slot");
    }

    @Test
    void testSavePreferences_CallsSaveAndFlushBeforeSave() {
        // Given
        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.of(existingPreference));
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        pickupPreferenceService.savePreferences(donor, validRequest);

        // Then - saveAndFlush must be called before save to flush deletes first
        var inOrder = inOrder(pickupPreferenceRepository);
        inOrder.verify(pickupPreferenceRepository).saveAndFlush(existingPreference);
        inOrder.verify(pickupPreferenceRepository).save(existingPreference);
    }

    // ==================== savePreferences - availability window ====================

    @Test
    void testSavePreferences_WithNullAvailabilityWindow_SavesNullTimes() {
        // Given
        validRequest.setAvailabilityWindowStart(null);
        validRequest.setAvailabilityWindowEnd(null);

        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.empty());
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then
        assertThat(result.getAvailabilityWindowStart()).isNull();
        assertThat(result.getAvailabilityWindowEnd()).isNull();
    }

    @Test
    void testSavePreferences_UpdatesAvailabilityWindowOnExistingPreference() {
        // Given
        existingPreference.setAvailabilityWindowStart(LocalTime.of(8, 0));
        existingPreference.setAvailabilityWindowEnd(LocalTime.of(12, 0));

        validRequest.setAvailabilityWindowStart(LocalTime.of(10, 0));
        validRequest.setAvailabilityWindowEnd(LocalTime.of(18, 0));

        when(pickupPreferenceRepository.findByDonorId(donor.getId()))
                .thenReturn(Optional.of(existingPreference));
        when(pickupPreferenceRepository.saveAndFlush(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(pickupPreferenceRepository.save(any(PickupPreference.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        PickupPreferenceResponse result = pickupPreferenceService.savePreferences(donor, validRequest);

        // Then
        assertThat(result.getAvailabilityWindowStart()).isEqualTo(LocalTime.of(10, 0));
        assertThat(result.getAvailabilityWindowEnd()).isEqualTo(LocalTime.of(18, 0));
    }
}
