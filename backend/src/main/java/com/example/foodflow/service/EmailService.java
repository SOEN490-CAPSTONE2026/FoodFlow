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
                            <a href="http://localhost:3000/receiver" class="button" style="color: white !important; text-decoration: none;">View Donation</a>
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
                            <a href="http://localhost:3000/donor/dashboard" class="button" style="color: white !important; text-decoration: none;">View Claim Details</a>
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
                            <a href="http://localhost:3000/donor/dashboard" class="button" style="color: white !important; text-decoration: none;">View Your Donations</a>
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
}

