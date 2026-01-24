package com.example.foodflow.model.dto;

/**
 * Response DTO for user profile data including organization information.
 */
public class UserProfileResponse {
    private String email;
    private String fullName;
    private String phoneNumber;
    private String organizationName;
    private String address;

    public UserProfileResponse() {}

    public UserProfileResponse(String email, String fullName, String phoneNumber, String organizationName, String address) {
        this.email = email;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.organizationName = organizationName;
        this.address = address;
    }

    // Getters and setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
