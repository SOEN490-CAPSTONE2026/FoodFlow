package com.example.foodflow.model.dto;

public class AuthResponse {
    private String token;
    private String email;
    private String role;
    private String message;
    private Long userId;
    private String organizationName;
    private String verificationStatus;

    public AuthResponse(String token, String email, String role, String message) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.message = message;
    }

    public AuthResponse(String token, String email, String role, String message, Long userId) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.message = message;
        this.userId = userId;
    }

    public AuthResponse(String token, String email, String role, String message, Long userId, String organizationName) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.message = message;
        this.userId = userId;
        this.organizationName = organizationName;
    }

    public AuthResponse(String token, String email, String role, String message, Long userId, String organizationName, String verificationStatus) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.message = message;
        this.userId = userId;
        this.organizationName = organizationName;
        this.verificationStatus = verificationStatus;
    }

    // Getters and setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
}
