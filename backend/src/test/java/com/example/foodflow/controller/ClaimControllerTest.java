package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ClaimRequest;
import com.example.foodflow.model.dto.ClaimResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.ClaimService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ClaimControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClaimService claimService;

    private User receiver;
    private ClaimRequest claimRequest;
    private ClaimResponse claimResponse;

    @BeforeEach
    void setUp() {
        receiver = new User();
        receiver.setId(1L);
        receiver.setEmail("receiver@test.com");
        receiver.setRole(UserRole.RECEIVER);

        claimRequest = new ClaimRequest();
        claimRequest.setSurplusPostId(1L);

        claimResponse = new ClaimResponse();
        claimResponse.setId(1L);
        claimResponse.setSurplusPostTitle("Test Food");
        claimResponse.setClaimedAt(LocalDateTime.now());
        claimResponse.setStatus("ACTIVE");
    }

    @Test
    @WithMockUser(authorities = "RECEIVER")
    void claimSurplusPost_Success() throws Exception {
        // Given
        when(claimService.claimSurplusPost(any(ClaimRequest.class), any()))
            .thenReturn(claimResponse);

        // When & Then
        mockMvc.perform(post("/api/claims")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(claimRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.surplusPostTitle").value("Test Food"))
            .andExpect(jsonPath("$.status").value("ACTIVE"));

        verify(claimService).claimSurplusPost(any(ClaimRequest.class), any());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void claimSurplusPost_DonorRole_Forbidden() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/claims")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(claimRequest)))
            .andExpect(status().isForbidden());

        verify(claimService, never()).claimSurplusPost(any(), any());
    }

    @Test
    void claimSurplusPost_Unauthenticated_Unauthorized() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/claims")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(claimRequest)))
            .andExpect(status().isUnauthorized());

        verify(claimService, never()).claimSurplusPost(any(), any());
    }


    @Test
    @WithMockUser(authorities = "RECEIVER")
    void getMyClaims_Success() throws Exception {
        // Given
        List<ClaimResponse> claims = Arrays.asList(claimResponse);
        when(claimService.getReceiverClaims(any()))
            .thenReturn(claims);

        // When & Then
        mockMvc.perform(get("/api/claims/my-claims"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].surplusPostTitle").value("Test Food"));

        verify(claimService).getReceiverClaims(any());
    }

    @Test
    @WithMockUser(authorities = "RECEIVER")
    void getMyClaims_EmptyList_ReturnsEmptyArray() throws Exception {
        // Given
        when(claimService.getReceiverClaims(any(User.class)))
            .thenReturn(Arrays.asList());

        // When & Then
        mockMvc.perform(get("/api/claims/my-claims"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void getMyClaims_DonorRole_Forbidden() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/claims/my-claims"))
            .andExpect(status().isForbidden());

        verify(claimService, never()).getReceiverClaims(any());
    }

    @Test
    @WithMockUser(authorities = "RECEIVER")
    void cancelClaim_Success() throws Exception {
        // Given
        doNothing().when(claimService).cancelClaim(eq(1L), any());

        // When & Then
        mockMvc.perform(delete("/api/claims/1"))
            .andExpect(status().isNoContent());

        verify(claimService).cancelClaim(eq(1L), any());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void cancelClaim_DonorRole_Forbidden() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/claims/1"))
            .andExpect(status().isForbidden());

        verify(claimService, never()).cancelClaim(any(), any());
    }

    @Test
    @WithMockUser(authorities = "RECEIVER")
    void getClaimsForPost_Success() throws Exception {
        // Given
        List<ClaimResponse> claims = Arrays.asList(claimResponse);
        when(claimService.getClaimsForSurplusPost(1L))
            .thenReturn(claims);

        // When & Then
        mockMvc.perform(get("/api/claims/post/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].id").value(1));

        verify(claimService).getClaimsForSurplusPost(1L);
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void getClaimsForPost_DonorRole_Success() throws Exception {
        // Given
        List<ClaimResponse> claims = Arrays.asList(claimResponse);
        when(claimService.getClaimsForSurplusPost(1L))
            .thenReturn(claims);

        // When & Then
        mockMvc.perform(get("/api/claims/post/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());

        verify(claimService).getClaimsForSurplusPost(1L);
    }

    @Test
    void getClaimsForPost_Unauthenticated_Unauthorized() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/claims/post/1"))
            .andExpect(status().isUnauthorized());

        verify(claimService, never()).getClaimsForSurplusPost(any());
    }
}
