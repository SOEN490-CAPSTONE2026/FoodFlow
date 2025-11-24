package com.example.foodflow.service;

import com.example.foodflow.model.dto.ReceiverPreferencesRequest;
import com.example.foodflow.model.dto.ReceiverPreferencesResponse;
import com.example.foodflow.model.entity.ReceiverPreferences;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.ReceiverPreferencesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReceiverPreferencesServiceTest {

    @Mock
    private ReceiverPreferencesRepository preferencesRepository;

    @InjectMocks
    private ReceiverPreferencesService preferencesService;

    private User receiver;
    private ReceiverPreferences existingPreferences;
    private ReceiverPreferencesRequest validRequest;

    @BeforeEach
    void setUp() {
        // Create receiver user
        receiver = new User();
        receiver.setId(1L);
        receiver.setEmail("receiver@test.com");
        receiver.setPassword("password123");
        receiver.setRole(UserRole.RECEIVER);

        // Create existing preferences
        existingPreferences = new ReceiverPreferences(receiver);
        existingPreferences.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry"));
        existingPreferences.setMaxCapacity(50);
        existingPreferences.setMinQuantity(10);
        existingPreferences.setMaxQuantity(100);
        existingPreferences.setPreferredPickupWindows(Arrays.asList("MORNING"));
        existingPreferences.setAcceptRefrigerated(true);
        existingPreferences.setAcceptFrozen(false);

        // Create valid request
        validRequest = new ReceiverPreferencesRequest();
        validRequest.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry", "Dairy & Cold Items"));
        validRequest.setMaxCapacity(75);
        validRequest.setMinQuantity(5);
        validRequest.setMaxQuantity(150);
        validRequest.setPreferredPickupWindows(Arrays.asList("MORNING", "AFTERNOON"));
        validRequest.setAcceptRefrigerated(true);
        validRequest.setAcceptFrozen(true);
    }

    @Test
    void testGetPreferences_ReturnsPreferences_WhenExists() {
        // Given
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.of(existingPreferences));

        // When
        Optional<ReceiverPreferencesResponse> result = preferencesService.getPreferences(receiver);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getMaxCapacity()).isEqualTo(50);
        assertThat(result.get().getPreferredFoodTypes()).hasSize(1);
        verify(preferencesRepository).findByUserId(receiver.getId());
    }

    @Test
    void testGetPreferences_ReturnsEmpty_WhenNotExists() {
        // Given
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.empty());

        // When
        Optional<ReceiverPreferencesResponse> result = preferencesService.getPreferences(receiver);

        // Then
        assertThat(result).isEmpty();
        verify(preferencesRepository).findByUserId(receiver.getId());
    }

    @Test
    void testSavePreferences_CreatesNew_WhenNotExists() {
        // Given
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.empty());
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> {
            ReceiverPreferences prefs = invocation.getArgument(0);
            return prefs;
        });

        // When
        ReceiverPreferencesResponse result = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getMaxCapacity()).isEqualTo(75);
        assertThat(result.getMinQuantity()).isEqualTo(5);
        assertThat(result.getMaxQuantity()).isEqualTo(150);
        verify(preferencesRepository).findByUserId(receiver.getId());
        verify(preferencesRepository).save(any(ReceiverPreferences.class));
    }

    @Test
    void testSavePreferences_UpdatesExisting_WhenExists() {
        // Given
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.of(existingPreferences));
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ReceiverPreferencesResponse result = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getMaxCapacity()).isEqualTo(75);
        assertThat(result.getPreferredFoodTypes()).hasSize(2);
        verify(preferencesRepository).findByUserId(receiver.getId());
        verify(preferencesRepository).save(existingPreferences);
    }

    @Test
    void testSavePreferences_ThrowsException_WhenMinGreaterThanMax() {
        // Given
        validRequest.setMinQuantity(100);
        validRequest.setMaxQuantity(50);

        // When/Then
        assertThatThrownBy(() -> preferencesService.savePreferences(receiver, validRequest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Minimum quantity cannot be greater than maximum quantity");

        verify(preferencesRepository, never()).save(any());
    }

    @Test
    void testDeletePreferences_CallsRepository() {
        // Given
        doNothing().when(preferencesRepository).deleteByUserId(receiver.getId());

        // When
        preferencesService.deletePreferences(receiver);

        // Then
        verify(preferencesRepository).deleteByUserId(receiver.getId());
    }

    @Test
    void testHasPreferences_ReturnsTrue_WhenExists() {
        // Given
        when(preferencesRepository.existsByUserId(receiver.getId())).thenReturn(true);

        // When
        boolean result = preferencesService.hasPreferences(receiver);

        // Then
        assertThat(result).isTrue();
        verify(preferencesRepository).existsByUserId(receiver.getId());
    }

    @Test
    void testHasPreferences_ReturnsFalse_WhenNotExists() {
        // Given
        when(preferencesRepository.existsByUserId(receiver.getId())).thenReturn(false);

        // When
        boolean result = preferencesService.hasPreferences(receiver);

        // Then
        assertThat(result).isFalse();
        verify(preferencesRepository).existsByUserId(receiver.getId());
    }

    @Test
    void testGetOrCreateDefaultPreferences_ReturnsExisting_WhenExists() {
        // Given
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.of(existingPreferences));

        // When
        ReceiverPreferencesResponse result = preferencesService.getOrCreateDefaultPreferences(receiver);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getMaxCapacity()).isEqualTo(50);
        verify(preferencesRepository).findByUserId(receiver.getId());
        verify(preferencesRepository, never()).save(any());
    }

    @Test
    void testGetOrCreateDefaultPreferences_CreatesDefault_WhenNotExists() {
        // Given
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.empty());
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ReceiverPreferencesResponse result = preferencesService.getOrCreateDefaultPreferences(receiver);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getMaxCapacity()).isEqualTo(50); // Default value
        assertThat(result.getMinQuantity()).isEqualTo(0);
        assertThat(result.getMaxQuantity()).isEqualTo(100);
        assertThat(result.getAcceptRefrigerated()).isTrue();
        assertThat(result.getAcceptFrozen()).isTrue();
        verify(preferencesRepository).findByUserId(receiver.getId());
        verify(preferencesRepository).save(any(ReceiverPreferences.class));
    }

    @Test
    void testSavePreferences_WithEmptyFoodTypes() {
        // Given
        validRequest.setPreferredFoodTypes(Arrays.asList());
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.empty());
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ReceiverPreferencesResponse result = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getPreferredFoodTypes()).isEmpty();
        verify(preferencesRepository).save(any(ReceiverPreferences.class));
    }

    @Test
    void testSavePreferences_WithEmptyPickupWindows() {
        // Given
        validRequest.setPreferredPickupWindows(Arrays.asList());
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.empty());
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ReceiverPreferencesResponse result = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getPreferredPickupWindows()).isEmpty();
        verify(preferencesRepository).save(any(ReceiverPreferences.class));
    }

    // ==================== Tests for notificationPreferencesEnabled field ====================

    @Test
    void testSavePreferences_WithNotificationPreferencesEnabled_True() {
        // Given
        validRequest.setNotificationPreferencesEnabled(true);
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.empty());
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ReceiverPreferencesResponse result = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getNotificationPreferencesEnabled()).isTrue();
        verify(preferencesRepository).save(any(ReceiverPreferences.class));
    }

    @Test
    void testSavePreferences_WithNotificationPreferencesEnabled_False() {
        // Given
        validRequest.setNotificationPreferencesEnabled(false);
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.empty());
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ReceiverPreferencesResponse result = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getNotificationPreferencesEnabled()).isFalse();
        verify(preferencesRepository).save(any(ReceiverPreferences.class));
    }

    @Test
    void testSavePreferences_UpdatesNotificationPreferencesEnabled() {
        // Given - Existing preferences with smart notifications enabled
        existingPreferences.setNotificationPreferencesEnabled(true);
        
        // Request to disable smart notifications
        validRequest.setNotificationPreferencesEnabled(false);
        
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.of(existingPreferences));
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ReceiverPreferencesResponse result = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getNotificationPreferencesEnabled()).isFalse();
        verify(preferencesRepository).save(existingPreferences);
    }

    @Test
    void testGetPreferences_ReturnsNotificationPreferencesEnabled() {
        // Given
        existingPreferences.setNotificationPreferencesEnabled(true);
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.of(existingPreferences));

        // When
        Optional<ReceiverPreferencesResponse> result = preferencesService.getPreferences(receiver);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getNotificationPreferencesEnabled()).isTrue();
        verify(preferencesRepository).findByUserId(receiver.getId());
    }

    @Test
    void testGetOrCreateDefaultPreferences_CreatesWithNotificationPreferencesEnabled() {
        // Given
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.empty());
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ReceiverPreferencesResponse result = preferencesService.getOrCreateDefaultPreferences(receiver);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getNotificationPreferencesEnabled()).isTrue(); // Default should be true
        verify(preferencesRepository).save(any(ReceiverPreferences.class));
    }

    @Test
    void testSavePreferences_WithNullNotificationPreferencesEnabled_UsesDefaultTrue() {
        // Given - Request with null notification preferences (should default to true)
        validRequest.setNotificationPreferencesEnabled(null);
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.empty());
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ReceiverPreferencesResponse result = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result).isNotNull();
        // Should use the entity's default value (true)
        assertThat(result.getNotificationPreferencesEnabled()).isTrue();
        verify(preferencesRepository).save(any(ReceiverPreferences.class));
    }

    @Test
    void testSavePreferences_ToggleNotificationPreferencesMultipleTimes() {
        // Given - Existing preferences
        existingPreferences.setNotificationPreferencesEnabled(true);
        when(preferencesRepository.findByUserId(receiver.getId())).thenReturn(Optional.of(existingPreferences));
        when(preferencesRepository.save(any(ReceiverPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When - Toggle to false
        validRequest.setNotificationPreferencesEnabled(false);
        ReceiverPreferencesResponse result1 = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result1.getNotificationPreferencesEnabled()).isFalse();

        // When - Toggle back to true
        validRequest.setNotificationPreferencesEnabled(true);
        ReceiverPreferencesResponse result2 = preferencesService.savePreferences(receiver, validRequest);

        // Then
        assertThat(result2.getNotificationPreferencesEnabled()).isTrue();
        verify(preferencesRepository, times(2)).save(existingPreferences);
    }
}
