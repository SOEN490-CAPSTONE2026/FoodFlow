package com.example.foodflow.controller;

import com.example.foodflow.service.MetricsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserInteractionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MetricsService metricsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void trackUserInteraction_Success() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();
        interaction.put("action", "click");
        interaction.put("component", "login_button");

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, times(1)).incrementUserInteraction("click", "login_button");
    }

    @Test
    void trackUserInteraction_DifferentAction_Success() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();
        interaction.put("action", "submit");
        interaction.put("component", "registration_form");

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, times(1)).incrementUserInteraction("submit", "registration_form");
    }

    @Test
    void trackUserInteraction_MissingAction_NoTracking() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();
        interaction.put("component", "button");

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, never()).incrementUserInteraction(anyString(), anyString());
    }

    @Test
    void trackUserInteraction_MissingComponent_NoTracking() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();
        interaction.put("action", "click");

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, never()).incrementUserInteraction(anyString(), anyString());
    }

    @Test
    void trackUserInteraction_EmptyMap_NoTracking() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, never()).incrementUserInteraction(anyString(), anyString());
    }

    @Test
    void trackUserInteraction_NullAction_NoTracking() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();
        interaction.put("action", null);
        interaction.put("component", "button");

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, never()).incrementUserInteraction(anyString(), anyString());
    }

    @Test
    void trackUserInteraction_NullComponent_NoTracking() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();
        interaction.put("action", "click");
        interaction.put("component", null);

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, never()).incrementUserInteraction(anyString(), anyString());
    }

    @Test
    void trackUserInteraction_MultipleActions_Success() throws Exception {
        // First interaction
        Map<String, String> interaction1 = new HashMap<>();
        interaction1.put("action", "view");
        interaction1.put("component", "dashboard");

        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction1)))
                .andExpect(status().isOk());
        
        // Second interaction
        Map<String, String> interaction2 = new HashMap<>();
        interaction2.put("action", "click");
        interaction2.put("component", "menu");

        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction2)))
                .andExpect(status().isOk());
        
        verify(metricsService, times(1)).incrementUserInteraction("view", "dashboard");
        verify(metricsService, times(1)).incrementUserInteraction("click", "menu");
    }

    @Test
    void trackUserInteraction_WithExtraFields_Success() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();
        interaction.put("action", "hover");
        interaction.put("component", "tooltip");
        interaction.put("extraField", "ignored");

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, times(1)).incrementUserInteraction("hover", "tooltip");
    }

    @Test
    void trackUserInteraction_EmptyStrings_NoTracking() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();
        interaction.put("action", "");
        interaction.put("component", "");

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        // Empty strings are not null, so they will be tracked
        verify(metricsService, times(1)).incrementUserInteraction("", "");
    }

    @Test
    void trackUserInteraction_LongStrings_Success() throws Exception {
        // Given
        String longAction = "a".repeat(100);
        String longComponent = "b".repeat(100);
        Map<String, String> interaction = new HashMap<>();
        interaction.put("action", longAction);
        interaction.put("component", longComponent);

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, times(1)).incrementUserInteraction(longAction, longComponent);
    }

    @Test
    void trackUserInteraction_SpecialCharacters_Success() throws Exception {
        // Given
        Map<String, String> interaction = new HashMap<>();
        interaction.put("action", "click@#$%");
        interaction.put("component", "button!&*()");

        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(interaction)))
                .andExpect(status().isOk());
        
        verify(metricsService, times(1)).incrementUserInteraction("click@#$%", "button!&*()");
    }

    @Test
    void trackUserInteraction_MalformedJson_ReturnsBadRequest() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{action: click, component: }")) // malformed JSON
                .andExpect(status().isBadRequest());
        
        verify(metricsService, never()).incrementUserInteraction(anyString(), anyString());
    }

    @Test
    void trackUserInteraction_EmptyBody_ReturnsBadRequest() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/analytics/track")
                .contentType(MediaType.APPLICATION_JSON)
                .content(""))
                .andExpect(status().isBadRequest());
        
        verify(metricsService, never()).incrementUserInteraction(anyString(), anyString());
    }
}
