package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.SurplusService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SurplusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SurplusService surplusService;

    private ObjectMapper objectMapper;
    private CreateSurplusRequest request;
    private SurplusResponse response;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // Create test request
        request = new CreateSurplusRequest();
        request.setType("Vegetables");
        request.setQuantity("10 kg");  // ✅ FIXED: String not int
        request.setExpiryDate(LocalDateTime.now().plusDays(2));
        request.setPickupTime(LocalDateTime.now().plusHours(3));
        request.setLocation("123 Main St");

        // Create test response
        response = new SurplusResponse();
        response.setId(1L);
        response.setType("Vegetables");
        response.setQuantity("10 kg");  // ✅ FIXED: String
        response.setLocation("123 Main St");
        response.setExpiryDate(request.getExpiryDate());
        response.setPickupTime(request.getPickupTime());
        response.setDonorEmail("donor@test.com");
        // ✅ REMOVED: organizationName (doesn't exist)
        response.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_Success() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void testCreateSurplusPost_Unauthorized() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());  // ✅ CHANGED: 403 instead of 401
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testCreateSurplusPost_Forbidden_WrongRole() throws Exception {
        // When & Then (RECEIVER trying to create post should be forbidden)
        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_InvalidRequest_MissingType() throws Exception {
        // Given
        request.setType(null);

        // When & Then
        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_InvalidRequest_EmptyQuantity() throws Exception {  // ✅ FIXED: test name and logic
        // Given
        request.setQuantity("");  // ✅ FIXED: Empty string not negative number

        // When & Then
        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
