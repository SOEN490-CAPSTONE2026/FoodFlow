package com.example.foodflow.integration;

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
        request.setPassword("password123");
        request.setOrganizationName("Integration Test Restaurant");
        request.setContactPerson("John Integration");
        request.setPhone("123-456-7890");
        request.setAddress("123 Integration St");

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
        request.setPassword("password123");
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
        request1.setPassword("password123");
        request1.setOrganizationName("First Restaurant");
        request1.setContactPerson("First User");
        request1.setPhone("123-456-7890");
        request1.setAddress("123 First St");

        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        // Given - Second registration with same email
        RegisterDonorRequest request2 = new RegisterDonorRequest();
        request2.setEmail("duplicate@test.com");
        request2.setPassword("password456");
        request2.setOrganizationName("Second Restaurant");
        request2.setContactPerson("Second User");
        request2.setPhone("987-654-3210");
        request2.setAddress("456 Second St");

        // When & Then
        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest());
    }
}
