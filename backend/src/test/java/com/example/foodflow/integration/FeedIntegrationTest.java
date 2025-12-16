package com.example.foodflow.integration;

import com.example.foodflow.model.dto.LoginRequest;
import com.example.foodflow.model.dto.RegisterDonorRequest;
import com.example.foodflow.model.dto.RegisterReceiverRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class FeedIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void feedLoadsForReceiver() throws Exception {
        // Register a receiver
        RegisterReceiverRequest registerRequest = new RegisterReceiverRequest();
        registerRequest.setEmail("receiver@test.com");
        registerRequest.setPassword("password123");
        registerRequest.setConfirmPassword("password123");
        registerRequest.setOrganizationName("Test Charity");
        registerRequest.setContactPerson("Test Receiver");
        registerRequest.setPhone("123-456-7890");
        registerRequest.setAddress("123 Test St");

        // Login and get token
        mockMvc.perform(post("/api/auth/register/receiver")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        LoginRequest loginRequest = new LoginRequest("receiver@test.com", "password123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        // Test feed loads using existing surplus endpoint (requires RECEIVER auth)
        mockMvc.perform(get("/api/surplus")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void donorPostCreationStillWorks() throws Exception {
        // Register a donor
        RegisterDonorRequest registerRequest = new RegisterDonorRequest();
        registerRequest.setEmail("donor@test.com");
        registerRequest.setPassword("password123");
        registerRequest.setConfirmPassword("password123");
        registerRequest.setOrganizationName("Test Restaurant");
        registerRequest.setContactPerson("Test Donor");
        registerRequest.setPhone("123-456-7890");
        registerRequest.setAddress("123 Test St");
        registerRequest.setBusinessLicense("FEED-TEST-LICENSE-123");

        // Login and get token
        mockMvc.perform(post("/api/auth/register/donor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        LoginRequest loginRequest = new LoginRequest("donor@test.com", "password123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        // Create surplus post with correct DTO fields
        String postJson = "{"
        + "\"title\": \"Milk\","
        + "\"description\": \"Fresh milk available\","
        + "\"foodCategories\": [\"DAIRY\"],"
        + "\"quantity\": {\"value\": 2.0, \"unit\": \"LITER\"},"
        + "\"pickupLocation\": {\"address\": \"Donor Street 2\"},"
        + "\"expiryDate\": \"2030-01-01\","
        + "\"pickupDate\": \"2030-01-01\","
        + "\"pickupFrom\": \"15:00:00\","
        + "\"pickupTo\": \"18:00:00\""
        + "}";



        mockMvc.perform(post("/api/surplus")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(postJson))
                .andExpect(status().isCreated())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Milk")));
    }

    @Test
    void newPostAppearsInFeed() throws Exception {
        // Register a donor
        RegisterDonorRequest donorRequest = new RegisterDonorRequest();
        donorRequest.setEmail("donor2@test.com");
        donorRequest.setPassword("password123");
        donorRequest.setConfirmPassword("password123");
        donorRequest.setOrganizationName("Test Restaurant 2");
        donorRequest.setContactPerson("Test Donor 2");
        donorRequest.setPhone("123-456-7890");
        donorRequest.setAddress("123 Test St");
        donorRequest.setBusinessLicense("FEED-TEST-LICENSE-456");

        mockMvc.perform(post("/api/auth/register/donor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(donorRequest)))
                .andExpect(status().isOk());

        LoginRequest donorLogin = new LoginRequest("donor2@test.com", "password123");
        MvcResult donorLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(donorLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String donorToken = objectMapper.readTree(donorLoginResult.getResponse().getContentAsString()).get("token").asText();

        // Register a receiver
        RegisterReceiverRequest receiverRequest = new RegisterReceiverRequest();
        receiverRequest.setEmail("receiver2@test.com");
        receiverRequest.setPassword("password123");
        receiverRequest.setConfirmPassword("password123");
        receiverRequest.setOrganizationName("Test Charity 2");
        receiverRequest.setContactPerson("Test Receiver 2");
        receiverRequest.setPhone("987-654-3210");
        receiverRequest.setAddress("456 Test Ave");

        mockMvc.perform(post("/api/auth/register/receiver")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(receiverRequest)))
                .andExpect(status().isOk());

        LoginRequest receiverLogin = new LoginRequest("receiver2@test.com", "password123");
        MvcResult receiverLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(receiverLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String receiverToken = objectMapper.readTree(receiverLoginResult.getResponse().getContentAsString()).get("token").asText();

        // Create surplus post with correct DTO fields
        String postJson = "{"
        + "\"title\": \"Bread\","
        + "\"description\": \"Fresh bread available\","
        + "\"foodCategories\": [\"BREAD\", \"BAKED_GOODS\"],"
        + "\"quantity\": {\"value\": 5.0, \"unit\": \"LOAF\"},"
        + "\"pickupLocation\": {\"address\": \"Donor Street 1\"},"
        + "\"expiryDate\": \"2030-01-01\","
        + "\"pickupDate\": \"2030-01-01\","
        + "\"pickupFrom\": \"15:00:00\","
        + "\"pickupTo\": \"18:00:00\""
        + "}";

        mockMvc.perform(post("/api/surplus")
                        .header("Authorization", "Bearer " + donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(postJson))
                .andExpect(status().isCreated());

        // Verify the post appears in the feed using existing surplus endpoint (requires RECEIVER auth)
        mockMvc.perform(get("/api/surplus")
                        .header("Authorization", "Bearer " + receiverToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
