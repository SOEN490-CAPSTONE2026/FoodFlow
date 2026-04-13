package com.example.foodflow.model.dto;
import com.example.foodflow.model.types.ReferralType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
public class ReferralRequest {
    @NotNull(message = "Referral type is required")
    private ReferralType referralType;
    @NotBlank(message = "Business or organization name is required")
    @Size(max = 200, message = "Name cannot exceed 200 characters")
    private String businessName;
    @NotBlank(message = "Contact email is required")
    @Email(message = "Contact email must be a valid email address")
    @Size(max = 255, message = "Contact email cannot exceed 255 characters")
    private String contactEmail;
    @Size(max = 50, message = "Contact phone cannot exceed 50 characters")
    private String contactPhone;
    @Size(max = 500, message = "Message cannot exceed 500 characters")
    private String message;
    // Getters and Setters
    public ReferralType getReferralType() {
        return referralType;
    }
    public void setReferralType(ReferralType referralType) {
        this.referralType = referralType;
    }
    public String getBusinessName() {
        return businessName;
    }
    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }
    public String getContactEmail() {
        return contactEmail;
    }
    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }
    public String getContactPhone() {
        return contactPhone;
    }
    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
}
