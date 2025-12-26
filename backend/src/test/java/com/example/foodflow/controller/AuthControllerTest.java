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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.context.SpringBootTest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
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
        request.setConfirmPassword("password123");
        request.setOrganizationName("Test Restaurant");
        request.setContactPerson("John Doe");
        request.setPhone("123-456-7890");
        request.setAddress("123 Main St");
        request.setBusinessLicense("TEST-LICENSE-123");

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
        request.setConfirmPassword("password123");
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

    // ====== COMPREHENSIVE LOGIN TESTS ======

    @Test
    void login_NullEmail_ReturnsBadRequest() throws Exception {
        // Given
        LoginRequest request = new LoginRequest(null, "password123");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_NullPassword_ReturnsBadRequest() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("user@test.com", null);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WhitespaceOnlyEmail_ReturnsBadRequest() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("   ", "password123");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WhitespaceOnlyPassword_ReturnsBadRequest() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("user@test.com", "   ");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_NonExistentUser_ReturnsBadRequest() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("nonexistent@test.com", "password123");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("User not found"));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.token").value((Object) null))
                .andExpect(jsonPath("$.email").value((Object) null))
                .andExpect(jsonPath("$.role").value((Object) null))
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    void login_DonorRole_Success() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("donor@test.com", "password123");
        AuthResponse response = new AuthResponse("jwt-token-donor", "donor@test.com", "DONOR", "Login successful");

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-donor"))
                .andExpect(jsonPath("$.email").value("donor@test.com"))
                .andExpect(jsonPath("$.role").value("DONOR"))
                .andExpect(jsonPath("$.message").value("Login successful"));
    }

    @Test
    void login_ReceiverRole_Success() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("receiver@test.com", "password123");
        AuthResponse response = new AuthResponse("jwt-token-receiver", "receiver@test.com", "RECEIVER", "Login successful");

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-receiver"))
                .andExpect(jsonPath("$.email").value("receiver@test.com"))
                .andExpect(jsonPath("$.role").value("RECEIVER"))
                .andExpect(jsonPath("$.message").value("Login successful"));
    }

    @Test
    void login_CaseSensitiveEmail_Success() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("User@Test.COM", "password123");
        AuthResponse response = new AuthResponse("jwt-token", "user@test.com", "DONOR", "Login successful");

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.email").value("user@test.com"))
                .andExpect(jsonPath("$.role").value("DONOR"));
    }

    @Test
    void login_PasswordWithSpecialCharacters_Success() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("user@test.com", "P@ssw0rd!#$%");
        AuthResponse response = new AuthResponse("jwt-token", "user@test.com", "DONOR", "Login successful");

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.email").value("user@test.com"));
    }


    @Test
    void login_AccountLocked_ReturnsBadRequest() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("locked@test.com", "password123");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Account is locked"));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Account is locked"));
    }

    @Test
    void login_MalformedJson_ReturnsBadRequest() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{email: user@test.com, password: }")) // malformed JSON
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_MissingContentType_ReturnsUnsupportedMediaType() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("user@test.com", "password123");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .content(objectMapper.writeValueAsString(request))) // Missing content type
                .andExpect(status().isUnsupportedMediaType()); // 415 is correct for missing content type
    }

    @Test
    void login_EmptyRequestBody_ReturnsBadRequest() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_SqlInjectionAttempt_ReturnsBadRequest() throws Exception {
        // Given - SQL injection attempt
        LoginRequest request = new LoginRequest("'; DROP TABLE users; --", "password123");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Invalid email format"));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email format"));
    }

    @Test
    void login_XssAttempt_ReturnsBadRequest() throws Exception {
        // Given - XSS attempt
        LoginRequest request = new LoginRequest("<script>alert('xss')</script>@test.com", "password123");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Invalid email format"));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email format"));
    }

    @Test
    void login_ServiceException_ReturnsBadRequest() throws Exception {
        // Given
        LoginRequest request = new LoginRequest("user@test.com", "password123");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Internal service error"));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.token").value((Object) null))
                .andExpect(jsonPath("$.message").value("Internal service error"));
    }
}
