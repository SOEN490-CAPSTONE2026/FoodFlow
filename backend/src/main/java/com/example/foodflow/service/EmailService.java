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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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
    
    /**
     * Send an email verification link to new users
     * @param toEmail recipient email address
     * @param verificationToken UUID token for email verification
     * @throws ApiException if email sending fails
     */
    public void sendVerificationEmail(String toEmail, String verificationToken) throws ApiException {
        log.info("Sending verification email to: {}", toEmail);
        
        // Configure API client
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        
        // Build email
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        // Set sender
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        // Set recipient
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        // Set subject and content
        sendSmtpEmail.setSubject("FoodFlow - Verify Your Email Address");
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
        
        // Configure API client
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        
        // Build email
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        // Set sender
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        // Set recipient
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        // Set subject and content
        sendSmtpEmail.setSubject("FoodFlow - Password Reset Code");
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
            
            sendSmtpEmail.setSubject("New Donation Available - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildNewDonationEmailBody(userName, donationData));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("New donation notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending new donation notification to: {}", toEmail, ex);
            // Don't throw - email is secondary to websocket notification
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
            
            sendSmtpEmail.setSubject("Your Donation Has Been Claimed - FoodFlow");
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
            
            sendSmtpEmail.setSubject("Claim Canceled - FoodFlow");
            sendSmtpEmail.setHtmlContent(buildClaimCanceledEmailBody(userName, claimData));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Claim canceled notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending claim canceled notification to: {}", toEmail, ex);
        }
    }
    
    /**
     * Build HTML email body for password reset
     */
    private String buildPasswordResetEmailBody(String resetCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #224d68; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .code-box { background-color: white; border: 2px solid #224d68; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0; }
                    .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #224d68; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    .warning { color: #b91c1c; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>FoodFlow Password Reset</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                        <div class="code-box">
                            <div class="code">%s</div>
                        </div>
                        <p><strong>This code will expire in 60 seconds.</strong></p>
                        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                        <p class="warning">⚠️ Never share this code with anyone. FoodFlow will never ask for this code.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 FoodFlow. All rights reserved.</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetCode);
    }
    
    /**
     * Build HTML email body for email verification
     */
    private String buildVerificationEmailBody(String verificationToken) {
        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #224d68; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .button-container { text-align: center; margin: 30px 0; }
                    .verify-button { 
                        background-color: #224d68; 
                        color: white !important; 
                        padding: 15px 40px; 
                        text-decoration: none !important; 
                        border-radius: 5px; 
                        font-size: 16px; 
                        font-weight: bold;
                        display: inline-block;
                    }
                    .verify-button:hover { background-color: #1a3d52; }
                    .verify-button:visited { color: white !important; }
                    .verify-button:active { color: white !important; }
                    a.verify-button { color: white !important; }
                    .info-box { 
                        background-color: #e0f2fe; 
                        border-left: 4px solid #224d68; 
                        padding: 15px; 
                        margin: 20px 0; 
                    }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    .alternative-link { 
                        word-break: break-all; 
                        color: #224d68; 
                        font-size: 12px; 
                        margin-top: 20px; 
                        padding: 10px; 
                        background-color: #f0f0f0; 
                        border-radius: 5px; 
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to FoodFlow! 🍲</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Thank you for registering with FoodFlow! We're excited to have you join our community in fighting food waste and helping those in need.</p>
                        
                        <div class="info-box">
                            <strong>📋 What happens next?</strong>
                            <p style="margin: 10px 0 0 0;">Your application is pending verification. Our team will review your account within 24 hours. Please verify your email address to complete your registration.</p>
                        </div>
                        
                        <p><strong>Click the button below to verify your email address:</strong></p>
                        
                        <div class="button-container">
                            <a href="%s" class="verify-button">Verify Email Address</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">This verification link will expire in 24 hours.</p>
                        
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <div class="alternative-link">%s</div>
                        
                        <p style="margin-top: 30px;">If you didn't create an account with FoodFlow, please ignore this email or contact our support team.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 FoodFlow. All rights reserved.</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>Need help? Contact us at support@foodflow.com</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(verificationLink, verificationLink);
    }
    
    /**
     * Build HTML email body for new donation notification
     */
    private String buildNewDonationEmailBody(String userName, Map<String, Object> donationData) {
        String title = (String) donationData.getOrDefault("title", "New Donation");
        String quantity = String.valueOf(donationData.getOrDefault("quantity", "N/A"));
        String matchReason = (String) donationData.getOrDefault("matchReason", "Matches your preferences");
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #224d68; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .donation-box { background-color: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .detail { margin: 10px 0; }
                    .label { font-weight: bold; color: #224d68; }
                    .button { display: inline-block; background-color: #224d68; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    a.button:visited { color: white !important; }
                    a.button:hover { color: white !important; }
                    a.button:active { color: white !important; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍽️ New Donation Available</h1>
                    </div>
                    <div class="content">
                        <p>Hi %s,</p>
                        <p>A new donation matching your preferences is now available:</p>
                        <div class="donation-box">
                            <div class="detail"><span class="label">Title:</span> %s</div>
                            <div class="detail"><span class="label">Quantity:</span> %s</div>
                            <div class="detail"><span class="label">Why this matches:</span> %s</div>
                        </div>
                        <p>Log in to FoodFlow to view details and claim this donation!</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/receiver-dashboard" class="button" style="color: white !important; text-decoration: none;">View Donation</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 FoodFlow. All rights reserved.</p>
                        <p>You're receiving this email because you have email notifications enabled in your preferences.</p>
                        <p>To manage your notification settings, visit Settings in your FoodFlow account.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, title, quantity, matchReason);
    }
    
    /**
     * Build HTML email body for donation claimed notification
     */
    private String buildDonationClaimedEmailBody(String userName, Map<String, Object> claimData) {
        String title = (String) claimData.getOrDefault("title", "Your Donation");
        String receiverName = (String) claimData.getOrDefault("receiverName", "A receiver");
        String quantity = String.valueOf(claimData.getOrDefault("quantity", "N/A"));
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #224d68; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .claim-box { background-color: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .detail { margin: 10px 0; }
                    .label { font-weight: bold; color: #224d68; }
                    .button { display: inline-block; background-color: #224d68; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    a.button:visited { color: white !important; }
                    a.button:hover { color: white !important; }
                    a.button:active { color: white !important; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Your Donation Has Been Claimed!</h1>
                    </div>
                    <div class="content">
                        <p>Hi %s,</p>
                        <p>Great news! Your donation has been claimed:</p>
                        <div class="claim-box">
                            <div class="detail"><span class="label">Donation:</span> %s</div>
                            <div class="detail"><span class="label">Claimed by:</span> %s</div>
                            <div class="detail"><span class="label">Quantity:</span> %s</div>
                        </div>
                        <p>The receiver will coordinate pickup details with you. Please check your messages in FoodFlow.</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/donor-dashboard" class="button" style="color: white !important; text-decoration: none;">View Claim Details</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 FoodFlow. All rights reserved.</p>
                        <p>You're receiving this email because you have email notifications enabled in your preferences.</p>
                        <p>To manage your notification settings, visit Settings in your FoodFlow account.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, title, receiverName, quantity);
    }
    
    /**
     * Build HTML email body for claim canceled notification
     */
    private String buildClaimCanceledEmailBody(String userName, Map<String, Object> claimData) {
        String title = (String) claimData.getOrDefault("title", "A Donation");
        String reason = (String) claimData.getOrDefault("reason", "The receiver canceled their claim");
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #224d68; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .info-box { background-color: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .detail { margin: 10px 0; }
                    .label { font-weight: bold; color: #224d68; }
                    .button { display: inline-block; background-color: #224d68; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    a.button:visited { color: white !important; }
                    a.button:hover { color: white !important; }
                    a.button:active { color: white !important; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>ℹ️ Claim Canceled</h1>
                    </div>
                    <div class="content">
                        <p>Hi %s,</p>
                        <p>A claim on your donation has been canceled:</p>
                        <div class="info-box">
                            <div class="detail"><span class="label">Donation:</span> %s</div>
                            <div class="detail"><span class="label">Reason:</span> %s</div>
                        </div>
                        <p>Your donation is now available again for other receivers to claim.</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/donor-dashboard" class="button" style="color: white !important; text-decoration: none;">View Your Donations</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 FoodFlow. All rights reserved.</p>
                        <p>You're receiving this email because you have email notifications enabled in your preferences.</p>
                        <p>To manage your notification settings, visit Settings in your FoodFlow account.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, title, reason);
    }
    
    /**
     * Send account approval email to user
     * @param toEmail recipient email address
     * @param userName user's name or organization name
     * @throws ApiException if email sending fails
     */
    public void sendAccountApprovalEmail(String toEmail, String userName) throws ApiException {
        log.info("Sending account approval email to: {}", toEmail);
        
        // Configure API client
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        
        // Build email
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        // Set sender
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        // Set recipient
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        // Set subject and content
        sendSmtpEmail.setSubject("FoodFlow - Account Approved! Welcome to FoodFlow");
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
        
        // Configure API client
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKey = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKey.setApiKey(brevoApiKey);
        
        TransactionalEmailsApi apiInstance = new TransactionalEmailsApi();
        
        // Build email
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        
        // Set sender
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        sender.setEmail(fromEmail);
        sender.setName(fromName);
        sendSmtpEmail.setSender(sender);
        
        // Set recipient
        SendSmtpEmailTo recipient = new SendSmtpEmailTo();
        recipient.setEmail(toEmail);
        sendSmtpEmail.setTo(Collections.singletonList(recipient));
        
        // Set subject and content
        sendSmtpEmail.setSubject("FoodFlow - Account Registration Update");
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
    
    /**
     * Build HTML email body for account approval
     */
    private String buildAccountApprovalEmailBody(String userName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #10b981; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .success-box { background-color: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .feature-list { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .feature-list li { margin: 10px 0; }
                    .button { display: inline-block; background-color: #10b981; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    a.button:visited { color: white !important; }
                    a.button:hover { background-color: #059669; color: white !important; }
                    a.button:active { color: white !important; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to FoodFlow!</h1>
                    </div>
                    <div class="content">
                        <p>Hi %s,</p>
                        <div class="success-box">
                            <h2 style="color: #10b981; margin-top: 0;">Your Account Has Been Approved!</h2>
                            <p>Great news! Our admin team has reviewed and approved your FoodFlow account. You now have full access to all platform features.</p>
                        </div>
                        <div class="feature-list">
                            <h3>What You Can Do Now:</h3>
                            <ul>
                                <li>✅ Create and manage food donations</li>
                                <li>✅ Connect with receivers in your area</li>
                                <li>✅ Track your impact and contributions</li>
                                <li>✅ Communicate through our messaging system</li>
                                <li>✅ Earn achievements and points</li>
                            </ul>
                        </div>
                        <p>We're excited to have you join our mission to reduce food waste and help those in need!</p>
                        <p style="text-align: center;">
                            <a href="%s/login" class="button" style="color: white !important; text-decoration: none;">Get Started</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 FoodFlow. All rights reserved.</p>
                        <p>Need help? Contact us at support@foodflow.com</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, frontendUrl);
    }
    
    /**
     * Build HTML email body for account rejection
     */
    private String buildAccountRejectionEmailBody(String userName, String reason, String customMessage) {
        String reasonText = getRejectionReasonText(reason);
        String messageSection = "";
        
        if (customMessage != null && !customMessage.trim().isEmpty()) {
            messageSection = """
                <div class="message-box">
                    <h3>Additional Information:</h3>
                    <p>%s</p>
                </div>
                """.formatted(customMessage);
        }
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .info-box { background-color: white; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .message-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .support-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #e5e7eb; }
                    .detail { margin: 10px 0; }
                    .label { font-weight: bold; color: #224d68; }
                    .button { display: inline-block; background-color: #224d68; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    a.button:visited { color: white !important; }
                    a.button:hover { background-color: #1a3a4f; color: white !important; }
                    a.button:active { color: white !important; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>FoodFlow Registration Update</h1>
                    </div>
                    <div class="content">
                        <p>Hi %s,</p>
                        <div class="info-box">
                            <h2 style="margin-top: 0;">Account Registration Status</h2>
                            <p>After reviewing your application, we are unable to approve your FoodFlow account at this time.</p>
                            <div class="detail"><span class="label">Reason:</span> %s</div>
                        </div>
                        %s
                        <div class="support-box">
                            <h3>Need Assistance?</h3>
                            <p>If you believe this decision was made in error or would like to provide additional information, please contact our support team:</p>
                            <ul>
                                <li><strong>Email:</strong> support@foodflow.com</li>
                                <li><strong>Hours:</strong> Monday - Friday, 9 AM - 5 PM EST</li>
                                <li><strong>Response Time:</strong> Within 24-48 hours</li>
                            </ul>
                            <p>You may also re-register with updated information if the issues have been resolved.</p>
                        </div>
                        <p style="text-align: center;">
                            <a href="%s/register" class="button" style="color: white !important; text-decoration: none;">Re-Register</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2026 FoodFlow. All rights reserved.</p>
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, reasonText, messageSection, frontendUrl);
    }
}

