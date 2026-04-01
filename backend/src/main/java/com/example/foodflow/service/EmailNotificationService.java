package com.example.foodflow.service;

import brevo.ApiException;

import java.util.Map;

public interface EmailNotificationService {

    void sendVerificationEmail(String toEmail, String verificationToken) throws ApiException;

    void sendPasswordResetEmail(String toEmail, String resetCode) throws ApiException;

    void sendNewDonationNotification(String toEmail, String userName, Map<String, Object> donationData);

    void sendDonationClaimedNotification(String toEmail, String userName, Map<String, Object> claimData);

    void sendClaimCanceledNotification(String toEmail, String userName, Map<String, Object> claimData);

    void sendReviewReceivedNotification(String toEmail, String userName, Map<String, Object> reviewData);

    void sendDonationPickedUpNotification(String toEmail, String userName, Map<String, Object> donationData);

    void sendNewMessageNotification(String toEmail, String recipientName, String senderName, String messagePreview);

    void sendAccountApprovalEmail(String toEmail, String userName) throws ApiException;

    void sendAccountRejectionEmail(String toEmail, String userName, String reason, String customMessage) throws ApiException;

    void sendDonationCompletedNotification(String toEmail, String userName, Map<String, Object> donationData);

    void sendReadyForPickupNotification(String toEmail, String userName, Map<String, Object> donationData);

    void sendDonationExpiredNotification(String toEmail, String donorName, Map<String, Object> donationData);

    void sendDonationStatusUpdateNotification(String toEmail, String userName, Map<String, Object> statusData);

    void sendAccountDeactivationEmail(String toEmail, String userName) throws ApiException;

    void sendAccountReactivationEmail(String toEmail, String userName) throws ApiException;

    void sendAccountDeletionEmail(String toEmail, String userName, String reason) throws ApiException;

    void sendAdminAlertEmail(String toEmail, String userName, String alertMessage);

    void sendAdminAlertEmail(String toEmail, String userName, String alertMessage, String languagePreference);
}
