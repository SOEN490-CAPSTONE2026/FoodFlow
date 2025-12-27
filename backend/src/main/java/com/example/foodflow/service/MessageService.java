package com.example.foodflow.service;

import com.example.foodflow.model.dto.MessageHistoryResponse;
import com.example.foodflow.model.dto.MessageRequest;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.Message;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.ConversationRepository;
import com.example.foodflow.repository.MessageRepository;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {
    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private ConversationService conversationService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final BusinessMetricsService businessMetricsService;
    
    public MessageService(BusinessMetricsService businessMetricsService) {
        this.businessMetricsService = businessMetricsService;
    }

    /**
     * Send a message in a conversation
     */
    @Transactional
    @Timed(value = "message.service.send", description = "Time taken to send a message")
    public MessageResponse sendMessage(MessageRequest request, User sender) {
        Timer.Sample sample = businessMetricsService.startTimer();
        // Get and validate conversation
        Conversation conversation = conversationService.getConversation(
            request.getConversationId(), 
            sender
        );
        
        // Create and save message
        Message message = new Message(conversation, sender, request.getMessageBody());
        message = messageRepository.save(message);
        
        // Update conversation's last message timestamp
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        // Convert to response
        MessageResponse response = new MessageResponse(message);
        
        // Send via WebSocket to the other participant
        User otherUser = conversation.getOtherParticipant(sender.getId());
        messagingTemplate.convertAndSendToUser(
            otherUser.getId().toString(),
            "/queue/messages",
            response
        );
        logger.info("Sent websocket message to userId={} conversationId={} messageId={}", otherUser.getId(), conversation.getId(), response.getId());
        
        businessMetricsService.incrementMessagesSent();
        businessMetricsService.recordTimer(sample, "message.service.send", "conversationId", conversation.getId().toString());

        return response;
    }
    
    /**
     * Get all messages in a conversation
     */
    @Transactional(readOnly = true)
    @Timed(value = "message.service.getConversationMessages", description = "Time taken to get a conversation messages")
    public List<MessageResponse> getConversationMessages(Long conversationId, User currentUser) {
        // Validate user is participant
        conversationService.getConversation(conversationId, currentUser);
        
        List<Message> messages = messageRepository.findByConversationId(conversationId);

        businessMetricsService.incrementMessagesReceived();

        return messages.stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }
    
    /**
     * Mark a message as read
     */
    @Transactional
    public void markAsRead(Long messageId, User currentUser) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        
        // Only the recipient (not the sender) can mark as read
        if (message.getSender().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Cannot mark your own message as read");
        }
        
        // Verify user is participant in the conversation
        Conversation conversation = message.getConversation();
        if (!conversation.isParticipant(currentUser.getId())) {
            throw new IllegalArgumentException("Unauthorized to mark this message as read");
        }
        
        message.setReadStatus(true);
        messageRepository.save(message);
    }
    
    /**
     * Mark all messages in a conversation as read for the current user
     */
    @Transactional
    public void markConversationAsRead(Long conversationId, User currentUser) {
        // Validate user is participant
        conversationService.getConversation(conversationId, currentUser);
        
        List<Message> unreadMessages = messageRepository.findUnreadByConversationAndUser(
            conversationId, 
            currentUser.getId()
        );
        
        unreadMessages.forEach(message -> message.setReadStatus(true));
        messageRepository.saveAll(unreadMessages);
    }
    
    /**
     * Get unread message count for user
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return messageRepository.countUnreadByUser(user.getId());
    }
    
    /**
     * Get paginated message history for a specific post
     */
    @Transactional(readOnly = true)
    public MessageHistoryResponse getMessageHistoryByPostId(Long postId, User currentUser, int page, int size) {
        // Find conversation for this post where user is a participant
        Conversation conversation = conversationRepository.findByPostIdAndUserId(postId, currentUser.getId())
            .orElseThrow(() -> new IllegalArgumentException("No conversation found for this post"));
        
        // Get paginated messages
        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messagePage = messageRepository.findByConversationIdWithPagination(
            conversation.getId(), 
            pageable
        );
        
        // Convert to response DTOs
        List<MessageResponse> messageResponses = messagePage.getContent()
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
        
        // Build response with pagination metadata
        return new MessageHistoryResponse(
            messageResponses,
            messagePage.getNumber(),
            messagePage.getTotalPages(),
            messagePage.getTotalElements(),
            messagePage.hasNext()
        );
    }
}
