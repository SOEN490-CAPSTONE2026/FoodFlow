package com.example.foodflow.service;

import brevo.ApiClient;
import brevo.ApiException;
import brevo.Configuration;
import brevo.auth.ApiKeyAuth;
import brevoApi.TransactionalEmailsApi;
import brevoModel.SendSmtpEmail;
import brevoModel.SendSmtpEmailSender;
import brevoModel.SendSmtpEmailTo;
import brevoModel.CreateSmtpEmail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Collections;
import java.util.Map;

@Service
public class EmailService {
    
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    
    @Value("${brevo.api.key}")
    private String brevoApiKey;
    
    @Value("${brevo.from.email}")
    private String fromEmail;
    
    @Value("${brevo.from.name}")
    private String fromName;
    
    @Value("${frontend.url}")
    private String frontendUrl;

    private final MessageSource messageSource;

    public EmailService(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    // ──────────────────────────────────────────────────────────────
    // Brand constants
    // ──────────────────────────────────────────────────────────────
    private static final String COLOR_PRIMARY   = "#224d68";
    private static final String COLOR_SUCCESS   = "#10b981";
    private static final String COLOR_WARNING   = "#f59e0b";
    private static final String COLOR_DANGER    = "#ef4444";
    private static final String COLOR_INFO      = "#3b82f6";
    private static final String COLOR_PURPLE    = "#7c3aed";

    private static final String FONT_STACK = "'Segoe UI', Tahoma, Geneva, Verdana, Arial, Helvetica, sans-serif";

    private static final String FOOTER_NOTIFICATION = "<p style=\"margin:4px 0;\">You received this because you have email notifications enabled in your preferences.</p>"
            + "<p style=\"margin:4px 0;\">Manage your settings in your FoodFlow account.</p>";
    private static final String FOOTER_AUTOMATED = "<p style=\"margin:4px 0;\">Need help? Contact us at foodflow.group@gmail.com</p>";
    private static final String FOOTER_ADMIN_ACTION = "<p style=\"margin:4px 0;\">You received this because administrative action was taken on your account.</p>";

    
    //  PUBLIC SEND METHODS
    

    /**
     * Send an email verification link to new users
     * @param toEmail recipient email address
     * @param verificationToken UUID token for email verification
     * @throws ApiException if email sending fails
     */
    public void sendVerificationEmail(String toEmail, String verificationToken) throws ApiException {
        log.info("Sending verification email to: {}", toEmail);
        
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        sendSmtpEmail.setSubject("[No-Reply] FoodFlow - Verify Your Email Address");
        sendSmtpEmail.setTextContent("Please verify your email address by clicking the link: " + frontendUrl + "/verify-email?token=" + verificationToken);
        sendSmtpEmail.setHtmlContent(buildVerificationEmailBody(verificationToken));
        
        try {
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Verification email sent successfully to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending verification email to: {}. Status: {}, Response: {}", 
                      toEmail, ex.getCode(), ex.getResponseBody(), ex);
            throw ex;
        }
    }
    
