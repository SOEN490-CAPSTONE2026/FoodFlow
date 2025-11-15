package com.example.foodflow.repository;

import com.example.foodflow.model.entity.ReceiverPreferences;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class ReceiverPreferencesRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ReceiverPreferencesRepository preferencesRepository;

    private User receiver;

    @BeforeEach
    void setUp() {
        // Create receiver user
        receiver = new User();
        receiver.setEmail("receiver@test.com");
        receiver.setPassword("password123");
        receiver.setRole(UserRole.RECEIVER);
        entityManager.persist(receiver);
        entityManager.flush();
    }

    @Test
    void testFindByUserId_ReturnsPreferences_WhenExists() {
        // Given
        ReceiverPreferences preferences = new ReceiverPreferences(receiver);
        preferences.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry", "Dairy & Cold Items"));
        preferences.setMaxCapacity(50);
        preferences.setMinQuantity(10);
        preferences.setMaxQuantity(100);
        preferences.setPreferredPickupWindows(Arrays.asList("MORNING", "AFTERNOON"));
        preferences.setAcceptRefrigerated(true);
        preferences.setAcceptFrozen(false);
        entityManager.persist(preferences);
        entityManager.flush();

        // When
        Optional<ReceiverPreferences> result = preferencesRepository.findByUserId(receiver.getId());

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getUser().getId()).isEqualTo(receiver.getId());
        assertThat(result.get().getPreferredFoodTypes()).hasSize(2);
        assertThat(result.get().getMaxCapacity()).isEqualTo(50);
        assertThat(result.get().getMinQuantity()).isEqualTo(10);
        assertThat(result.get().getMaxQuantity()).isEqualTo(100);
        assertThat(result.get().getPreferredPickupWindows()).containsExactly("MORNING", "AFTERNOON");
        assertThat(result.get().getAcceptRefrigerated()).isTrue();
        assertThat(result.get().getAcceptFrozen()).isFalse();
    }

    @Test
    void testFindByUserId_ReturnsEmpty_WhenNotExists() {
        // When
        Optional<ReceiverPreferences> result = preferencesRepository.findByUserId(999L);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void testExistsByUserId_ReturnsTrue_WhenExists() {
        // Given
        ReceiverPreferences preferences = new ReceiverPreferences(receiver);
        entityManager.persist(preferences);
        entityManager.flush();

        // When
        boolean exists = preferencesRepository.existsByUserId(receiver.getId());

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void testExistsByUserId_ReturnsFalse_WhenNotExists() {
        // When
        boolean exists = preferencesRepository.existsByUserId(999L);

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void testDeleteByUserId_RemovesPreferences() {
        // Given
        ReceiverPreferences preferences = new ReceiverPreferences(receiver);
        entityManager.persist(preferences);
        entityManager.flush();

        // When
        preferencesRepository.deleteByUserId(receiver.getId());
        entityManager.flush();

        // Then
        Optional<ReceiverPreferences> result = preferencesRepository.findByUserId(receiver.getId());
        assertThat(result).isEmpty();
    }

    @Test
    void testSavePreferences_WithEmptyLists() {
        // Given
        ReceiverPreferences preferences = new ReceiverPreferences(receiver);
        preferences.setPreferredFoodTypes(Arrays.asList());
        preferences.setPreferredPickupWindows(Arrays.asList());
        preferences.setMaxCapacity(100);
        preferences.setMinQuantity(0);
        preferences.setMaxQuantity(200);

        // When
        ReceiverPreferences saved = preferencesRepository.save(preferences);
        entityManager.flush();

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getPreferredFoodTypes()).isEmpty();
        assertThat(saved.getPreferredPickupWindows()).isEmpty();
    }

    @Test
    void testUpdatePreferences_ModifiesExisting() {
        // Given
        ReceiverPreferences preferences = new ReceiverPreferences(receiver);
        preferences.setMaxCapacity(50);
        preferences.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry"));
        entityManager.persist(preferences);
        entityManager.flush();

        // When
        preferences.setMaxCapacity(75);
        preferences.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry", "Dairy & Cold Items"));
        preferencesRepository.save(preferences);
        entityManager.flush();

        // Then
        Optional<ReceiverPreferences> updated = preferencesRepository.findByUserId(receiver.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getMaxCapacity()).isEqualTo(75);
        assertThat(updated.get().getPreferredFoodTypes()).hasSize(2);
    }

    @Test
    void testHelperMethod_AcceptsFoodType() {
        // Given
        ReceiverPreferences preferences = new ReceiverPreferences(receiver);
        preferences.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry", "Dairy & Cold Items"));
        entityManager.persist(preferences);
        entityManager.flush();

        // When/Then
        assertThat(preferences.acceptsFoodType("Bakery & Pastry")).isTrue();
        assertThat(preferences.acceptsFoodType("Frozen Food")).isFalse();
    }

    @Test
    void testHelperMethod_AcceptsFoodType_EmptyListAcceptsAll() {
        // Given
        ReceiverPreferences preferences = new ReceiverPreferences(receiver);
        preferences.setPreferredFoodTypes(Arrays.asList());
        entityManager.persist(preferences);
        entityManager.flush();

        // When/Then
        assertThat(preferences.acceptsFoodType("Bakery & Pastry")).isTrue();
        assertThat(preferences.acceptsFoodType("Anything")).isTrue();
    }

    @Test
    void testHelperMethod_AcceptsQuantity() {
        // Given
        ReceiverPreferences preferences = new ReceiverPreferences(receiver);
        preferences.setMinQuantity(10);
        preferences.setMaxQuantity(100);
        entityManager.persist(preferences);
        entityManager.flush();

        // When/Then
        assertThat(preferences.acceptsQuantity(50)).isTrue();
        assertThat(preferences.acceptsQuantity(10)).isTrue();
        assertThat(preferences.acceptsQuantity(100)).isTrue();
        assertThat(preferences.acceptsQuantity(5)).isFalse();
        assertThat(preferences.acceptsQuantity(101)).isFalse();
    }
}
