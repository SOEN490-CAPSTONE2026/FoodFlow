package com.example.foodflow.service;

import com.example.foodflow.exception.BusinessException;
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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConversationService {
    private static final Logger logger = LoggerFactory.getLogger(ConversationService.class);

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SurplusPostRepository surplusPostRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SmsService smsService;

    @Autowired
    private NotificationPreferenceService notificationPreferenceService;

    
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
            throw new BusinessException("error.conversation.self_conversation");
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
            throw new BusinessException("error.conversation.not_participant");
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

        // Enforce donation-thread model: one conversation per (postId, receiverId).
        User donor = post.getDonor();
        User receiver;
        if (currentUser.getId().equals(donor.getId())) {
            receiver = otherUser;
        } else if (otherUser.getId().equals(donor.getId())) {
            receiver = currentUser;
        } else {
            throw new IllegalArgumentException("Conversation participants must include the donation donor");
        }

        Conversation conversation = conversationRepository.findByPostIdAndReceiverId(postId, receiver.getId())
            .orElseGet(() -> {
                Conversation newConv = Conversation.createDonationThread(donor, receiver, post);
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

    /**
     * Express interest in a donation - creates a donation-anchored thread.
     * Uses (donation_id, receiver_id) as the unique key.
     * If a thread already exists for this donation+receiver, returns it.
     * If new, creates the thread with a system message and notifies the donor.
     */
    @Transactional
    public ConversationResponse expressInterestInDonation(Long postId, User receiver) {
        // Validate post exists
        SurplusPost post = surplusPostRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Donation not found"));

        User donor = post.getDonor();

        // Prevent donor from expressing interest in their own donation
        if (receiver.getId().equals(donor.getId())) {
            throw new IllegalArgumentException("Cannot express interest in your own donation");
        }

        // Check if thread already exists for this donation + receiver
        Optional<Conversation> existingThread = conversationRepository.findByPostIdAndReceiverId(postId, receiver.getId());

        boolean alreadyExists = existingThread.isPresent();
        Conversation conversation;
        String lastMessagePreview = "No messages yet";
        long unreadCount = 0L;

        if (alreadyExists) {
            conversation = existingThread.get();

            // Get last message preview
            List<Message> messages = messageRepository.findByConversationId(conversation.getId());
            if (!messages.isEmpty()) {
                lastMessagePreview = messages.get(messages.size() - 1).getMessageBody();
            }
            unreadCount = messageRepository.countUnreadInConversation(conversation.getId(), receiver.getId());
        } else {
            // Create new donation-anchored thread
            conversation = Conversation.createDonationThread(donor, receiver, post);
            conversation = conversationRepository.save(conversation);

            // Get receiver name for the system message
            String receiverName = receiver.getOrganization() != null ?
                receiver.getOrganization().getName() : receiver.getEmail();

            // Create system message to kick off the conversation
            String systemMessageBody = receiverName + " is interested in your donation: " + post.getTitle();
            Message systemMessage = new Message(conversation, receiver, systemMessageBody);
            systemMessage.setMessageType("SYSTEM");
            messageRepository.save(systemMessage);

            // Update conversation timestamps and preview
            conversation.setLastMessageAt(LocalDateTime.now());
            conversation.setLastMessagePreview(systemMessageBody);
            conversationRepository.save(conversation);

            lastMessagePreview = systemMessageBody;

            // Notify donor via WebSocket
            try {
                com.example.foodflow.model.dto.ConversationResponse notificationPayload =
                    new com.example.foodflow.model.dto.ConversationResponse(conversation, donor, lastMessagePreview, 1L, false);
                messagingTemplate.convertAndSendToUser(
                    donor.getId().toString(),
                    "/queue/messages",
                    notificationPayload
                );
                logger.info("Sent interest notification to donor userId={} for postId={}", donor.getId(), postId);
            } catch (Exception e) {
                logger.error("Failed to send WebSocket interest notification to donor: {}", e.getMessage());
            }

            // Send email notification to donor
            try {
                boolean emailEnabled = notificationPreferenceService.shouldSendNotification(donor, "newMessageFromReceiver", "email");
                
                if (emailEnabled && donor.getEmail() != null) {
                    String donorName = donor.getOrganization() != null ? 
                        donor.getOrganization().getName() : donor.getEmail();
                    
                    emailService.sendNewMessageNotification(
                        donor.getEmail(),
                        donorName,
                        receiverName,
                        systemMessageBody
                    );
                    logger.info("Sent interest email notification to donor userId={}", donor.getId());
                }
            } catch (Exception e) {
                logger.error("Failed to send email interest notification to donor userId={}: {}", donor.getId(), e.getMessage());
                // Don't fail the whole operation if email fails
            }

            // Send SMS notification to donor if enabled
            try {
                boolean smsEnabled = notificationPreferenceService.shouldSendNotification(donor, "newMessageFromReceiver", "sms");
                
                if (smsEnabled && donor.getPhone() != null && !donor.getPhone().isEmpty()) {
                    smsService.sendNewMessageNotification(donor.getPhone(), receiverName, systemMessageBody);
                    logger.info("Sent interest SMS notification to donor userId={}", donor.getId());
                }
            } catch (Exception e) {
                logger.error("Failed to send SMS interest notification to donor userId={}: {}", donor.getId(), e.getMessage());
                // Don't fail the whole operation if SMS fails
            }
        }

        return new ConversationResponse(conversation, receiver, lastMessagePreview, unreadCount, alreadyExists);
    }
}
