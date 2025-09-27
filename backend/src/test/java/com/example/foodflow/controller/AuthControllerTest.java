package com.example.foodflow.controller;

import com.example.foodflow.model.dto.AuthResponse;
import com.example.foodflow.model.dto.RegisterDonorRequest;
import com.example.foodflow.model.dto.RegisterReceiverRequest;
import com.example.foodflow.model.dto.LoginRequest;
import com.example.foodflow.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerDonor_Success() throws Exception {
        // Given
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("donor@test.com");
        request.setPassword("password123");
        request.setOrganizationName("Test Restaurant");
        request.setContactPerson("John Doe");
        request.setPhone("123-456-7890");
        request.setAddress("123 Main St");

        AuthResponse response = new AuthResponse("jwt-token", "donor@test.com", "DONOR", "Registration successful");
        response.setToken("jwt-token");
        response.setEmail("donor@test.com");

        when(authService.registerDonor(any(RegisterDonorRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.email").value("donor@test.com"));
    }

    @Test
    void registerReceiver_Success() throws Exception {
        // Given
        RegisterReceiverRequest request = new RegisterReceiverRequest();
        request.setEmail("receiver@test.com");
        request.setPassword("password123");
        request.setOrganizationName("Test Charity");
        request.setContactPerson("Jane Smith");
        request.setPhone("987-654-3210");
        request.setAddress("456 Oak Ave");

        AuthResponse response = new AuthResponse("jwt-token", "donor@test.com", "DONOR", "Registration successful");
        response.setToken("jwt-token");
        response.setEmail("receiver@test.com");

        when(authService.registerReceiver(any(RegisterReceiverRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/auth/register/receiver")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.email").value("receiver@test.com"));
    }

    @Test
    void registerDonor_InvalidEmail_BadRequest() throws Exception {
        // Given
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("invalid-email");
        request.setPassword("password123");

        // When & Then
        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_Success() throws Exception {
    // Given
    LoginRequest request = new LoginRequest("user@test.com", "password123");
    AuthResponse response = new AuthResponse("jwt-token", "user@test.com", "DONOR", "Login successful");

    when(authService.login(any(LoginRequest.class))).thenReturn(response);

    // When & Then
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("jwt-token"))
            .andExpect(jsonPath("$.email").value("user@test.com"))
            .andExpect(jsonPath("$.role").value("DONOR"))
            .andExpect(jsonPath("$.message").value("Login successful"));
    }

    @Test
    void login_InvalidCredentials_ReturnsBadRequest() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("user@test.com", "wrongpassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Invalid credentials"));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.token").value((Object) null))
                .andExpect(jsonPath("$.email").value((Object) null))
                .andExpect(jsonPath("$.role").value((Object) null))
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void login_BlankEmailOrPassword_ReturnsBadRequest() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("", ""); // both blank, triggers @NotBlank

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}


