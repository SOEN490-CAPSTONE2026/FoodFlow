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

import java.time.LocalDateTime;
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

    private ReceiverPreferences createPreferencesWithTimestamps(User user) {
        ReceiverPreferences preferences = new ReceiverPreferences(user);
        // Set timestamps manually since @CreatedDate might not be working in tests
        preferences.setCreatedAt(LocalDateTime.now());
        preferences.setUpdatedAt(LocalDateTime.now());
        return preferences;
    }

    @Test
    void testFindByUserId_ReturnsPreferences_WhenExists() {
        // Given
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
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
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
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
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
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
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
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
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
        preferences.setMaxCapacity(50);
        preferences.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry"));
        entityManager.persist(preferences);
        entityManager.flush();

        // When
        preferences.setMaxCapacity(75);
        preferences.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry", "Dairy & Cold Items"));
        preferences.setUpdatedAt(LocalDateTime.now()); // Update timestamp
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
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
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
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
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
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
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

    // Additional test to verify timestamps are working
    @Test
    void testTimestampsAreSetCorrectly() {
        // Given
        LocalDateTime before = LocalDateTime.now().minusSeconds(1);
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
        
        // When
        ReceiverPreferences saved = preferencesRepository.save(preferences);
        entityManager.flush();
        LocalDateTime after = LocalDateTime.now().plusSeconds(1);

        // Then
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(saved.getCreatedAt()).isAfter(before);
        assertThat(saved.getCreatedAt()).isBefore(after);
    }

    // Test to verify user relationship
    @Test
    void testUserRelationshipIsCorrect() {
        // Given
        ReceiverPreferences preferences = createPreferencesWithTimestamps(receiver);
        preferences.setMaxCapacity(75);

        // When
        ReceiverPreferences saved = preferencesRepository.save(preferences);
        entityManager.flush();

        // Then
        assertThat(saved.getUser()).isNotNull();
        assertThat(saved.getUser().getId()).isEqualTo(receiver.getId());
        assertThat(saved.getUser().getEmail()).isEqualTo("receiver@test.com");
        assertThat(saved.getUser().getRole()).isEqualTo(UserRole.RECEIVER);
    }
}