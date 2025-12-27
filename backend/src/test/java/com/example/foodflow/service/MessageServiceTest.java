package com.example.foodflow.service;

import com.example.foodflow.model.dto.MessageHistoryResponse;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.Message;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.ConversationRepository;
import com.example.foodflow.repository.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {
    
    @Mock
    private MessageRepository messageRepository;
    
    @Mock
    private ConversationRepository conversationRepository;
    
    @InjectMocks
    private MessageService messageService;
    
    private User testUser;
    private Conversation testConversation;
    private SurplusPost testPost;
    private Message testMessage1;
    private Message testMessage2;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");
        
        testPost = new SurplusPost();
        testPost.setId(100L);
        
        testConversation = new Conversation(testUser, otherUser, testPost);
        testConversation.setId(10L);
        
        testMessage1 = new Message(testConversation, testUser, "First message");
        testMessage1.setId(1L);
        
        testMessage2 = new Message(testConversation, otherUser, "Second message");
        testMessage2.setId(2L);
    }
    
    @Test
    void testGetMessageHistoryByPostId_Success() {
        // Arrange
        Long postId = 100L;
        int page = 0;
        int size = 50;
        
        List<Message> messages = Arrays.asList(testMessage1, testMessage2);
        Page<Message> messagePage = new PageImpl<>(messages, PageRequest.of(page, size), messages.size());
        
        when(conversationRepository.findByPostIdAndUserId(postId, testUser.getId()))
            .thenReturn(Optional.of(testConversation));
        when(messageRepository.findByConversationIdWithPagination(eq(testConversation.getId()), any(Pageable.class)))
            .thenReturn(messagePage);
        
        // Act
        MessageHistoryResponse response = messageService.getMessageHistoryByPostId(postId, testUser, page, size);
        
        // Assert
        assertNotNull(response);
        assertEquals(2, response.getMessages().size());
        assertEquals(0, response.getCurrentPage());
        assertEquals(1, response.getTotalPages());
        assertEquals(2, response.getTotalMessages());
        assertFalse(response.isHasMore());
        
        verify(conversationRepository).findByPostIdAndUserId(postId, testUser.getId());
        verify(messageRepository).findByConversationIdWithPagination(eq(testConversation.getId()), any(Pageable.class));
    }
    
    @Test
    void testGetMessageHistoryByPostId_WithPagination() {
        // Arrange
        Long postId = 100L;
        int page = 0;
        int size = 1;
        
        List<Message> messages = Collections.singletonList(testMessage1);
        Page<Message> messagePage = new PageImpl<>(messages, PageRequest.of(page, size), 2);
        
        when(conversationRepository.findByPostIdAndUserId(postId, testUser.getId()))
            .thenReturn(Optional.of(testConversation));
        when(messageRepository.findByConversationIdWithPagination(eq(testConversation.getId()), any(Pageable.class)))
            .thenReturn(messagePage);
        
        // Act
        MessageHistoryResponse response = messageService.getMessageHistoryByPostId(postId, testUser, page, size);
        
        // Assert
        assertNotNull(response);
        assertEquals(1, response.getMessages().size());
        assertEquals(0, response.getCurrentPage());
        assertEquals(2, response.getTotalPages());
        assertEquals(2, response.getTotalMessages());
        assertTrue(response.isHasMore());
    }
    
    @Test
    void testGetMessageHistoryByPostId_NoConversationFound() {
        // Arrange
        Long postId = 999L;
        
        when(conversationRepository.findByPostIdAndUserId(postId, testUser.getId()))
            .thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            messageService.getMessageHistoryByPostId(postId, testUser, 0, 50);
        });
        
        verify(conversationRepository).findByPostIdAndUserId(postId, testUser.getId());
        verify(messageRepository, never()).findByConversationIdWithPagination(any(), any());
    }
    
    @Test
    void testGetMessageHistoryByPostId_MessagesInChronologicalOrder() {
        // Arrange
        Long postId = 100L;
        
        // Create messages - repository query handles chronological ordering
        Message message1 = new Message(testConversation, testUser, "First message");
        message1.setId(1L);
        
        Message message2 = new Message(testConversation, testUser, "Second message");
        message2.setId(2L);
        
        // Messages returned in order as repository would provide them
        List<Message> messages = Arrays.asList(message1, message2);
        Page<Message> messagePage = new PageImpl<>(messages, PageRequest.of(0, 50), messages.size());
        
        when(conversationRepository.findByPostIdAndUserId(postId, testUser.getId()))
            .thenReturn(Optional.of(testConversation));
        when(messageRepository.findByConversationIdWithPagination(eq(testConversation.getId()), any(Pageable.class)))
            .thenReturn(messagePage);
        
        // Act
        MessageHistoryResponse response = messageService.getMessageHistoryByPostId(postId, testUser, 0, 50);
        
        // Assert
        List<MessageResponse> responseMessages = response.getMessages();
        assertEquals(2, responseMessages.size());
        // Verify messages are returned in the order provided by repository
        assertEquals("First message", responseMessages.get(0).getMessageBody());
        assertEquals("Second message", responseMessages.get(1).getMessageBody());
    }
    
    @Test
    void testGetMessageHistoryByPostId_EmptyConversation() {
        // Arrange
        Long postId = 100L;
        
        List<Message> messages = Collections.emptyList();
        Page<Message> messagePage = new PageImpl<>(messages, PageRequest.of(0, 50), 0);
        
        when(conversationRepository.findByPostIdAndUserId(postId, testUser.getId()))
            .thenReturn(Optional.of(testConversation));
        when(messageRepository.findByConversationIdWithPagination(eq(testConversation.getId()), any(Pageable.class)))
            .thenReturn(messagePage);
        
        // Act
        MessageHistoryResponse response = messageService.getMessageHistoryByPostId(postId, testUser, 0, 50);
        
        // Assert
        assertNotNull(response);
        assertTrue(response.getMessages().isEmpty());
        assertEquals(0, response.getTotalMessages());
        assertEquals(0, response.getTotalPages());
        assertFalse(response.isHasMore());
    }
}
