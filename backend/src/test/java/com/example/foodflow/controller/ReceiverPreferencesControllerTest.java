package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ReceiverPreferencesRequest;
import com.example.foodflow.model.dto.ReceiverPreferencesResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.ReceiverPreferencesService;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReceiverPreferencesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReceiverPreferencesService preferencesService;

    @MockBean
    private com.example.foodflow.repository.UserRepository userRepository;

    private User receiver;
    private ReceiverPreferencesRequest preferencesRequest;
    private ReceiverPreferencesResponse preferencesResponse;

    private UsernamePasswordAuthenticationToken createAuth(User user) {
        return new UsernamePasswordAuthenticationToken(
            user, null, Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name())));
    }

    @BeforeEach
    void setUp() {
        receiver = new User();
        receiver.setId(1L);
        receiver.setEmail("receiver@test.com");
        receiver.setRole(UserRole.RECEIVER);
        
        when(userRepository.findByEmail("receiver@test.com")).thenReturn(java.util.Optional.of(receiver));

        preferencesRequest = new ReceiverPreferencesRequest();
        preferencesRequest.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry", "Dairy & Cold Items"));
        preferencesRequest.setMaxCapacity(75);
        preferencesRequest.setMinQuantity(5);
        preferencesRequest.setMaxQuantity(150);
        preferencesRequest.setPreferredPickupWindows(Arrays.asList("MORNING", "AFTERNOON"));
        preferencesRequest.setAcceptRefrigerated(true);
        preferencesRequest.setAcceptFrozen(true);

        preferencesResponse = new ReceiverPreferencesResponse();
        preferencesResponse.setId(1L);
        preferencesResponse.setUserId(receiver.getId());
        preferencesResponse.setPreferredFoodTypes(Arrays.asList("Bakery & Pastry", "Dairy & Cold Items"));
        preferencesResponse.setMaxCapacity(75);
        preferencesResponse.setMinQuantity(5);
        preferencesResponse.setMaxQuantity(150);
        preferencesResponse.setPreferredPickupWindows(Arrays.asList("MORNING", "AFTERNOON"));
        preferencesResponse.setAcceptRefrigerated(true);
        preferencesResponse.setAcceptFrozen(true);
        preferencesResponse.setCreatedAt(LocalDateTime.now());
        preferencesResponse.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void getPreferences_Success_ReturnsExistingPreferences() throws Exception {
        when(preferencesService.getPreferences(any(User.class)))
            .thenReturn(Optional.of(preferencesResponse));

        mockMvc.perform(get("/api/receiver/preferences")
                .with(authentication(createAuth(receiver))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.userId").value(1))
            .andExpect(jsonPath("$.maxCapacity").value(75));

        verify(preferencesService).getPreferences(any(User.class));
    }

    @Test
    void getPreferences_NoPreferencesExist_CreatesDefault() throws Exception {
        when(preferencesService.getPreferences(any(User.class)))
            .thenReturn(Optional.empty());
        when(preferencesService.getOrCreateDefaultPreferences(any(User.class)))
            .thenReturn(preferencesResponse);

        mockMvc.perform(get("/api/receiver/preferences")
                .with(authentication(createAuth(receiver))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));

        verify(preferencesService).getPreferences(any(User.class));
        verify(preferencesService).getOrCreateDefaultPreferences(any(User.class));
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void getPreferences_DonorRole_Forbidden() throws Exception {
        mockMvc.perform(get("/api/receiver/preferences"))
            .andExpect(status().isForbidden());

        verify(preferencesService, never()).getPreferences(any());
    }

    @Test
    void getPreferences_Unauthenticated_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/receiver/preferences"))
            .andExpect(status().isForbidden());

        verify(preferencesService, never()).getPreferences(any());
    }

    @Test
    void createPreferences_Success() throws Exception {
        when(preferencesService.hasPreferences(any(User.class)))
            .thenReturn(false);
        when(preferencesService.savePreferences(any(User.class), any(ReceiverPreferencesRequest.class)))
            .thenReturn(preferencesResponse);

        mockMvc.perform(post("/api/receiver/preferences")
                .with(authentication(createAuth(receiver)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(preferencesRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.maxCapacity").value(75));

        verify(preferencesService).hasPreferences(any(User.class));
        verify(preferencesService).savePreferences(any(User.class), any(ReceiverPreferencesRequest.class));
    }

    @Test
    void createPreferences_AlreadyExists_Conflict() throws Exception {
        when(preferencesService.hasPreferences(any(User.class)))
            .thenReturn(true);

        mockMvc.perform(post("/api/receiver/preferences")
                .with(authentication(createAuth(receiver)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(preferencesRequest)))
            .andExpect(status().isConflict());

        verify(preferencesService).hasPreferences(any(User.class));
        verify(preferencesService, never()).savePreferences(any(), any());
    }

    @Test
    @WithMockUser(authorities = "RECEIVER")
    void createPreferences_InvalidData_BadRequest() throws Exception {
        ReceiverPreferencesRequest invalidRequest = new ReceiverPreferencesRequest();
        invalidRequest.setMaxCapacity(0);
        invalidRequest.setMinQuantity(100);
        invalidRequest.setMaxQuantity(50);
        invalidRequest.setAcceptRefrigerated(true);
        invalidRequest.setAcceptFrozen(true);

        mockMvc.perform(post("/api/receiver/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest());

        verify(preferencesService, never()).savePreferences(any(), any());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void createPreferences_DonorRole_Forbidden() throws Exception {
        mockMvc.perform(post("/api/receiver/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(preferencesRequest)))
            .andExpect(status().isForbidden());

        verify(preferencesService, never()).savePreferences(any(), any());
    }

    @Test
    void updatePreferences_Success() throws Exception {
        when(preferencesService.savePreferences(any(User.class), any(ReceiverPreferencesRequest.class)))
            .thenReturn(preferencesResponse);

        mockMvc.perform(put("/api/receiver/preferences")
                .with(authentication(createAuth(receiver)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(preferencesRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.maxCapacity").value(75));

        verify(preferencesService).savePreferences(any(User.class), any(ReceiverPreferencesRequest.class));
    }

    @Test
    void updatePreferences_InvalidData_BadRequest() throws Exception {
        ReceiverPreferencesRequest invalidRequest = new ReceiverPreferencesRequest();
        invalidRequest.setMaxCapacity(50);
        invalidRequest.setMinQuantity(100);
        invalidRequest.setMaxQuantity(50);
        invalidRequest.setAcceptRefrigerated(true);
        invalidRequest.setAcceptFrozen(true);

        when(preferencesService.savePreferences(any(User.class), any(ReceiverPreferencesRequest.class)))
            .thenThrow(new IllegalArgumentException("Minimum quantity cannot be greater than maximum quantity"));

        mockMvc.perform(put("/api/receiver/preferences")
                .with(authentication(createAuth(receiver)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void updatePreferences_DonorRole_Forbidden() throws Exception {
        mockMvc.perform(put("/api/receiver/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(preferencesRequest)))
            .andExpect(status().isForbidden());

        verify(preferencesService, never()).savePreferences(any(), any());
    }

    @Test
    void deletePreferences_Success() throws Exception {
        doNothing().when(preferencesService).deletePreferences(any(User.class));

        mockMvc.perform(delete("/api/receiver/preferences")
                .with(authentication(createAuth(receiver))))
            .andExpect(status().isNoContent());

        verify(preferencesService).deletePreferences(any(User.class));
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void deletePreferences_DonorRole_Forbidden() throws Exception {
        mockMvc.perform(delete("/api/receiver/preferences"))
            .andExpect(status().isForbidden());

        verify(preferencesService, never()).deletePreferences(any());
    }

    @Test
    void hasPreferences_True() throws Exception {
        when(preferencesService.hasPreferences(any(User.class)))
            .thenReturn(true);

        mockMvc.perform(get("/api/receiver/preferences/exists")
                .with(authentication(createAuth(receiver))))
            .andExpect(status().isOk())
            .andExpect(content().string("true"));

        verify(preferencesService).hasPreferences(any(User.class));
    }

    @Test
    void hasPreferences_False() throws Exception {
        when(preferencesService.hasPreferences(any(User.class)))
            .thenReturn(false);

        mockMvc.perform(get("/api/receiver/preferences/exists")
                .with(authentication(createAuth(receiver))))
            .andExpect(status().isOk())
            .andExpect(content().string("false"));

        verify(preferencesService).hasPreferences(any(User.class));
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void hasPreferences_DonorRole_Forbidden() throws Exception {
        mockMvc.perform(get("/api/receiver/preferences/exists"))
            .andExpect(status().isForbidden());

        verify(preferencesService, never()).hasPreferences(any());
    }

    @Test
    void updatePreferences_WithEmptyFoodTypes_Success() throws Exception {
        preferencesRequest.setPreferredFoodTypes(Arrays.asList());
        preferencesResponse.setPreferredFoodTypes(Arrays.asList());
        when(preferencesService.savePreferences(any(User.class), any(ReceiverPreferencesRequest.class)))
            .thenReturn(preferencesResponse);

        mockMvc.perform(put("/api/receiver/preferences")
                .with(authentication(createAuth(receiver)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(preferencesRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.preferredFoodTypes").isArray())
            .andExpect(jsonPath("$.preferredFoodTypes").isEmpty());
    }

    @Test
    void updatePreferences_WithEmptyPickupWindows_Success() throws Exception {
        preferencesRequest.setPreferredPickupWindows(Arrays.asList());
        preferencesResponse.setPreferredPickupWindows(Arrays.asList());
        when(preferencesService.savePreferences(any(User.class), any(ReceiverPreferencesRequest.class)))
            .thenReturn(preferencesResponse);

        mockMvc.perform(put("/api/receiver/preferences")
                .with(authentication(createAuth(receiver)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(preferencesRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.preferredPickupWindows").isArray())
            .andExpect(jsonPath("$.preferredPickupWindows").isEmpty());
    }
}
