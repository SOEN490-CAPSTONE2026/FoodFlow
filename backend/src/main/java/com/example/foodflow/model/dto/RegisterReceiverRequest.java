package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.config.jackson.OrganizationTypeDeserializer;
import com.example.foodflow.validation.ValidPassword;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterReceiverRequest {
    @Email(message = "{validation.email.invalid}")
    @NotBlank(message = "{validation.email.required}")
    private String email;

    @NotBlank(message = "{validation.password.required}")
    @ValidPassword
    private String password;

    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;

    @NotBlank
    private String organizationName;

    @NotBlank(message = "{validation.contactPerson.required}")
    private String contactPerson;

    @NotBlank(message = "{validation.phone.required}")
    private String phone;

    @NotBlank(message = "{validation.address.required}")
    private String address;

    @JsonDeserialize(using = OrganizationTypeDeserializer.class)
    private OrganizationType organizationType;
    private Integer capacity;
    private String charityRegistrationNumber;

    // URL of the uploaded supporting document (set by the controller after file storage)
    private String supportingDocumentUrl;

    private Boolean dataStorageConsent = false;

    // Constructors, getters, setters
    public RegisterReceiverRequest() {}

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
    
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getCharityRegistrationNumber() { return charityRegistrationNumber; }
    public void setCharityRegistrationNumber(String charityRegistrationNumber) { this.charityRegistrationNumber = charityRegistrationNumber; }

    public String getSupportingDocumentUrl() { return supportingDocumentUrl; }
    public void setSupportingDocumentUrl(String supportingDocumentUrl) { this.supportingDocumentUrl = supportingDocumentUrl; }

    public Boolean getDataStorageConsent() { return dataStorageConsent; }
    public void setDataStorageConsent(Boolean dataStorageConsent) { this.dataStorageConsent = dataStorageConsent; }
}
