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
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Locale;
import java.util.Map;

@Service
public class EmailService {
    
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    
    private final MessageSource messageSource;
    private final UserRepository userRepository;
    
    @Value("${brevo.api.key}")
    private String brevoApiKey;
    
    @Value("${brevo.from.email}")
    private String fromEmail;
    
    @Value("${brevo.from.name}")
    private String fromName;
    
    @Value("${frontend.url}")
    private String frontendUrl;
    
    // Supported languages matching the platform's language list
    private static final String[] SUPPORTED_LANGUAGES = {"en", "fr", "es", "zh", "ar", "pt"};
    
    public EmailService(MessageSource messageSource, UserRepository userRepository) {
        this.messageSource = messageSource;
        this.userRepository = userRepository;
    }
    
    /**
     * Get user's preferred language from their profile, with fallback to English
     * @param email user's email address
     * @return Locale object for the user's language preference
     */
    private Locale getUserLocale(String email) {
        try {
            return userRepository.findByEmail(email)
                    .map(user -> {
                        String lang = user.getLanguagePreference();
                        if (lang != null && isSupportedLanguage(lang)) {
                            return Locale.forLanguageTag(lang);
                        }
                        return Locale.ENGLISH; // Default fallback
                    })
                    .orElse(Locale.ENGLISH);
        } catch (Exception e) {
            log.warn("Error fetching user locale for {}: {}. Defaulting to English.", email, e.getMessage());
            return Locale.ENGLISH;
        }
    }
    
    /**
     * Check if a language code is supported
     */
    private boolean isSupportedLanguage(String lang) {
        for (String supported : SUPPORTED_LANGUAGES) {
            if (supported.equalsIgnoreCase(lang)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get translated message with fallback to English
     */
    private String getMessage(String key, Locale locale, Object... args) {
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (Exception e) {
            log.warn("Translation not found for key '{}' in locale '{}'. Falling back to English.", key, locale);
            try {
                return messageSource.getMessage(key, args, Locale.ENGLISH);
            } catch (Exception ex) {
                log.error("Translation not found for key '{}' even in English. Returning key as fallback.", key);
                return key;
            }
        }
    }
    
    /**
     * Send an email verification link to new users
     * @param toEmail recipient email address
     * @param verificationToken UUID token for email verification
     * @throws ApiException if email sending fails
     */
    public void sendVerificationEmail(String toEmail, String verificationToken) throws ApiException {
        log.info("Sending verification email to: {}", toEmail);
        
        Locale locale = getUserLocale(toEmail);
        
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
        
        // Set subject and content (localized)
        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
        sendSmtpEmail.setSubject(getMessage("email.verification.subject", locale));
        sendSmtpEmail.setTextContent(getMessage("email.verification.text_content", locale, verificationLink));
        sendSmtpEmail.setHtmlContent(buildVerificationEmailBody(verificationToken, locale));
        
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
        
        Locale locale = getUserLocale(toEmail);
        
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
        
        // Set subject and content (localized)
        sendSmtpEmail.setSubject(getMessage("email.password_reset.subject", locale));
        sendSmtpEmail.setTextContent(getMessage("email.password_reset.text_content", locale, resetCode));
        sendSmtpEmail.setHtmlContent(buildPasswordResetEmailBody(resetCode, locale));
        
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
        
        Locale locale = getUserLocale(toEmail);
        
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
            
            sendSmtpEmail.setSubject(getMessage("email.new_donation.subject", locale));
            sendSmtpEmail.setHtmlContent(buildNewDonationEmailBody(userName, donationData, locale));
            
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
        
        Locale locale = getUserLocale(toEmail);
        
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
            
            sendSmtpEmail.setSubject(getMessage("email.donation_claimed.subject", locale));
            sendSmtpEmail.setHtmlContent(buildDonationClaimedEmailBody(userName, claimData, locale));
            
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
        
        Locale locale = getUserLocale(toEmail);
        
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
            
            sendSmtpEmail.setSubject(getMessage("email.claim_canceled.subject", locale));
            sendSmtpEmail.setHtmlContent(buildClaimCanceledEmailBody(userName, claimData, locale));
            
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
        
        Locale locale = getUserLocale(toEmail);
        
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
            
            sendSmtpEmail.setSubject(getMessage("email.review_received.subject", locale));
            sendSmtpEmail.setHtmlContent(buildReviewReceivedEmailBody(userName, reviewData, locale));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Review received notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending review received notification to: {}", toEmail, ex);
            // Don't throw - email is secondary to websocket notification
        }
    }

    /**
     * Send notification email for donation picked up
     */
    public void sendDonationPickedUpNotification(String toEmail, String userName, Map<String, Object> donationData) {
        log.info("Sending donation picked up notification email to: {}", toEmail);
        
        Locale locale = getUserLocale(toEmail);
        
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
            
            sendSmtpEmail.setSubject(getMessage("email.donation_picked_up.subject", locale));
            sendSmtpEmail.setHtmlContent(buildDonationPickedUpEmailBody(userName, donationData, locale));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Donation picked up notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending donation picked up notification to: {}", toEmail, ex);
            // Don't throw - email is secondary to websocket notification
        }
    }
    
    /**
     * Build HTML email body for password reset
     */
    private String buildPasswordResetEmailBody(String resetCode, Locale locale) {
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
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s</p>
                        <p>%s</p>
                        <div class="code-box">
                            <div class="code">%s</div>
                        </div>
                        <p><strong>%s</strong></p>
                        <p>%s</p>
                        <p class="warning">%s</p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.password_reset.header", locale),
                getMessage("email.common.hello", locale),
                getMessage("email.password_reset.intro", locale),
                resetCode,
                getMessage("email.password_reset.expire_warning", locale),
                getMessage("email.password_reset.ignore_message", locale),
                getMessage("email.password_reset.security_warning", locale),
                getMessage("email.common.footer_copyright", locale),
                getMessage("email.common.footer_automated", locale)
            );
    }
    
