package com.example.foodflow.model.dto;

public class ProfileResponseDTO {

    private String organizationName;
    private PendingChangeDTO pendingOrganizationChange;

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public PendingChangeDTO getPendingOrganizationChange() {
        return pendingOrganizationChange;
    }

    public void setPendingOrganizationChange(PendingChangeDTO pendingOrganizationChange) {
        this.pendingOrganizationChange = pendingOrganizationChange;
    }
}