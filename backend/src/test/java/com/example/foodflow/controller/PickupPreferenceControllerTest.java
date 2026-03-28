package com.example.foodflow.controller;

import com.example.foodflow.model.dto.PickupPreferenceRequest;
import com.example.foodflow.model.dto.PickupPreferenceResponse;
import com.example.foodflow.model.dto.PickupPreferenceSlotRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.PickupPreferenceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PickupPreferenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PickupPreferenceService pickupPreferenceService;

    private User donorUser;
    private User receiverUser;
    private UsernamePasswordAuthenticationToken donorAuth;
    private UsernamePasswordAuthenticationToken receiverAuth;
    private PickupPreferenceResponse testResponse;

    @BeforeEach
    void setUp() {
        donorUser = new User();
        donorUser.setId(1L);
        donorUser.setEmail("donor@test.com");
        donorUser.setPassword("password");
        donorUser.setRole(UserRole.DONOR);

        receiverUser = new User();
        receiverUser.setId(2L);
        receiverUser.setEmail("receiver@test.com");
        receiverUser.setPassword("password");
        receiverUser.setRole(UserRole.RECEIVER);

        donorAuth = new UsernamePasswordAuthenticationToken(
                donorUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("DONOR"))
        );

        receiverAuth = new UsernamePasswordAuthenticationToken(
                receiverUser,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("RECEIVER"))
        );

        testResponse = new PickupPreferenceResponse();
    }

    // ==================== GET /api/donors/pickup-preferences ====================

    @Test
    void getPreferences_WithDonorAuth_Returns200() throws Exception {
        // Given
        when(pickupPreferenceService.getPreferences(any(User.class)))
                .thenReturn(testResponse);

        // When & Then
        mockMvc.perform(get("/api/donors/pickup-preferences")
                        .with(authentication(donorAuth)))
                .andExpect(status().isOk());
    }

    @Test
    void getPreferences_WithDonorAuth_ReturnsExpectedJson() throws Exception {
        // Given
        when(pickupPreferenceService.getPreferences(any(User.class)))
                .thenReturn(testResponse);

        // When & Then
        mockMvc.perform(get("/api/donors/pickup-preferences")
                        .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void getPreferences_WithoutAuth_Returns401() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/donors/pickup-preferences"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getPreferences_WithReceiverRole_ReturnsBadRequest() throws Exception {
        // AccessDeniedException extends RuntimeException, which GlobalExceptionHandler maps to 400
        // When & Then
        mockMvc.perform(get("/api/donors/pickup-preferences")
                        .with(authentication(receiverAuth)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getPreferences_WhenServiceThrows_ReturnsBadRequest() throws Exception {
        // GlobalExceptionHandler.handleRuntimeException maps RuntimeException to 400
        // Given
        when(pickupPreferenceService.getPreferences(any(User.class)))
                .thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(get("/api/donors/pickup-preferences")
                        .with(authentication(donorAuth)))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/donors/pickup-preferences ====================

    @Test
    void savePreferences_WithValidRequest_Returns200() throws Exception {
        // Given
        PickupPreferenceRequest request = new PickupPreferenceRequest();
        request.setAvailabilityWindowStart(LocalTime.of(9, 0));
        request.setAvailabilityWindowEnd(LocalTime.of(17, 0));
        request.setSlots(Collections.emptyList());

        when(pickupPreferenceService.savePreferences(any(User.class), any(PickupPreferenceRequest.class)))
                .thenReturn(testResponse);

        // When & Then
        mockMvc.perform(put("/api/donors/pickup-preferences")
                        .with(authentication(donorAuth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void savePreferences_WithSlots_Returns200() throws Exception {
        // Given
        PickupPreferenceSlotRequest slotReq = new PickupPreferenceSlotRequest();
        slotReq.setStartTime(LocalTime.of(9, 0));
        slotReq.setEndTime(LocalTime.of(12, 0));
        slotReq.setNotes("Morning");

        PickupPreferenceRequest request = new PickupPreferenceRequest();
        request.setAvailabilityWindowStart(LocalTime.of(9, 0));
        request.setAvailabilityWindowEnd(LocalTime.of(17, 0));
        request.setSlots(List.of(slotReq));

        when(pickupPreferenceService.savePreferences(any(User.class), any(PickupPreferenceRequest.class)))
                .thenReturn(testResponse);

        // When & Then
        mockMvc.perform(put("/api/donors/pickup-preferences")
                        .with(authentication(donorAuth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void savePreferences_WithNullWindowTimes_Returns200() throws Exception {
        // Given
        PickupPreferenceRequest request = new PickupPreferenceRequest();
        request.setAvailabilityWindowStart(null);
        request.setAvailabilityWindowEnd(null);
        request.setSlots(Collections.emptyList());

        when(pickupPreferenceService.savePreferences(any(User.class), any(PickupPreferenceRequest.class)))
                .thenReturn(testResponse);

        // When & Then
        mockMvc.perform(put("/api/donors/pickup-preferences")
                        .with(authentication(donorAuth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void savePreferences_WithoutAuth_Returns401() throws Exception {
        // Given
        PickupPreferenceRequest request = new PickupPreferenceRequest();
        request.setSlots(Collections.emptyList());

        // When & Then
        mockMvc.perform(put("/api/donors/pickup-preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void savePreferences_WithReceiverRole_ReturnsBadRequest() throws Exception {
        // AccessDeniedException extends RuntimeException, which GlobalExceptionHandler maps to 400
        // Given
        PickupPreferenceRequest request = new PickupPreferenceRequest();
        request.setSlots(Collections.emptyList());

        // When & Then
        mockMvc.perform(put("/api/donors/pickup-preferences")
                        .with(authentication(receiverAuth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void savePreferences_WhenServiceThrows_ReturnsBadRequest() throws Exception {
        // GlobalExceptionHandler.handleRuntimeException maps RuntimeException to 400
        // Given
        PickupPreferenceRequest request = new PickupPreferenceRequest();
        request.setAvailabilityWindowStart(LocalTime.of(9, 0));
        request.setAvailabilityWindowEnd(LocalTime.of(17, 0));
        request.setSlots(Collections.emptyList());

        when(pickupPreferenceService.savePreferences(any(User.class), any(PickupPreferenceRequest.class)))
                .thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(put("/api/donors/pickup-preferences")
                        .with(authentication(donorAuth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
