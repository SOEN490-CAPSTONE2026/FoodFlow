package com.example.foodflow.service;

import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationPreferenceService Tests")
class NotificationPreferenceServiceTest {

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private NotificationPreferenceService notificationPreferenceService;

    private User donorUser;
    private User receiverUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        donorUser = new User();
        donorUser.setId(1L);
        donorUser.setRole(UserRole.DONOR);
        donorUser.setEmailNotificationsEnabled(true);
        donorUser.setSmsNotificationsEnabled(true);

        receiverUser = new User();
        receiverUser.setId(2L);
        receiverUser.setRole(UserRole.RECEIVER);
        receiverUser.setEmailNotificationsEnabled(true);
        receiverUser.setSmsNotificationsEnabled(true);

        adminUser = new User();
        adminUser.setId(3L);
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setEmailNotificationsEnabled(true);
        adminUser.setSmsNotificationsEnabled(true);
    }

    @Nested
    @DisplayName("shouldSendNotification Tests")
    class ShouldSendNotificationTests {

        @Test
        @DisplayName("Should return false when email notifications are disabled")
        void shouldReturnFalse_WhenEmailNotificationsDisabled() {
            donorUser.setEmailNotificationsEnabled(false);

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "email");

            assertFalse(result);
        }

        @Test
        @DisplayName("Should return false when email notifications are null")
        void shouldReturnFalse_WhenEmailNotificationsNull() {
            donorUser.setEmailNotificationsEnabled(null);

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "email");

            assertFalse(result);
        }

        @Test
        @DisplayName("Should return false when SMS notifications are disabled")
        void shouldReturnFalse_WhenSmsNotificationsDisabled() {
            donorUser.setSmsNotificationsEnabled(false);

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "sms");

            assertFalse(result);
        }

        @Test
        @DisplayName("Should return false when SMS notifications are null")
        void shouldReturnFalse_WhenSmsNotificationsNull() {
            donorUser.setSmsNotificationsEnabled(null);

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "sms");

            assertFalse(result);
        }

        @Test
        @DisplayName("Should return true when no notification type preferences exist")
        void shouldReturnTrue_WhenNoNotificationTypePreferencesExist() {
            donorUser.setNotificationTypePreferences(null);

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "email");

            assertTrue(result);
        }

        @Test
        @DisplayName("Should return true when notification type preferences are empty")
        void shouldReturnTrue_WhenNotificationTypePreferencesEmpty() {
            donorUser.setNotificationTypePreferences("");

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "email");

            assertTrue(result);
        }

        @Test
        @DisplayName("Should return true when notification type is not in preferences")
        void shouldReturnTrue_WhenNotificationTypeNotInPreferences() throws Exception {
            Map<String, Boolean> preferences = new HashMap<>();
            preferences.put("donationExpired", true);
            donorUser.setNotificationTypePreferences(objectMapper.writeValueAsString(preferences));

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "email");

            assertTrue(result);
        }

        @Test
        @DisplayName("Should return true when notification type is enabled in preferences")
        void shouldReturnTrue_WhenNotificationTypeEnabled() throws Exception {
            Map<String, Boolean> preferences = new HashMap<>();
            preferences.put("donationClaimed", true);
            donorUser.setNotificationTypePreferences(objectMapper.writeValueAsString(preferences));

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "email");

            assertTrue(result);
        }

        @Test
        @DisplayName("Should return false when notification type is disabled in preferences")
        void shouldReturnFalse_WhenNotificationTypeDisabled() throws Exception {
            Map<String, Boolean> preferences = new HashMap<>();
            preferences.put("donationClaimed", false);
            donorUser.setNotificationTypePreferences(objectMapper.writeValueAsString(preferences));

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "email");

            assertFalse(result);
        }

        @Test
        @DisplayName("Should return true for websocket channel when email is disabled")
        void shouldReturnTrue_ForWebsocketWhenEmailDisabled() {
            donorUser.setEmailNotificationsEnabled(false);

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "websocket");

            assertTrue(result);
        }

        @Test
        @DisplayName("Should handle invalid JSON in notification preferences gracefully")
        void shouldHandleInvalidJson_Gracefully() {
            donorUser.setNotificationTypePreferences("{invalid json}");

            boolean result = notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "email");

            assertTrue(result); // Should default to true when JSON is invalid
        }
    }

    @Nested
    @DisplayName("validateNotificationTypes Tests")
    class ValidateNotificationTypesTests {

        @Test
        @DisplayName("Should return empty list when all notification types are valid for DONOR")
        void shouldReturnEmptyList_WhenAllTypesValidForDonor() {
            Map<String, Boolean> notificationTypes = new HashMap<>();
            notificationTypes.put("donationClaimed", true);
            notificationTypes.put("claimCanceled", true);
            notificationTypes.put("donationExpired", true);

            List<String> invalidTypes = notificationPreferenceService.validateNotificationTypes(
                donorUser, notificationTypes);

            assertTrue(invalidTypes.isEmpty());
        }

        @Test
        @DisplayName("Should return invalid types when notification types are not valid for DONOR")
        void shouldReturnInvalidTypes_WhenTypesNotValidForDonor() {
            Map<String, Boolean> notificationTypes = new HashMap<>();
            notificationTypes.put("donationClaimed", true);
            notificationTypes.put("newDonationAvailable", true); // Invalid for DONOR
            notificationTypes.put("suspiciousActivity", true); // Invalid for DONOR

            List<String> invalidTypes = notificationPreferenceService.validateNotificationTypes(
                donorUser, notificationTypes);

            assertEquals(2, invalidTypes.size());
            assertTrue(invalidTypes.contains("newDonationAvailable"));
            assertTrue(invalidTypes.contains("suspiciousActivity"));
        }

        @Test
        @DisplayName("Should return empty list when all notification types are valid for RECEIVER")
        void shouldReturnEmptyList_WhenAllTypesValidForReceiver() {
            Map<String, Boolean> notificationTypes = new HashMap<>();
            notificationTypes.put("newDonationAvailable", true);
            notificationTypes.put("donationReadyForPickup", true);
            notificationTypes.put("donationCompleted", true);

            List<String> invalidTypes = notificationPreferenceService.validateNotificationTypes(
                receiverUser, notificationTypes);

            assertTrue(invalidTypes.isEmpty());
        }

        @Test
        @DisplayName("Should return invalid types when notification types are not valid for RECEIVER")
        void shouldReturnInvalidTypes_WhenTypesNotValidForReceiver() {
            Map<String, Boolean> notificationTypes = new HashMap<>();
            notificationTypes.put("newDonationAvailable", true);
            notificationTypes.put("donationClaimed", true); // Invalid for RECEIVER

            List<String> invalidTypes = notificationPreferenceService.validateNotificationTypes(
                receiverUser, notificationTypes);

            assertEquals(1, invalidTypes.size());
            assertTrue(invalidTypes.contains("donationClaimed"));
        }

        @Test
        @DisplayName("Should return empty list when all notification types are valid for ADMIN")
        void shouldReturnEmptyList_WhenAllTypesValidForAdmin() {
            Map<String, Boolean> notificationTypes = new HashMap<>();
            notificationTypes.put("donationFlagged", true);
            notificationTypes.put("suspiciousActivity", true);
            notificationTypes.put("verificationRequest", true);

            List<String> invalidTypes = notificationPreferenceService.validateNotificationTypes(
                adminUser, notificationTypes);

            assertTrue(invalidTypes.isEmpty());
        }

        @Test
        @DisplayName("Should handle empty notification types map")
        void shouldHandleEmptyMap() {
            Map<String, Boolean> notificationTypes = new HashMap<>();

            List<String> invalidTypes = notificationPreferenceService.validateNotificationTypes(
                donorUser, notificationTypes);

            assertTrue(invalidTypes.isEmpty());
        }
    }

    @Nested
    @DisplayName("getValidNotificationTypes Tests")
    class GetValidNotificationTypesTests {

        @Test
        @DisplayName("Should return valid notification types for DONOR role")
        void shouldReturnValidTypes_ForDonorRole() {
            Set<String> validTypes = notificationPreferenceService.getValidNotificationTypes(UserRole.DONOR);

            assertNotNull(validTypes);
            assertFalse(validTypes.isEmpty());
            assertTrue(validTypes.contains("donationClaimed"));
            assertTrue(validTypes.contains("claimCanceled"));
            assertTrue(validTypes.contains("donationExpired"));
        }

        @Test
        @DisplayName("Should return valid notification types for RECEIVER role")
        void shouldReturnValidTypes_ForReceiverRole() {
            Set<String> validTypes = notificationPreferenceService.getValidNotificationTypes(UserRole.RECEIVER);

            assertNotNull(validTypes);
            assertFalse(validTypes.isEmpty());
            assertTrue(validTypes.contains("newDonationAvailable"));
            assertTrue(validTypes.contains("donationReadyForPickup"));
            assertTrue(validTypes.contains("donationCompleted"));
        }

        @Test
        @DisplayName("Should return valid notification types for ADMIN role")
        void shouldReturnValidTypes_ForAdminRole() {
            Set<String> validTypes = notificationPreferenceService.getValidNotificationTypes(UserRole.ADMIN);

            assertNotNull(validTypes);
            assertFalse(validTypes.isEmpty());
            assertTrue(validTypes.contains("donationFlagged"));
            assertTrue(validTypes.contains("suspiciousActivity"));
            assertTrue(validTypes.contains("verificationRequest"));
        }

        @Test
        @DisplayName("Should return empty set for unknown role")
        void shouldReturnEmptySet_ForUnknownRole() {
            Set<String> validTypes = notificationPreferenceService.getValidNotificationTypes(null);

            assertNotNull(validTypes);
            assertTrue(validTypes.isEmpty());
        }
    }

    @Nested
    @DisplayName("Integration Tests")
    class IntegrationTests {

        @Test
        @DisplayName("Should work end-to-end with valid donor preferences")
        void shouldWorkEndToEnd_WithValidDonorPreferences() throws Exception {
            Map<String, Boolean> preferences = new HashMap<>();
            preferences.put("donationClaimed", true);
            preferences.put("claimCanceled", false);
            preferences.put("donationExpired", true);

            donorUser.setNotificationTypePreferences(objectMapper.writeValueAsString(preferences));

            // Should send for enabled type
            assertTrue(notificationPreferenceService.shouldSendNotification(
                donorUser, "donationClaimed", "email"));

            // Should not send for disabled type
            assertFalse(notificationPreferenceService.shouldSendNotification(
                donorUser, "claimCanceled", "email"));

            // Should send for type not in preferences (default true)
            assertTrue(notificationPreferenceService.shouldSendNotification(
                donorUser, "pickupReminder", "email"));

            // Validate the preferences
            List<String> invalidTypes = notificationPreferenceService.validateNotificationTypes(
                donorUser, preferences);
            assertTrue(invalidTypes.isEmpty());
        }

        @Test
        @DisplayName("Should work end-to-end with receiver preferences and channel checks")
        void shouldWorkEndToEnd_WithReceiverPreferencesAndChannels() throws Exception {
            Map<String, Boolean> preferences = new HashMap<>();
            preferences.put("newDonationAvailable", true);
            preferences.put("donationReadyForPickup", true);

            receiverUser.setNotificationTypePreferences(objectMapper.writeValueAsString(preferences));
            receiverUser.setEmailNotificationsEnabled(false);
            receiverUser.setSmsNotificationsEnabled(true);

            // Should not send email (channel disabled)
            assertFalse(notificationPreferenceService.shouldSendNotification(
                receiverUser, "newDonationAvailable", "email"));

            // Should send SMS (channel enabled, type enabled)
            assertTrue(notificationPreferenceService.shouldSendNotification(
                receiverUser, "newDonationAvailable", "sms"));

            // Should send websocket (not blocked by email/sms settings)
            assertTrue(notificationPreferenceService.shouldSendNotification(
                receiverUser, "newDonationAvailable", "websocket"));
        }
    }
}
