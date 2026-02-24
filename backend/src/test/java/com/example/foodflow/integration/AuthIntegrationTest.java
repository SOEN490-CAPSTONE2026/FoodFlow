package com.example.foodflow.integration;

import com.example.foodflow.model.dto.LoginRequest;
import com.example.foodflow.model.dto.RegisterDonorRequest;
import com.example.foodflow.model.dto.RegisterReceiverRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@AutoConfigureMockMvc // Add this annotation
@ActiveProfiles("test")
@Transactional
class AuthIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        void registerDonor_EndToEnd_Success() throws Exception {
                // Given
                RegisterDonorRequest request = new RegisterDonorRequest();
                request.setEmail("integration.donor@test.com");
                request.setPassword("TestSecure123!");
                request.setConfirmPassword("TestSecure123!");
                request.setOrganizationName("Integration Test Restaurant");
                request.setContactPerson("John Integration");
                request.setPhone("123-456-7890");
                request.setAddress("123 Integration St");
                request.setBusinessLicense("INTEGRATION-LICENSE-123");

                // When & Then
                mockMvc.perform(post("/api/auth/register/donor")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.email").value("integration.donor@test.com"));
        }

        @Test
        void registerReceiver_EndToEnd_Success() throws Exception {
                // Given
                RegisterReceiverRequest request = new RegisterReceiverRequest();
                request.setEmail("integration.receiver@test.com");
                request.setPassword("TestSecure123!");
                request.setConfirmPassword("TestSecure123!");
                request.setOrganizationName("Integration Test Charity");
                request.setContactPerson("Jane Integration");
                request.setPhone("987-654-3210");
                request.setAddress("456 Integration Ave");

                // When & Then
                mockMvc.perform(post("/api/auth/register/receiver")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.email").value("integration.receiver@test.com"));
        }

        @Test
        void registerDonor_DuplicateEmail_Conflict() throws Exception {
                // Given - First registration
                RegisterDonorRequest request1 = new RegisterDonorRequest();
                request1.setEmail("duplicate@test.com");
                request1.setPassword("TestSecure123!");
                request1.setConfirmPassword("TestSecure123!");
                request1.setOrganizationName("First Restaurant");
                request1.setContactPerson("First User");
                request1.setPhone("123-456-7890");
                request1.setAddress("123 First St");
                request1.setBusinessLicense("FIRST-LICENSE-123");

                mockMvc.perform(post("/api/auth/register/donor")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request1)))
                                .andExpect(status().isOk());

                // Given - Second registration with same email
                RegisterDonorRequest request2 = new RegisterDonorRequest();
                request2.setEmail("duplicate@test.com");
                request2.setPassword("Password456!");
                request2.setConfirmPassword("Password456!");
                request2.setOrganizationName("Second Restaurant");
                request2.setContactPerson("Second User");
                request2.setPhone("987-654-3210");
                request2.setAddress("456 Second St");
                request2.setBusinessLicense("SECOND-LICENSE-456");

                // When & Then
                mockMvc.perform(post("/api/auth/register/donor")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request2)))
                                .andExpect(status().isBadRequest());
        }

        // ====== INTEGRATION LOGIN TESTS ======

        @Test
        void registerThenLogin_DonorFlow_Success() throws Exception {
                // Given - First register a donor
                RegisterDonorRequest registerRequest = new RegisterDonorRequest();
                registerRequest.setEmail("login.donor@test.com");
                registerRequest.setPassword("TestSecure123!");
                registerRequest.setConfirmPassword("TestSecure123!");
                registerRequest.setOrganizationName("Login Test Restaurant");
                registerRequest.setContactPerson("Login Test User");
                registerRequest.setPhone("123-456-7890");
                registerRequest.setAddress("123 Login St");
                registerRequest.setBusinessLicense("LOGIN-LICENSE-123");

                mockMvc.perform(post("/api/auth/register/donor")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerRequest)))
                                .andExpect(status().isOk());

                // When - Then login with the registered credentials
                LoginRequest loginRequest = new LoginRequest("login.donor@test.com", "TestSecure123!");

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.email").value("login.donor@test.com"))
                                .andExpect(jsonPath("$.role").value("DONOR"))
                                .andExpect(jsonPath("$.message").value("Account logged in successfully."));
        }

        @Test
        void registerThenLogin_ReceiverFlow_Success() throws Exception {
                // Given - First register a receiver
                RegisterReceiverRequest registerRequest = new RegisterReceiverRequest();
                registerRequest.setEmail("login.receiver@test.com");
                registerRequest.setPassword("TestSecure123!");
                registerRequest.setConfirmPassword("TestSecure123!");
                registerRequest.setOrganizationName("Login Test Charity");
                registerRequest.setContactPerson("Login Test User");
                registerRequest.setPhone("987-654-3210");
                registerRequest.setAddress("456 Login Ave");

                mockMvc.perform(post("/api/auth/register/receiver")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerRequest)))
                                .andExpect(status().isOk());

                // When - Then login with the registered credentials
                LoginRequest loginRequest = new LoginRequest("login.receiver@test.com", "TestSecure123!");

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.email").value("login.receiver@test.com"))
                                .andExpect(jsonPath("$.role").value("RECEIVER"))
                                .andExpect(jsonPath("$.message").value("Account logged in successfully."));
        }

        @Test
        void login_WithoutRegistration_UserNotFound() throws Exception {
                // Given - Login request for unregistered user
                LoginRequest loginRequest = new LoginRequest("unregistered@test.com", "password123");

                // When & Then
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("User not found"));
        }

        @Test
        void login_WrongPassword_InvalidCredentials() throws Exception {
                // Given - First register a user
                RegisterDonorRequest registerRequest = new RegisterDonorRequest();
                registerRequest.setEmail("wrongpass.test@test.com");
                registerRequest.setPassword("CorrectPass123!");
                registerRequest.setConfirmPassword("CorrectPass123!");
                registerRequest.setOrganizationName("Wrong Pass Restaurant");
                registerRequest.setContactPerson("Wrong Pass User");
                registerRequest.setPhone("123-456-7890");
                registerRequest.setAddress("123 Wrong St");
                registerRequest.setBusinessLicense("WRONGPASS-LICENSE-123");

                mockMvc.perform(post("/api/auth/register/donor")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerRequest)))
                                .andExpect(status().isOk());

                // When - Then login with wrong password
                LoginRequest loginRequest = new LoginRequest("wrongpass.test@test.com", "WrongPass123!");

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Invalid email or password."));
        }
}
