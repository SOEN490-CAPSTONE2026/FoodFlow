package com.example.foodflow.model.dto;

import jakarta.validation.constraints.Email;

public class ForgotPasswordRequest {
    
    @Email(message = "Invalid email format")
    private String email;
    
    private String phone;
    
    private String method; // "email" or "sms"

    public ForgotPasswordRequest() {}

    public ForgotPasswordRequest(String email, String phone, String method) {
        this.email = email;
        this.phone = phone;
        this.method = method;
    }

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
    
    public String getMethod() {
        return method;
    }
    
    public void setMethod(String method) {
        this.method = method;
    }
}
