package com.example.foodflow.model.dto;

import com.example.foodflow.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {
    
    @Email(message = "Invalid email format")
    private String email;
    
    private String phone;
    
    @Pattern(regexp = "^[0-9]{6}$", message = "Code must be exactly 6 digits")
    @NotBlank(message = "Verification code is required")
    private String code;
    
    @NotBlank(message = "New password is required")
    @ValidPassword
    private String newPassword;
    
    // Getters and setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getNewPassword() {
        return newPassword;
    }
    
    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
