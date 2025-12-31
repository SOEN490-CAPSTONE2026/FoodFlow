package com.example.foodflow.service;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.repository.SurplusPostRepository;
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
import java.util.Optional;

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

    @Autowired
    private SurplusPostRepository surplusPostRepository;

    
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
                
                return new ConversationResponse(conv, currentUser, lastMessagePreview, unreadCount, true);
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

        Optional<Conversation> conversationOptional = conversationRepository.findByUsers(userId1, userId2);
        boolean conversationAlreadyExists = conversationOptional.isPresent();
        
        Conversation conversation;
        String lastMessagePreview = "No messages yet";
        Long unreadCount = 0L;

        if (conversationAlreadyExists){
            conversation = conversationOptional.get();

            //This can be done more efficiently by creating a service that returns the most recent message
            List<Message> messages = messageRepository.findByConversationId(conversation.getId());
            if (!messages.isEmpty()) { 
                lastMessagePreview = messages.get(messages.size() - 1).getMessageBody();
            }

            unreadCount = messageRepository.countUnreadInConversation(
            conversation.getId(), 
            currentUser.getId() );
        }
        else {
            // Create new conversation
            User user1 = currentUser.getId().equals(userId1) ? currentUser : recipient;
            User user2 = currentUser.getId().equals(userId2) ? currentUser : recipient;
                
            conversation = new Conversation(user1, user2);
            conversationRepository.save(conversation);
        }
        
        return new ConversationResponse(conversation, currentUser, lastMessagePreview, unreadCount, conversationAlreadyExists);
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
        
        return new ConversationResponse(conversation, currentUser, lastMessagePreview, unreadCount, true);
    }

    /**
     * Get conversation for a specific post
     * Returns conversation details including the other participant
     */
    @Transactional(readOnly = true)
    public ConversationResponse getConversationByPost(Long postId, User currentUser) {
        Conversation conversation = conversationRepository.findByPostIdAndUserId(postId, currentUser.getId())
            .orElseThrow(() -> new IllegalArgumentException("No conversation found for this post"));
        
        // Get last message
        List<Message> messages = messageRepository.findByConversationId(conversation.getId());
        String lastMessagePreview = messages.isEmpty() ? 
            "No messages yet" : 
            messages.get(messages.size() - 1).getMessageBody();
        
        // Get unread count
        long unreadCount = messageRepository.countUnreadInConversation(
            conversation.getId(), 
            currentUser.getId()
        );
        
        return new ConversationResponse(conversation, currentUser, lastMessagePreview, unreadCount, true);
    }

     /**
     * Create or get conversation for a specific post
     * Creates a new conversation linked to the post if one doesn't exist
     */
    @Transactional
    public ConversationResponse createOrGetPostConversation(Long postId, Long otherUserId, User currentUser) {
        // Validate post exists
        SurplusPost post = surplusPostRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        
        // Get other user
        User otherUser = userRepository.findById(otherUserId)
            .orElseThrow(() -> new IllegalArgumentException("Other user not found"));
        
        // Prevent self-conversation
        if (currentUser.getId().equals(otherUserId)) {
            throw new IllegalArgumentException("Cannot create conversation with yourself");
        }
        
        // Check if conversation already exists for this post
        Conversation conversation = conversationRepository.findByPostIdAndUserId(postId, currentUser.getId())
            .orElseGet(() -> {
                // Create new conversation linked to post
                Conversation newConv = new Conversation(currentUser, otherUser, post);
                return conversationRepository.save(newConv);
            });
        
        // Get last message (if any)
        List<Message> messages = messageRepository.findByConversationId(conversation.getId());
        String lastMessagePreview = messages.isEmpty() ? 
            "No messages yet" : 
            messages.get(messages.size() - 1).getMessageBody();
        
        // Get unread count
        long unreadCount = messageRepository.countUnreadInConversation(
            conversation.getId(), 
            currentUser.getId()
        );
        
        return new ConversationResponse(conversation, currentUser, lastMessagePreview, unreadCount, true);
    }
}