    /**
     * Build HTML email body for email verification
     */
    private String buildVerificationEmailBody(String verificationToken, Locale locale) {
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
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s</p>
                        <p>%s</p>
                        
                        <div class="info-box">
                            <strong>%s</strong>
                            <p style="margin: 10px 0 0 0;">%s</p>
                        </div>
                        
                        <p><strong>%s</strong></p>
                        
                        <div class="button-container">
                            <a href="%s" class="verify-button">%s</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">%s</p>
                        
                        <p>%s</p>
                        <div class="alternative-link">%s</div>
                        
                        <p style="margin-top: 30px;">%s</p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.verification.header", locale),
                getMessage("email.common.hello", locale),
                getMessage("email.verification.intro", locale),
                getMessage("email.verification.what_next_title", locale),
                getMessage("email.verification.what_next_body", locale),
                getMessage("email.verification.button_instruction", locale),
                verificationLink,
                getMessage("email.verification.button_text", locale),
                getMessage("email.verification.link_expiry", locale),
                getMessage("email.verification.alt_link_text", locale),
                verificationLink,
                getMessage("email.verification.ignore_message", locale),
                getMessage("email.common.footer_copyright", locale),
                getMessage("email.common.footer_automated", locale),
                getMessage("email.verification.footer_support", locale)
            );
    }
    
    /**
     * Build HTML email body for new donation notification
     */
    private String buildNewDonationEmailBody(String userName, Map<String, Object> donationData, Locale locale) {
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
                        <h1>🍽️ %s</h1>
                    </div>
                    <div class="content">
                        <p>%s %s,</p>
                        <p>%s</p>
                        <div class="donation-box">
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                        </div>
                        <p>%s</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/receiver/dashboard" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.new_donation.header", locale),
                getMessage("email.common.hi", locale), userName,
                getMessage("email.new_donation.intro", locale),
                getMessage("email.new_donation.label_title", locale), title,
                getMessage("email.new_donation.label_quantity", locale), quantity,
                getMessage("email.new_donation.label_match_reason", locale), matchReason,
                getMessage("email.new_donation.cta_text", locale),
                getMessage("email.new_donation.button_text", locale),
                getMessage("email.common.footer_copyright", locale),
                getMessage("email.common.footer_notifications", locale),
                getMessage("email.common.footer_manage_settings", locale)
            );
    }
    
    /**
     * Build HTML email body for donation claimed notification
     */
    private String buildDonationClaimedEmailBody(String userName, Map<String, Object> claimData, Locale locale) {
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
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s %s,</p>
                        <p>%s</p>
                        <div class="claim-box">
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                        </div>
                        <p>%s</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/donor/dashboard" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.donation_claimed.header", locale),
                getMessage("email.common.hi", locale), userName,
                getMessage("email.donation_claimed.message", locale),
                getMessage("email.donation_claimed.label.donation", locale), title,
                getMessage("email.donation_claimed.label.claimed_by", locale), receiverName,
                getMessage("email.donation_claimed.label.quantity", locale), quantity,
                getMessage("email.donation_claimed.instruction", locale),
                getMessage("email.donation_claimed.button", locale),
                getMessage("email.common.footer_copyright", locale),
                getMessage("email.common.footer_notifications", locale),
                getMessage("email.common.footer_manage_settings", locale)
            );
    }
    
    /**
     * Build HTML email body for claim canceled notification
     */
    private String buildClaimCanceledEmailBody(String userName, Map<String, Object> claimData, Locale locale) {
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
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s %s,</p>
                        <p>%s</p>
                        <div class="info-box">
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                        </div>
                        <p>%s</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/donor/dashboard" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.claim_canceled.header", locale),
                getMessage("email.common.hi", locale), userName,
                getMessage("email.claim_canceled.message", locale),
                getMessage("email.claim_canceled.label.donation", locale), title,
                getMessage("email.claim_canceled.label.reason", locale), reason,
                getMessage("email.claim_canceled.instruction", locale),
                getMessage("email.claim_canceled.button", locale),
                getMessage("email.common.footer_copyright", locale),
                getMessage("email.common.footer_notifications", locale),
                getMessage("email.common.footer_manage_settings", locale)
            );
    }
    
    /**
     * Build HTML email body for review received notification
     */
    private String buildReviewReceivedEmailBody(String userName, Map<String, Object> reviewData, Locale locale) {
        String reviewerName = (String) reviewData.getOrDefault("reviewerName", "A user");
        Integer rating = (Integer) reviewData.getOrDefault("rating", 0);
        String reviewText = (String) reviewData.getOrDefault("reviewText", "");
        Boolean isDonorReview = (Boolean) reviewData.getOrDefault("isDonorReview", false);
        
        // Generate star rating display
        String stars = "⭐".repeat(Math.max(0, Math.min(5, rating)));
        String emptyStars = "☆".repeat(Math.max(0, 5 - rating));
        String starDisplay = stars + emptyStars;
        
        // Determine review context
        String reviewContext = isDonorReview ? "a donor" : "a receiver";
        
        // Determine correct settings URL based on role
        String settingsUrl = isDonorReview ? "http://localhost:3000/receiver/settings" : "http://localhost:3000/donor/settings";
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #224d68; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .review-box { background-color: white; border-left: 4px solid #fbbf24; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .stars { font-size: 24px; color: #fbbf24; margin: 15px 0; }
                    .review-text { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0; font-style: italic; }
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
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s %s,</p>
                        <p>%s</p>
                        <div class="review-box">
                            <div class="detail"><span class="label">%s</span> %s (%s)</div>
                            <div class="stars">%s</div>
                            <div class="detail"><span class="label">%s</span> %d%s</div>
                            %s
                        </div>
                        <p>%s</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.review_received.header", locale),
                getMessage("email.common.hi", locale), userName,
                getMessage("email.review_received.message", locale, reviewerName),
                getMessage("email.review_received.label.from", locale), reviewerName, reviewContext,
                starDisplay,
                getMessage("email.review_received.label.rating", locale), rating, getMessage("email.review_received.stars_suffix", locale),
                reviewText != null && !reviewText.isEmpty() 
                    ? "<div class=\"review-text\">\"" + reviewText + "\"</div>" 
                    : "",
                getMessage("email.review_received.instruction", locale),
                settingsUrl,
                getMessage("email.review_received.button", locale),
                getMessage("email.common.footer_copyright", locale),
                getMessage("email.common.footer_notifications", locale),
                getMessage("email.common.footer_manage_settings", locale)
            );
    }
    
    /**
     * Send notification email for new message received
     * Generalized method that works for both donors and receivers
     * @param toEmail recipient email address
     * @param recipientName recipient's name or organization name
     * @param senderName sender's name or organization name
     * @param messagePreview preview of the message content
     */
    public void sendNewMessageNotification(String toEmail, String recipientName, String senderName, String messagePreview) {
        log.info("Sending new message notification email to: {}", toEmail);
        
        Locale locale = getUserLocale(toEmail);
        
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
            
            sendSmtpEmail.setSubject(getMessage("email.new_message.subject", locale, senderName));
            sendSmtpEmail.setHtmlContent(buildNewMessageEmailBody(recipientName, senderName, messagePreview, locale));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("New message notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending new message notification to: {}", toEmail, ex);
            // Don't throw - email is secondary to websocket notification
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
        
        Locale locale = getUserLocale(toEmail);
        
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
        sendSmtpEmail.setSubject(getMessage("email.account_approval.subject", locale));
        sendSmtpEmail.setTextContent(getMessage("email.account_approval.text_content", locale));
        sendSmtpEmail.setHtmlContent(buildAccountApprovalEmailBody(userName, locale));
        
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
        
        Locale locale = getUserLocale(toEmail);
        
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
        sendSmtpEmail.setSubject(getMessage("email.account_rejection.subject", locale));
        sendSmtpEmail.setTextContent(getMessage("email.account_rejection.text_content", locale, getRejectionReasonText(reason, locale)));
        sendSmtpEmail.setHtmlContent(buildAccountRejectionEmailBody(userName, reason, customMessage, locale));
        
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
    private String getRejectionReasonText(String reason, Locale locale) {
        return switch (reason) {
            case "incomplete_info" -> getMessage("email.account_rejection.reason.incomplete_info", locale);
            case "invalid_organization" -> getMessage("email.account_rejection.reason.invalid_organization", locale);
            case "duplicate_account" -> getMessage("email.account_rejection.reason.duplicate_account", locale);
            case "suspicious_activity" -> getMessage("email.account_rejection.reason.suspicious_activity", locale);
            case "does_not_meet_criteria" -> getMessage("email.account_rejection.reason.does_not_meet_criteria", locale);
            case "other" -> getMessage("email.account_rejection.reason.other", locale);
            default -> getMessage("email.account_rejection.reason.unspecified", locale);
        };
    }
    
    /**
     * Build HTML email body for new message notification
     */
    private String buildNewMessageEmailBody(String recipientName, String senderName, String messagePreview, Locale locale) {
        // Limit message preview to 150 characters
        String preview = messagePreview;
        if (preview.length() > 150) {
            preview = preview.substring(0, 147) + "...";
        }
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #224d68; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .message-box { background-color: white; border-left: 4px solid #224d68; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .sender-name { font-weight: bold; color: #224d68; font-size: 18px; margin-bottom: 10px; }
                    .message-preview { color: #555; font-style: italic; background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0; }
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
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s %s,</p>
                        <p>%s</p>
                        <div class="message-box">
                            <div class="sender-name">%s %s</div>
                            <div class="message-preview">"%s"</div>
                        </div>
                        <p>%s</p>
                        <p style="text-align: center;">
                            <a href="%s/donor/messages" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.new_message.header", locale),
                getMessage("email.common.hi", locale), recipientName,
                getMessage("email.new_message.message", locale),
                getMessage("email.new_message.label_from", locale), senderName,
                preview,
                getMessage("email.new_message.instruction", locale),
                frontendUrl,
                getMessage("email.new_message.button", locale),
                getMessage("email.common.footer_copyright", locale),
                getMessage("email.common.footer_notifications", locale),
                getMessage("email.common.footer_manage_settings", locale)
            );
    }

    /**
     * Build HTML email body for account approval
     */
    private String buildAccountApprovalEmailBody(String userName, Locale locale) {
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
    private String buildAccountRejectionEmailBody(String userName, String reason, String customMessage, Locale locale) {
        String reasonText = getRejectionReasonText(reason, locale);
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

    /**
     * Build HTML email body for donation picked up notification
     */
    private String buildDonationPickedUpEmailBody(String userName, Map<String, Object> donationData, Locale locale) {
        String donationTitle = (String) donationData.getOrDefault("donationTitle", "Your Donation");
        String quantity = String.valueOf(donationData.getOrDefault("quantity", "N/A"));
        String receiverName = (String) donationData.getOrDefault("receiverName", "A receiver");
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #10b981; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .info-box { background-color: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .detail { margin: 10px 0; }
                    .label { font-weight: bold; color: #224d68; }
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
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s</p>
                        <div class="success-box">
                            <p>%s</p>
                        </div>
                        <p>%s</p>
                        <div class="info-box">
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                        </div>
                        <p>%s</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/donor/dashboard" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.donation_picked_up.header", locale),
                getMessage("email.donation_picked_up.greeting", locale, userName),
                getMessage("email.donation_picked_up.success_message", locale, receiverName),
                getMessage("email.donation_picked_up.details_title", locale),
                getMessage("email.donation_picked_up.label.donation_item", locale), donationTitle,
                getMessage("email.donation_picked_up.label.quantity", locale), quantity,
                getMessage("email.donation_picked_up.label.picked_up_by", locale), receiverName,
                getMessage("email.donation_picked_up.thank_you", locale),
                getMessage("email.donation_picked_up.button", locale),
                getMessage("email.common.footer", locale),
                getMessage("email.common.footer.notifications", locale),
                getMessage("email.common.footer.manage_settings", locale)
            );
    }

    /**
     * Send notification email for donation completed (to receiver)
     */
    public void sendDonationCompletedNotification(String toEmail, String userName, Map<String, Object> donationData) {
        log.info("Sending donation completed notification email to: {}", toEmail);
        
        Locale locale = getUserLocale(toEmail);
        
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
            
            sendSmtpEmail.setSubject(getMessage("email.donation_completed.subject", locale));
            sendSmtpEmail.setHtmlContent(buildDonationCompletedEmailBody(userName, donationData, locale));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Donation completed notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending donation completed notification to: {}", toEmail, ex);
            // Don't throw - email is secondary to websocket notification
        }
    }

    /**
     * Build HTML email body for donation completed notification
     */
    private String buildDonationCompletedEmailBody(String userName, Map<String, Object> donationData, Locale locale) {
        String donationTitle = (String) donationData.getOrDefault("donationTitle", "A Donation");
        String quantity = String.valueOf(donationData.getOrDefault("quantity", "N/A"));
        String donorName = (String) donationData.getOrDefault("donorName", "A donor");
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .success-box { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .info-box { background-color: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .detail { margin: 10px 0; }
                    .label { font-weight: bold; color: #224d68; }
                    .button { display: inline-block; background-color: #3b82f6; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    a.button:visited { color: white !important; }
                    a.button:hover { background-color: #2563eb; color: white !important; }
                    a.button:active { color: white !important; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s</p>
                        <div class="success-box">
                            <p>%s</p>
                        </div>
                        <p>%s</p>
                        <div class="info-box">
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                        </div>
                        <p>%s</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/receiver/dashboard" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.donation_completed.header", locale),
                getMessage("email.donation_completed.greeting", locale, userName),
                getMessage("email.donation_completed.success_message", locale, donorName),
                getMessage("email.donation_completed.details_title", locale),
                getMessage("email.donation_completed.label.donation_item", locale), donationTitle,
                getMessage("email.donation_completed.label.quantity_received", locale), quantity,
                getMessage("email.donation_completed.label.from", locale), donorName,
                getMessage("email.donation_completed.thank_you", locale),
                getMessage("email.donation_completed.button", locale),
                getMessage("email.common.footer", locale),
                getMessage("email.common.footer.notifications", locale),
                getMessage("email.common.footer.manage_settings", locale)
            );
    }

    /**
     * Send notification email for ready for pickup (to receiver)
     */
    public void sendReadyForPickupNotification(String toEmail, String userName, Map<String, Object> donationData) {
        log.info("Sending ready for pickup notification email to: {}", toEmail);
        
        Locale locale = getUserLocale(toEmail);
        
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
            
            sendSmtpEmail.setSubject(getMessage("email.ready_for_pickup.subject", locale));
            sendSmtpEmail.setHtmlContent(buildReadyForPickupEmailBody(userName, donationData, locale));
            
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Ready for pickup notification sent to: {}. MessageId: {}", toEmail, result.getMessageId());
        } catch (ApiException ex) {
            log.error("Error sending ready for pickup notification to: {}", toEmail, ex);
            // Don't throw - email is secondary to websocket notification
        }
    }

    /**
     * Build HTML email body for ready for pickup notification
     */
    private String buildReadyForPickupEmailBody(String userName, Map<String, Object> donationData, Locale locale) {
        String donationTitle = (String) donationData.getOrDefault("donationTitle", "A Donation");
        String quantity = String.valueOf(donationData.getOrDefault("quantity", "N/A"));
        String pickupDate = (String) donationData.getOrDefault("pickupDate", "Soon");
        String pickupTime = (String) donationData.getOrDefault("pickupTime", "Check your app");
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .info-box { background-color: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .detail { margin: 10px 0; }
                    .label { font-weight: bold; color: #224d68; }
                    .button { display: inline-block; background-color: #f59e0b; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    a.button:visited { color: white !important; }
                    a.button:hover { background-color: #d97706; color: white !important; }
                    a.button:active { color: white !important; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s</p>
                        <div class="alert-box">
                            <p>%s</p>
                        </div>
                        <p>%s</p>
                        <div class="info-box">
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                        </div>
                        <p>%s</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/receiver/dashboard" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.ready_for_pickup.header", locale),
                getMessage("email.ready_for_pickup.greeting", locale, userName),
                getMessage("email.ready_for_pickup.alert_message", locale),
                getMessage("email.ready_for_pickup.details_title", locale),
                getMessage("email.ready_for_pickup.label.donation_item", locale), donationTitle,
                getMessage("email.ready_for_pickup.label.quantity", locale), quantity,
                getMessage("email.ready_for_pickup.label.pickup_date", locale), pickupDate,
                getMessage("email.ready_for_pickup.label.pickup_time", locale), pickupTime,
                getMessage("email.ready_for_pickup.code_reminder", locale),
                getMessage("email.ready_for_pickup.button", locale),
                getMessage("email.common.footer", locale),
                getMessage("email.common.footer.notifications", locale),
                getMessage("email.common.footer.manage_settings", locale)
            );
    }

    /**
     * Sends a donation expired notification email to a donor
     */
    public void sendDonationExpiredNotification(String toEmail, String donorName, Map<String, Object> donationData) {
        Locale locale = getUserLocale(toEmail);
        
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
            sendSmtpEmail.setSubject(getMessage("email.donation_expired.subject", locale));
            sendSmtpEmail.setHtmlContent(buildDonationExpiredEmailBody(donorName, donationData, locale));

            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Donation expired email sent successfully to {} - Message ID: {}", toEmail, result.getMessageId());
        } catch (ApiException e) {
            log.error("Failed to send donation expired email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    private String buildDonationExpiredEmailBody(String donorName, Map<String, Object> donationData, Locale locale) {
        String donationTitle = (String) donationData.get("donationTitle");
        String quantity = (String) donationData.get("quantity");
        String expiryDate = (String) donationData.get("expiryDate");

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
                    .header { background: linear-gradient(135deg, #ef4444 0%%, #dc2626 100%%); color: white; padding: 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { padding: 30px; }
                    .alert { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .alert-title { color: #991b1b; font-weight: bold; margin: 0 0 10px 0; }
                    .alert-text { color: #7f1d1d; margin: 0; }
                    .details { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #374151; }
                    .button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%%, #dc2626 100%%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s</p>
                        <div class="alert">
                            <p class="alert-title">%s</p>
                            <p class="alert-text">%s</p>
                        </div>
                        <div class="details">
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                        </div>
                        <p><strong>%s</strong></p>
                        <ul>
                            <li>%s</li>
                            <li>%s</li>
                            <li>%s</li>
                        </ul>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/donor/dashboard" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.donation_expired.header", locale),
                getMessage("email.donation_expired.greeting", locale, donorName),
                getMessage("email.donation_expired.alert_title", locale),
                getMessage("email.donation_expired.alert_message", locale),
                getMessage("email.donation_expired.label.donation_item", locale), donationTitle,
                getMessage("email.donation_expired.label.quantity", locale), quantity,
                getMessage("email.donation_expired.label.expiry_date", locale), expiryDate,
                getMessage("email.donation_expired.next_steps_title", locale),
                getMessage("email.donation_expired.next_step1", locale),
                getMessage("email.donation_expired.next_step2", locale),
                getMessage("email.donation_expired.next_step3", locale),
                getMessage("email.donation_expired.button", locale),
                getMessage("email.common.footer", locale),
                getMessage("email.common.footer.notifications", locale),
                getMessage("email.common.footer.manage_settings", locale)
            );
    }

    /**
     * Sends a donation status update notification email
     */
    public void sendDonationStatusUpdateNotification(String toEmail, String userName, Map<String, Object> statusData) {
        Locale locale = getUserLocale(toEmail);
        
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
            sendSmtpEmail.setSubject(getMessage("email.donation_status_updated.subject", locale));
            sendSmtpEmail.setHtmlContent(buildDonationStatusUpdateEmailBody(userName, statusData, locale));

            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Donation status update email sent successfully to {} - Message ID: {}", toEmail, result.getMessageId());
        } catch (ApiException e) {
            log.error("Failed to send donation status update email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    private String buildDonationStatusUpdateEmailBody(String userName, Map<String, Object> statusData, Locale locale) {
        String donationTitle = (String) statusData.get("donationTitle");
        String oldStatus = (String) statusData.get("oldStatus");
        String newStatus = (String) statusData.get("newStatus");
        String reason = (String) statusData.get("reason");
        String userType = (String) statusData.get("userType");
        
        String donationType = userType.equals("donor") ? 
            getMessage("email.donation_status_updated.donation_type", locale) : 
            getMessage("email.donation_status_updated.claim_type", locale);

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
                    .header { background: linear-gradient(135deg, #a855f7 0%%, #9333ea 100%%); color: white; padding: 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { padding: 30px; }
                    .alert { background-color: #f3e5f5; border-left: 4px solid #a855f7; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .alert-title { color: #6b21a8; font-weight: bold; margin: 0 0 10px 0; }
                    .alert-text { color: #7e22ce; margin: 0; }
                    .details { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #374151; }
                    .status-change { display: flex; align-items: center; gap: 10px; font-size: 16px; margin: 15px 0; }
                    .old-status { background-color: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 6px; font-weight: 600; }
                    .new-status { background-color: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 6px; font-weight: 600; }
                    .arrow { color: #9ca3af; font-size: 24px; }
                    .button { display: inline-block; background: linear-gradient(135deg, #a855f7 0%%, #9333ea 100%%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>%s</p>
                        <div class="alert">
                            <p class="alert-title">%s</p>
                            <p class="alert-text">%s</p>
                        </div>
                        <div class="details">
                            <div class="detail"><span class="label">%s</span> %s</div>
                            <div class="detail">
                                <span class="label">%s</span>
                                <div class="status-change">
                                    <span class="old-status">%s</span>
                                    <span class="arrow">→</span>
                                    <span class="new-status">%s</span>
                                </div>
                            </div>
                            <div class="detail"><span class="label">%s</span> %s</div>
                        </div>
                        <p><strong>%s</strong></p>
                        <p>%s</p>
                        <p style="text-align: center;">
                            <a href="http://localhost:3000/%s/dashboard" class="button" style="color: white !important; text-decoration: none;">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>%s</p>
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.donation_status_updated.header", locale),
                getMessage("email.donation_status_updated.greeting", locale, userName),
                getMessage("email.donation_status_updated.alert_title", locale),
                getMessage("email.donation_status_updated.alert_message", locale, donationType),
                getMessage("email.donation_status_updated.label.donation", locale), donationTitle,
                getMessage("email.donation_status_updated.label.status_change", locale),
                oldStatus, newStatus,
                getMessage("email.donation_status_updated.label.admin_reason", locale), reason,
                getMessage("email.donation_status_updated.meaning_title", locale),
                getMessage("email.donation_status_updated.meaning_message", locale),
                userType,
                getMessage("email.donation_status_updated.button", locale),
                getMessage("email.common.footer", locale),
                getMessage("email.common.footer.notifications", locale),
                getMessage("email.common.footer.manage_settings", locale)
            );
    }

    /**
     * Send account deactivation notification email
     */
    public void sendAccountDeactivationEmail(String toEmail, String userName) throws ApiException {
        log.info("Sending account deactivation email to: {}", toEmail);
        
        Locale locale = getUserLocale(toEmail);
        
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
        
        sendSmtpEmail.setSubject(getMessage("email.account_deactivation.subject", locale));
        sendSmtpEmail.setTextContent(getMessage("email.account_deactivation.text_content", locale));
        sendSmtpEmail.setHtmlContent(buildAccountDeactivationEmailBody(userName, locale));
        
        try {
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Account deactivation email sent successfully. Message ID: {}", result.getMessageId());
        } catch (ApiException e) {
            log.error("Failed to send account deactivation email: {}", e.getResponseBody(), e);
            throw e;
        }
    }

    private String buildAccountDeactivationEmailBody(String userName, Locale locale) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #ef4444 0%%, #dc2626 100%%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">%s</h1>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">%s</p>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            %s
                        </p>
                        
                        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="color: #991b1b; margin: 0; font-size: 14px;">
                                <strong>%s</strong><br>
                                %s
                            </p>
                        </div>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            %s
                        </p>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            %s
                        </p>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.account_deactivation.header", locale),
                getMessage("email.account_deactivation.greeting", locale, userName),
                getMessage("email.account_deactivation.message", locale),
                getMessage("email.account_deactivation.meaning_title", locale),
                getMessage("email.account_deactivation.meaning_message", locale),
                getMessage("email.account_deactivation.appeal", locale),
                getMessage("email.account_deactivation.signature", locale),
                getMessage("email.common.footer", locale),
                getMessage("email.common.footer.notifications", locale)
            );
    }

    /**
     * Send account reactivation notification email
     */
    public void sendAccountReactivationEmail(String toEmail, String userName) throws ApiException {
        log.info("Sending account reactivation email to: {}", toEmail);
        
        Locale locale = getUserLocale(toEmail);
        
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
        
        sendSmtpEmail.setSubject(getMessage("email.account_reactivation.subject", locale));
        sendSmtpEmail.setTextContent(getMessage("email.account_reactivation.text_content", locale));
        sendSmtpEmail.setHtmlContent(buildAccountReactivationEmailBody(userName, locale));
        
        try {
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Account reactivation email sent successfully. Message ID: {}", result.getMessageId());
        } catch (ApiException e) {
            log.error("Failed to send account reactivation email: {}", e.getResponseBody(), e);
            throw e;
        }
    }

    private String buildAccountReactivationEmailBody(String userName, Locale locale) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">%s</h1>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">%s</p>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            %s
                        </p>
                        
                        <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="color: #065f46; margin: 0; font-size: 14px;">
                                <strong>%s</strong><br>
                                %s
                            </p>
                        </div>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            %s
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/login" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                %s
                            </a>
                        </div>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            %s
                        </p>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                        <p>%s</p>
                        <p>%s</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                getMessage("email.account_reactivation.header", locale),
                getMessage("email.account_reactivation.greeting", locale, userName),
                getMessage("email.account_reactivation.message", locale),
                getMessage("email.account_reactivation.meaning_title", locale),
                getMessage("email.account_reactivation.meaning_message", locale),
                getMessage("email.account_reactivation.instruction", locale),
                getMessage("email.account_reactivation.button", locale),
                getMessage("email.account_reactivation.signature", locale),
                getMessage("email.common.footer", locale),
                getMessage("email.common.footer.notifications", locale)
            );
    }
}
