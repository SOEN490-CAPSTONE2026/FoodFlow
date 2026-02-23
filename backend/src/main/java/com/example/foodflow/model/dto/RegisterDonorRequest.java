package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.OrganizationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterDonorRequest {
    @Email(message = "{validation.email.invalid}")
    @NotBlank(message = "{validation.email.required}")
    private String email;

    @NotBlank(message = "{validation.password.required}")
    @Size(min = 8, message = "{validation.password.minLength}")
    private String password;

    @NotBlank(message = "{validation.organizationName.required}")
    @NotBlank
    @Size(min = 8)
    private String confirmPassword;

    @NotBlank
    private String organizationName;

    @NotBlank(message = "{validation.contactPerson.required}")
    private String contactPerson;

    @NotBlank(message = "{validation.phone.required}")
    private String phone;

    @NotBlank(message = "{validation.address.required}")
    private String address;

    private OrganizationType organizationType;

    // Business license is optional — user can provide a supporting document instead
    private String businessLicense;

    // URL of the uploaded supporting document (set by the controller after file storage)
    private String supportingDocumentUrl;

    private Boolean dataStorageConsent = false;

    // Constructors, getters, setters
    public RegisterDonorRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    
    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
    
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public OrganizationType getOrganizationType() { return organizationType; }
    public void setOrganizationType(OrganizationType organizationType) { this.organizationType = organizationType; }
    
    public String getBusinessLicense() { return businessLicense; }
    public void setBusinessLicense(String businessLicense) { this.businessLicense = businessLicense; }

    public String getSupportingDocumentUrl() { return supportingDocumentUrl; }
    public void setSupportingDocumentUrl(String supportingDocumentUrl) { this.supportingDocumentUrl = supportingDocumentUrl; }

    public Boolean getDataStorageConsent() { return dataStorageConsent; }
    public void setDataStorageConsent(Boolean dataStorageConsent) { this.dataStorageConsent = dataStorageConsent; }
}
