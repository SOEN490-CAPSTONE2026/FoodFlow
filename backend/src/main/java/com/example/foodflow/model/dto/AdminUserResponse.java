package com.example.foodflow.model.dto;

import java.time.LocalDateTime;

public class AdminUserResponse {
    private Long id;
    private String email;
    private String role;
    private String accountStatus;
    private String organizationName;
    private String contactPerson;
    private String phone;
    private String verificationStatus;
    private Long donationCount;
    private Long claimCount;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime deactivatedAt;
    
    // Additional organization fields
    private String address;
    private String businessLicense;
    private String charityRegistrationNumber;
    private String supportingDocumentUrl;

    // Constructors
    public AdminUserResponse() {}

    public AdminUserResponse(Long id, String email, String role, String accountStatus, 
                           String organizationName, String contactPerson, String phone,
                           String verificationStatus, Long donationCount, Long claimCount,
                           String adminNotes, LocalDateTime createdAt, LocalDateTime deactivatedAt) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.accountStatus = accountStatus;
        this.organizationName = organizationName;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.verificationStatus = verificationStatus;
        this.donationCount = donationCount;
        this.claimCount = claimCount;
        this.adminNotes = adminNotes;
        this.createdAt = createdAt;
        this.deactivatedAt = deactivatedAt;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public Long getDonationCount() { return donationCount; }
    public void setDonationCount(Long donationCount) { this.donationCount = donationCount; }

    public Long getClaimCount() { return claimCount; }
    public void setClaimCount(Long claimCount) { this.claimCount = claimCount; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getDeactivatedAt() { return deactivatedAt; }
    public void setDeactivatedAt(LocalDateTime deactivatedAt) { this.deactivatedAt = deactivatedAt; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getBusinessLicense() { return businessLicense; }
    public void setBusinessLicense(String businessLicense) { this.businessLicense = businessLicense; }
    
    public String getCharityRegistrationNumber() { return charityRegistrationNumber; }
    public void setCharityRegistrationNumber(String charityRegistrationNumber) { this.charityRegistrationNumber = charityRegistrationNumber; }
    
    public String getSupportingDocumentUrl() { return supportingDocumentUrl; }
    public void setSupportingDocumentUrl(String supportingDocumentUrl) { this.supportingDocumentUrl = supportingDocumentUrl; }
}
