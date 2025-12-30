package com.example.foodflow.model.dto;

import java.util.Map;

public class UpdateNotificationPreferencesRequest {
    private Boolean emailNotificationsEnabled;
    private Boolean smsNotificationsEnabled;
    private Map<String, Boolean> notificationTypes;

    public Boolean getEmailNotificationsEnabled() { return emailNotificationsEnabled; }
    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) { this.emailNotificationsEnabled = emailNotificationsEnabled; }

    public Boolean getSmsNotificationsEnabled() { return smsNotificationsEnabled; }
    public void setSmsNotificationsEnabled(Boolean smsNotificationsEnabled) { this.smsNotificationsEnabled = smsNotificationsEnabled; }
    
    public Map<String, Boolean> getNotificationTypes() { return notificationTypes; }
    public void setNotificationTypes(Map<String, Boolean> notificationTypes) { this.notificationTypes = notificationTypes; }
}