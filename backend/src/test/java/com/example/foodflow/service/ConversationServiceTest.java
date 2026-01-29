package com.example.foodflow.service;

import com.example.foodflow.exception.BusinessException;
import com.example.foodflow.model.dto.ConversationResponse;
import com.example.foodflow.model.dto.StartConversationRequest;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.Message;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.ConversationRepository;
import com.example.foodflow.repository.MessageRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @InjectMocks
    private ConversationService conversationService;

    private User user1;
    private User user2;
    private Conversation conversation;
    private Message message;
    private SurplusPost surplusPost;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setId(1L);
        user1.setEmail("user1@test.com");
        user1.setRole(UserRole.DONOR);

        user2 = new User();
        user2.setId(2L);
        user2.setEmail("user2@test.com");
        user2.setRole(UserRole.RECEIVER);

        conversation = new Conversation(user1, user2);
        conversation.setId(1L);

        message = new Message();
        message.setId(1L);
        message.setMessageBody("Test message");
        message.setSender(user1);
        message.setConversation(conversation);

        surplusPost = new SurplusPost();
        surplusPost.setId(1L);
        surplusPost.setDonor(user1);
    }

    // ==================== Tests for getUserConversations ====================

    @Test
    void testGetUserConversations_Success() {
        // Given
        when(conversationRepository.findByUserId(1L)).thenReturn(Arrays.asList(conversation));
        when(messageRepository.findByConversationId(1L)).thenReturn(Arrays.asList(message));
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(2L);

        // When
        List<ConversationResponse> responses = conversationService.getUserConversations(user1);

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getLastMessagePreview()).isEqualTo("Test message");
        assertThat(responses.get(0).getUnreadCount()).isEqualTo(2L);
        verify(conversationRepository).findByUserId(1L);
        verify(messageRepository).findByConversationId(1L);
        verify(messageRepository).countUnreadInConversation(1L, 1L);
    }

    @Test
    void testGetUserConversations_NoMessages() {
        // Given
        when(conversationRepository.findByUserId(1L)).thenReturn(Arrays.asList(conversation));
        when(messageRepository.findByConversationId(1L)).thenReturn(Collections.emptyList());
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(0L);

        // When
        List<ConversationResponse> responses = conversationService.getUserConversations(user1);

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getLastMessagePreview()).isEqualTo("No messages yet");
        assertThat(responses.get(0).getUnreadCount()).isEqualTo(0L);
    }

    @Test
    void testGetUserConversations_EmptyList() {
        // Given
        when(conversationRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        // When
        List<ConversationResponse> responses = conversationService.getUserConversations(user1);

        // Then
        assertThat(responses).isEmpty();
        verify(conversationRepository).findByUserId(1L);
    }

    @Test
    void testGetUserConversations_MultipleConversations() {
        // Given
        Conversation conversation2 = new Conversation(user1, user2);
        conversation2.setId(2L);

        Message message2 = new Message();
        message2.setId(2L);
        message2.setMessageBody("Second message");

        when(conversationRepository.findByUserId(1L)).thenReturn(Arrays.asList(conversation, conversation2));
        when(messageRepository.findByConversationId(1L)).thenReturn(Arrays.asList(message));
        when(messageRepository.findByConversationId(2L)).thenReturn(Arrays.asList(message2));
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(1L);
        when(messageRepository.countUnreadInConversation(2L, 1L)).thenReturn(0L);

        // When
        List<ConversationResponse> responses = conversationService.getUserConversations(user1);

        // Then
        assertThat(responses).hasSize(2);
        verify(conversationRepository).findByUserId(1L);
    }

    // ==================== Tests for startConversation ====================

    @Test
    void testStartConversation_NewConversation() {
        // Given
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("user2@test.com");

        when(userRepository.findByEmail("user2@test.com")).thenReturn(Optional.of(user2));
        when(conversationRepository.findByUsers(1L, 2L)).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);

        // When
        ConversationResponse response = conversationService.startConversation(user1, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAlreadyExists()).isFalse();
        assertThat(response.getLastMessagePreview()).isEqualTo("No messages yet");
        assertThat(response.getUnreadCount()).isEqualTo(0L);
        verify(userRepository).findByEmail("user2@test.com");
        verify(conversationRepository).findByUsers(1L, 2L);
        verify(conversationRepository).save(any(Conversation.class));
    }

    @Test
    void testStartConversation_ExistingConversation() {
        // Given
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("user2@test.com");

        when(userRepository.findByEmail("user2@test.com")).thenReturn(Optional.of(user2));
        when(conversationRepository.findByUsers(1L, 2L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationId(1L)).thenReturn(Arrays.asList(message));
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(3L);

        // When
        ConversationResponse response = conversationService.startConversation(user1, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAlreadyExists()).isTrue();
        assertThat(response.getLastMessagePreview()).isEqualTo("Test message");
        assertThat(response.getUnreadCount()).isEqualTo(3L);
        verify(conversationRepository, never()).save(any(Conversation.class));
    }

    @Test
    void testStartConversation_RecipientNotFound() {
        // Given
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("nonexistent@test.com");

        when(userRepository.findByEmail("nonexistent@test.com")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> conversationService.startConversation(user1, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found with email");
    }

    @Test
    void testStartConversation_SelfConversation() {
        // Given
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("user1@test.com");

        when(userRepository.findByEmail("user1@test.com")).thenReturn(Optional.of(user1));

        // When & Then
        // FIXED: Changed from IllegalArgumentException to BusinessException
        assertThatThrownBy(() -> conversationService.startConversation(user1, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("error.conversation.self_conversation");
    }

    @Test
    void testStartConversation_UserOrderReversed() {
        // Given - User2 initiates conversation with User1
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientEmail("user1@test.com");

        when(userRepository.findByEmail("user1@test.com")).thenReturn(Optional.of(user1));
        when(conversationRepository.findByUsers(1L, 2L)).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);

        // When
        ConversationResponse response = conversationService.startConversation(user2, request);

        // Then
        assertThat(response).isNotNull();
        verify(conversationRepository).findByUsers(1L, 2L); // Should query with min, max order
        verify(conversationRepository).save(any(Conversation.class));
    }

    // ==================== Tests for getConversation ====================

    @Test
    void testGetConversation_Success() {
        // Given
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));

        // When
        Conversation result = conversationService.getConversation(1L, user1);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(conversationRepository).findById(1L);
    }

    @Test
    void testGetConversation_NotFound() {
        // Given
        when(conversationRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> conversationService.getConversation(999L, user1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Conversation not found");
    }

    @Test
    void testGetConversation_NotParticipant() {
        // Given
        User user3 = new User();
        user3.setId(3L);
        user3.setEmail("user3@test.com");

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));

        // When & Then
        // FIXED: Changed from IllegalArgumentException to BusinessException
        assertThatThrownBy(() -> conversationService.getConversation(1L, user3))
                .isInstanceOf(BusinessException.class)
                .hasMessage("error.conversation.not_participant");
    }

    @Test
    void testGetConversation_User2AsParticipant() {
        // Given
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));

        // When
        Conversation result = conversationService.getConversation(1L, user2);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    // ==================== Tests for getConversationResponse ====================

    @Test
    void testGetConversationResponse_Success() {
        // Given
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationId(1L)).thenReturn(Arrays.asList(message));
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(5L);

        // When
        ConversationResponse response = conversationService.getConversationResponse(1L, user1);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getLastMessagePreview()).isEqualTo("Test message");
        assertThat(response.getUnreadCount()).isEqualTo(5L);
        assertThat(response.getAlreadyExists()).isTrue();
    }

    @Test
    void testGetConversationResponse_NoMessages() {
        // Given
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationId(1L)).thenReturn(Collections.emptyList());
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(0L);

        // When
        ConversationResponse response = conversationService.getConversationResponse(1L, user1);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getLastMessagePreview()).isEqualTo("No messages yet");
        assertThat(response.getUnreadCount()).isEqualTo(0L);
    }

    @Test
    void testGetConversationResponse_NotParticipant() {
        // Given
        User user3 = new User();
        user3.setId(3L);

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));

        // When & Then
        // FIXED: Changed from IllegalArgumentException to BusinessException
        assertThatThrownBy(() -> conversationService.getConversationResponse(1L, user3))
                .isInstanceOf(BusinessException.class)
                .hasMessage("error.conversation.not_participant");
    }

    // ==================== Tests for getConversationByPost ====================

    @Test
    void testGetConversationByPost_Success() {
        // Given
        when(conversationRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationId(1L)).thenReturn(Arrays.asList(message));
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(1L);

        // When
        ConversationResponse response = conversationService.getConversationByPost(1L, user1);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getLastMessagePreview()).isEqualTo("Test message");
        assertThat(response.getUnreadCount()).isEqualTo(1L);
        verify(conversationRepository).findByPostIdAndUserId(1L, 1L);
    }

    @Test
    void testGetConversationByPost_NotFound() {
        // Given
        when(conversationRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> conversationService.getConversationByPost(1L, user1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No conversation found for this post");
    }

    @Test
    void testGetConversationByPost_WithMessages() {
        // Given
        Message message2 = new Message();
        message2.setId(2L);
        message2.setMessageBody("Latest message");

        when(conversationRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationId(1L)).thenReturn(Arrays.asList(message, message2));
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(2L);

        // When
        ConversationResponse response = conversationService.getConversationByPost(1L, user1);

        // Then
        assertThat(response.getLastMessagePreview()).isEqualTo("Latest message");
        assertThat(response.getUnreadCount()).isEqualTo(2L);
    }

    // ==================== Tests for createOrGetPostConversation ====================

    @Test
    void testCreateOrGetPostConversation_NewConversation() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(conversationRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(messageRepository.findByConversationId(anyLong())).thenReturn(Collections.emptyList());
        when(messageRepository.countUnreadInConversation(anyLong(), anyLong())).thenReturn(0L);

        // When
        ConversationResponse response = conversationService.createOrGetPostConversation(1L, 2L, user1);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getLastMessagePreview()).isEqualTo("No messages yet");
        assertThat(response.getUnreadCount()).isEqualTo(0L);
        verify(conversationRepository).save(any(Conversation.class));
    }

    @Test
    void testCreateOrGetPostConversation_ExistingConversation() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(conversationRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationId(1L)).thenReturn(Arrays.asList(message));
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(2L);

        // When
        ConversationResponse response = conversationService.createOrGetPostConversation(1L, 2L, user1);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getLastMessagePreview()).isEqualTo("Test message");
        assertThat(response.getUnreadCount()).isEqualTo(2L);
        verify(conversationRepository, never()).save(any(Conversation.class));
    }

    @Test
    void testCreateOrGetPostConversation_PostNotFound() {
        // Given
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> conversationService.createOrGetPostConversation(999L, 2L, user1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Post not found");
    }

    @Test
    void testCreateOrGetPostConversation_OtherUserNotFound() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> conversationService.createOrGetPostConversation(1L, 999L, user1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Other user not found");
    }

    @Test
    void testCreateOrGetPostConversation_SelfConversation() {
        // Given
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));

        // When & Then
        assertThatThrownBy(() -> conversationService.createOrGetPostConversation(1L, 1L, user1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot create conversation with yourself");
    }

    @Test
    void testCreateOrGetPostConversation_WithMultipleMessages() {
        // Given
        Message message2 = new Message();
        message2.setId(2L);
        message2.setMessageBody("Most recent message");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(surplusPost));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(conversationRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationId(1L)).thenReturn(Arrays.asList(message, message2));
        when(messageRepository.countUnreadInConversation(1L, 1L)).thenReturn(1L);

        // When
        ConversationResponse response = conversationService.createOrGetPostConversation(1L, 2L, user1);

        // Then
        assertThat(response.getLastMessagePreview()).isEqualTo("Most recent message");
        assertThat(response.getUnreadCount()).isEqualTo(1L);
    }
}