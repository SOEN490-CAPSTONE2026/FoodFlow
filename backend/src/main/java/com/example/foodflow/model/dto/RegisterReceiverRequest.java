package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.OrganizationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterReceiverRequest {
    @Email(message = "{validation.email.invalid}")
    @NotBlank(message = "{validation.email.required}")
    private String email;

    @NotBlank(message = "{validation.password.required}")
    @Size(min = 8, message = "{validation.password.minLength}")
    private String password;

    @NotBlank(message = "{validation.organizationName.required}")
    private String organizationName;

    @NotBlank(message = "{validation.contactPerson.required}")
    private String contactPerson;

    @NotBlank(message = "{validation.phone.required}")
    private String phone;

    @NotBlank(message = "{validation.address.required}")
    private String address;

    private OrganizationType organizationType;
    private Integer capacity;

    // Constructors, getters, setters
    public RegisterReceiverRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
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
}
