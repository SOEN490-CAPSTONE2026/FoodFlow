package com.example.foodflow.service;

import com.example.foodflow.model.dto.MessageRequest;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.Message;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.ConversationRepository;
import com.example.foodflow.repository.MessageRepository;
import io.micrometer.core.instrument.Timer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class MessageServiceTest {

    @Autowired
    private MessageService messageService;

    @MockBean
    private MessageRepository messageRepository;

    @MockBean
    private ConversationRepository conversationRepository;

    @MockBean
    private ConversationService conversationService;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @MockBean
    private BusinessMetricsService businessMetricsService;

    @MockBean
    private NotificationPreferenceService notificationPreferenceService;

    @MockBean
    private GamificationService gamificationService;

    private User sender;
    private User recipient;
    private Conversation conversation;

    @BeforeEach
    void setUp() {

        // Setup test users
        sender = new User();
        sender.setId(1L);
        sender.setEmail("sender@test.com");
        sender.setRole(UserRole.DONOR);

        recipient = new User();
        recipient.setId(2L);
        recipient.setEmail("recipient@test.com");
        recipient.setRole(UserRole.RECEIVER);

        // Setup test conversation
        conversation = new Conversation(sender, recipient);
        conversation.setId(1L);

        // Mock timer
        Timer.Sample mockSample = mock(Timer.Sample.class);
        when(businessMetricsService.startTimer()).thenReturn(mockSample);
    }

    @Test
    void testSendMessage_Success() {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Hello, this is a test message");

        Message savedMessage = new Message(conversation, sender, "Hello, this is a test message");
        savedMessage.setId(1L);

        when(conversationService.getConversation(1L, sender)).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), any(), eq("websocket")))
                .thenReturn(true);
        when(gamificationService.checkAndUnlockAchievements(sender.getId())).thenReturn(Collections.emptyList());

        // When
        MessageResponse response = messageService.sendMessage(request, sender);

        // Then
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Hello, this is a test message", response.getMessageBody());
        verify(conversationService).getConversation(1L, sender);
        verify(messageRepository).save(any(Message.class));
        verify(conversationRepository).save(any(Conversation.class));
        verify(messagingTemplate).convertAndSendToUser(eq("2"), eq("/queue/messages"), any(MessageResponse.class));
        verify(businessMetricsService).incrementMessagesSent();
    }

    @Test
    void testGetConversationMessages_Success() {
        // Given
        Message msg1 = new Message(conversation, sender, "Message 1");
        msg1.setId(1L);

        Message msg2 = new Message(conversation, recipient, "Message 2");
        msg2.setId(2L);

        List<Message> messages = Arrays.asList(msg1, msg2);

        when(conversationService.getConversation(1L, sender)).thenReturn(conversation);
        when(messageRepository.findByConversationId(1L)).thenReturn(messages);

        // When
        List<MessageResponse> responses = messageService.getConversationMessages(1L, sender);

        // Then
        assertEquals(2, responses.size());
        assertEquals(1L, responses.get(0).getId());
        assertEquals("Message 1", responses.get(0).getMessageBody());
        assertEquals(2L, responses.get(1).getId());
        assertEquals("Message 2", responses.get(1).getMessageBody());
        verify(conversationService).getConversation(1L, sender);
        verify(messageRepository).findByConversationId(1L);
        verify(businessMetricsService).incrementMessagesReceived();
    }

    @Test
    void testGetConversationMessages_EmptyList() {
        // Given
        when(conversationService.getConversation(1L, sender)).thenReturn(conversation);
        when(messageRepository.findByConversationId(1L)).thenReturn(Collections.emptyList());

        // When
        List<MessageResponse> responses = messageService.getConversationMessages(1L, sender);

        // Then
        assertTrue(responses.isEmpty());
        verify(businessMetricsService).incrementMessagesReceived();
    }

    @Test
    void testMarkAsRead_Success() {
        // Given
        Message message = new Message(conversation, sender, "Test message");
        message.setId(1L);
        message.setReadStatus(false);

        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        // When
        messageService.markAsRead(1L, recipient);

        // Then
        verify(messageRepository).findById(1L);
        verify(messageRepository).save(argThat(m -> m.getReadStatus()));
    }

    @Test
    void testMarkAsRead_MessageNotFound() {
        // Given
        when(messageRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> messageService.markAsRead(999L, recipient))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.resource.not_found");
    }

    @Test
    void testMarkAsRead_CannotMarkOwnMessage() {
        // Given
        Message message = new Message(conversation, sender, "Test message");
        message.setId(1L);

        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));

        // When & Then
        assertThatThrownBy(() -> messageService.markAsRead(1L, sender))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.message.mark_own_read");
    }

    @Test
    void testMarkAsRead_UnauthorizedUser() {
        // Given
        User unauthorizedUser = new User();
        unauthorizedUser.setId(3L);
        unauthorizedUser.setEmail("unauthorized@test.com");

        Message message = new Message(conversation, sender, "Test message");
        message.setId(1L);

        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));

        // When & Then
        assertThatThrownBy(() -> messageService.markAsRead(1L, unauthorizedUser))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("error.message.unauthorized_read");
    }

    @Test
    void testMarkConversationAsRead_Success() {
        // Given
        Message msg1 = new Message(conversation, sender, "Message 1");
        msg1.setReadStatus(false);
        Message msg2 = new Message(conversation, sender, "Message 2");
        msg2.setReadStatus(false);

        List<Message> unreadMessages = Arrays.asList(msg1, msg2);

        when(conversationService.getConversation(1L, recipient)).thenReturn(conversation);
        when(messageRepository.findUnreadByConversationAndUser(1L, 2L)).thenReturn(unreadMessages);
        when(messageRepository.saveAll(anyList())).thenReturn(unreadMessages);

        // When
        messageService.markConversationAsRead(1L, recipient);

        // Then
        verify(conversationService).getConversation(1L, recipient);
        verify(messageRepository).findUnreadByConversationAndUser(1L, 2L);
        verify(messageRepository).saveAll(anyList());
        assertTrue(msg1.getReadStatus());
        assertTrue(msg2.getReadStatus());
    }

    @Test
    void testMarkConversationAsRead_NoUnreadMessages() {
        // Given
        when(conversationService.getConversation(1L, recipient)).thenReturn(conversation);
        when(messageRepository.findUnreadByConversationAndUser(1L, 2L)).thenReturn(Collections.emptyList());

        // When
        messageService.markConversationAsRead(1L, recipient);

        // Then
        verify(messageRepository).saveAll(Collections.emptyList());
    }

    @Test
    void testGetUnreadCount_Success() {
        // Given
        when(messageRepository.countUnreadByUser(1L)).thenReturn(5L);

        // When
        long count = messageService.getUnreadCount(sender);

        // Then
        assertEquals(5L, count);
        verify(messageRepository).countUnreadByUser(1L);
    }

    @Test
    void testGetUnreadCount_NoUnreadMessages() {
        // Given
        when(messageRepository.countUnreadByUser(1L)).thenReturn(0L);

        // When
        long count = messageService.getUnreadCount(sender);

        // Then
        assertEquals(0L, count);
    }

    @Test
    void testSendMessage_InvalidConversation() {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(999L);
        request.setMessageBody("Test");

        when(conversationService.getConversation(999L, sender))
                .thenThrow(new IllegalArgumentException("Conversation not found"));

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            messageService.sendMessage(request, sender);
        });
    }

    @Test
    void testGetConversationMessages_NotParticipant() {
        // Given
        when(conversationService.getConversation(1L, sender))
                .thenThrow(new IllegalArgumentException("Not a participant"));

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            messageService.getConversationMessages(1L, sender);
        });
    }

    @Test
    void testMarkConversationAsRead_NotParticipant() {
        // Given
        when(conversationService.getConversation(1L, recipient))
                .thenThrow(new IllegalArgumentException("Not a participant"));

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            messageService.markConversationAsRead(1L, recipient);
        });
    }

    // Notification Tests

    @Test
    void testSendMessage_WithEmailNotificationsEnabled_SendsEmailToRecipient() {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Test message");

        Message savedMessage = new Message(conversation, sender, "Test message");
        savedMessage.setId(1L);

        when(conversationService.getConversation(1L, sender)).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(notificationPreferenceService.shouldSendNotification(eq(recipient), eq("newMessageFromDonor"), eq("websocket")))
                .thenReturn(true);
        when(notificationPreferenceService.shouldSendNotification(eq(recipient), eq("newMessageFromDonor"), eq("email")))
                .thenReturn(true);

        // When
        messageService.sendMessage(request, sender);

        // Then
        verify(notificationPreferenceService).shouldSendNotification(recipient, "newMessageFromDonor", "email");
        verify(notificationPreferenceService).shouldSendNotification(recipient, "newMessageFromDonor", "websocket");
    }

    @Test
    void testSendMessage_WithEmailNotificationsDisabled_DoesNotSendEmail() {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Test message");

        Message savedMessage = new Message(conversation, sender, "Test message");
        savedMessage.setId(1L);

        when(conversationService.getConversation(1L, sender)).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(notificationPreferenceService.shouldSendNotification(eq(recipient), eq("newMessageFromDonor"), eq("email")))
                .thenReturn(false);
        when(notificationPreferenceService.shouldSendNotification(eq(recipient), eq("newMessageFromDonor"), eq("websocket")))
                .thenReturn(true);

        // When
        messageService.sendMessage(request, sender);

        // Then
        verify(notificationPreferenceService).shouldSendNotification(recipient, "newMessageFromDonor", "email");
        verify(messagingTemplate).convertAndSendToUser(eq("2"), eq("/queue/messages"), any());
    }

    @Test
    void testSendMessage_WithWebSocketNotificationsDisabled_DoesNotSendWebSocket() {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Test message");

        Message savedMessage = new Message(conversation, sender, "Test message");
        savedMessage.setId(1L);

        when(conversationService.getConversation(1L, sender)).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(notificationPreferenceService.shouldSendNotification(eq(recipient), eq("newMessageFromDonor"), eq("websocket")))
                .thenReturn(false);
        when(notificationPreferenceService.shouldSendNotification(eq(recipient), eq("newMessageFromDonor"), eq("email")))
                .thenReturn(true);

        // When
        messageService.sendMessage(request, sender);

        // Then
        verify(notificationPreferenceService).shouldSendNotification(recipient, "newMessageFromDonor", "websocket");
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), eq("/queue/messages"), any());
    }

    @Test
    void testSendMessage_WithAllNotificationsDisabled_DoesNotSendAny() {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Test message");

        Message savedMessage = new Message(conversation, sender, "Test message");
        savedMessage.setId(1L);

        when(conversationService.getConversation(1L, sender)).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(notificationPreferenceService.shouldSendNotification(eq(recipient), anyString(), anyString()))
                .thenReturn(false);

        // When
        messageService.sendMessage(request, sender);

        // Then
        verify(notificationPreferenceService, times(2)).shouldSendNotification(eq(recipient), anyString(), anyString());
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), eq("/queue/messages"), any());
    }

    @Test
    void testSendMessage_FromReceiver_UsesCorrectNotificationType() {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Test message from receiver");

        Message savedMessage = new Message(conversation, recipient, "Test message from receiver");
        savedMessage.setId(1L);

        when(conversationService.getConversation(1L, recipient)).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), anyString(), anyString()))
                .thenReturn(true);

        // When
        messageService.sendMessage(request, recipient);

        // Then - should use "newMessageFromReceiver" notification type for donor
        verify(notificationPreferenceService).shouldSendNotification(sender, "newMessageFromReceiver", "websocket");
        verify(notificationPreferenceService).shouldSendNotification(sender, "newMessageFromReceiver", "email");
    }

    @Test
    void testSendMessage_ChecksBothEmailAndWebSocketPreferences() {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Test message");

        Message savedMessage = new Message(conversation, sender, "Test message");
        savedMessage.setId(1L);

        when(conversationService.getConversation(1L, sender)).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(notificationPreferenceService.shouldSendNotification(any(User.class), anyString(), anyString()))
                .thenReturn(true);

        // When
        messageService.sendMessage(request, sender);

        // Then - verify both channels are checked
        verify(notificationPreferenceService).shouldSendNotification(recipient, "newMessageFromDonor", "websocket");
        verify(notificationPreferenceService).shouldSendNotification(recipient, "newMessageFromDonor", "email");
        verify(notificationPreferenceService, times(2)).shouldSendNotification(any(User.class), anyString(), anyString());
    }

    @Test
    void testSendMessage_WithMixedPreferences_SendsOnlyEnabledChannels() {
        // Given
        MessageRequest request = new MessageRequest();
        request.setConversationId(1L);
        request.setMessageBody("Test message");

        Message savedMessage = new Message(conversation, sender, "Test message");
        savedMessage.setId(1L);

        when(conversationService.getConversation(1L, sender)).thenReturn(conversation);
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
        when(notificationPreferenceService.shouldSendNotification(eq(recipient), eq("newMessageFromDonor"), eq("websocket")))
                .thenReturn(true);
        when(notificationPreferenceService.shouldSendNotification(eq(recipient), eq("newMessageFromDonor"), eq("email")))
                .thenReturn(false);

        // When
        messageService.sendMessage(request, sender);

        // Then - only websocket should be sent
        verify(messagingTemplate).convertAndSendToUser(eq("2"), eq("/queue/messages"), any());
        verify(notificationPreferenceService, times(2)).shouldSendNotification(eq(recipient), eq("newMessageFromDonor"), anyString());
    }
}

