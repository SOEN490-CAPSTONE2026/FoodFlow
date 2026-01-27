package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CreateReportRequest;
import com.example.foodflow.model.dto.DisputeResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.DisputeStatus;
import com.example.foodflow.service.DisputeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReportControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private DisputeService disputeService;
    
    private User donorUser;
    private User receiverUser;
    private UsernamePasswordAuthenticationToken donorAuth;
    private UsernamePasswordAuthenticationToken receiverAuth;
    
    @BeforeEach
    void setUp() {
        donorUser = new User();
        donorUser.setId(1L);
        donorUser.setEmail("donor@example.com");
        donorUser.setRole(UserRole.DONOR);
        
        receiverUser = new User();
        receiverUser.setId(2L);
        receiverUser.setEmail("receiver@example.com");
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
    }
    
    @Test
    void createReport_ValidRequestAsDonor_ShouldReturn201() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(100L);
        request.setDescription("The receiver never came to pick up the donation");
        
        DisputeResponse response = new DisputeResponse();
        response.setId(1L);
        response.setReporterId(1L);
        response.setReportedId(2L);
        response.setDonationId(100L);
        response.setDescription("The receiver never came to pick up the donation");
        response.setStatus(DisputeStatus.OPEN);
        response.setCreatedAt(LocalDateTime.now());
        
        when(disputeService.createReport(any(CreateReportRequest.class), anyLong()))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.reporterId").value(1))
                .andExpect(jsonPath("$.reportedId").value(2))
                .andExpect(jsonPath("$.donationId").value(100))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }
    
    @Test
    void createReport_ValidRequestAsReceiver_ShouldReturn201() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(1L);
        request.setDonationId(100L);
        request.setDescription("The food was expired");
        
        DisputeResponse response = new DisputeResponse();
        response.setId(2L);
        response.setReporterId(2L);
        response.setReportedId(1L);
        response.setDonationId(100L);
        response.setDescription("The food was expired");
        response.setStatus(DisputeStatus.OPEN);
        response.setCreatedAt(LocalDateTime.now());
        
        when(disputeService.createReport(any(CreateReportRequest.class), anyLong()))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(receiverAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.reporterId").value(2))
                .andExpect(jsonPath("$.reportedId").value(1))
                .andExpect(jsonPath("$.donationId").value(100))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }
    
    @Test
    void createReport_Unauthenticated_ShouldReturn403() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(100L);
        request.setDescription("User did not show up");
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void createReport_ServiceThrowsException_ShouldReturn400() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(100L);
        request.setDescription("User did not show up");
        
        when(disputeService.createReport(any(CreateReportRequest.class), anyLong()))
            .thenThrow(new RuntimeException("Invalid donation ID"));
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void createReport_MissingReportedId_ShouldReturn400() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        // reportedId is missing
        request.setDonationId(100L);
        request.setDescription("User did not show up");
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void createReport_MissingDescription_ShouldReturn400() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(100L);
        // description is missing
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void createReport_EmptyDescription_ShouldReturn400() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(100L);
        request.setDescription(""); // Empty description
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void createReport_WithDetailedDescription_ShouldReturn201() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(100L);
        request.setDescription("The user was rude and unprofessional during the pickup. They also arrived 2 hours late without any notification.");
        
        DisputeResponse response = new DisputeResponse();
        response.setId(3L);
        response.setReporterId(1L);
        response.setReportedId(2L);
        response.setDonationId(100L);
        response.setDescription("The user was rude and unprofessional during the pickup. They also arrived 2 hours late without any notification.");
        response.setStatus(DisputeStatus.OPEN);
        response.setCreatedAt(LocalDateTime.now());
        
        when(disputeService.createReport(any(CreateReportRequest.class), anyLong()))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.description").value("The user was rude and unprofessional during the pickup. They also arrived 2 hours late without any notification."));
    }
    
    @Test
    void createReport_AsAdminUser_ShouldReturn403() throws Exception {
        // Given - Admin users should not be able to create reports through this endpoint
        User adminUser = new User();
        adminUser.setId(3L);
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(UserRole.ADMIN);
        
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
            adminUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority("ADMIN"))
        );
        
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(100L);
        request.setDescription("User did not show up");
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void createReport_DuplicateReport_ShouldReturn400() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(100L);
        request.setDescription("User did not show up");
        
        when(disputeService.createReport(any(CreateReportRequest.class), anyLong()))
            .thenThrow(new RuntimeException("Report already exists for this donation"));
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void createReport_WithImageUrl_ShouldReturn201() throws Exception {
        // Given
        CreateReportRequest request = new CreateReportRequest();
        request.setReportedId(2L);
        request.setDonationId(100L);
        request.setDescription("The food was spoiled");
        request.setImageUrl("https://example.com/evidence.jpg");
        
        DisputeResponse response = new DisputeResponse();
        response.setId(4L);
        response.setReporterId(1L);
        response.setReportedId(2L);
        response.setDonationId(100L);
        response.setDescription("The food was spoiled");
        response.setImageUrl("https://example.com/evidence.jpg");
        response.setStatus(DisputeStatus.OPEN);
        response.setCreatedAt(LocalDateTime.now());
        
        when(disputeService.createReport(any(CreateReportRequest.class), anyLong()))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(post("/api/reports")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.imageUrl").value("https://example.com/evidence.jpg"));
    }
}
