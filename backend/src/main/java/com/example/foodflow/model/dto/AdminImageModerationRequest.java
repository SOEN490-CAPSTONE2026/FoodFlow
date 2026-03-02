package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.DonationImageStatus;

public class AdminImageModerationRequest {
    private DonationImageStatus status;
    private String reason;

    public DonationImageStatus getStatus() {
        return status;
    }

    public void setStatus(DonationImageStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
