package com.example.foodflow.service;
import com.example.foodflow.exception.BusinessException;
import com.example.foodflow.model.dto.MessageHistoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page as JpaPage;
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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
@Service
public class MessageService {
    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationPreferenceService notificationPreferenceService;
    private final EmailNotificationService emailService;
    private final GamificationService gamificationService;
    private final BusinessMetricsService businessMetricsService;
    public MessageService(MessageRepository messageRepository,
                         ConversationRepository conversationRepository,
                         ConversationService conversationService,
                         SimpMessagingTemplate messagingTemplate,
                         NotificationPreferenceService notificationPreferenceService,
                         EmailNotificationService emailService,
                         GamificationService gamificationService,
                         BusinessMetricsService businessMetricsService) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.conversationService = conversationService;
        this.messagingTemplate = messagingTemplate;
        this.notificationPreferenceService = notificationPreferenceService;
        this.emailService = emailService;
        this.gamificationService = gamificationService;
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
        // Update conversation's last message timestamp and preview
        conversation.setLastMessageAt(LocalDateTime.now());
        String preview = request.getMessageBody();
        if (preview != null && preview.length() > 100) {
            preview = preview.substring(0, 100) + "...";
        }
        conversation.setLastMessagePreview(preview);
        conversationRepository.save(conversation);
        // Convert to response
        MessageResponse response = new MessageResponse(message);
        // Send via WebSocket to the other participant
        User otherUser = conversation.getOtherParticipant(sender.getId());
        // Determine notification type based on sender's role
        String notificationType = sender.getRole().toString().equals("DONOR") ? 
            "newMessageFromDonor" : "newMessageFromReceiver";
        // Send websocket notification
        if (notificationPreferenceService.shouldSendNotification(otherUser, notificationType, "websocket")) {
            try {
                messagingTemplate.convertAndSendToUser(
                    otherUser.getId().toString(),
                    "/queue/messages",
                    response
                );
                logger.info("Sent websocket message to userId={} conversationId={} messageId={} (type: {})", 
                    otherUser.getId(), conversation.getId(), response.getId(), notificationType);
            } catch (Exception e) {
                logger.error("Failed to send message notification: {}", e.getMessage());
            }
        } else {
            logger.info("Skipped websocket message notification to userId={} - notification type '{}' disabled", 
                otherUser.getId(), notificationType);
        }
        // Send email notification if enabled
        if (notificationPreferenceService.shouldSendNotification(otherUser, notificationType, "email")) {
            try {
                String recipientName = (otherUser.getOrganization() != null && otherUser.getOrganization().getName() != null) ? 
                    otherUser.getOrganization().getName() : otherUser.getEmail();
                String senderName = (sender.getOrganization() != null && sender.getOrganization().getName() != null) ? 
                    sender.getOrganization().getName() : sender.getEmail();
                String messagePreview = request.getMessageBody();
                emailService.sendNewMessageNotification(
                    otherUser.getEmail(), 
                    recipientName, 
                    senderName, 
                    messagePreview
                );
                logger.info("Sent email message notification to userId={} (type: {})", 
                    otherUser.getId(), notificationType);
            } catch (Exception e) {
                logger.error("Failed to send email message notification to userId={}: {}", 
                    otherUser.getId(), e.getMessage());
                // Don't fail the whole operation if email fails
            }
        } else {
            logger.info("Skipped email message notification to userId={} - notification type '{}' disabled", 
                otherUser.getId(), notificationType);
        }
        businessMetricsService.incrementMessagesSent();
        businessMetricsService.recordTimer(sample, "message.service.send", "conversationId", conversation.getId().toString());
        // Trigger achievement checks for message-based achievements
        try {
            gamificationService.checkAndUnlockAchievements(sender.getId());
        } catch (Exception e) {
            logger.error("Failed to check message achievements for userId={}: {}", sender.getId(), e.getMessage());
        }
        return response;
    }
    /**
     * Get paginated messages in a conversation
     * @param conversationId the conversation ID
     * @param currentUser the authenticated user
     * @param page the page number (0-based, default 0)
     * @param pageSize the number of messages per page (default 20, max 100)
     * @return paginated message responses
     */
    @Transactional(readOnly = true)
    @Timed(value = "message.service.getConversationMessages", description = "Time taken to get conversation messages")
    public Page<MessageResponse> getConversationMessages(Long conversationId, User currentUser, int page, int pageSize) {
        // Validate page parameters
        if (page < 0) page = 0;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100; // cap at 100 to prevent abuse
        // Validate user is participant
        conversationService.getConversation(conversationId, currentUser);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Message> messages = messageRepository.findByConversationIdWithPagination(conversationId, pageable);
        businessMetricsService.incrementMessagesReceived();
        return messages.map(MessageResponse::new);
    }
    /**
     * Get all messages in a conversation (legacy, use getConversationMessages with pagination)
     */
    @Transactional(readOnly = true)
    @Timed(value = "message.service.getConversationMessages", description = "Time taken to get conversation messages")
    public List<MessageResponse> getConversationMessages(Long conversationId, User currentUser) {
        // Validate user is participant
        conversationService.getConversation(conversationId, currentUser);
        List<Message> messages = messageRepository.findByConversationId(conversationId);
        businessMetricsService.incrementMessagesReceived();
        logger.warn("Deprecated: getConversationMessages called without pagination. " +
                    "This loads ALL messages which impacts performance. " +
                    "Use getConversationMessages(Long, User, int, int) instead.");
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
            .orElseThrow(() -> new BusinessException("error.resource.not_found"));
        // Only the recipient (not the sender) can mark as read
        if (message.getSender().getId().equals(currentUser.getId())) {
            throw new BusinessException("error.message.mark_own_read");
        }
        // Verify user is participant in the conversation
        Conversation conversation = message.getConversation();
        if (!conversation.isParticipant(currentUser.getId())) {
            throw new BusinessException("error.message.unauthorized_read");
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
            .orElseThrow(() -> new com.example.foodflow.exception.domain.ConversationNotFoundException("No conversation found for this post"));
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
