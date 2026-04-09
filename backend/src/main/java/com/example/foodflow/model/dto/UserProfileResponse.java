package com.example.foodflow.model.dto;

/**
 * DTO returned for user profile data
 */
public class UserProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String profilePhoto;
    private String organizationName;
    private String organizationAddress;
    private Boolean onboardingCompleted;

    // ===== Sensitive field pending/rejected state =====
    private boolean organizationChangePending;
    private PendingChangeDTO pendingOrganizationName;
    private PendingChangeDTO pendingOrganizationAddress;
    private PendingChangeDTO lastRejectedOrganizationName;
    private PendingChangeDTO lastRejectedOrganizationAddress;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getOrganizationAddress() { return organizationAddress; }
    public void setOrganizationAddress(String organizationAddress) { this.organizationAddress = organizationAddress; }

    public Boolean getOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(Boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }

    // Alias methods for frontend compatibility
    public String getPhoneNumber() { return phone; }
    public void setPhoneNumber(String phoneNumber) { this.phone = phoneNumber; }

    public String getAddress() { return organizationAddress; }
    public void setAddress(String address) { this.organizationAddress = address; }

    public boolean isOrganizationChangePending() { return organizationChangePending; }
    public void setOrganizationChangePending(boolean organizationChangePending) { this.organizationChangePending = organizationChangePending; }

    public PendingChangeDTO getPendingOrganizationName() { return pendingOrganizationName; }
    public void setPendingOrganizationName(PendingChangeDTO pendingOrganizationName) { this.pendingOrganizationName = pendingOrganizationName; }

    public PendingChangeDTO getPendingOrganizationAddress() { return pendingOrganizationAddress; }
    public void setPendingOrganizationAddress(PendingChangeDTO pendingOrganizationAddress) { this.pendingOrganizationAddress = pendingOrganizationAddress; }

    public PendingChangeDTO getLastRejectedOrganizationName() { return lastRejectedOrganizationName; }
    public void setLastRejectedOrganizationName(PendingChangeDTO lastRejectedOrganizationName) { this.lastRejectedOrganizationName = lastRejectedOrganizationName; }

    public PendingChangeDTO getLastRejectedOrganizationAddress() { return lastRejectedOrganizationAddress; }
    public void setLastRejectedOrganizationAddress(PendingChangeDTO lastRejectedOrganizationAddress) { this.lastRejectedOrganizationAddress = lastRejectedOrganizationAddress; }
}
