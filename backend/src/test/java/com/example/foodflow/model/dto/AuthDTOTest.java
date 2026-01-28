package com.example.foodflow.model.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for Auth-related DTOs
 */
class AuthDTOTest {
    
    // AuthResponse Tests
    @Test
    void authResponse_AllArgsConstructor_ShouldWork() {
        AuthResponse response = new AuthResponse("token", "user@test.com", "DONOR", "Success");
        assertEquals("token", response.getToken());
        assertEquals("user@test.com", response.getEmail());
        assertEquals("DONOR", response.getRole());
        assertEquals("Success", response.getMessage());
    }
    
    
    // LoginRequest Tests
    @Test
    void loginRequest_SettersAndGetters_ShouldWork() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@test.com");
        request.setPassword("password123");
        
        assertEquals("user@test.com", request.getEmail());
        assertEquals("password123", request.getPassword());
    }
    
    
    // RegisterDonorRequest Tests
    @Test
    void registerDonorRequest_SettersAndGetters_ShouldWork() {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("donor@test.com");
        request.setPassword("Password123!");
        request.setPhone("+1234567890");
        request.setOrganizationName("Donor Org");
        request.setAddress("123 Main St");
        
        assertEquals("donor@test.com", request.getEmail());
        assertEquals("Password123!", request.getPassword());
        assertEquals("+1234567890", request.getPhone());
        assertEquals("Donor Org", request.getOrganizationName());
        assertEquals("123 Main St", request.getAddress());
    }
    
    // RegisterReceiverRequest Tests
    @Test
    void registerReceiverRequest_SettersAndGetters_ShouldWork() {
        RegisterReceiverRequest request = new RegisterReceiverRequest();
        request.setEmail("receiver@test.com");
        request.setPassword("Password123!");
        request.setPhone("+1234567890");
        request.setOrganizationName("Receiver Org");
        request.setAddress("456 Oak Ave");
        
        assertEquals("receiver@test.com", request.getEmail());
        assertEquals("Password123!", request.getPassword());
        assertEquals("+1234567890", request.getPhone());
        assertEquals("Receiver Org", request.getOrganizationName());
        assertEquals("456 Oak Ave", request.getAddress());
    }
    
    // ChangePasswordRequest Tests
    @Test
    void changePasswordRequest_SettersAndGetters_ShouldWork() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("OldPass123!");
        request.setNewPassword("NewPass123!");
        request.setConfirmPassword("NewPass123!");
        
        assertEquals("OldPass123!", request.getCurrentPassword());
        assertEquals("NewPass123!", request.getNewPassword());
        assertEquals("NewPass123!", request.getConfirmPassword());
    }
    
    // ForgotPasswordRequest Tests
    @Test
    void forgotPasswordRequest_SettersAndGetters_ShouldWork() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("user@test.com");
        
        assertEquals("user@test.com", request.getEmail());
    }
    
    // ResetPasswordRequest Tests
    @Test
    void resetPasswordRequest_SettersAndGetters_ShouldWork() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("user@test.com");
        request.setCode("123456");
        request.setNewPassword("NewPass123!");
        
        assertEquals("user@test.com", request.getEmail());
        assertEquals("123456", request.getCode());
        assertEquals("NewPass123!", request.getNewPassword());
    }
    
    // VerifyResetCodeRequest Tests
    @Test
    void verifyResetCodeRequest_SettersAndGetters_ShouldWork() {
        VerifyResetCodeRequest request = new VerifyResetCodeRequest();
        request.setEmail("user@test.com");
        request.setCode("123456");
        
        assertEquals("user@test.com", request.getEmail());
        assertEquals("123456", request.getCode());
    }
}
