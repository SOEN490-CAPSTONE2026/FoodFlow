package com.example.foodflow.service;

import com.example.foodflow.model.dto.MessageRequest;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.Message;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.ConversationRepository;
import com.example.foodflow.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private ConversationService conversationService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * Send a message in a conversation
     */
    @Transactional
    public MessageResponse sendMessage(MessageRequest request, User sender) {
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
        
        return response;
    }
    
    /**
     * Get all messages in a conversation
     */
    @Transactional(readOnly = true)
    public List<MessageResponse> getConversationMessages(Long conversationId, User currentUser) {
        // Validate user is participant
        conversationService.getConversation(conversationId, currentUser);
        
        return messageRepository.findByConversationId(conversationId)
            .stream()
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
}
