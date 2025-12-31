package com.example.foodflow.service;

/**
 * Service interface for sending alerts to administrators
 */
public interface AlertService {
    
    /**
     * Send an alert to administrators
     * @param alertType Type of alert (e.g., "LOW_RATING_ALERT", "SYSTEM_ERROR")
     * @param message The alert message
     * @param relatedUserId User ID related to the alert (optional)
     */
    void sendAdminAlert(String alertType, String message, Long relatedUserId);
    
    /**
     * Send an alert to administrators with additional metadata
     * @param alertType Type of alert
     * @param message The alert message
     * @param relatedUserId User ID related to the alert
     * @param metadata Additional data about the alert
     */
    void sendAdminAlert(String alertType, String message, Long relatedUserId, Object metadata);
}