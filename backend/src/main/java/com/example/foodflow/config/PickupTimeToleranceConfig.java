package com.example.foodflow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for pickup time tolerance.
 * Defines how early or late a pickup confirmation can be accepted
 * relative to the scheduled pickup window.
 */
@Configuration
@ConfigurationProperties(prefix = "foodflow.pickup")
public class PickupTimeToleranceConfig {

    /**
     * Number of minutes before the pickup window start time that confirmation is
     * allowed.
     * Default: 15 minutes
     */
    private int earlyToleranceMinutes = 15;

    /**
     * Number of minutes after the pickup window end time that confirmation is
     * allowed.
     * Default: 30 minutes
     */
    private int lateToleranceMinutes = 30;

    public int getEarlyToleranceMinutes() {
        return earlyToleranceMinutes;
    }

    public void setEarlyToleranceMinutes(int earlyToleranceMinutes) {
        this.earlyToleranceMinutes = earlyToleranceMinutes;
    }

    public int getLateToleranceMinutes() {
        return lateToleranceMinutes;
    }

    public void setLateToleranceMinutes(int lateToleranceMinutes) {
        this.lateToleranceMinutes = lateToleranceMinutes;
    }
}
