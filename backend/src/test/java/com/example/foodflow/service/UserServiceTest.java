package com.example.foodflow.service;

import com.example.foodflow.model.dto.UpdateNotificationPreferencesRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private NotificationPreferenceService notificationPreferenceService;

    @InjectMocks
    private UserService userService;

    private User donor;
    private User receiver;
    private User admin;

    @BeforeEach
    void setUp() {
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);
        donor.setEmailNotificationsEnabled(true);
        donor.setSmsNotificationsEnabled(false);

        receiver = new User();
        receiver.setId(2L);
        receiver.setEmail("receiver@test.com");
        receiver.setRole(UserRole.RECEIVER);
        receiver.setEmailNotificationsEnabled(true);
        receiver.setSmsNotificationsEnabled(true);

        admin = new User();
        admin.setId(3L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        admin.setEmailNotificationsEnabled(true);
        admin.setSmsNotificationsEnabled(false);
    }

    // ==================== Tests for updateNotificationPreferences ====================

    @Test
    void testUpdateNotificationPreferences_EnableEmail_Success() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        User result = userService.updateNotificationPreferences(1L, request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmailNotificationsEnabled()).isTrue();
        verify(userRepository).findById(1L);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_DisableEmail_Success() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        User result = userService.updateNotificationPreferences(1L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_EnableSms_Success() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setSmsNotificationsEnabled(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        User result = userService.updateNotificationPreferences(1L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_DisableSms_Success() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setSmsNotificationsEnabled(false);

        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(userRepository.save(any(User.class))).thenReturn(receiver);

        // When
        User result = userService.updateNotificationPreferences(2L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_UserNotFound_ThrowsException() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(true);

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> userService.updateNotificationPreferences(999L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found with id: 999");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_AdminEnablingSms_ThrowsException() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setSmsNotificationsEnabled(true);

        when(userRepository.findById(3L)).thenReturn(Optional.of(admin));

        // When & Then
        assertThatThrownBy(() -> userService.updateNotificationPreferences(3L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SMS notifications are not available for admin users");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_AdminDisablingSms_Success() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setSmsNotificationsEnabled(false);

        when(userRepository.findById(3L)).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenReturn(admin);

        // When
        User result = userService.updateNotificationPreferences(3L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_WithNotificationTypes_Success() throws JsonProcessingException {
        // Given
        Map<String, Boolean> notificationTypes = new HashMap<>();
        notificationTypes.put("NEW_POST", true);
        notificationTypes.put("CLAIM_ACCEPTED", true);
        notificationTypes.put("PICKUP_REMINDER", false);

        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setNotificationTypes(notificationTypes);

        String jsonPreferences = "{\"NEW_POST\":true,\"CLAIM_ACCEPTED\":true,\"PICKUP_REMINDER\":false}";

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(notificationPreferenceService.validateNotificationTypes(donor, notificationTypes))
                .thenReturn(Collections.emptyList());
        when(objectMapper.writeValueAsString(notificationTypes)).thenReturn(jsonPreferences);
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        User result = userService.updateNotificationPreferences(1L, request);

        // Then
        assertThat(result).isNotNull();
        verify(notificationPreferenceService).validateNotificationTypes(donor, notificationTypes);
        verify(objectMapper).writeValueAsString(notificationTypes);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_InvalidNotificationTypes_ThrowsException() {
        // Given
        Map<String, Boolean> notificationTypes = new HashMap<>();
        notificationTypes.put("INVALID_TYPE", true);

        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setNotificationTypes(notificationTypes);

        List<String> invalidTypes = Arrays.asList("INVALID_TYPE");

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(notificationPreferenceService.validateNotificationTypes(donor, notificationTypes))
                .thenReturn(invalidTypes);

        // When & Then
        assertThatThrownBy(() -> userService.updateNotificationPreferences(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid notification types for role")
                .hasMessageContaining("DONOR");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_JsonProcessingException_ThrowsException() throws JsonProcessingException {
        // Given
        Map<String, Boolean> notificationTypes = new HashMap<>();
        notificationTypes.put("NEW_POST", true);

        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setNotificationTypes(notificationTypes);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(notificationPreferenceService.validateNotificationTypes(donor, notificationTypes))
                .thenReturn(Collections.emptyList());
        when(objectMapper.writeValueAsString(notificationTypes))
                .thenThrow(new JsonProcessingException("Test exception") {});

        // When & Then
        assertThatThrownBy(() -> userService.updateNotificationPreferences(1L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Error serializing notification preferences");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_BothEmailAndSms_Success() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(false);
        request.setSmsNotificationsEnabled(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        User result = userService.updateNotificationPreferences(1L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_NoChanges_Success() {
        // Given
        donor.setEmailNotificationsEnabled(true);
        
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(true); // Same as current value

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        User result = userService.updateNotificationPreferences(1L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_NullCurrentValues_Success() {
        // Given
        donor.setEmailNotificationsEnabled(null);
        donor.setSmsNotificationsEnabled(null);

        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(true);
        request.setSmsNotificationsEnabled(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        User result = userService.updateNotificationPreferences(1L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_AllPreferences_Success() throws JsonProcessingException {
        // Given
        Map<String, Boolean> notificationTypes = new HashMap<>();
        notificationTypes.put("NEW_POST", true);

        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(false);
        request.setSmsNotificationsEnabled(false);
        request.setNotificationTypes(notificationTypes);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(notificationPreferenceService.validateNotificationTypes(donor, notificationTypes))
                .thenReturn(Collections.emptyList());
        when(objectMapper.writeValueAsString(notificationTypes)).thenReturn("{}");
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        User result = userService.updateNotificationPreferences(1L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_EmptyRequest_Success() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        // All fields are null

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        User result = userService.updateNotificationPreferences(1L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_ReceiverRole_Success() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(false);
        request.setSmsNotificationsEnabled(false);

        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(userRepository.save(any(User.class))).thenReturn(receiver);

        // When
        User result = userService.updateNotificationPreferences(2L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testUpdateNotificationPreferences_AdminRole_EmailOnly_Success() {
        // Given
        UpdateNotificationPreferencesRequest request = new UpdateNotificationPreferencesRequest();
        request.setEmailNotificationsEnabled(false);

        when(userRepository.findById(3L)).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenReturn(admin);

        // When
        User result = userService.updateNotificationPreferences(3L, request);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    // ==================== Tests for getUserById ====================

    @Test
    void testGetUserById_Success() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));

        // When
        User result = userService.getUserById(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("donor@test.com");
        verify(userRepository).findById(1L);
    }

    @Test
    void testGetUserById_NotFound_ThrowsException() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> userService.getUserById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found with id: 999");
    }

    @Test
    void testGetUserById_DifferentRoles() {
        // Given - Test with receiver
        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));

        // When
        User result = userService.getUserById(2L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getRole()).isEqualTo(UserRole.RECEIVER);

        // Given - Test with admin
        when(userRepository.findById(3L)).thenReturn(Optional.of(admin));

        // When
        User adminResult = userService.getUserById(3L);

        // Then
        assertThat(adminResult).isNotNull();
        assertThat(adminResult.getRole()).isEqualTo(UserRole.ADMIN);
    }

    // ==================== Tests for getNotificationTypePreferences ====================

    @Test
    void testGetNotificationTypePreferences_Success() throws JsonProcessingException {
        // Given
        String jsonPreferences = "{\"NEW_POST\":true,\"CLAIM_ACCEPTED\":false}";
        donor.setNotificationTypePreferences(jsonPreferences);

        Map<String, Boolean> expectedMap = new HashMap<>();
        expectedMap.put("NEW_POST", true);
        expectedMap.put("CLAIM_ACCEPTED", false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(objectMapper.readValue(eq(jsonPreferences), eq(Map.class))).thenReturn(expectedMap);

        // When
        Map<String, Boolean> result = userService.getNotificationTypePreferences(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).containsEntry("NEW_POST", true);
        assertThat(result).containsEntry("CLAIM_ACCEPTED", false);
        verify(objectMapper).readValue(eq(jsonPreferences), eq(Map.class));
    }

    @Test
    void testGetNotificationTypePreferences_NullPreferences_ReturnsEmptyMap() {
        // Given
        donor.setNotificationTypePreferences(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));

        // When
        Map<String, Boolean> result = userService.getNotificationTypePreferences(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
        verifyNoInteractions(objectMapper);
    }

    @Test
    void testGetNotificationTypePreferences_EmptyPreferences_ReturnsEmptyMap() {
        // Given
        donor.setNotificationTypePreferences("");

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));

        // When
        Map<String, Boolean> result = userService.getNotificationTypePreferences(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
        verifyNoInteractions(objectMapper);
    }

    @Test
    void testGetNotificationTypePreferences_JsonProcessingException_ThrowsException() {
        // Given
        String invalidJson = "{invalid json}";
        donor.setNotificationTypePreferences(invalidJson);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        try {
            when(objectMapper.readValue(eq(invalidJson), eq(Map.class)))
                    .thenThrow(new JsonProcessingException("Test exception") {});
        } catch (JsonProcessingException e) {
            // This should not happen in test setup
        }

        // When & Then
        assertThatThrownBy(() -> userService.getNotificationTypePreferences(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Error deserializing notification preferences");
    }

    @Test
    void testGetNotificationTypePreferences_UserNotFound_ThrowsException() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> userService.getNotificationTypePreferences(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found with id: 999");
    }

    @Test
    void testGetNotificationTypePreferences_ComplexPreferences_Success() {
        // Given
        String jsonPreferences = "{\"NEW_POST\":true,\"CLAIM_ACCEPTED\":false,\"PICKUP_REMINDER\":true,\"MESSAGE_RECEIVED\":false}";
        receiver.setNotificationTypePreferences(jsonPreferences);

        Map<String, Boolean> expectedMap = new HashMap<>();
        expectedMap.put("NEW_POST", true);
        expectedMap.put("CLAIM_ACCEPTED", false);
        expectedMap.put("PICKUP_REMINDER", true);
        expectedMap.put("MESSAGE_RECEIVED", false);

        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        try {
            when(objectMapper.readValue(eq(jsonPreferences), eq(Map.class))).thenReturn(expectedMap);
        } catch (JsonProcessingException e) {
            // This should not happen in test setup
        }

        // When
        Map<String, Boolean> result = userService.getNotificationTypePreferences(2L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(4);
        assertThat(result).containsEntry("NEW_POST", true);
        assertThat(result).containsEntry("PICKUP_REMINDER", true);
    }

    @Test
    void testGetNotificationTypePreferences_EmptyJsonObject_ReturnsEmptyMap() {
        // Given
        String emptyJson = "{}";
        donor.setNotificationTypePreferences(emptyJson);

        Map<String, Boolean> emptyMap = new HashMap<>();

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        try {
            when(objectMapper.readValue(eq(emptyJson), eq(Map.class))).thenReturn(emptyMap);
        } catch (JsonProcessingException e) {
            // This should not happen in test setup
        }

        // When
        Map<String, Boolean> result = userService.getNotificationTypePreferences(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
    }
}
