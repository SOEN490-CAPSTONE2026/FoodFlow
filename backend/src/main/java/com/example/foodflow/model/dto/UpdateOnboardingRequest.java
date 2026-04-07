package com.example.foodflow.model.dto;
import jakarta.validation.constraints.NotNull;
public class UpdateOnboardingRequest {
    @NotNull
    private Boolean onboardingCompleted;
    public Boolean getOnboardingCompleted() {
        return onboardingCompleted;
    }
    public void setOnboardingCompleted(Boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }
}
