package com.example.foodflow.service;

import com.example.foodflow.config.PickupToleranceConfig;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Service to validate pickup time with configurable tolerance windows.
 */
@Service
public class PickupTimeValidationService {
    
    private static final Logger logger = LoggerFactory.getLogger(PickupTimeValidationService.class);
    
    private final PickupToleranceConfig toleranceConfig;
    
    public PickupTimeValidationService(PickupToleranceConfig toleranceConfig) {
        this.toleranceConfig = toleranceConfig;
    }
    
    /**
     * Result of pickup time validation.
     */
    public static class ValidationResult {
        private final boolean allowed;
        private final String message;
        private final String reason; // For audit logging: WITHIN_WINDOW, EARLY_TOLERANCE, LATE_TOLERANCE, TOO_EARLY, TOO_LATE
        
        private ValidationResult(boolean allowed, String message, String reason) {
            this.allowed = allowed;
            this.message = message;
            this.reason = reason;
        }
        
        public static ValidationResult allowed(String message, String reason) {
            return new ValidationResult(true, message, reason);
        }
        
        public static ValidationResult denied(String message, String reason) {
            return new ValidationResult(false, message, reason);
        }
        
        public boolean isAllowed() { return allowed; }
        public String getMessage() { return message; }
        public String getReason() { return reason; }
    }
    
    /**
     * Validates if pickup confirmation is allowed based on the current time and scheduled pickup window.
     * Uses claim's confirmed pickup slot if available, otherwise falls back to post's pickup time.
     * 
     * @param post The surplus post
     * @param claim The claim (may be null for posts without claims)
     * @return ValidationResult indicating if pickup is allowed and the reason
     */
    public ValidationResult validatePickupTime(SurplusPost post, Claim claim) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();
        
        // Determine the scheduled pickup window from claim or post
        LocalDate pickupDate;
        LocalTime pickupStartTime;
        LocalTime pickupEndTime;
        
        if (claim != null && claim.getConfirmedPickupDate() != null) {
            pickupDate = claim.getConfirmedPickupDate();
            pickupStartTime = claim.getConfirmedPickupStartTime();
            pickupEndTime = claim.getConfirmedPickupEndTime();
        } else {
            pickupDate = post.getPickupDate();
            pickupStartTime = post.getPickupFrom();
            pickupEndTime = post.getPickupTo();
        }
        
        // Handle null times gracefully
        if (pickupDate == null || pickupStartTime == null || pickupEndTime == null) {
            logger.warn("Pickup time validation skipped - missing pickup schedule for post {}", post.getId());
            return ValidationResult.allowed("No scheduled pickup time set", "NO_SCHEDULE");
        }
        
        // Calculate tolerance boundaries
        LocalDateTime scheduledStart = LocalDateTime.of(pickupDate, pickupStartTime);
        LocalDateTime scheduledEnd = LocalDateTime.of(pickupDate, pickupEndTime);
        LocalDateTime earlyBoundary = scheduledStart.minusMinutes(toleranceConfig.getEarlyMinutes());
        LocalDateTime lateBoundary = scheduledEnd.plusMinutes(toleranceConfig.getLateMinutes());
        
        logger.debug("Validating pickup time for post {}: current={}, scheduled={} to {}, " +
                "tolerance window: {} to {} (early: {}min, late: {}min)",
                post.getId(), now, scheduledStart, scheduledEnd, 
                earlyBoundary, lateBoundary,
                toleranceConfig.getEarlyMinutes(), toleranceConfig.getLateMinutes());
        
        // Check if current time is within the allowed window
        if (now.isBefore(earlyBoundary)) {
            // Too early
            long minutesUntilEarlyBoundary = java.time.Duration.between(now, earlyBoundary).toMinutes();
            String message = String.format(
                "Pickup confirmation not yet allowed. Please wait until %s (in %d minutes). " +
                "Early tolerance window starts %d minutes before scheduled pickup time of %s.",
                formatTime(earlyBoundary.toLocalTime()), 
                minutesUntilEarlyBoundary,
                toleranceConfig.getEarlyMinutes(),
                formatTime(pickupStartTime)
            );
            logger.info("Pickup denied for post {}: TOO_EARLY - {} minutes until allowed", 
                post.getId(), minutesUntilEarlyBoundary);
            return ValidationResult.denied(message, "TOO_EARLY");
        }
        
        if (now.isAfter(lateBoundary)) {
            // Too late
            long minutesPastLateBoundary = java.time.Duration.between(lateBoundary, now).toMinutes();
            String message = String.format(
                "Pickup confirmation window has expired. The late tolerance window ended at %s " +
                "(%d minutes after scheduled end time of %s). Window expired %d minutes ago.",
                formatTime(lateBoundary.toLocalTime()),
                toleranceConfig.getLateMinutes(),
                formatTime(pickupEndTime),
                minutesPastLateBoundary
            );
            logger.info("Pickup denied for post {}: TOO_LATE - {} minutes past allowed window", 
                post.getId(), minutesPastLateBoundary);
            return ValidationResult.denied(message, "TOO_LATE");
        }
        
        // Determine the specific reason for allowing
        if (now.isBefore(scheduledStart)) {
            // Within early tolerance
            long minutesEarly = java.time.Duration.between(now, scheduledStart).toMinutes();
            String message = String.format(
                "Pickup confirmed within early tolerance window (%d minutes before scheduled start time of %s).",
                minutesEarly, formatTime(pickupStartTime)
            );
            logger.info("Pickup allowed for post {}: EARLY_TOLERANCE - {} minutes early", 
                post.getId(), minutesEarly);
            return ValidationResult.allowed(message, "EARLY_TOLERANCE");
        }
        
        if (now.isAfter(scheduledEnd)) {
            // Within late tolerance
            long minutesLate = java.time.Duration.between(scheduledEnd, now).toMinutes();
            String message = String.format(
                "Pickup confirmed within late tolerance window (%d minutes after scheduled end time of %s).",
                minutesLate, formatTime(pickupEndTime)
            );
            logger.info("Pickup allowed for post {}: LATE_TOLERANCE - {} minutes late", 
                post.getId(), minutesLate);
            return ValidationResult.allowed(message, "LATE_TOLERANCE");
        }
        
        // Within scheduled window
        String message = "Pickup confirmed within scheduled pickup window.";
        logger.info("Pickup allowed for post {}: WITHIN_WINDOW", post.getId());
        return ValidationResult.allowed(message, "WITHIN_WINDOW");
    }
    
    /**
     * Gets the current tolerance configuration for display purposes.
     */
    public int getEarlyToleranceMinutes() {
        return toleranceConfig.getEarlyMinutes();
    }
    
    public int getLateToleranceMinutes() {
        return toleranceConfig.getLateMinutes();
    }
    
    private String formatTime(LocalTime time) {
        return time.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"));
    }
}
