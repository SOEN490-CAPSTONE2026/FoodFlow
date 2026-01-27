package com.example.foodflow.controller;

import com.example.foodflow.model.dto.MessageRequest;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MessageControllerTest {

    @Autowired
    private MockMvc mockMvc;

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
    @WithMockUser(authorities = "DONOR")
    void sendMessage_Success() throws Exception {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Hello, this is a test message");
        
        MessageResponse response = new MessageResponse();
        response.setId(1L);
        response.setMessageBody("Hello, this is a test message");
        response.setCreatedAt(LocalDateTime.now());
        
        when(messageService.sendMessage(any(MessageRequest.class), any()))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.messageBody").value("Hello, this is a test message"));
        
        verify(messageService, times(1)).sendMessage(any(MessageRequest.class), any());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void sendMessage_InvalidConversation_ReturnsBadRequest() throws Exception {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(999L);
        request.setMessageBody("Test message");
        
        when(messageService.sendMessage(any(MessageRequest.class), any()))
                .thenThrow(new IllegalArgumentException("Conversation not found"));

        // When & Then
        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void sendMessage_EmptyBody_ReturnsBadRequest() throws Exception {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("");
        
        // When & Then
        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void sendMessage_NotParticipant_ReturnsBadRequest() throws Exception {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Test message");
        
        when(messageService.sendMessage(any(MessageRequest.class), any()))
                .thenThrow(new IllegalArgumentException("Not a participant"));

        // When & Then
        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void markAsRead_Success() throws Exception {
        // Given
        Long messageId = 1L;

        // When & Then
        mockMvc.perform(put("/api/messages/{messageId}/read", messageId))
                .andExpect(status().isOk());
        
        verify(messageService, times(1)).markAsRead(eq(messageId), any());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void markAsRead_InvalidMessage_ReturnsBadRequest() throws Exception {
        // Given
        Long messageId = 999L;
        
        doThrow(new IllegalArgumentException("Message not found"))
                .when(messageService).markAsRead(eq(messageId), any());

        // When & Then
        mockMvc.perform(put("/api/messages/{messageId}/read", messageId))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void markAsRead_NotRecipient_ReturnsBadRequest() throws Exception {
        // Given
        Long messageId = 1L;
        
        doThrow(new IllegalArgumentException("Not the recipient"))
                .when(messageService).markAsRead(eq(messageId), any());

        // When & Then
        mockMvc.perform(put("/api/messages/{messageId}/read", messageId))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void getUnreadCount_Success() throws Exception {
        // Given
        when(messageService.getUnreadCount(any())).thenReturn(5L);

        // When & Then
        mockMvc.perform(get("/api/messages/unread/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(5));
        
        verify(messageService, times(1)).getUnreadCount(any());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void getUnreadCount_NoUnreadMessages() throws Exception {
        // Given
        when(messageService.getUnreadCount(any())).thenReturn(0L);

        // When & Then
        mockMvc.perform(get("/api/messages/unread/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void getUnreadCount_LargeNumber() throws Exception {
        // Given
        when(messageService.getUnreadCount(any())).thenReturn(100L);

        // When & Then
        mockMvc.perform(get("/api/messages/unread/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(100));
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void sendMessage_LongMessage_Success() throws Exception {
        // Given
        String longMessage = "A".repeat(1000);
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody(longMessage);
        
        MessageResponse response = new MessageResponse();
        response.setId(1L);
        response.setMessageBody(longMessage);
        
        when(messageService.sendMessage(any(MessageRequest.class), any()))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageBody").value(longMessage));
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void sendMessage_SpecialCharacters_Success() throws Exception {
        // Given
        String specialMessage = "Hello! @#$%^&*() <script>alert('test')</script>";
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody(specialMessage);
        
        MessageResponse response = new MessageResponse();
        response.setId(1L);
        response.setMessageBody(specialMessage);
        
        when(messageService.sendMessage(any(MessageRequest.class), any()))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messageBody").value(specialMessage));
    }

    @Test
    @WithMockUser
    void sendMessage_Unauthorized_ReturnsForbidden() throws Exception {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Test");

        // When & Then
        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "DONOR")
    void sendMessage_NullConversationId_ReturnsBadRequest() throws Exception {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(null);
        request.setMessageBody("Test message");

        // When & Then
        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
