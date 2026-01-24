package com.example.foodflow.model.dto;

/**
 * DTO to expose pickup time tolerance configuration to frontend.
 * Allows frontend to calculate and display user-friendly messages about
 * when pickup confirmation is allowed relative to the scheduled window.
 */
public class PickupToleranceResponse {

    /**
     * Number of minutes before the pickup window start time that confirmation is allowed.
     * Example: if 15 minutes, donor can confirm 15 minutes before scheduled pickup time.
     */
    private int earlyToleranceMinutes;

    /**
     * Number of minutes after the pickup window end time that confirmation is allowed.
     * Example: if 30 minutes, donor can confirm up to 30 minutes after scheduled pickup end.
     */
    private int lateToleranceMinutes;

    public PickupToleranceResponse() {
    }

    public PickupToleranceResponse(int earlyToleranceMinutes, int lateToleranceMinutes) {
        this.earlyToleranceMinutes = earlyToleranceMinutes;
        this.lateToleranceMinutes = lateToleranceMinutes;
    }

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

    @Override
    public String toString() {
        return "PickupToleranceResponse{" +
                "earlyToleranceMinutes=" + earlyToleranceMinutes +
                ", lateToleranceMinutes=" + lateToleranceMinutes +
                '}';
    }
}
