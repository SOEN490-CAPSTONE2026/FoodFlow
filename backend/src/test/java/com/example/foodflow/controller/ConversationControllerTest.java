package com.example.foodflow.controller;

import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.ConversationService;
import com.example.foodflow.service.MessageService;
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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConversationControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private ConversationService conversationService;
    
    @MockBean
    private MessageService messageService;
    
    private User testUser;
    private UsernamePasswordAuthenticationToken auth;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user@test.com");
        testUser.setRole(UserRole.DONOR);
        
        auth = new UsernamePasswordAuthenticationToken(
            testUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority("DONOR"))
        );
    }
    
    @Test
    void getUserConversations_ShouldReturn200() throws Exception {
        // Given
        List<ConversationResponse> conversations = new ArrayList<>();
        ConversationResponse conv = new ConversationResponse();
        conv.setId(1L);
        conversations.add(conv);
        
        when(conversationService.getUserConversations(any(User.class))).thenReturn(conversations);
        
        // When & Then
        mockMvc.perform(get("/api/conversations")
                .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1));
    }
    
    @Test
    void startConversation_ValidRequest_ShouldReturn201() throws Exception {
        // Given
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("other@test.com");
        
        ConversationResponse response = new ConversationResponse();
        response.setId(1L);
        
        when(conversationService.startConversation(any(User.class), any(StartConversationRequest.class)))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(post("/api/conversations")
                .with(authentication(auth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }
    
    @Test
    void startConversation_InvalidUser_ShouldReturn400() throws Exception {
        // Given
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("invalid@test.com");
        
        when(conversationService.startConversation(any(User.class), any(StartConversationRequest.class)))
            .thenThrow(new IllegalArgumentException("User not found"));
        
        // When & Then
        mockMvc.perform(post("/api/conversations")
                .with(authentication(auth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void getConversation_ValidId_ShouldReturn200() throws Exception {
        // Given
        ConversationResponse response = new ConversationResponse();
        response.setId(1L);
        
        when(conversationService.getConversationResponse(eq(1L), any(User.class)))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(get("/api/conversations/1")
                .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }
    
    @Test
    void getConversation_Forbidden_ShouldReturn403() throws Exception {
        // Given
        when(conversationService.getConversationResponse(eq(1L), any(User.class)))
            .thenThrow(new IllegalArgumentException("Access denied"));
        
        // When & Then
        mockMvc.perform(get("/api/conversations/1")
                .with(authentication(auth)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void getConversationMessages_ShouldReturn200() throws Exception {
        // Given
        List<MessageResponse> messages = new ArrayList<>();
        MessageResponse msg = new MessageResponse();
        msg.setId(1L);
        messages.add(msg);
        
        when(messageService.getConversationMessages(eq(1L), any(User.class)))
            .thenReturn(messages);
        
        // When & Then
        mockMvc.perform(get("/api/conversations/1/messages")
                .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
    
    @Test
    void markConversationAsRead_ShouldReturn200() throws Exception {
        // Given
        doNothing().when(messageService).markConversationAsRead(eq(1L), any(User.class));
        
        // When & Then
        mockMvc.perform(put("/api/conversations/1/read")
                .with(authentication(auth)))
                .andExpect(status().isOk());
    }
    
    @Test
    void getConversationByPost_ShouldReturn200() throws Exception {
        // Given
        ConversationResponse response = new ConversationResponse();
        response.setId(1L);
        
        when(conversationService.getConversationByPost(eq(1L), any(User.class)))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(get("/api/conversations/post/1")
                .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }
    
    @Test
    void getConversationByPost_NotFound_ShouldReturn404() throws Exception {
        // Given
        when(conversationService.getConversationByPost(eq(999L), any(User.class)))
            .thenThrow(new IllegalArgumentException("Not found"));
        
        // When & Then
        mockMvc.perform(get("/api/conversations/post/999")
                .with(authentication(auth)))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void createOrGetPostConversation_ShouldReturn201() throws Exception {
        // Given
        StartPostConversationRequest request = new StartPostConversationRequest();
        request.setOtherUserId(2L);
        
        ConversationResponse response = new ConversationResponse();
        response.setId(1L);
        
        when(conversationService.createOrGetPostConversation(eq(1L), eq(2L), any(User.class)))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(post("/api/conversations/post/1")
                .with(authentication(auth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }
    
    @Test
    void getUserConversations_Unauthenticated_ShouldReturn403() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/conversations"))
                .andExpect(status().isForbidden());
    }
}