    /**
     * Send a password reset email with a verification code
     * @param toEmail recipient email address
     * @param resetCode 6-digit verification code
     * @throws ApiException if email sending fails
     */
    public void sendPasswordResetEmail(String toEmail, String resetCode) throws ApiException {
        log.info("Sending password reset email to: {}", toEmail);
        
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        sendSmtpEmail.setSubject("[No-Reply] FoodFlow - Password Reset Code");
        sendSmtpEmail.setTextContent("Your password reset code is: " + resetCode);
        sendSmtpEmail.setHtmlContent(buildPasswordResetEmailBody(resetCode));
        
        try {
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Password reset email sent successfully to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending password reset email to: {}. Status: {}, Response: {}", 
                      toEmail, ex.getCode(), ex.getResponseBody(), ex);
            throw ex;
        }
    }
    
    /**
     * Send notification email for new donation available
     */
    public void sendNewDonationNotification(String toEmail, String userName, Map<String, Object> donationData) {
        log.info("Sending new donation notification email to: {}", toEmail);
        
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);
            
            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);
            
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            
            sendSmtpEmail.setSubject("[No-Reply] New Donation Available - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildNewDonationEmailBody(userName, donationData));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("New donation notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending new donation notification to: {}", toEmail, ex);
        }
    }
    
    /**
     * Send notification email for donation claimed
     */
    public void sendDonationClaimedNotification(String toEmail, String userName, Map<String, Object> claimData) {
        log.info("Sending donation claimed notification email to: {}", toEmail);
        
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);
            
            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);
            
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            
            sendSmtpEmail.setSubject("[No-Reply] Your Donation Has Been Claimed - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildDonationClaimedEmailBody(userName, claimData));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Donation claimed notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending donation claimed notification to: {}", toEmail, ex);
        }
    }
    
    /**
     * Send notification email for claim canceled
     */
    public void sendClaimCanceledNotification(String toEmail, String userName, Map<String, Object> claimData) {
        log.info("Sending claim canceled notification email to: {}", toEmail);
        
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);
            
            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);
            
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            
            sendSmtpEmail.setSubject("[No-Reply] Claim Canceled - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildClaimCanceledEmailBody(userName, claimData));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Claim canceled notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending claim canceled notification to: {}", toEmail, ex);
        }
    }
    
    /**
     * Send notification email for review received
     */
    public void sendReviewReceivedNotification(String toEmail, String userName, Map<String, Object> reviewData) {
        log.info("Sending review received notification email to: {}", toEmail);
        
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);
            
            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);
            
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            
            sendSmtpEmail.setSubject("[No-Reply] New Review Received - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildReviewReceivedEmailBody(userName, reviewData));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Review received notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending review received notification to: {}", toEmail, ex);
        }
    }

    /**
     * Send notification email for donation picked up
     */
    public void sendDonationPickedUpNotification(String toEmail, String userName, Map<String, Object> donationData) {
        log.info("Sending donation picked up notification email to: {}", toEmail);
        
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);
            
            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);
            
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            
            sendSmtpEmail.setSubject("[No-Reply] Your Donation Has Been Picked Up - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildDonationPickedUpEmailBody(userName, donationData));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Donation picked up notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending donation picked up notification to: {}", toEmail, ex);
        }
    }

    /**
     * Send notification email for new message received
     * @param toEmail recipient email address
     * @param recipientName recipient's name or organization name
     * @param senderName sender's name or organization name
     * @param messagePreview preview of the message content
     */
    public void sendNewMessageNotification(String toEmail, String recipientName, String senderName, String messagePreview) {
        log.info("Sending new message notification email to: {}", toEmail);
        
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);
            
            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);
            
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            
            sendSmtpEmail.setSubject("[No-Reply] New Message from " + senderName + " - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildNewMessageEmailBody(recipientName, senderName, messagePreview));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("New message notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending new message notification to: {}", toEmail, ex);
        }
    }

    /**
     * Send account approval email to user
     * @param toEmail recipient email address
     * @param userName user's name or organization name
     * @throws ApiException if email sending fails
     */
    public void sendAccountApprovalEmail(String toEmail, String userName) throws ApiException {
        log.info("Sending account approval email to: {}", toEmail);
        
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        sendSmtpEmail.setSubject("[No-Reply] FoodFlow - Account Approved! Welcome to FoodFlow");
        sendSmtpEmail.setTextContent("Your FoodFlow account has been approved by our admin team. You now have full access to all features.");
        sendSmtpEmail.setHtmlContent(buildAccountApprovalEmailBody(userName));
        
        try {
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Account approval email sent successfully to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending account approval email to: {}. Status: {}, Response: {}", 
                      toEmail, ex.getCode(), ex.getResponseBody(), ex);
            throw ex;
        }
    }
    
    /**
     * Send account rejection email to user
     * @param toEmail recipient email address
     * @param userName user's name or organization name
     * @param reason rejection reason code
     * @param customMessage optional custom message from admin
     * @throws ApiException if email sending fails
     */
    public void sendAccountRejectionEmail(String toEmail, String userName, String reason, String customMessage) throws ApiException {
        log.info("Sending account rejection email to: {}", toEmail);
        
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        sendSmtpEmail.setSubject("[No-Reply] FoodFlow - Account Registration Update");
        sendSmtpEmail.setTextContent("Your FoodFlow account registration could not be approved. Reason: " + getRejectionReasonText(reason));
        sendSmtpEmail.setHtmlContent(buildAccountRejectionEmailBody(userName, reason, customMessage));
        
        try {
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Account rejection email sent successfully to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending account rejection email to: {}. Status: {}, Response: {}", 
                      toEmail, ex.getCode(), ex.getResponseBody(), ex);
            throw ex;
        }
    }

    /**
     * Send notification email for donation completed (to receiver)
     */
    public void sendDonationCompletedNotification(String toEmail, String userName, Map<String, Object> donationData) {
        log.info("Sending donation completed notification email to: {}", toEmail);
        
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);
            
            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);
            
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            
            sendSmtpEmail.setSubject("[No-Reply] Your Donation Has Been Completed - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildDonationCompletedEmailBody(userName, donationData));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Donation completed notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending donation completed notification to: {}", toEmail, ex);
        }
    }

    /**
     * Send notification email for ready for pickup (to receiver)
     */
    public void sendReadyForPickupNotification(String toEmail, String userName, Map<String, Object> donationData) {
        log.info("Sending ready for pickup notification email to: {}", toEmail);
        
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);
            
            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);
            
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            
            sendSmtpEmail.setSubject("[No-Reply] Your Donation Is Ready for Pickup - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildReadyForPickupEmailBody(userName, donationData));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Ready for pickup notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending ready for pickup notification to: {}", toEmail, ex);
        }
    }

    /**
     * Sends a donation expired notification email to a donor
     */
    public void sendDonationExpiredNotification(String toEmail, String donorName, Map<String, Object> donationData) {
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);

            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();

            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);

            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            recipient.setName(donorName);

            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            sendSmtpEmail.setSender(sender);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            sendSmtpEmail.setSubject("[No-Reply] Donation Expired - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildDonationExpiredEmailBody(donorName, donationData));

            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Donation expired email sent successfully to {} - Message ID: {}", toEmail, result.getMessageId());
        } catch (ApiException e) {
            log.error("Failed to send donation expired email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Sends a donation status update notification email
     */
    public void sendDonationStatusUpdateNotification(String toEmail, String userName, Map<String, Object> statusData) {
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);

            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();

            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);

            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            recipient.setName(userName);

            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            sendSmtpEmail.setSender(sender);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            sendSmtpEmail.setSubject("[No-Reply] Donation Status Updated by Admin - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildDonationStatusUpdateEmailBody(userName, statusData));

            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Donation status update email sent successfully to {} - Message ID: {}", toEmail, result.getMessageId());
        } catch (ApiException e) {
            log.error("Failed to send donation status update email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Send account deactivation notification email
     */
    public void sendAccountDeactivationEmail(String toEmail, String userName) throws ApiException {
        log.info("Sending account deactivation email to: {}", toEmail);
        
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        sendSmtpEmail.setSubject("[No-Reply] Account Deactivated - FoodFlow");
        sendSmtpEmail.setTextContent("Your FoodFlow account has been deactivated by an administrator.");
        sendSmtpEmail.setHtmlContent(buildAccountDeactivationEmailBody(userName));
        
        try {
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Account deactivation email sent successfully. Message ID: {}", result.getMessageId());
        } catch (ApiException e) {
            log.error("Failed to send account deactivation email: {}", e.getResponseBody(), e);
            throw e;
        }
    }

    /**
     * Send account reactivation notification email
     */
    public void sendAccountReactivationEmail(String toEmail, String userName) throws ApiException {
        log.info("Sending account reactivation email to: {}", toEmail);
        
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        sendSmtpEmail.setSubject("[No-Reply] Account Reactivated - FoodFlow");
        sendSmtpEmail.setTextContent("Your FoodFlow account has been reactivated by an administrator.");
        sendSmtpEmail.setHtmlContent(buildAccountReactivationEmailBody(userName));
        
        try {
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Account reactivation email sent successfully. Message ID: {}", result.getMessageId());
        } catch (ApiException e) {
            log.error("Failed to send account reactivation email: {}", e.getResponseBody(), e);
            throw e;
        }
    }

    /**
     * Send an admin alert email to a user
     * @param toEmail recipient email address
     * @param userName user's display name
     * @param alertMessage the alert message from the admin
     */
    public void sendAdminAlertEmail(String toEmail, String userName, String alertMessage) {
        sendAdminAlertEmail(toEmail, userName, alertMessage, "en");
    }

    public void sendAdminAlertEmail(String toEmail, String userName, String alertMessage, String languagePreference) {
        log.info("Sending admin alert email to: {}", toEmail);

        String language = normalizeSupportedLanguage(languagePreference);

        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKey.setApiKey(brevoApiKey);

            TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();

            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);

            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(toEmail);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));

            sendSmtpEmail.setSubject(getAdminAlertEmailSubject(language));
            sendSmtpEmail.setTextContent(getAdminAlertEmailText(language, userName, alertMessage));
            sendSmtpEmail.setHtmlContent(buildAdminAlertEmailBody(userName, alertMessage, language));

            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Admin alert email sent successfully to: {} (lang={}). MessageId: {}", toEmail, language, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending admin alert email to: {}. Status: {}, Response: {}",
                      toEmail, ex.getCode(), ex.getResponseBody(), ex);
        }
    }

    
    //  BRANDED TEMPLATE SYSTEM
   

    private String wrapInBrandedTemplate(String bannerTitle, String bannerColor, String innerContent, String footerNote) {
        return """
            <!DOCTYPE html>
            <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="x-apple-disable-message-reformatting">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="color-scheme" content="light">
                <meta name="supported-color-schemes" content="light">
                <title>FoodFlow</title>
                <!--[if mso]>
                <noscript>
                    <xml>
                        <o:OfficeDocumentSettings>
                            <o:AllowPNG/>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                        </o:OfficeDocumentSettings>
                    </xml>
                </noscript>
                <style>
                    table { border-collapse: collapse; }
                    td { font-family: Segoe UI, Tahoma, Geneva, Verdana, Arial, sans-serif; }
                </style>
                <![endif]-->
                <style>
                    /* === RESET === */
                    body, table, td, p, a, li, blockquote {
                        -webkit-text-size-adjust: 100%%;
                        -ms-text-size-adjust: 100%%;
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100%% !important;
                        background-color: #f0f4f8;
                    }
                    table { border-collapse: collapse !important; }
                    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
                    a { color: %s; }

                    /* === RESPONSIVE === */
                    @media only screen and (max-width: 620px) {
                        .email-outer { width: 100%% !important; max-width: 100%% !important; }
                        .content-cell { padding: 24px 18px !important; }
                        .banner-cell { padding: 24px 18px !important; }
                        .footer-cell { padding: 20px 18px !important; }
                        .logo-cell { padding: 20px 16px 14px 16px !important; }
                        .cta-btn { width: 100%% !important; text-align: center !important; box-sizing: border-box !important; }
                        .details-table { width: 100%% !important; }
                        .detail-label { display: block !important; padding-bottom: 2px !important; }
                        .detail-value { display: block !important; padding-top: 0 !important; padding-bottom: 12px !important; }
                    }
                </style>
            </head>
            <body style="margin:0; padding:0; background-color:#f0f4f8; font-family:%s; color:#1f2937; line-height:1.6; -webkit-font-smoothing:antialiased;">

                <!-- Full-width background wrapper -->
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;">
                <tr>
                <td align="center" style="padding:0;">

                    <!-- ======== LOGO ======== -->
                    <table role="presentation" class="email-outer" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%%;">
                        <tr>
                            <td class="logo-cell" align="center" style="padding:32px 24px 18px 24px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td style="background-color:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:14px 28px; text-align:center;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
                                                <tr>
                                                    <!-- Green circle icon -->
                                                    <td align="center" valign="middle"
                                                        style="width:44px; height:44px; background-color:#10b981; border-radius:22px; text-align:center; vertical-align:middle;">
                                                        <!--[if mso]>
                                                        <v:oval xmlns:v="urn:schemas-microsoft-com:vml" style="width:44px;height:44px;" fillcolor="#10b981" stroked="f">
                                                            <v:textbox inset="0,0,0,0" style="mso-fit-shape-to-text:false;">
                                                                <center style="font-size:18px;font-weight:700;color:#ffffff;font-family:Segoe UI,sans-serif;">FF</center>
                                                            </v:textbox>
                                                        </v:oval>
                                                        <![endif]-->
                                                        <!--[if !mso]><!-->
                                                        <span style="font-family:%s; font-size:18px; font-weight:700; color:#ffffff; line-height:44px; display:block;">FF</span>
                                                        <!--<![endif]-->
                                                    </td>
                                                    <!-- Spacing -->
                                                    <td style="width:12px; font-size:0;">&nbsp;</td>
                                                    <!-- Brand name -->
                                                    <td valign="middle" style="vertical-align:middle;">
                                                        <span style="font-family:%s; font-size:24px; font-weight:700; color:%s; letter-spacing:0.5px; line-height:1.1;">
                                                            FoodFlow
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <!-- ======== MAIN CARD ======== -->
                    <table role="presentation" class="email-outer" width="600" cellpadding="0" cellspacing="0" border="0"
                           style="max-width:600px; width:100%%; border-radius:12px; overflow:hidden; background-color:#ffffff;">

                        <!-- Banner -->
                        <tr>
                            <td class="banner-cell" align="center"
                                style="background-color:%s; padding:30px 32px;">
                                <h1 style="margin:0; font-family:%s; font-size:22px; font-weight:700; color:#ffffff; line-height:1.3;">
                                    %s
                                </h1>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td class="content-cell"
                                style="background-color:#ffffff; padding:36px 32px; font-family:%s; font-size:15px; color:#374151; line-height:1.6;">
                                %s
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td class="footer-cell"
                                style="background-color:#f8fafc; padding:24px 32px; border-top:1px solid #e2e8f0;">
                                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center" style="font-family:%s; font-size:12px; color:#94a3b8; line-height:1.6;">
                                            <p style="margin:0 0 6px 0;">&copy; 2026 FoodFlow. All rights reserved.</p>
                                            %s
                                            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 0 0;">
                                                <tr>
                                                    <td align="center">
                                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                                <td style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:8px 16px; text-align:center;">
                                                                    <p style="margin:0; font-size:12px; font-weight:600; color:#dc2626; line-height:1.4;">
                                                                        &#9888; This is an automated message sent from a no-reply address.
                                                                    </p>
                                                                    <p style="margin:3px 0 0 0; font-size:11px; color:#991b1b; line-height:1.4;">
                                                                        Please do not reply to this email &mdash; responses are not monitored.
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <!-- Bottom spacer -->
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
                        <tr><td style="height:32px; font-size:0; line-height:0;">&nbsp;</td></tr>
                    </table>

                </td>
                </tr>
                </table>
            </body>
            </html>
            """.formatted(
                bannerColor,           
                FONT_STACK,            
                FONT_STACK,            
                FONT_STACK,            
                COLOR_PRIMARY,         
                bannerColor,          
                FONT_STACK,            
                bannerTitle,           
                FONT_STACK,            
                innerContent,         
                FONT_STACK,            
                footerNote             
            );
    }

    // ──────────────────────────────────────────────────────────────
    // Reusable component builders
    // ──────────────────────────────────────────────────────────────

    /** Standard paragraph */
    private static String p(String html) {
        return "<p style=\"margin:0 0 16px 0; font-size:15px; color:#374151; line-height:1.6;\">" + html + "</p>";
    }

    /** Bold intro paragraph */
    private static String pBold(String html) {
        return "<p style=\"margin:0 0 16px 0; font-size:15px; color:#374151; line-height:1.6; font-weight:600;\">" + html + "</p>";
    }

    /** Colored call-to-action button (table-based for Outlook) */
    private static String ctaButton(String text, String url, String bgColor) {
        return """
            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 12px 0;">
                <tr>
                    <td align="center">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                                     href="%s" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="17%%" fill="t">
                            <v:fill type="tile" color="%s"/>
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:Segoe UI,Tahoma,sans-serif;font-size:16px;font-weight:600;">%s</center>
                        </v:roundrect>
                        <![endif]-->
                        <!--[if !mso]><!-->
                        <a href="%s" class="cta-btn"
                           style="display:inline-block; padding:14px 40px; background-color:%s; color:#ffffff !important;
                                  font-family:'Segoe UI',Tahoma,sans-serif; font-size:16px; font-weight:600;
                                  text-decoration:none; border-radius:8px; line-height:1; mso-hide:all;">
                            %s
                        </a>
                        <!--<![endif]-->
                    </td>
                </tr>
            </table>
            """.formatted(url, bgColor, text, url, bgColor, text);
    }

    /** Accent-bordered info / alert box */
    private static String infoBox(String borderColor, String bgColor, String innerHtml) {
        return """
            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
                <tr>
                    <td style="border-left:4px solid %s; background-color:%s; padding:18px 20px; border-radius:0 8px 8px 0;">
                        %s
                    </td>
                </tr>
            </table>
            """.formatted(borderColor, bgColor, innerHtml);
    }

    /** Key-value details card */
    private static String detailsCard(String... labelValuePairs) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table role=\"presentation\" class=\"details-table\" width=\"100%%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" ")
          .append("style=\"background-color:#f8fafc; border-radius:8px; margin:20px 0; border:1px solid #e2e8f0;\">");
        for (int i = 0; i + 1 < labelValuePairs.length; i += 2) {
            String bb = (i + 2 < labelValuePairs.length) ? "border-bottom:1px solid #e2e8f0;" : "";
            sb.append(String.format(
                "<tr>"
                + "<td class=\"detail-label\" style=\"padding:12px 16px; font-size:13px; font-weight:600; color:%s; vertical-align:top; white-space:nowrap; %s\">%s</td>"
                + "<td class=\"detail-value\" style=\"padding:12px 16px; font-size:14px; color:#374151; %s\">%s</td>"
                + "</tr>",
                COLOR_PRIMARY, bb, labelValuePairs[i], bb, labelValuePairs[i + 1]
            ));
        }
        sb.append("</table>");
        return sb.toString();
    }

    /** Large centered code display (for OTP / verification codes) */
    private static String codeBlock(String code) {
        return """
            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                               style="border:2px solid %s; border-radius:10px; background-color:#f8fafc;">
                            <tr>
                                <td style="padding:20px 40px; text-align:center;">
                                    <span style="font-family:'Courier New',Courier,monospace; font-size:36px; font-weight:700; letter-spacing:8px; color:%s;">
                                        %s
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            """.formatted(COLOR_PRIMARY, COLOR_PRIMARY, code);
    }

    /** Fallback link (for "if the button doesn't work") */
    private static String fallbackLink(String url) {
        return """
            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
                <tr>
                    <td style="padding:12px 16px; background-color:#f1f5f9; border-radius:6px; word-break:break-all; font-size:12px; color:#64748b;">
                        If the button doesn't work, copy and paste this link:<br/>
                        <a href="%s" style="color:%s; text-decoration:underline;">%s</a>
                    </td>
                </tr>
            </table>
            """.formatted(url, COLOR_PRIMARY, url);
    }

    
    //  EMAIL BODY BUILDERS
    

    /**
     * 1. Email Verification
     */
    private String buildVerificationEmailBody(String verificationToken) {
        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;

        String content = p("Hello,")
            + p("Thank you for registering with FoodFlow! We're excited to have you join our community in fighting food waste and helping those in need.")
            + infoBox(COLOR_PRIMARY, "#eff6ff",
                "<p style=\"margin:0; font-size:14px; color:#1e40af;\"><strong>&#128203; What happens next?</strong><br/>"
                + "Your application is pending verification. Our team will review your account within 24 hours. "
                + "Please verify your email address to complete your registration.</p>")
            + pBold("Click the button below to verify your email address:")
            + ctaButton("Verify Email Address", verificationLink, COLOR_PRIMARY)
            + fallbackLink(verificationLink)
            + "<p style=\"margin:20px 0 0 0; font-size:13px; color:#64748b;\">This verification link will expire in 24 hours.</p>"
            + "<p style=\"margin:12px 0 0 0; font-size:13px; color:#64748b;\">If you didn't create an account with FoodFlow, please ignore this email.</p>";

        return wrapInBrandedTemplate("Welcome to FoodFlow! &#127858;", COLOR_PRIMARY, content, FOOTER_AUTOMATED);
    }

    /**
     * 2. Password Reset
     */
    private String buildPasswordResetEmailBody(String resetCode) {
        String content = p("Hello,")
            + p("We received a request to reset your password. Use the verification code below to proceed:")
            + codeBlock(resetCode)
            + p("<strong>This code will expire in 60 seconds.</strong>")
            + p("If you didn't request a password reset, please ignore this email or contact support if you have concerns.")
            + infoBox(COLOR_DANGER, "#fef2f2",
                "<p style=\"margin:0; font-size:13px; color:#991b1b;\"><strong>&#9888;&#65039; Security Notice:</strong> "
                + "Never share this code with anyone. FoodFlow will never ask for this code.</p>");

        return wrapInBrandedTemplate("&#128274; Password Reset", COLOR_PRIMARY, content, FOOTER_AUTOMATED);
    }

    /**
     * 3. New Donation Notification
     */
    private String buildNewDonationEmailBody(String userName, Map<String, Object> donationData) {
        String title = (String) donationData.getOrDefault("title", "New Donation");
        String quantity = String.valueOf(donationData.getOrDefault("quantity", "N/A"));
        String matchReason = (String) donationData.getOrDefault("matchReason", "Matches your preferences");

        String content = p("Hi " + userName + ",")
            + p("A new donation matching your preferences is now available:")
            + detailsCard("Donation", title, "Quantity", quantity, "Why this matches", matchReason)
            + p("Log in to FoodFlow to view details and claim this donation!")
            + ctaButton("View Donation", frontendUrl + "/receiver/dashboard", COLOR_SUCCESS);

        return wrapInBrandedTemplate("&#127869;&#65039; New Donation Available", COLOR_SUCCESS, content, FOOTER_NOTIFICATION);
    }

    /**
     * 4. Donation Claimed
     */
    private String buildDonationClaimedEmailBody(String userName, Map<String, Object> claimData) {
        String title = (String) claimData.getOrDefault("title", "Your Donation");
        String receiverName = (String) claimData.getOrDefault("receiverName", "A receiver");
        String quantity = String.valueOf(claimData.getOrDefault("quantity", "N/A"));

        String content = p("Hi " + userName + ",")
            + p("Great news! Your donation has been claimed:")
            + detailsCard("Donation", title, "Claimed by", receiverName, "Quantity", quantity)
            + p("The receiver will coordinate pickup details with you. Please check your messages in FoodFlow.")
            + ctaButton("View Claim Details", frontendUrl + "/donor/dashboard", COLOR_PRIMARY);

        return wrapInBrandedTemplate("&#9989; Your Donation Has Been Claimed!", COLOR_PRIMARY, content, FOOTER_NOTIFICATION);
    }

    /**
     * 5. Claim Canceled
     */
    private String buildClaimCanceledEmailBody(String userName, Map<String, Object> claimData) {
        String title = (String) claimData.getOrDefault("title", "A Donation");
        String reason = (String) claimData.getOrDefault("reason", "The receiver canceled their claim");

        String content = p("Hi " + userName + ",")
            + p("A claim on your donation has been canceled:")
            + detailsCard("Donation", title, "Reason", reason)
            + infoBox(COLOR_WARNING, "#fffbeb",
                "<p style=\"margin:0; font-size:14px; color:#92400e;\">Your donation is now available again for other receivers to claim.</p>")
            + ctaButton("View Your Donations", frontendUrl + "/donor/dashboard", COLOR_PRIMARY);

        return wrapInBrandedTemplate("&#8505;&#65039; Claim Canceled", COLOR_WARNING, content, FOOTER_NOTIFICATION);
    }

    /**
     * 6. Review Received
     */
    private String buildReviewReceivedEmailBody(String userName, Map<String, Object> reviewData) {
        String reviewerName = (String) reviewData.getOrDefault("reviewerName", "A user");
        Integer rating = (Integer) reviewData.getOrDefault("rating", 0);
        String reviewText = (String) reviewData.getOrDefault("reviewText", "");
        Boolean isDonorReview = (Boolean) reviewData.getOrDefault("isDonorReview", false);

        String stars = "&#11088;".repeat(Math.max(0, Math.min(5, rating)));
        String emptyStars = "&#9734;".repeat(Math.max(0, 5 - rating));
        String starDisplay = stars + emptyStars;

        String reviewContext = isDonorReview ? "a donor" : "a receiver";
        String settingsUrl = isDonorReview
            ? frontendUrl + "/receiver/settings"
            : frontendUrl + "/donor/settings";

        String reviewSection = "";
        if (reviewText != null && !reviewText.isEmpty()) {
            reviewSection = """
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0;">
                    <tr>
                        <td style="padding:14px 18px; background-color:#f1f5f9; border-radius:6px; font-style:italic; font-size:14px; color:#475569;">
                            &ldquo;%s&rdquo;
                        </td>
                    </tr>
                </table>
                """.formatted(reviewText);
        }

        String content = p("Hi " + userName + ",")
            + p("You've received a new review from " + reviewerName + "!")
            + infoBox("#eab308", "#fefce8",
                "<p style=\"margin:0 0 8px 0; font-size:13px; font-weight:600; color:" + COLOR_PRIMARY + ";\">From: "
                + reviewerName + " (" + reviewContext + ")</p>"
                + "<p style=\"margin:0 0 8px 0; font-size:22px; line-height:1;\">" + starDisplay + "</p>"
                + "<p style=\"margin:0; font-size:14px; color:#374151;\"><strong>Rating:</strong> " + rating + "/5 stars</p>")
            + reviewSection
            + p("Your feedback helps build trust in the FoodFlow community. Keep up the great work!")
            + ctaButton("View Your Profile", settingsUrl, COLOR_PRIMARY);

        return wrapInBrandedTemplate("&#11088; New Review Received", COLOR_PRIMARY, content, FOOTER_NOTIFICATION);
    }

    /**
     * 7. Donation Picked Up
     */
    private String buildDonationPickedUpEmailBody(String userName, Map<String, Object> donationData) {
        String donationTitle = (String) donationData.getOrDefault("donationTitle", "Your Donation");
        String quantity = String.valueOf(donationData.getOrDefault("quantity", "N/A"));
        String receiverName = (String) donationData.getOrDefault("receiverName", "A receiver");

        String content = p("Hi " + userName + ",")
            + infoBox(COLOR_SUCCESS, "#ecfdf5",
                "<p style=\"margin:0; font-size:14px; color:#065f46;\"><strong>Great news!</strong> "
                + "Your donation has been successfully picked up by " + receiverName + ".</p>")
            + detailsCard("Donation", donationTitle, "Quantity", quantity, "Picked Up By", receiverName)
            + p("Thank you for making a difference in your community! Your donation will help someone in need.")
            + ctaButton("View Your Dashboard", frontendUrl + "/donor/dashboard", COLOR_SUCCESS);

        return wrapInBrandedTemplate("&#10003; Donation Picked Up", COLOR_SUCCESS, content, FOOTER_NOTIFICATION);
    }

    /**
     * 8. New Message
     */
    private String buildNewMessageEmailBody(String recipientName, String senderName, String messagePreview) {
        String preview = messagePreview != null ? messagePreview : "";
        if (preview.length() > 150) {
            preview = preview.substring(0, 147) + "...";
        }

        String content = p("Hi " + recipientName + ",")
            + p("You have received a new message on FoodFlow:")
            + infoBox(COLOR_PRIMARY, "#eff6ff",
                "<p style=\"margin:0 0 10px 0; font-size:16px; font-weight:600; color:" + COLOR_PRIMARY + ";\">From: " + senderName + "</p>"
                + "<table role=\"presentation\" width=\"100%%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
                + "<tr><td style=\"padding:12px 16px; background-color:#f1f5f9; border-radius:6px; font-style:italic; font-size:14px; color:#475569;\">"
                + "&ldquo;" + preview + "&rdquo;"
                + "</td></tr></table>")
            + p("Log in to FoodFlow to view the full message and reply!")
            + ctaButton("View Message", frontendUrl + "/donor/messages", COLOR_PRIMARY);

        return wrapInBrandedTemplate("&#128172; New Message Received", COLOR_PRIMARY, content, FOOTER_NOTIFICATION);
    }

    /**
     * 9. Account Approved
     */
    private String buildAccountApprovalEmailBody(String userName) {
        String content = p("Hi " + userName + ",")
            + infoBox(COLOR_SUCCESS, "#ecfdf5",
                "<p style=\"margin:0 0 6px 0; font-size:16px; font-weight:700; color:#065f46;\">Your Account Has Been Approved!</p>"
                + "<p style=\"margin:0; font-size:14px; color:#065f46;\">Our admin team has reviewed and approved your FoodFlow account. "
                + "You now have full access to all platform features.</p>")
            + "<table role=\"presentation\" width=\"100%%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
            + "style=\"background-color:#f8fafc; border-radius:8px; margin:20px 0; padding:0; border:1px solid #e2e8f0;\">"
            + "<tr><td style=\"padding:20px 24px;\">"
            + "<p style=\"margin:0 0 12px 0; font-size:15px; font-weight:600; color:#1f2937;\">What You Can Do Now:</p>"
            + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
            + "<tr><td style=\"padding:6px 0; font-size:14px; color:#374151;\">&#9989; Create and manage food donations</td></tr>"
            + "<tr><td style=\"padding:6px 0; font-size:14px; color:#374151;\">&#9989; Connect with receivers in your area</td></tr>"
            + "<tr><td style=\"padding:6px 0; font-size:14px; color:#374151;\">&#9989; Track your impact and contributions</td></tr>"
            + "<tr><td style=\"padding:6px 0; font-size:14px; color:#374151;\">&#9989; Communicate through our messaging system</td></tr>"
            + "<tr><td style=\"padding:6px 0; font-size:14px; color:#374151;\">&#9989; Earn achievements and points</td></tr>"
            + "</table></td></tr></table>"
            + p("We're excited to have you join our mission to reduce food waste and help those in need!")
            + ctaButton("Get Started", frontendUrl + "/login", COLOR_SUCCESS);

        return wrapInBrandedTemplate("&#127881; Welcome to FoodFlow!", COLOR_SUCCESS, content, FOOTER_AUTOMATED);
    }

    /**
     * 10. Account Rejected
     */
    private String buildAccountRejectionEmailBody(String userName, String reason, String customMessage) {
        String reasonText = getRejectionReasonText(reason);

        String messageSection = "";
        if (customMessage != null && !customMessage.trim().isEmpty()) {
            messageSection = infoBox(COLOR_WARNING, "#fffbeb",
                "<p style=\"margin:0 0 6px 0; font-size:14px; font-weight:600; color:#92400e;\">Additional Information:</p>"
                + "<p style=\"margin:0; font-size:14px; color:#78350f;\">" + customMessage + "</p>");
        }

        String content = p("Hi " + userName + ",")
            + infoBox(COLOR_DANGER, "#fef2f2",
                "<p style=\"margin:0 0 6px 0; font-size:16px; font-weight:700; color:#991b1b;\">Account Registration Status</p>"
                + "<p style=\"margin:0 0 8px 0; font-size:14px; color:#991b1b;\">After reviewing your application, "
                + "we are unable to approve your FoodFlow account at this time.</p>"
                + "<p style=\"margin:0; font-size:14px;\"><strong style=\"color:" + COLOR_PRIMARY + ";\">Reason:</strong> "
                + "<span style=\"color:#374151;\">" + reasonText + "</span></p>")
            + messageSection
            + "<table role=\"presentation\" width=\"100%%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
            + "style=\"background-color:#f8fafc; border-radius:8px; margin:20px 0; border:1px solid #e2e8f0;\">"
            + "<tr><td style=\"padding:20px 24px;\">"
            + "<p style=\"margin:0 0 12px 0; font-size:15px; font-weight:600; color:#1f2937;\">Need Assistance?</p>"
            + "<p style=\"margin:0 0 8px 0; font-size:14px; color:#374151;\">If you believe this decision was made in error, please contact our support team:</p>"
            + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
            + "<tr><td style=\"padding:4px 0; font-size:14px; color:#374151;\"><strong>Email:</strong> foodflow.group@gmail.com</td></tr>"
            + "<tr><td style=\"padding:4px 0; font-size:14px; color:#374151;\"><strong>Hours:</strong> Monday &ndash; Friday, 9 AM &ndash; 5 PM EST</td></tr>"
            + "<tr><td style=\"padding:4px 0; font-size:14px; color:#374151;\"><strong>Response Time:</strong> Within 24&ndash;48 hours</td></tr>"
            + "</table>"
            + "<p style=\"margin:12px 0 0 0; font-size:14px; color:#374151;\">You may also re-register with updated information.</p>"
            + "</td></tr></table>"
            + ctaButton("Re-Register", frontendUrl + "/register", COLOR_PRIMARY);

        return wrapInBrandedTemplate("FoodFlow Registration Update", COLOR_DANGER, content, FOOTER_AUTOMATED);
    }

    /**
     * 11. Donation Completed
     */
    private String buildDonationCompletedEmailBody(String userName, Map<String, Object> donationData) {
        String donationTitle = (String) donationData.getOrDefault("donationTitle", "A Donation");
        String quantity = String.valueOf(donationData.getOrDefault("quantity", "N/A"));
        String donorName = (String) donationData.getOrDefault("donorName", "A donor");

        String content = p("Hi " + userName + ",")
            + infoBox(COLOR_SUCCESS, "#ecfdf5",
                "<p style=\"margin:0; font-size:14px; color:#065f46;\"><strong>Excellent news!</strong> "
                + "Your donation from " + donorName + " has been successfully completed. Thank you for helping those in need!</p>")
            + detailsCard("Donation Item", donationTitle, "Quantity Received", quantity, "From", donorName)
            + p("This donation will make a real difference in your community. Your support is deeply appreciated!")
            + ctaButton("View Your Dashboard", frontendUrl + "/receiver/dashboard", COLOR_INFO);

        return wrapInBrandedTemplate("&#10003; Donation Completed", COLOR_INFO, content, FOOTER_NOTIFICATION);
    }

    /**
     * 12. Ready for Pickup
     */
    private String buildReadyForPickupEmailBody(String userName, Map<String, Object> donationData) {
        String donationTitle = (String) donationData.getOrDefault("donationTitle", "A Donation");
        String quantity = String.valueOf(donationData.getOrDefault("quantity", "N/A"));
        String pickupDate = (String) donationData.getOrDefault("pickupDate", "Soon");
        String pickupTime = (String) donationData.getOrDefault("pickupTime", "Check your app");

        String content = p("Hi " + userName + ",")
            + infoBox(COLOR_WARNING, "#fffbeb",
                "<p style=\"margin:0; font-size:14px; color:#92400e;\"><strong>Great news!</strong> "
                + "Your claimed donation is now ready for pickup. Don't miss it!</p>")
            + detailsCard("Donation Item", donationTitle, "Quantity", quantity, "Pickup Date", pickupDate, "Pickup Time", pickupTime)
            + infoBox(COLOR_PRIMARY, "#eff6ff",
                "<p style=\"margin:0; font-size:14px; color:#1e40af;\"><strong>&#128276; Don't forget to bring your pickup code!</strong> "
                + "You'll need it to confirm the pickup.</p>")
            + ctaButton("View Pickup Details", frontendUrl + "/receiver/dashboard", COLOR_WARNING);

        return wrapInBrandedTemplate("&#128680; Ready for Pickup!", COLOR_WARNING, content, FOOTER_NOTIFICATION);
    }

    /**
     * 13. Donation Expired
     */
    private String buildDonationExpiredEmailBody(String donorName, Map<String, Object> donationData) {
        String donationTitle = (String) donationData.getOrDefault("donationTitle", "A Donation");
        String quantity = String.valueOf(donationData.getOrDefault("quantity", "N/A"));
        String expiryDate = (String) donationData.getOrDefault("expiryDate", "N/A");

        String content = p("Hello " + donorName + ",")
            + infoBox(COLOR_DANGER, "#fef2f2",
                "<p style=\"margin:0 0 6px 0; font-size:14px; font-weight:600; color:#991b1b;\">Your donation has expired</p>"
                + "<p style=\"margin:0; font-size:14px; color:#7f1d1d;\">The expiry date for this donation has passed. "
                + "It has been automatically marked as expired and removed from available listings.</p>")
            + detailsCard("Donation Item", donationTitle, "Quantity", quantity, "Expiry Date", expiryDate)
            + pBold("What happens next?")
            + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:0 0 16px 0;\">"
            + "<tr><td style=\"padding:5px 0 5px 4px; font-size:14px; color:#374151;\">&#8226; The donation is no longer visible to receivers</td></tr>"
            + "<tr><td style=\"padding:5px 0 5px 4px; font-size:14px; color:#374151;\">&#8226; If claimed, the receiver will be notified</td></tr>"
            + "<tr><td style=\"padding:5px 0 5px 4px; font-size:14px; color:#374151;\">&#8226; You can create a new donation if food is still available</td></tr>"
            + "</table>"
            + ctaButton("View Dashboard", frontendUrl + "/donor/dashboard", COLOR_PRIMARY);

        return wrapInBrandedTemplate("&#128680; Donation Expired", COLOR_DANGER, content, FOOTER_NOTIFICATION);
    }

    /**
     * 14. Donation Status Updated (Admin)
     */
    private String buildDonationStatusUpdateEmailBody(String userName, Map<String, Object> statusData) {
        String donationTitle = (String) statusData.getOrDefault("donationTitle", "A Donation");
        String oldStatus = (String) statusData.getOrDefault("oldStatus", "Unknown");
        String newStatus = (String) statusData.getOrDefault("newStatus", "Unknown");
        String reason = (String) statusData.getOrDefault("reason", "No reason provided");
        String userType = (String) statusData.getOrDefault("userType", "donor");

        String entityLabel = userType.equals("donor") ? "donation" : "claim";

        String statusChange = "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:8px 0;\">"
            + "<tr>"
            + "<td style=\"padding:6px 14px; background-color:#fef2f2; border-radius:6px; font-size:13px; font-weight:600; color:#991b1b;\">" + oldStatus + "</td>"
            + "<td style=\"padding:0 10px; font-size:20px; color:#94a3b8;\">&#8594;</td>"
            + "<td style=\"padding:6px 14px; background-color:#ecfdf5; border-radius:6px; font-size:13px; font-weight:600; color:#065f46;\">" + newStatus + "</td>"
            + "</tr></table>";

        String content = p("Hello " + userName + ",")
            + infoBox(COLOR_PURPLE, "#f5f3ff",
                "<p style=\"margin:0 0 4px 0; font-size:14px; font-weight:600; color:#5b21b6;\">Admin Status Update</p>"
                + "<p style=\"margin:0; font-size:14px; color:#6d28d9;\">An administrator has updated the status of your " + entityLabel + ".</p>")
            + detailsCard("Donation", donationTitle, "Admin Reason", reason)
            + "<table role=\"presentation\" width=\"100%%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:0 0 16px 0;\">"
            + "<tr><td>"
            + "<p style=\"margin:0 0 8px 0; font-size:13px; font-weight:600; color:" + COLOR_PRIMARY + ";\">Status Change:</p>"
            + statusChange
            + "</td></tr></table>"
            + p("<strong>What does this mean?</strong> An administrator has manually updated the status of this donation. "
                + "This may have been done to resolve an issue, correct an error, or manage the donation lifecycle.")
            + ctaButton("View Dashboard", frontendUrl + "/" + userType + "/dashboard", COLOR_PRIMARY);

        return wrapInBrandedTemplate("&#128276; Status Updated by Admin", COLOR_PURPLE, content, FOOTER_NOTIFICATION);
    }

    /**
     * 15. Account Deactivated
     */
    private String buildAccountDeactivationEmailBody(String userName) {
        String content = p("Hi " + userName + ",")
            + p("Your FoodFlow account has been deactivated by an administrator.")
            + infoBox(COLOR_DANGER, "#fef2f2",
                "<p style=\"margin:0; font-size:14px; color:#991b1b;\"><strong>What this means:</strong><br/>"
                + "You will no longer be able to access your FoodFlow account or use any platform features.</p>")
            + p("If you believe this is a mistake or would like to appeal this decision, please contact our support team.")
            + "<p style=\"margin:16px 0 0 0; font-size:15px; color:#374151; line-height:1.6;\">"
            + "Best regards,<br/><strong>The FoodFlow Team</strong></p>";

        return wrapInBrandedTemplate("Account Deactivated", COLOR_DANGER, content, FOOTER_ADMIN_ACTION);
    }

    /**
     * 16. Account Reactivated
     */
    private String buildAccountReactivationEmailBody(String userName) {
        String content = p("Hi " + userName + ",")
            + p("Great news! Your FoodFlow account has been reactivated by an administrator.")
            + infoBox(COLOR_SUCCESS, "#ecfdf5",
                "<p style=\"margin:0; font-size:14px; color:#065f46;\"><strong>What this means:</strong><br/>"
                + "You now have full access to your FoodFlow account and can resume using all platform features.</p>")
            + p("You can log in to your account and continue connecting donors with receivers to reduce food waste.")
            + ctaButton("Log In to Your Account", frontendUrl + "/login", COLOR_SUCCESS)
            + "<p style=\"margin:16px 0 0 0; font-size:15px; color:#374151; line-height:1.6;\">"
            + "Welcome back,<br/><strong>The FoodFlow Team</strong></p>";

        return wrapInBrandedTemplate("Account Reactivated &#127881;", COLOR_SUCCESS, content, FOOTER_ADMIN_ACTION);
    }

   
    /**
     * 17. Admin Alert Email
     */
    private String buildAdminAlertEmailBody(String userName, String alertMessage) {
        return buildAdminAlertEmailBody(userName, alertMessage, "en");
    }

    private String buildAdminAlertEmailBody(String userName, String alertMessage, String language) {
        String normalizedLanguage = normalizeSupportedLanguage(language);
        String formattedMessage = formatAlertMessageToHtml(alertMessage);

        String content = p(getAdminAlertGreeting(normalizedLanguage) + " " + userName + ",")
            + p(getAdminAlertIntro(normalizedLanguage))
            + infoBox(COLOR_WARNING, "#fffbeb",
                "<p style=\"margin:0 0 8px 0; font-size:14px; color:#92400e;\"><strong>" + getAdminAlertHeader(normalizedLanguage) + "</strong></p>"
                + "<div style=\"font-size:14px; color:#92400e; line-height:1.7;\">" + formattedMessage + "</div>")
            + p(getAdminAlertBody(normalizedLanguage))
            + ctaButton(getAdminAlertCta(normalizedLanguage), frontendUrl + "/login", COLOR_PRIMARY)
            + "<p style=\"margin:16px 0 0 0; font-size:15px; color:#374151; line-height:1.6;\">" 
            + getAdminAlertSignoff(normalizedLanguage) + "<br/><strong>" + getFoodFlowTeamLabel(normalizedLanguage) + "</strong></p>";

        return wrapInBrandedTemplate("&#9888; " + getAdminAlertHeader(normalizedLanguage), COLOR_WARNING, content, FOOTER_ADMIN_ACTION);
    }

    private String normalizeSupportedLanguage(String languagePreference) {
        if (languagePreference == null || languagePreference.isBlank()) {
            return "en";
        }

        String normalized = languagePreference.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("-")) {
            normalized = normalized.substring(0, normalized.indexOf('-'));
        }

        return switch (normalized) {
            case "en", "fr", "es", "zh", "ar", "pt" -> normalized;
            default -> "en";
        };
    }

    private String getAdminAlertEmailSubject(String language) {
        return msg("email.adminAlert.subject", null,
                "[No-Reply] FoodFlow - Important Alert from Administration", language);
    }

    private String getAdminAlertEmailText(String language, String userName, String alertMessage) {
        Object[] args = new Object[] { userName, alertMessage };
        String fallback = "Dear " + userName
                + ", You have received an alert from the FoodFlow administration team: " + alertMessage;
        return msg("email.adminAlert.text", args, fallback, language);
    }

    private String getAdminAlertHeader(String language) {
        return msg("email.adminAlert.header", null, "Admin Alert", language);
    }

    private String getAdminAlertGreeting(String language) {
        return msg("email.adminAlert.greeting", null, "Dear", language);
    }

    private String getAdminAlertIntro(String language) {
        return msg("email.adminAlert.intro", null,
                "You have received an important alert from the FoodFlow administration team.", language);
    }

    private String getAdminAlertBody(String language) {
        return msg("email.adminAlert.body", null,
                "Please review this alert carefully and take any necessary action. If you have questions or believe this was sent in error, please contact our support team.",
                language);
    }

    private String getAdminAlertCta(String language) {
        return msg("email.adminAlert.cta", null, "Go to FoodFlow", language);
    }

    private String getAdminAlertSignoff(String language) {
        return msg("email.adminAlert.signoff", null, "Best regards,", language);
    }

    private String getFoodFlowTeamLabel(String language) {
        return msg("email.team.name", null, "The FoodFlow Team", language);
    }

    private String msg(String key, Object[] args, String fallback, String language) {
        Locale locale = resolveLocale(language);
        if (messageSource == null) {
            return fallback;
        }
        return messageSource.getMessage(key, args, fallback, locale);
    }

    private Locale resolveLocale(String language) {
        return switch (normalizeSupportedLanguage(language)) {
            case "fr" -> Locale.FRENCH;
            case "es" -> new Locale("es");
            case "zh" -> new Locale("zh");
            case "ar" -> new Locale("ar");
            case "pt" -> new Locale("pt");
            default -> Locale.ENGLISH;
        };
    }

    /**
     * Convert plain-text alert message (with \n line breaks and bullet markers)
     * into formatted HTML for email rendering.
     * Handles: newlines → &lt;br/&gt;, lines starting with - or ✓ → styled list items.
     */
    private static String formatAlertMessageToHtml(String message) {
        if (message == null || message.isEmpty()) return "";

        String[] lines = message.split("\n");
        StringBuilder sb = new StringBuilder();
        boolean inList = false;

        for (String line : lines) {
            String trimmed = line.trim();
            // Detect bullet lines: starting with "- " or "✓ " (with or without space)
            boolean isBullet = trimmed.startsWith("- ") || trimmed.startsWith("✓ ")
                    || trimmed.startsWith("✓");
            if (isBullet) {
                if (!inList) {
                    sb.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:8px 0 8px 4px;\">");
                    inList = true;
                }
                // Strip the bullet marker
                String bulletText = trimmed.replaceFirst("^[-✓]\\s*", "");
                sb.append("<tr><td style=\"vertical-align:top; padding:2px 8px 2px 0; color:#92400e; font-size:14px;\">&#8226;</td>")
                  .append("<td style=\"vertical-align:top; padding:2px 0; font-size:14px; color:#92400e;\">")
                  .append(bulletText).append("</td></tr>");
            } else {
                if (inList) {
                    sb.append("</table>");
                    inList = false;
                }
                if (trimmed.isEmpty()) {
                    sb.append("<br/>");
                } else {
                    sb.append("<p style=\"margin:4px 0; font-size:14px; color:#92400e;\">").append(trimmed).append("</p>");
                }
            }
        }
        if (inList) {
            sb.append("</table>");
        }
        return sb.toString();
    }

    /**
     * Convert rejection reason code to human-readable text
     */
    private String getRejectionReasonText(String reason) {
        return switch (reason) {
            case "incomplete_info" -> "Incomplete Information";
            case "invalid_organization" -> "Invalid Organization";
            case "duplicate_account" -> "Duplicate Account";
            case "suspicious_activity" -> "Suspicious Activity";
            case "does_not_meet_criteria" -> "Does Not Meet Criteria";
            case "other" -> "Other";
            default -> "Unspecified Reason";
        };
    }
}
