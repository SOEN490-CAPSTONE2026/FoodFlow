package com.example.foodflow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for pickup time tolerance window.
 * Allows pickup confirmation within a defined early/late window around the scheduled pickup time.
 */
@Configuration
@ConfigurationProperties(prefix = "foodflow.pickup.tolerance")
public class PickupToleranceConfig {
    
    /**
     * Number of minutes before the scheduled pickup start time when confirmation is allowed.
     * Default: 30 minutes
     */
    private int earlyMinutes = 30;
    
    /**
     * Number of minutes after the scheduled pickup end time when confirmation is still allowed.
     * Default: 30 minutes
     */
    private int lateMinutes = 30;
    
    public int getEarlyMinutes() {
        return earlyMinutes;
    }
    
    public void setEarlyMinutes(int earlyMinutes) {
        this.earlyMinutes = earlyMinutes;
    }
    
    public int getLateMinutes() {
        return lateMinutes;
    }
    
    public void setLateMinutes(int lateMinutes) {
        this.lateMinutes = lateMinutes;
    }
}
