package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.UserRole;

import java.time.LocalDateTime;

public class UserVerificationDTO {
    private Long id;
    private String organizationName;
    private String contactName;
    private String email;
    private String phoneNumber;
    private UserRole role;
    private AccountStatus accountStatus;
    private OrganizationType organizationType;
    private String charityRegistrationNumber;
    private String businessLicense;
    private String capacity;
    private String supportingDocument;
    private AddressDTO address;
    private LocalDateTime createdAt;

    // Nested Address DTO (since Organization stores address as single string, we'll parse it)
    public static class AddressDTO {
        private String street;
        private String unit;
        private String city;
        private String state;
        private String zipCode;
        private String country;

        public AddressDTO() {}

        public AddressDTO(String street, String unit, String city, String state, String zipCode, String country) {
            this.street = street;
            this.unit = unit;
            this.city = city;
            this.state = state;
            this.zipCode = zipCode;
            this.country = country;
        }

        // Getters and setters
        public String getStreet() { return street; }
        public void setStreet(String street) { this.street = street; }

        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public String getState() { return state; }
        public void setState(String state) { this.state = state; }

        public String getZipCode() { return zipCode; }
        public void setZipCode(String zipCode) { this.zipCode = zipCode; }

        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
    }

    // Constructors
    public UserVerificationDTO() {}

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public AccountStatus getAccountStatus() { return accountStatus; }
    public void setAccountStatus(AccountStatus accountStatus) { this.accountStatus = accountStatus; }

    public OrganizationType getOrganizationType() { return organizationType; }
    public void setOrganizationType(OrganizationType organizationType) { this.organizationType = organizationType; }

    public String getCharityRegistrationNumber() { return charityRegistrationNumber; }
    public void setCharityRegistrationNumber(String charityRegistrationNumber) { this.charityRegistrationNumber = charityRegistrationNumber; }

    public String getBusinessLicense() { return businessLicense; }
    public void setBusinessLicense(String businessLicense) { this.businessLicense = businessLicense; }

    public String getCapacity() { return capacity; }
    public void setCapacity(String capacity) { this.capacity = capacity; }

    public String getSupportingDocument() { return supportingDocument; }
    public void setSupportingDocument(String supportingDocument) { this.supportingDocument = supportingDocument; }

    public AddressDTO getAddress() { return address; }
    public void setAddress(AddressDTO address) { this.address = address; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
