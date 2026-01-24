package com.example.foodflow.model.dto;

/**
 * Request DTO for updating user profile data.
 */
public class UpdateProfileRequest {
    private String fullName;        // Maps to Organization.contactPerson
    private String phoneNumber;     // Maps to Organization.phone
    private String organizationName; // Maps to Organization.name
    private String address;         // Maps to Organization.address

    public UpdateProfileRequest() {}

    // Getters and setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
