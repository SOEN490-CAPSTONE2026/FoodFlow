package com.example.foodflow.service;

import com.example.foodflow.model.dto.ConversationResponse;
import com.example.foodflow.model.dto.StartConversationRequest;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.Message;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.ConversationRepository;
import com.example.foodflow.repository.MessageRepository;
import com.example.foodflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConversationService {
    
    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Get all conversations for the current user
     */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getUserConversations(User currentUser) {
        List<Conversation> conversations = conversationRepository.findByUserId(currentUser.getId());
        
        return conversations.stream()
            .map(conv -> {
                // Get last message preview
                List<Message> messages = messageRepository.findByConversationId(conv.getId());
                String lastMessagePreview = messages.isEmpty() ? 
                    "No messages yet" : 
                    messages.get(messages.size() - 1).getMessageBody();
                
                // Get unread count for current user
                long unreadCount = messageRepository.countUnreadInConversation(
                    conv.getId(), 
                    currentUser.getId()
                );
                
                return new ConversationResponse(conv, currentUser, lastMessagePreview, unreadCount);
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Start a new conversation or return existing one
     */
    @Transactional
    public ConversationResponse startConversation(User currentUser, StartConversationRequest request) {
        // Find recipient by email
        User recipient = userRepository.findByEmail(request.getRecipientEmail())
            .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + request.getRecipientEmail()));
        
        // Prevent self-conversation
        if (currentUser.getId().equals(recipient.getId())) {
            throw new IllegalArgumentException("Cannot start conversation with yourself");
        }
        
        // Check if conversation already exists
        Long userId1 = Math.min(currentUser.getId(), recipient.getId());
        Long userId2 = Math.max(currentUser.getId(), recipient.getId());
        
        Conversation conversation = conversationRepository.findByUsers(userId1, userId2)
            .orElseGet(() -> {
                // Create new conversation
                User user1 = currentUser.getId().equals(userId1) ? currentUser : recipient;
                User user2 = currentUser.getId().equals(userId2) ? currentUser : recipient;
                
                Conversation newConv = new Conversation(user1, user2);
                return conversationRepository.save(newConv);
            });
        
        return new ConversationResponse(conversation, currentUser, "No messages yet", 0);
    }
    
    /**
     * Get a specific conversation (validates user is participant)
     */
    @Transactional(readOnly = true)
    public Conversation getConversation(Long conversationId, User currentUser) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        
        // Validate user is a participant
        if (!conversation.isParticipant(currentUser.getId())) {
            throw new IllegalArgumentException("You are not a participant in this conversation");
        }
        
        return conversation;
    }
    
    /**
     * Get conversation response with details
     */
    @Transactional(readOnly = true)
    public ConversationResponse getConversationResponse(Long conversationId, User currentUser) {
        Conversation conversation = getConversation(conversationId, currentUser);
        
        // Get last message
        List<Message> messages = messageRepository.findByConversationId(conversationId);
        String lastMessagePreview = messages.isEmpty() ? 
            "No messages yet" : 
            messages.get(messages.size() - 1).getMessageBody();
        
        // Get unread count
        long unreadCount = messageRepository.countUnreadInConversation(
            conversationId, 
            currentUser.getId()
        );
        
        return new ConversationResponse(conversation, currentUser, lastMessagePreview, unreadCount);
    }
}
