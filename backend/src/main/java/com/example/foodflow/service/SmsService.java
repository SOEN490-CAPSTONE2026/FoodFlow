package com.example.foodflow.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Map;

/**
 * Service for sending SMS notifications using Twilio
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String fromPhoneNumber;

    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_RETRY_DELAY_MS = 1000; // 1 second

    /**
     * Initialize Twilio client on service startup
     */
    @PostConstruct
    public void init() {
        try {
            Twilio.init(accountSid, authToken);
            log.info("Twilio SMS service initialized successfully with sender number: {}", fromPhoneNumber);
        } catch (Exception e) {
            log.error("Failed to initialize Twilio SMS service: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize Twilio SMS service", e);
        }
    }

    /**
     * Send SMS with retry logic and exponential backoff
     *
     * @param toPhoneNumber Recipient phone number in E.164 format (e.g., +1234567890)
     * @param messageBody SMS message content (max 160 chars recommended)
     * @return true if SMS sent successfully, false otherwise
     */
    public boolean sendSms(String toPhoneNumber, String messageBody) {
        if (toPhoneNumber == null || toPhoneNumber.trim().isEmpty()) {
            log.warn("Cannot send SMS: recipient phone number is null or empty");
            return false;
        }

        if (messageBody == null || messageBody.trim().isEmpty()) {
            log.warn("Cannot send SMS: message body is null or empty");
            return false;
        }

        // Validate phone number format (E.164)
        if (!isValidPhoneNumber(toPhoneNumber)) {
            log.warn("Invalid phone number format: {}. Must be in E.164 format (e.g., +1234567890)", toPhoneNumber);
            return false;
        }

        log.info("Attempting to send SMS to: {} (message length: {} chars)", toPhoneNumber, messageBody.length());

        int attempt = 0;
        long delay = INITIAL_RETRY_DELAY_MS;

        while (attempt < MAX_RETRIES) {
            try {
                Message message = Message.creator(
                        new PhoneNumber(toPhoneNumber),
                        new PhoneNumber(fromPhoneNumber),
                        messageBody
                ).create();

                log.info("SMS sent successfully to: {}. Message SID: {}, Status: {}",
                        toPhoneNumber, message.getSid(), message.getStatus());
                return true;

            } catch (Exception e) {
                attempt++;
                log.error("Failed to send SMS to: {} (attempt {}/{}): {}",
                        toPhoneNumber, attempt, MAX_RETRIES, e.getMessage());

                if (attempt < MAX_RETRIES) {
                    try {
                        log.info("Retrying in {} ms...", delay);
                        Thread.sleep(delay);
                        delay *= 2; // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.error("Retry interrupted for SMS to: {}", toPhoneNumber);
                        return false;
                    }
                } else {
                    log.error("All retry attempts exhausted for SMS to: {}. SMS delivery failed.", toPhoneNumber);
                }
            }
        }

        return false;
    }

    /**
     * Send SMS for new donation available notification
     */
    public boolean sendNewDonationNotification(String toPhoneNumber, String userName, Map<String, Object> donationData) {
        String title = (String) donationData.getOrDefault("title", "New Donation");
        String foodCategories = (String) donationData.getOrDefault("foodCategories", "Various");
        
        String message = String.format(
            "FoodFlow: New donation available! %s - %s. Check the app for details.",
            title, foodCategories
        );

        log.info("Sending new donation SMS notification to: {}", toPhoneNumber);
        return sendSms(toPhoneNumber, message);
    }

    /**
     * Send SMS for donation claimed notification
     */
    public boolean sendDonationClaimedNotification(String toPhoneNumber, String userName, Map<String, Object> claimData) {
        String donationTitle = (String) claimData.getOrDefault("donationTitle", "Your donation");
        String receiverName = (String) claimData.getOrDefault("receiverName", "A receiver");
        String pickupCode = (String) claimData.get("pickupCode");
        
        String message;
        if (pickupCode != null && !pickupCode.isEmpty()) {
            message = String.format(
                "FoodFlow: %s claimed by %s. Pickup code: %s. Check app for details.",
                donationTitle, receiverName, pickupCode
            );
        } else {
            message = String.format(
                "FoodFlow: %s claimed by %s. Check the app for details.",
                donationTitle, receiverName
            );
        }

        log.info("Sending donation claimed SMS notification to: {}", toPhoneNumber);
        return sendSms(toPhoneNumber, message);
    }

    /**
     * Send SMS for claim canceled notification
     */
    public boolean sendClaimCanceledNotification(String toPhoneNumber, String userName, Map<String, Object> claimData) {
        String donationTitle = (String) claimData.getOrDefault("donationTitle", "Your donation");
        
        String message = String.format(
            "FoodFlow: Claim canceled for %s. The donation is now available again.",
            donationTitle
        );

        log.info("Sending claim canceled SMS notification to: {}", toPhoneNumber);
        return sendSms(toPhoneNumber, message);
    }

    /**
     * Send SMS for pickup reminder notification
     */
    public boolean sendPickupReminderNotification(String toPhoneNumber, String userName, Map<String, Object> reminderData) {
        String donationTitle = (String) reminderData.getOrDefault("donationTitle", "Your donation");
        String pickupTime = (String) reminderData.getOrDefault("pickupTime", "soon");
        String pickupCode = (String) reminderData.get("pickupCode");
        
        String message;
        if (pickupCode != null && !pickupCode.isEmpty()) {
            message = String.format(
                "FoodFlow: Pickup reminder for %s at %s. Code: %s",
                donationTitle, pickupTime, pickupCode
            );
        } else {
            message = String.format(
                "FoodFlow: Pickup reminder for %s at %s. Check app for details.",
                donationTitle, pickupTime
            );
        }

        log.info("Sending pickup reminder SMS notification to: {}", toPhoneNumber);
        return sendSms(toPhoneNumber, message);
    }

    /**
     * Send SMS for donation ready for pickup notification
     */
    public boolean sendDonationReadyNotification(String toPhoneNumber, String userName, Map<String, Object> donationData) {
        String donationTitle = (String) donationData.getOrDefault("donationTitle", "Your donation");
        String pickupCode = (String) donationData.get("pickupCode");
        
        String message;
        if (pickupCode != null && !pickupCode.isEmpty()) {
            message = String.format(
                "FoodFlow: %s is ready for pickup! Code: %s. See app for location.",
                donationTitle, pickupCode
            );
        } else {
            message = String.format(
                "FoodFlow: %s is ready for pickup! Check the app for details.",
                donationTitle
            );
        }

        log.info("Sending donation ready SMS notification to: {}", toPhoneNumber);
        return sendSms(toPhoneNumber, message);
    }

    /**
     * Send SMS for donation completed notification
     */
    public boolean sendDonationCompletedNotification(String toPhoneNumber, String userName, Map<String, Object> donationData) {
        String donationTitle = (String) donationData.getOrDefault("donationTitle", "The donation");
        
        String message = String.format(
            "FoodFlow: %s has been completed. Thank you for using FoodFlow!",
            donationTitle
        );

        log.info("Sending donation completed SMS notification to: {}", toPhoneNumber);
        return sendSms(toPhoneNumber, message);
    }

    /**
     * Send SMS for new message notification
     */
    public boolean sendNewMessageNotification(String toPhoneNumber, String senderName, String messagePreview) {
        String preview = messagePreview != null && messagePreview.length() > 50 
            ? messagePreview.substring(0, 50) + "..." 
            : messagePreview;
        
        String message = String.format(
            "FoodFlow: New message from %s: %s",
            senderName, preview
        );

        log.info("Sending new message SMS notification to: {}", toPhoneNumber);
        return sendSms(toPhoneNumber, message);
    }

    /**
     * Validate phone number format (E.164)
     *
     * @param phoneNumber Phone number to validate
     * @return true if valid E.164 format, false otherwise
     */
    private boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }
        
        // E.164 format: +[country code][number] (e.g., +12345678901)
        // Must start with +, followed by 1-15 digits
        return phoneNumber.matches("^\\+[1-9]\\d{1,14}$");
    }

    /**
     * Check if SMS service is properly configured
     *
     * @return true if Twilio credentials are configured, false otherwise
     */
    public boolean isConfigured() {
        return accountSid != null && !accountSid.isEmpty()
                && authToken != null && !authToken.isEmpty()
                && fromPhoneNumber != null && !fromPhoneNumber.isEmpty();
    }
}
