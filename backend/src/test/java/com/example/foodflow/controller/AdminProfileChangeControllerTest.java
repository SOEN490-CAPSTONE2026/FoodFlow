package com.example.foodflow.controller;

import com.example.foodflow.model.dto.AdminPendingChangeDTO;
import com.example.foodflow.model.dto.RejectionRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.ProfileChangeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Execution(ExecutionMode.SAME_THREAD)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminProfileChangeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProfileChangeService profileChangeService;

    @Autowired
    private ObjectMapper objectMapper;

    private UsernamePasswordAuthenticationToken adminAuth;

    @BeforeEach
    void setUp() {
        Mockito.reset(profileChangeService);

        User admin = new User();
        admin.setId(1L);
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);

        adminAuth = new UsernamePasswordAuthenticationToken(
                admin, null,
                Collections.singletonList(new SimpleGrantedAuthority("ADMIN"))
        );
    }

    // ========== APPROVE TESTS ==========

    @Test
    void approve_ValidId_ShouldReturn200() throws Exception {
        doNothing().when(profileChangeService).approveProfileChange(1L);

        mockMvc.perform(post("/api/admin/profile-change/1/approve")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk());
    }

    @Test
    void approve_NotFound_ShouldReturn400() throws Exception {
        doThrow(new IllegalArgumentException("Request not found"))
                .when(profileChangeService).approveProfileChange(99L);

        mockMvc.perform(post("/api/admin/profile-change/99/approve")
                .with(authentication(adminAuth)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void approve_NotPending_ShouldReturn400() throws Exception {
        doThrow(new IllegalStateException("Request is not pending"))
                .when(profileChangeService).approveProfileChange(2L);

        mockMvc.perform(post("/api/admin/profile-change/2/approve")
                .with(authentication(adminAuth)))
                .andExpect(status().isBadRequest());
    }

   @Test
void approve_Unauthenticated_ShouldReturn401() throws Exception {
    mockMvc.perform(post("/api/admin/profile-change/1/approve"))
            .andExpect(status().isUnauthorized()); 
}

    // ========== REJECT TESTS ==========

    @Test
    void reject_ValidRequest_ShouldReturn200() throws Exception {
        RejectionRequest request = new RejectionRequest();
        request.setReason("Invalid document");
        request.setMessage("Please resubmit with valid documents.");

        doNothing().when(profileChangeService).rejectProfileChange(anyLong(), anyString(), anyString());

        mockMvc.perform(post("/api/admin/profile-change/1/reject")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profile change rejected successfully"));
    }

    @Test
    void reject_NotFound_ShouldReturn400() throws Exception {
        RejectionRequest request = new RejectionRequest();
        request.setReason("Fraud");
        request.setMessage("Not valid");

        doThrow(new IllegalArgumentException("Request not found"))
                .when(profileChangeService).rejectProfileChange(anyLong(), anyString(), anyString());

        mockMvc.perform(post("/api/admin/profile-change/99/reject")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reject_NotPending_ShouldReturn400() throws Exception {
        RejectionRequest request = new RejectionRequest();
        request.setReason("Already handled");
        request.setMessage(null);

        doThrow(new IllegalStateException("Request is not pending"))
                .when(profileChangeService).rejectProfileChange(anyLong(), anyString(), any());

        mockMvc.perform(post("/api/admin/profile-change/2/reject")
                .with(authentication(adminAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

   @Test
void reject_Unauthenticated_ShouldReturn401() throws Exception {
    RejectionRequest request = new RejectionRequest();
    request.setReason("Fraud");

    mockMvc.perform(post("/api/admin/profile-change/1/reject")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized()); // 401 not 403
}

    // ========== GET PENDING TESTS ==========

    @Test
    void getPending_WithResults_ShouldReturn200() throws Exception {
        AdminPendingChangeDTO dto1 = new AdminPendingChangeDTO();
        dto1.setId(1L);
        dto1.setFieldName("name");
        dto1.setOldValue("Old Org");
        dto1.setNewValue("New Org");

        AdminPendingChangeDTO dto2 = new AdminPendingChangeDTO();
        dto2.setId(2L);
        dto2.setFieldName("businessLicense");
        dto2.setOldValue("OLD-123");
        dto2.setNewValue("NEW-456");

        Mockito.when(profileChangeService.getPendingChanges())
                .thenReturn(List.of(dto1, dto2));

        mockMvc.perform(get("/api/admin/profile-change/pending")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fieldName").value("name"))
                .andExpect(jsonPath("$[1].fieldName").value("businessLicense"));
    }

    @Test
    void getPending_EmptyList_ShouldReturn200() throws Exception {
        Mockito.when(profileChangeService.getPendingChanges())
                .thenReturn(List.of());

        mockMvc.perform(get("/api/admin/profile-change/pending")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

   @Test
void getPending_Unauthenticated_ShouldReturn401() throws Exception {
    mockMvc.perform(get("/api/admin/profile-change/pending"))
            .andExpect(status().isUnauthorized()); // 401 not 403
}
}