package com.example.foodflow.repository;

import com.example.foodflow.model.entity.PickupPreference;
import com.example.foodflow.model.entity.PickupPreferenceSlot;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class PickupPreferenceRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PickupPreferenceRepository pickupPreferenceRepository;

    private User persistDonor(String email) {
        User donor = new User();
        donor.setEmail(email);
        donor.setPassword("password");
        donor.setRole(UserRole.DONOR);
        return entityManager.persistAndFlush(donor);
    }

    @Test
    void findByDonorId_WhenExists_ReturnsPreference() {
        // Given
        User donor = persistDonor("donor@test.com");

        PickupPreference pref = new PickupPreference(donor);
        pref.setAvailabilityWindowStart(LocalTime.of(9, 0));
        pref.setAvailabilityWindowEnd(LocalTime.of(17, 0));
        entityManager.persistAndFlush(pref);
        entityManager.clear();

        // When
        Optional<PickupPreference> result = pickupPreferenceRepository.findByDonorId(donor.getId());

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getAvailabilityWindowStart()).isEqualTo(LocalTime.of(9, 0));
        assertThat(result.get().getAvailabilityWindowEnd()).isEqualTo(LocalTime.of(17, 0));
    }

    @Test
    void findByDonorId_WhenNotExists_ReturnsEmpty() {
        // When
        Optional<PickupPreference> result = pickupPreferenceRepository.findByDonorId(999L);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByDonorId_WithSlots_ReturnsPreferenceWithSlots() {
        // Given
        User donor = persistDonor("donor.slots@test.com");

        PickupPreference pref = new PickupPreference(donor);
        pref.setAvailabilityWindowStart(LocalTime.of(8, 0));
        pref.setAvailabilityWindowEnd(LocalTime.of(18, 0));
        entityManager.persist(pref);

        PickupPreferenceSlot slot1 = new PickupPreferenceSlot(
                pref, LocalTime.of(9, 0), LocalTime.of(12, 0), "Morning", 0);
        PickupPreferenceSlot slot2 = new PickupPreferenceSlot(
                pref, LocalTime.of(14, 0), LocalTime.of(17, 0), null, 1);
        entityManager.persist(slot1);
        entityManager.persist(slot2);
        entityManager.flush();
        entityManager.clear();

        // When
        Optional<PickupPreference> result = pickupPreferenceRepository.findByDonorId(donor.getId());

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getSlots()).hasSize(2);
        assertThat(result.get().getSlots().get(0).getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(result.get().getSlots().get(0).getNotes()).isEqualTo("Morning");
        assertThat(result.get().getSlots().get(1).getStartTime()).isEqualTo(LocalTime.of(14, 0));
        assertThat(result.get().getSlots().get(1).getNotes()).isNull();
    }

    @Test
    void save_NewPreference_PersistsWithAllFields() {
        // Given
        User donor = persistDonor("donor.save@test.com");

        PickupPreference pref = new PickupPreference(donor);
        pref.setAvailabilityWindowStart(LocalTime.of(10, 0));
        pref.setAvailabilityWindowEnd(LocalTime.of(16, 0));

        // When
        PickupPreference saved = pickupPreferenceRepository.save(pref);
        entityManager.flush();
        entityManager.clear();

        // Then
        PickupPreference found = entityManager.find(PickupPreference.class, saved.getId());
        assertThat(found).isNotNull();
        assertThat(found.getAvailabilityWindowStart()).isEqualTo(LocalTime.of(10, 0));
        assertThat(found.getAvailabilityWindowEnd()).isEqualTo(LocalTime.of(16, 0));
        assertThat(found.getDonor().getId()).isEqualTo(donor.getId());
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getUpdatedAt()).isNotNull();
    }
}
