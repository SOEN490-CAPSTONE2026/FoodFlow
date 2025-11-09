package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ConversationResponse;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.dto.StartConversationRequest;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConversationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConversationService conversationService;

    @MockBean
    private MessageService messageService;

    @Autowired
    private ObjectMapper objectMapper;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setEmail("user@test.com");
        currentUser.setRole(UserRole.DONOR);
    }

    @Test
    void getUserConversations_Success() throws Exception {
        // Given
        ConversationResponse conv1 = new ConversationResponse();
        conv1.setId(1L);
        conv1.setOtherUserEmail("other1@test.com");
        
        ConversationResponse conv2 = new ConversationResponse();
        conv2.setId(2L);
        conv2.setOtherUserEmail("other2@test.com");
        
        List<ConversationResponse> conversations = Arrays.asList(conv1, conv2);
        
        when(conversationService.getUserConversations(any(User.class))).thenReturn(conversations);

        // When & Then
        mockMvc.perform(get("/api/conversations")
                .with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
        
        verify(conversationService, times(1)).getUserConversations(any(User.class));
    }

    @Test
    void getUserConversations_EmptyList() throws Exception {
        // Given
        when(conversationService.getUserConversations(any(User.class)))
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/conversations")
                .with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void startConversation_Success() throws Exception {
        // Given
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("recipient@test.com");
        
        ConversationResponse response = new ConversationResponse();
        response.setId(1L);
        response.setOtherUserEmail("recipient@test.com");
        
        when(conversationService.startConversation(any(User.class), any(StartConversationRequest.class)))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/conversations")
                .with(user(currentUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.otherUserEmail").value("recipient@test.com"));
    }

    @Test
    void startConversation_InvalidEmail_ReturnsBadRequest() throws Exception {
        // Given
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("nonexistent@test.com");
        
        when(conversationService.startConversation(any(User.class), any(StartConversationRequest.class)))
                .thenThrow(new IllegalArgumentException("User not found"));

        // When & Then
        mockMvc.perform(post("/api/conversations")
                .with(user(currentUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void startConversation_WithSelf_ReturnsBadRequest() throws Exception {
        // Given
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("user@test.com");
        
        when(conversationService.startConversation(any(User.class), any(StartConversationRequest.class)))
                .thenThrow(new IllegalArgumentException("Cannot start conversation with yourself"));

        // When & Then
        mockMvc.perform(post("/api/conversations")
                .with(user(currentUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getConversation_Success() throws Exception {
        // Given
        Long conversationId = 1L;
        ConversationResponse response = new ConversationResponse();
        response.setId(conversationId);
        response.setOtherUserEmail("other@test.com");
        
        when(conversationService.getConversationResponse(eq(conversationId), any(User.class)))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(get("/api/conversations/{id}", conversationId)
                .with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(conversationId))
                .andExpect(jsonPath("$.otherUserEmail").value("other@test.com"));
    }

    @Test
    void getConversation_NotParticipant_ReturnsForbidden() throws Exception {
        // Given
        Long conversationId = 1L;
        
        when(conversationService.getConversationResponse(eq(conversationId), any(User.class)))
                .thenThrow(new IllegalArgumentException("Not a participant"));

        // When & Then
        mockMvc.perform(get("/api/conversations/{id}", conversationId)
                .with(user(currentUser)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getConversationMessages_Success() throws Exception {
        // Given
        Long conversationId = 1L;
        MessageResponse msg1 = new MessageResponse();
        msg1.setId(1L);
        msg1.setMessageBody("Hello");
        
        MessageResponse msg2 = new MessageResponse();
        msg2.setId(2L);
        msg2.setMessageBody("Hi there");
        
        List<MessageResponse> messages = Arrays.asList(msg1, msg2);
        
        when(messageService.getConversationMessages(eq(conversationId), any(User.class)))
                .thenReturn(messages);

        // When & Then
        mockMvc.perform(get("/api/conversations/{id}/messages", conversationId)
                .with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].messageBody").value("Hello"))
                .andExpect(jsonPath("$[1].messageBody").value("Hi there"));
    }

    @Test
    void getConversationMessages_EmptyConversation() throws Exception {
        // Given
        Long conversationId = 1L;
        
        when(messageService.getConversationMessages(eq(conversationId), any(User.class)))
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/conversations/{id}/messages", conversationId)
                .with(user(currentUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getConversationMessages_NotParticipant_ReturnsForbidden() throws Exception {
        // Given
        Long conversationId = 1L;
        
        when(messageService.getConversationMessages(eq(conversationId), any(User.class)))
                .thenThrow(new IllegalArgumentException("Not a participant"));

        // When & Then
        mockMvc.perform(get("/api/conversations/{id}/messages", conversationId)
                .with(user(currentUser)))
                .andExpect(status().isForbidden());
    }

    @Test
    void markConversationAsRead_Success() throws Exception {
        // Given
        Long conversationId = 1L;

        // When & Then
        mockMvc.perform(put("/api/conversations/{id}/read", conversationId)
                .with(user(currentUser)))
                .andExpect(status().isOk());
        
        verify(messageService, times(1)).markConversationAsRead(eq(conversationId), any(User.class));
    }

    @Test
    void markConversationAsRead_NotParticipant_ReturnsForbidden() throws Exception {
        // Given
        Long conversationId = 1L;
        
        when(messageService.markConversationAsRead(eq(conversationId), any(User.class)))
                .thenThrow(new IllegalArgumentException("Not a participant"));

        // When & Then
        mockMvc.perform(put("/api/conversations/{id}/read", conversationId)
                .with(user(currentUser)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser
    void getUserConversations_Unauthorized_ReturnsForbidden() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/conversations"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getConversation_InvalidId_ReturnsForbidden() throws Exception {
        // Given
        Long invalidId = 999L;
        
        when(conversationService.getConversationResponse(eq(invalidId), any(User.class)))
                .thenThrow(new IllegalArgumentException("Conversation not found"));

        // When & Then
        mockMvc.perform(get("/api/conversations/{id}", invalidId)
                .with(user(currentUser)))
                .andExpect(status().isForbidden());
    }
}
