package com.example.foodflow.service;

import com.example.foodflow.model.dto.MessageRequest;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.entity.Message;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.MessageRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SurplusPostRepository surplusPostRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    public MessageService(MessageRepository messageRepository,
                         UserRepository userRepository,
                         SurplusPostRepository surplusPostRepository,
                         SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.messagingTemplate = messagingTemplate;
    }
    
    @Transactional
    public MessageResponse sendMessage(MessageRequest request, User sender) {
        // Validate surplus post exists
        SurplusPost surplusPost = surplusPostRepository.findById(request.getSurplusPostId())
            .orElseThrow(() -> new RuntimeException("Surplus post not found"));
        
        // Validate receiver exists
        User receiver = userRepository.findById(request.getReceiverId())
            .orElseThrow(() -> new RuntimeException("Receiver not found"));
        
        // Create and save message
        Message message = new Message(surplusPost, sender, receiver, request.getMessageBody());
        message = messageRepository.save(message);
        
        // Convert to response
        MessageResponse response = new MessageResponse(message);
        
        // Send via WebSocket to receiver
        messagingTemplate.convertAndSendToUser(
            receiver.getId().toString(),
            "/queue/messages",
            response
        );
        
        return response;
    }
    
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesForPost(Long postId) {
        return messageRepository.findBySurplusPostIdOrderByCreatedAtAsc(postId)
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesBetweenUsers(Long postId, Long userId1, Long userId2) {
        return messageRepository.findMessagesBetweenUsers(postId, userId1, userId2)
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public void markAsRead(Long messageId, User currentUser) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        
        // Only receiver can mark as read
        if (!message.getReceiver().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized to mark this message as read");
        }
        
        message.setReadStatus(true);
        messageRepository.save(message);
    }
    
    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return messageRepository.countByReceiverIdAndReadStatusFalse(user.getId());
    }
}
