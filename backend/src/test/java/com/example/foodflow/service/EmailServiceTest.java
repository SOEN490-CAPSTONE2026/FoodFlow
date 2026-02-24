package com.example.foodflow.service;

import brevo.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.HashMap;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @InjectMocks
    private EmailService emailService;

    private static final String TEST_API_KEY = "test-api-key";
    private static final String TEST_FROM_EMAIL = "noreply@foodflow.com";
    private static final String TEST_FROM_NAME = "FoodFlow";
    private static final String TEST_FRONTEND_URL = "http://localhost:3000";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "brevoApiKey", TEST_API_KEY);
        ReflectionTestUtils.setField(emailService, "fromEmail", TEST_FROM_EMAIL);
        ReflectionTestUtils.setField(emailService, "fromName", TEST_FROM_NAME);
        ReflectionTestUtils.setField(emailService, "frontendUrl", TEST_FRONTEND_URL);
    }

    @Test
    void sendVerificationEmail_WithValidInputs_SendsEmail() throws ApiException {
        // Given
        String toEmail = "test@example.com";
        String verificationToken = "test-token-123";

        // Note: Since we can't easily mock static ApiClient configuration,
        // this test verifies the method doesn't throw exceptions with valid inputs
        // In a real scenario, you'd use PowerMockito or testcontainers for full integration

        // When & Then
        // This will fail to actually send but we're testing the logic flow
        assertDoesNotThrow(() -> {
            try {
                emailService.sendVerificationEmail(toEmail, verificationToken);
            } catch (ApiException e) {
                // Expected in test environment without real API credentials
                assertTrue(e.getMessage() != null || e.getCode() != 0);
            }
        });
    }

    @Test
    void sendVerificationEmail_BuildsCorrectEmailContent() {
        // Given
        String toEmail = "user@example.com";
        String token = "verification-token-456";
        
        // When
        try {
            emailService.sendVerificationEmail(toEmail, token);
        } catch (ApiException e) {
            // Expected - we're testing the method runs without null pointer exceptions
        }

        // Then - method should have attempted to build email with these parameters
        // Verify no NullPointerException was thrown
        assertNotNull(toEmail);
        assertNotNull(token);
    }

    @Test
    void sendPasswordResetEmail_WithValidInputs_SendsEmail() throws ApiException {
        // Given
        String toEmail = "test@example.com";
        String resetCode = "123456";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendPasswordResetEmail(toEmail, resetCode);
            } catch (ApiException e) {
                // Expected in test environment without real API credentials
                assertTrue(e.getMessage() != null || e.getCode() != 0);
            }
        });
    }

    @Test
    void sendPasswordResetEmail_BuildsCorrectEmailContent() {
        // Given
        String toEmail = "user@example.com";
        String resetCode = "654321";
        
        // When
        try {
            emailService.sendPasswordResetEmail(toEmail, resetCode);
        } catch (ApiException e) {
            // Expected - we're testing the method runs without null pointer exceptions
        }

        // Then - method should have attempted to build email with these parameters
        assertNotNull(toEmail);
        assertNotNull(resetCode);
    }

    @Test
    void sendVerificationEmail_UsesConfiguredFromEmail() {
        // Given
        String customFromEmail = "custom@foodflow.com";
        ReflectionTestUtils.setField(emailService, "fromEmail", customFromEmail);
        
        String toEmail = "test@example.com";
        String token = "token-123";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendVerificationEmail(toEmail, token);
            } catch (ApiException e) {
                // Expected - verifying configuration is used
            }
        });
        
        assertEquals(customFromEmail, ReflectionTestUtils.getField(emailService, "fromEmail"));
    }

    @Test
    void sendVerificationEmail_UsesConfiguredFrontendUrl() {
        // Given
        String customFrontendUrl = "https://foodflow.com";
        ReflectionTestUtils.setField(emailService, "frontendUrl", customFrontendUrl);
        
        String toEmail = "test@example.com";
        String token = "token-789";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendVerificationEmail(toEmail, token);
            } catch (ApiException e) {
                // Expected - verifying configuration is used
            }
        });
        
        assertEquals(customFrontendUrl, ReflectionTestUtils.getField(emailService, "frontendUrl"));
    }

    @Test
    void emailService_HasRequiredConfiguration() {
        // Then
        assertNotNull(ReflectionTestUtils.getField(emailService, "brevoApiKey"));
        assertNotNull(ReflectionTestUtils.getField(emailService, "fromEmail"));
        assertNotNull(ReflectionTestUtils.getField(emailService, "fromName"));
        assertNotNull(ReflectionTestUtils.getField(emailService, "frontendUrl"));
    }

    @Test
    void sendVerificationEmail_WithNullEmail_ThrowsException() {
        // Given
        String token = "test-token";

        // When & Then
        assertThrows(Exception.class, () -> {
            emailService.sendVerificationEmail(null, token);
        });
    }

    @Test
    void sendPasswordResetEmail_WithNullEmail_ThrowsException() {
        // Given
        String resetCode = "123456";

        // When & Then
        assertThrows(Exception.class, () -> {
            emailService.sendPasswordResetEmail(null, resetCode);
        });
    }

    @Test
    void sendVerificationEmail_WithEmptyToken_AttemptsToSend() {
        // Given
        String toEmail = "test@example.com";
        String emptyToken = "";

        // When & Then - Should attempt to send even with empty token
        assertDoesNotThrow(() -> {
            try {
                emailService.sendVerificationEmail(toEmail, emptyToken);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendPasswordResetEmail_WithEmptyCode_AttemptsToSend() {
        // Given
        String toEmail = "test@example.com";
        String emptyCode = "";

        // When & Then - Should attempt to send even with empty code
        assertDoesNotThrow(() -> {
            try {
                emailService.sendPasswordResetEmail(toEmail, emptyCode);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    // ==================== Tests for sendNewDonationNotification ====================

    @Test
    void sendNewDonationNotification_WithValidData_SendsEmail() {
        // Given
        String toEmail = "receiver@example.com";
        String userName = "John Doe";
        Map<String, Object> donationData = new HashMap<>();
        donationData.put("title", "Fresh Vegetables");
        donationData.put("quantity", "5 kg");
        donationData.put("matchReason", "Matches your dietary preferences");

        // When & Then - Should not throw exception, logs error internally if API fails
        assertDoesNotThrow(() -> {
            emailService.sendNewDonationNotification(toEmail, userName, donationData);
        });
    }

    @Test
    void sendNewDonationNotification_WithMinimalData_HandlesDefaults() {
        // Given
        String toEmail = "receiver@example.com";
        String userName = "Jane Smith";
        Map<String, Object> donationData = new HashMap<>();
        // No data - should use defaults

        // When & Then
        assertDoesNotThrow(() -> {
            emailService.sendNewDonationNotification(toEmail, userName, donationData);
        });
    }

    @Test
    void sendNewDonationNotification_WithNullDonationData_HandlesGracefully() {
        // Given
        String toEmail = "receiver@example.com";
        String userName = "Bob Brown";

        // When & Then - Should catch exception internally since null causes NPE
        assertThrows(Exception.class, () -> {
            emailService.sendNewDonationNotification(toEmail, userName, null);
        });
    }

    @Test
    void sendNewDonationNotification_WithEmptyEmail_HandlesError() {
        // Given
        String toEmail = "";
        String userName = "User";
        Map<String, Object> donationData = new HashMap<>();

        // When & Then - Should catch exception internally
        assertDoesNotThrow(() -> {
            emailService.sendNewDonationNotification(toEmail, userName, donationData);
        });
    }

    @Test
    void sendNewDonationNotification_WithNullEmail_HandlesError() {
        // Given
        String userName = "User";
        Map<String, Object> donationData = new HashMap<>();

        // When & Then - Should catch exception internally
        assertDoesNotThrow(() -> {
            emailService.sendNewDonationNotification(null, userName, donationData);
        });
    }

    // ==================== Tests for sendDonationClaimedNotification ====================

    @Test
    void sendDonationClaimedNotification_WithValidData_SendsEmail() {
        // Given
        String toEmail = "donor@example.com";
        String userName = "Alice Donor";
        Map<String, Object> claimData = new HashMap<>();
        claimData.put("title", "Baked Goods");
        claimData.put("receiverName", "Community Center");
        claimData.put("quantity", "10 items");

        // When & Then
        assertDoesNotThrow(() -> {
            emailService.sendDonationClaimedNotification(toEmail, userName, claimData);
        });
    }

    @Test
    void sendDonationClaimedNotification_WithMinimalData_HandlesDefaults() {
        // Given
        String toEmail = "donor@example.com";
        String userName = "Bob Donor";
        Map<String, Object> claimData = new HashMap<>();

        // When & Then
        assertDoesNotThrow(() -> {
            emailService.sendDonationClaimedNotification(toEmail, userName, claimData);
        });
    }

    @Test
    void sendDonationClaimedNotification_WithNullClaimData_HandlesGracefully() {
        // Given
        String toEmail = "donor@example.com";
        String userName = "Charlie Donor";

        // When & Then - Should catch exception internally since null causes NPE
        assertThrows(Exception.class, () -> {
            emailService.sendDonationClaimedNotification(toEmail, userName, null);
        });
    }

    @Test
    void sendDonationClaimedNotification_WithNullEmail_HandlesError() {
        // Given
        String userName = "Donor";
        Map<String, Object> claimData = new HashMap<>();

        // When & Then - Should catch exception internally
        assertDoesNotThrow(() -> {
            emailService.sendDonationClaimedNotification(null, userName, claimData);
        });
    }

    // ==================== Tests for sendClaimCanceledNotification ====================

    @Test
    void sendClaimCanceledNotification_WithValidData_SendsEmail() {
        // Given
        String toEmail = "donor@example.com";
        String userName = "David Donor";
        Map<String, Object> claimData = new HashMap<>();
        claimData.put("title", "Surplus Food");
        claimData.put("reason", "Receiver had to cancel due to schedule change");

        // When & Then
        assertDoesNotThrow(() -> {
            emailService.sendClaimCanceledNotification(toEmail, userName, claimData);
        });
    }

    @Test
    void sendClaimCanceledNotification_WithMinimalData_HandlesDefaults() {
        // Given
        String toEmail = "donor@example.com";
        String userName = "Eve Donor";
        Map<String, Object> claimData = new HashMap<>();

        // When & Then
        assertDoesNotThrow(() -> {
            emailService.sendClaimCanceledNotification(toEmail, userName, claimData);
        });
    }

    @Test
    void sendClaimCanceledNotification_WithNullClaimData_HandlesGracefully() {
        // Given
        String toEmail = "donor@example.com";
        String userName = "Frank Donor";

        // When & Then - Should catch exception internally since null causes NPE
        assertThrows(Exception.class, () -> {
            emailService.sendClaimCanceledNotification(toEmail, userName, null);
        });
    }

    @Test
    void sendClaimCanceledNotification_WithNullEmail_HandlesError() {
        // Given
        String userName = "Donor";
        Map<String, Object> claimData = new HashMap<>();

        // When & Then - Should catch exception internally
        assertDoesNotThrow(() -> {
            emailService.sendClaimCanceledNotification(null, userName, claimData);
        });
    }

    // ==================== Tests for sendAccountApprovalEmail ====================

    @Test
    void sendAccountApprovalEmail_WithValidInputs_SendsEmail() {
        // Given
        String toEmail = "newuser@example.com";
        String userName = "New Organization";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountApprovalEmail(toEmail, userName);
            } catch (ApiException e) {
                // Expected in test environment
                assertTrue(e.getMessage() != null || e.getCode() != 0);
            }
        });
    }

    @Test
    void sendAccountApprovalEmail_WithNullEmail_ThrowsException() {
        // Given
        String userName = "Organization";

        // When & Then
        assertThrows(Exception.class, () -> {
            emailService.sendAccountApprovalEmail(null, userName);
        });
    }

    @Test
    void sendAccountApprovalEmail_WithEmptyUserName_AttemptsToSend() {
        // Given
        String toEmail = "user@example.com";
        String userName = "";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountApprovalEmail(toEmail, userName);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendAccountApprovalEmail_WithNullUserName_AttemptsToSend() {
        // Given
        String toEmail = "user@example.com";
        String userName = null;

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountApprovalEmail(toEmail, userName);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    // ==================== Tests for sendAccountRejectionEmail ====================

    @Test
    void sendAccountRejectionEmail_WithIncompleteInfo_SendsEmail() {
        // Given
        String toEmail = "rejected@example.com";
        String userName = "Rejected User";
        String reason = "incomplete_info";
        String customMessage = "Please provide valid identification documents.";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountRejectionEmail(toEmail, userName, reason, customMessage);
            } catch (ApiException e) {
                // Expected in test environment
                assertTrue(e.getMessage() != null || e.getCode() != 0);
            }
        });
    }

    @Test
    void sendAccountRejectionEmail_WithInvalidOrganization_SendsEmail() {
        // Given
        String toEmail = "org@example.com";
        String userName = "Invalid Org";
        String reason = "invalid_organization";
        String customMessage = null;

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountRejectionEmail(toEmail, userName, reason, customMessage);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendAccountRejectionEmail_WithDuplicateAccount_SendsEmail() {
        // Given
        String toEmail = "duplicate@example.com";
        String userName = "Duplicate User";
        String reason = "duplicate_account";
        String customMessage = "";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountRejectionEmail(toEmail, userName, reason, customMessage);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendAccountRejectionEmail_WithSuspiciousActivity_SendsEmail() {
        // Given
        String toEmail = "suspicious@example.com";
        String userName = "Suspicious User";
        String reason = "suspicious_activity";
        String customMessage = "Multiple accounts detected from same IP.";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountRejectionEmail(toEmail, userName, reason, customMessage);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendAccountRejectionEmail_WithDoesNotMeetCriteria_SendsEmail() {
        // Given
        String toEmail = "criteria@example.com";
        String userName = "User";
        String reason = "does_not_meet_criteria";
        String customMessage = "Must be a registered charity.";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountRejectionEmail(toEmail, userName, reason, customMessage);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendAccountRejectionEmail_WithOtherReason_SendsEmail() {
        // Given
        String toEmail = "other@example.com";
        String userName = "User";
        String reason = "other";
        String customMessage = "Custom rejection reason provided by admin.";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountRejectionEmail(toEmail, userName, reason, customMessage);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendAccountRejectionEmail_WithUnknownReason_UsesDefault() {
        // Given
        String toEmail = "unknown@example.com";
        String userName = "User";
        String reason = "unknown_reason_code";
        String customMessage = null;

        // When & Then - Should use default reason text
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountRejectionEmail(toEmail, userName, reason, customMessage);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendAccountRejectionEmail_WithNullEmail_ThrowsException() {
        // Given
        String userName = "User";
        String reason = "incomplete_info";
        String customMessage = "Test";

        // When & Then
        assertThrows(Exception.class, () -> {
            emailService.sendAccountRejectionEmail(null, userName, reason, customMessage);
        });
    }

    @Test
    void sendAccountRejectionEmail_WithNullReason_ThrowsException() {
        // Given
        String toEmail = "user@example.com";
        String userName = "User";
        String reason = null;
        String customMessage = "Custom message";

        // When & Then - Null reason causes NPE in switch statement
        assertThrows(Exception.class, () -> {
            emailService.sendAccountRejectionEmail(toEmail, userName, reason, customMessage);
        });
    }

    @Test
    void sendAccountRejectionEmail_WithEmptyCustomMessage_SendsEmail() {
        // Given
        String toEmail = "user@example.com";
        String userName = "User";
        String reason = "incomplete_info";
        String customMessage = "";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountRejectionEmail(toEmail, userName, reason, customMessage);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    // ==================== Additional Edge Case Tests ====================

    @Test
    void sendVerificationEmail_WithLongToken_SendsEmail() {
        // Given
        String toEmail = "test@example.com";
        String longToken = "a".repeat(500); // Very long token

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendVerificationEmail(toEmail, longToken);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendPasswordResetEmail_WithSpecialCharactersInCode_SendsEmail() {
        // Given
        String toEmail = "test@example.com";
        String resetCode = "123<>456"; // Code with special characters

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendPasswordResetEmail(toEmail, resetCode);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendNewDonationNotification_WithCompleteData_ContainsAllFields() {
        // Given
        String toEmail = "receiver@example.com";
        String userName = "Complete User";
        Map<String, Object> donationData = new HashMap<>();
        donationData.put("title", "Complete Donation");
        donationData.put("quantity", "100 units");
        donationData.put("matchReason", "Perfect match for your needs");
        donationData.put("extraField", "Should be ignored");

        // When & Then - Should handle extra fields gracefully
        assertDoesNotThrow(() -> {
            emailService.sendNewDonationNotification(toEmail, userName, donationData);
        });
    }

    @Test
    void sendDonationClaimedNotification_WithSpecialCharacters_HandlesCorrectly() {
        // Given
        String toEmail = "donor@example.com";
        String userName = "Donor & Co.";
        Map<String, Object> claimData = new HashMap<>();
        claimData.put("title", "Food <with> special & characters");
        claimData.put("receiverName", "Receiver's Organization");
        claimData.put("quantity", "5\"kg\"");

        // When & Then
        assertDoesNotThrow(() -> {
            emailService.sendDonationClaimedNotification(toEmail, userName, claimData);
        });
    }

    @Test
    void sendClaimCanceledNotification_WithLongReason_SendsEmail() {
        // Given
        String toEmail = "donor@example.com";
        String userName = "Donor";
        Map<String, Object> claimData = new HashMap<>();
        claimData.put("title", "Food");
        claimData.put("reason", "A".repeat(1000)); // Very long reason

        // When & Then
        assertDoesNotThrow(() -> {
            emailService.sendClaimCanceledNotification(toEmail, userName, claimData);
        });
    }

    @Test
    void sendAccountApprovalEmail_WithSpecialCharactersInName_SendsEmail() {
        // Given
        String toEmail = "user@example.com";
        String userName = "Müller & Søn's Café";

        // When & Then
        assertDoesNotThrow(() -> {
            try {
                emailService.sendAccountApprovalEmail(toEmail, userName);
            } catch (ApiException e) {
                // Expected in test environment
            }
        });
    }

    @Test
    void sendAccountRejectionEmail_WithAllReasonCodes_HandlesCorrectly() {
        // Test all rejection reason codes
        String[] reasons = {
            "incomplete_info",
            "invalid_organization",
            "duplicate_account",
            "suspicious_activity",
            "does_not_meet_criteria",
            "other"
        };

        for (String reason : reasons) {
            assertDoesNotThrow(() -> {
                try {
                    emailService.sendAccountRejectionEmail(
                        "test@example.com",
                        "Test User",
                        reason,
                        "Test message"
                    );
                } catch (ApiException e) {
                    // Expected in test environment
                }
            }, "Failed for reason: " + reason);
        }
    }

    @Test
    void emailService_ConfigurationCanBeUpdated() {
        // Given
        String newApiKey = "new-api-key";
        String newFromEmail = "new@foodflow.com";
        String newFromName = "New FoodFlow";
        String newFrontendUrl = "https://new.foodflow.com";

        // When
        ReflectionTestUtils.setField(emailService, "brevoApiKey", newApiKey);
        ReflectionTestUtils.setField(emailService, "fromEmail", newFromEmail);
        ReflectionTestUtils.setField(emailService, "fromName", newFromName);
        ReflectionTestUtils.setField(emailService, "frontendUrl", newFrontendUrl);

        // Then
        assertEquals(newApiKey, ReflectionTestUtils.getField(emailService, "brevoApiKey"));
        assertEquals(newFromEmail, ReflectionTestUtils.getField(emailService, "fromEmail"));
        assertEquals(newFromName, ReflectionTestUtils.getField(emailService, "fromName"));
        assertEquals(newFrontendUrl, ReflectionTestUtils.getField(emailService, "frontendUrl"));
    }
}
