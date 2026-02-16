package com.example.foodflow.integration;

import com.example.foodflow.model.dto.ChangePasswordRequest;
import com.example.foodflow.model.dto.RegisterDonorRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for password policy enforcement across registration and
 * password management flows
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PasswordPolicyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerDonor_WeakPassword_Returns400() throws Exception {
        // Given - Registration with weak password (too short)
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("weakpass@test.com");
        request.setPassword("Weak1!");
        request.setConfirmPassword("Weak1!");
        request.setOrganizationName("Test Restaurant");
        request.setContactPerson("John Doe");
        request.setPhone("123-456-7890");
        request.setAddress("123 Main St");
        request.setBusinessLicense("BL-12345");

        // When & Then
        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void registerDonor_CommonPassword_Returns400() throws Exception {
        // Given - Registration with common password
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("commonpass@test.com");
        request.setPassword("password123!");
        request.setConfirmPassword("password123!");
        request.setOrganizationName("Test Restaurant");
        request.setContactPerson("John Doe");
        request.setPhone("123-456-7890");
        request.setAddress("123 Main St");
        request.setBusinessLicense("BL-12345");

        // When & Then
        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='password')].message").value(
                        org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("too common"))));
    }

    @Test
    void registerDonor_NoUppercase_Returns400() throws Exception {
        // Given - Registration with no uppercase
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("nouppercase@test.com");
        request.setPassword("securepass123!");
        request.setConfirmPassword("securepass123!");
        request.setOrganizationName("Test Restaurant");
        request.setContactPerson("John Doe");
        request.setPhone("123-456-7890");
        request.setAddress("123 Main St");
        request.setBusinessLicense("BL-12345");

        // When & Then
        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='password')].message").value(
                        org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("uppercase"))));
    }

    @Test
    void registerDonor_NoSpecialChar_Returns400() throws Exception {
        // Given - Registration with no special character
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("nospecial@test.com");
        request.setPassword("SecurePass123");
        request.setConfirmPassword("SecurePass123");
        request.setOrganizationName("Test Restaurant");
        request.setContactPerson("John Doe");
        request.setPhone("123-456-7890");
        request.setAddress("123 Main St");
        request.setBusinessLicense("BL-12345");

        // When & Then
        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='password')].message").value(
                        org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("special character"))));
    }

    @Test
    void registerDonor_StrongPassword_Returns200() throws Exception {
        // Given - Registration with strong password
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("strongpass@test.com");
        request.setPassword("SecurePass123!");
        request.setConfirmPassword("SecurePass123!");
        request.setOrganizationName("Test Restaurant");
        request.setContactPerson("John Doe");
        request.setPhone("123-456-7890");
        request.setAddress("123 Main St");
        request.setBusinessLicense("BL-12345");

        // When & Then
        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value("strongpass@test.com"));
    }

    @Test
    void registerDonor_Receiver1234Password_Returns400() throws Exception {
        // Given - Registration with "receiver1234" (no uppercase, no special char)
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("receiver1234@test.com");
        request.setPassword("receiver1234");
        request.setConfirmPassword("receiver1234");
        request.setOrganizationName("Test Restaurant");
        request.setContactPerson("John Doe");
        request.setPhone("123-456-7890");
        request.setAddress("123 Main St");
        request.setBusinessLicense("BL-12345");

        // When & Then - Should reject due to missing uppercase and special character
        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='password')].message").value(
                        org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.anyOf(
                                org.hamcrest.Matchers.containsString("uppercase"),
                                org.hamcrest.Matchers.containsString("special character")))));
    }
}
