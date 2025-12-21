package com.example.foodflow.model.dto;

public class DeactivateUserRequest {
    private String adminNotes;

    public DeactivateUserRequest() {}

    public DeactivateUserRequest(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }
}
