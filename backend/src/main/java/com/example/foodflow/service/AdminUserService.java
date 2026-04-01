package com.example.foodflow.service;

import com.example.foodflow.model.dto.AdminUserResponse;
import com.example.foodflow.model.dto.UserActivityDTO;
import com.example.foodflow.audit.AuditLogger;
import com.example.foodflow.model.dto.AdminUserResponse;
import com.example.foodflow.model.dto.UserActivityDTO;
import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.entity.AuditLog;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.Message;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.AuditLogRepository;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.ConversationRepository;
import com.example.foodflow.repository.MessageRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);
    private static final String DELETED_NOTE_PREFIX = "[DELETED]";

    private final UserRepository userRepository;
    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final NotificationPreferenceService notificationPreferenceService;
    private final EmailService emailService;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AuditLogger auditLogger;
    private final AuditLogRepository auditLogRepository;
    private final MessageSource messageSource;

    public AdminUserService(UserRepository userRepository,
            SurplusPostRepository surplusPostRepository,
            ClaimRepository claimRepository,
            org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate,
            NotificationPreferenceService notificationPreferenceService,
            EmailService emailService,
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            AuditLogger auditLogger,
            AuditLogRepository auditLogRepository,
            MessageSource messageSource) {
        this.userRepository = userRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationPreferenceService = notificationPreferenceService;
        this.emailService = emailService;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.auditLogger = auditLogger;
        this.auditLogRepository = auditLogRepository;
        this.messageSource = messageSource;
    }

    /**
     * Get all users with pagination and filtering
     */
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getAllUsers(String role, String accountStatus, String search, int page, int size) {
        log.info("Fetching users - role: {}, accountStatus: {}, search: {}, page: {}, size: {}",
                role, accountStatus, search, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users;

        // Build query based on filters
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findByEmailContainingIgnoreCase(search, pageable);
        } else if (role != null && accountStatus != null) {
            UserRole userRole = UserRole.valueOf(role.toUpperCase());
            AccountStatus status = AccountStatus.valueOf(accountStatus.toUpperCase());
            users = userRepository.findByRoleAndAccountStatus(userRole, status, pageable);
        } else if (role != null) {
            UserRole userRole = UserRole.valueOf(role.toUpperCase());
            users = userRepository.findByRole(userRole, pageable);
        } else if (accountStatus != null) {
            AccountStatus status = AccountStatus.valueOf(accountStatus.toUpperCase());
            users = userRepository.findByAccountStatus(status, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(this::convertToAdminUserResponse);
    }

    /**
     * Get a single user by ID
     */
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long userId) {
        log.info("Fetching user details for userId: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return convertToAdminUserResponse(user);
    }

    /**
     * Deactivate a user account
     */
    @Transactional
    public AdminUserResponse deactivateUser(Long userId, String adminNotes, Long adminId) {
        return deactivateUser(userId, adminNotes, adminId, false);
    }

    /**
     * Deactivate or mark-delete a user account
     */
    @Transactional
    public AdminUserResponse deactivateUser(Long userId, String adminNotes, Long adminId, boolean deleteRequested) {
        log.info("Deactivating user {} by admin {}", userId, adminId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (user.getRole() == UserRole.ADMIN) {
            log.warn("Attempt to deactivate admin user {} blocked", userId);
            throw new RuntimeException("Cannot deactivate admin users");
        }

        if (user.getAccountStatus() == AccountStatus.DEACTIVATED) {
            log.warn("User {} is already deactivated", userId);
            throw new RuntimeException("User is already deactivated");
        }

        String storedAdminNotes = deleteRequested
                ? buildDeletedAdminNotes(adminNotes)
                : adminNotes;

        user.setAccountStatus(AccountStatus.DEACTIVATED);
        user.setAdminNotes(storedAdminNotes);
        user.setDeactivatedAt(LocalDateTime.now());
        user.setDeactivatedBy(adminId);

        User savedUser = userRepository.save(user);
        log.info("User {} successfully deactivated", userId);

        // Write structured audit log entry
        String adminEmail = userRepository.findById(adminId)
                .map(User::getEmail).orElse("unknown-admin");
        auditLogger.logAction(new AuditLog(
                adminEmail,
                deleteRequested ? "DELETE_USER" : "DEACTIVATE_USER",
                "User",
                userId.toString(),
                null,
                user.getEmail(),
                adminNotes));

        // Send in-app message with deactivation reason
        userRepository.findById(adminId).ifPresent(adminUser ->
            sendDeactivationMessage(savedUser, adminUser, adminNotes, deleteRequested)
        );

        // Send notifications to user
        sendAccountStatusNotification(savedUser, deleteRequested ? "deleted" : "deactivated", adminNotes);

        return convertToAdminUserResponse(savedUser);
    }

    /**
     * Reactivate a user account
     */
    @Transactional
    public AdminUserResponse reactivateUser(Long userId) {
        log.info("Reactivating user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (user.getAccountStatus() == AccountStatus.ACTIVE) {
            log.warn("User {} is already active", userId);
            throw new RuntimeException("User is already active");
        }

        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setDeactivatedAt(null);
        user.setDeactivatedBy(null);
        // Keep admin notes for historical record

        User savedUser = userRepository.save(user);
        log.info("User {} successfully reactivated", userId);

        // Send notifications to user
        sendAccountStatusNotification(savedUser, "reactivated", null);

        return convertToAdminUserResponse(savedUser);
    }

    /**
     * Send a persisted in-app message to the user explaining the deactivation reason.
     */
    private void sendDeactivationMessage(User user, User adminUser, String reason, boolean deleteRequested) {
        try {
            String userName = user.getOrganization() != null
                    ? user.getOrganization().getName()
                    : user.getEmail();

            String messageBody = String.format(
                "Dear %s, your account has been %s by one of our admins for: %s",
                userName,
                deleteRequested ? "deleted" : "deactivated",
                reason != null && !reason.isBlank() ? reason : "policy violation");

            Long userId1 = Math.min(adminUser.getId(), user.getId());
            Long userId2 = Math.max(adminUser.getId(), user.getId());

            Optional<Conversation> existing = conversationRepository.findByUsers(userId1, userId2);
            Conversation conversation = existing.orElseGet(() -> {
                Conversation c = new Conversation(adminUser, user);
                return conversationRepository.save(c);
            });

            Message message = new Message(conversation, adminUser, messageBody);
            messageRepository.save(message);

            conversation.setLastMessageAt(LocalDateTime.now());
            String preview = messageBody.length() > 100 ? messageBody.substring(0, 100) + "..." : messageBody;
            conversation.setLastMessagePreview(preview);
            conversationRepository.save(conversation);

            // Push real-time notification to the user's message queue
            Map<String, Object> wsPayload = new HashMap<>();
            wsPayload.put("conversationId", conversation.getId());
            wsPayload.put("senderName", "FoodFlow Admin");
            wsPayload.put("messageBody", messageBody);
            wsPayload.put("timestamp", LocalDateTime.now().toString());
            messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    "/queue/messages",
                    wsPayload);

            log.info("Deactivation in-app message sent to user {}", user.getId());
        } catch (Exception e) {
            log.error("Failed to send deactivation in-app message to user {}: {}", user.getId(), e.getMessage(), e);
        }
    }

    /**
     * Send account status change notifications (deactivated/reactivated)
     */
    private void sendAccountStatusNotification(User user, String action, String adminNotes) {
        String userName = user.getOrganization() != null
                ? user.getOrganization().getName()
                : user.getEmail();

        boolean shouldSendEmail = "deleted".equals(action)
                || notificationPreferenceService.shouldSendNotification(user, "verificationStatusChanged", "email");

        // Account deletion emails are system-critical and should not be skipped by user preferences.
        if (shouldSendEmail) {
            try {
                log.info("Sending {} email to user: {} ({})", action, user.getEmail(), userName);
                if ("deactivated".equals(action)) {
                    emailService.sendAccountDeactivationEmail(user.getEmail(), userName);
                } else if ("deleted".equals(action)) {
                    emailService.sendAccountDeletionEmail(user.getEmail(), userName, adminNotes);
                } else if ("reactivated".equals(action)) {
                    emailService.sendAccountReactivationEmail(user.getEmail(), userName);
                }
                log.info("Account {} email sent successfully to: {}", action, user.getEmail());
            } catch (Exception e) {
                log.error("Failed to send {} email to {}: {}", action, user.getEmail(), e.getMessage(), e);
            }
        } else {
            log.info("Account {} email skipped for user {} - preference disabled", action, user.getEmail());
        }

        // Send WebSocket notification if preference allows
        if (notificationPreferenceService.shouldSendNotification(user, "verificationStatusChanged", "websocket")) {
            try {
                Map<String, Object> notification = new HashMap<>();
                notification.put("type",
                        action.equals("reactivated") ? "ACCOUNT_REACTIVATED" : "ACCOUNT_DEACTIVATED");

                if ("deactivated".equals(action) || "deleted".equals(action)) {
                    notification.put("message",
                            "deleted".equals(action)
                                    ? "Your account has been deleted by an administrator. Please contact support for more information."
                                    : "Your account has been deactivated by an administrator. Please contact support for more information.");
                    if (adminNotes != null && !adminNotes.isEmpty()) {
                        notification.put("reason", adminNotes);
                    }
                } else {
                    notification.put("message",
                            "Your account has been reactivated by an administrator. You now have full access to FoodFlow.");
                }

                notification.put("organizationName", userName);
                notification.put("timestamp", ZonedDateTime.now(ZoneId.of("UTC")).toString());

                log.info("Sending WebSocket {} notification to user ID: {}", action, user.getId());
                messagingTemplate.convertAndSendToUser(
                        user.getId().toString(),
                        "/queue/verification/approved",
                        notification);
                log.info("WebSocket {} notification sent to user ID: {}", action, user.getId());
            } catch (Exception e) {
                log.error("Failed to send WebSocket {} notification to user {}: {}", action, user.getId(),
                        e.getMessage(), e);
            }
        } else {
            log.info("WebSocket notification skipped for user ID {} - preference disabled", user.getId());
        }
    }

    /**
     * Send alert to user via WebSocket notification (using same channel as
     * messages)
     */
    @Transactional
    public void sendAlertToUser(Long userId, String message) {
        sendAlertToUser(userId, message, null, null);
    }

    @Transactional
    public void sendAlertToUser(Long userId, String message, String alertType) {
        sendAlertToUser(userId, message, alertType, null);
    }

    @Transactional
    public void sendAlertToUser(Long userId, String message, String alertType, Long adminId) {
        log.info("Sending alert to user {}: {}", userId, message);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        String alertHeader = mapAlertTypeToHeader(alertType);
        String preferredLanguage = normalizeSupportedLanguage(user.getLanguagePreference());
        String deliveredMessage = resolveDeliveredAlertMessage(alertType, message, preferredLanguage);
        Long conversationId = null;

        User adminSender = resolveAdminSender(adminId);
        if (adminSender != null) {
            conversationId = persistAdminAlertMessage(user, adminSender, deliveredMessage);
        }

        // Create a notification object similar to MessageResponse
        java.util.Map<String, Object> alertNotification = new java.util.HashMap<>();
        alertNotification.put("senderName", alertHeader);
        alertNotification.put("type", "ADMIN_ALERT");
        alertNotification.put("alertType", alertType);
        alertNotification.put("preferredLanguage", preferredLanguage);
        alertNotification.put("messageBody", deliveredMessage);
        alertNotification.put("timestamp", LocalDateTime.now().toString());
        if (conversationId != null) {
            alertNotification.put("conversationId", conversationId);
        }

        // Send via WebSocket using the SAME pattern as MessageService
        messagingTemplate.convertAndSendToUser(
                user.getId().toString(),
                "/queue/messages",
                alertNotification);

        log.info("WebSocket alert sent to userId={} ({})", user.getId(), user.getEmail());

        // Send alert via email
        try {
            String userName = user.getFullName() != null ? user.getFullName() : user.getEmail();
            emailService.sendAdminAlertEmail(user.getEmail(), userName, deliveredMessage, preferredLanguage);
            log.info("Admin alert email sent to userId={} ({})", user.getId(), user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send admin alert email to userId={}: {}", user.getId(), e.getMessage(), e);
        }

        // Also add to admin_notes for record-keeping
        String currentNotes = user.getAdminNotes() != null ? user.getAdminNotes() : "";
        String alertNote = String.format("\n[%s %s]: %s", alertHeader.toUpperCase(), LocalDateTime.now(), deliveredMessage);
        user.setAdminNotes(currentNotes + alertNote);
        userRepository.save(user);
    }

    private String resolveDeliveredAlertMessage(String alertType, String fallbackMessage, String languageCode) {
        String normalizedType = alertType == null ? "" : alertType.trim().toLowerCase(Locale.ROOT);
        if ("custom".equals(normalizedType)) {
            return fallbackMessage;
        }

        Locale locale = localeFromLanguage(languageCode);
        String resolved = switch (normalizedType) {
            case "warning" -> messageSource.getMessage(
                    "admin.alert.template.warning",
                    null,
                    fallbackMessage,
                    locale);
            case "safety" -> messageSource.getMessage(
                    "admin.alert.template.safety",
                    null,
                    fallbackMessage,
                    locale);
            case "compliance" -> messageSource.getMessage(
                    "admin.alert.template.compliance",
                    null,
                    fallbackMessage,
                    locale);
            default -> fallbackMessage;
        };

        return resolved != null ? resolved : fallbackMessage;
    }

    private Locale localeFromLanguage(String languageCode) {
        return switch (normalizeSupportedLanguage(languageCode)) {
            case "fr" -> Locale.FRENCH;
            case "es" -> new Locale("es");
            case "zh" -> new Locale("zh");
            case "ar" -> new Locale("ar");
            case "pt" -> new Locale("pt");
            default -> Locale.ENGLISH;
        };
    }

    private User resolveAdminSender(Long adminId) {
        if (adminId != null) {
            Optional<User> adminById = userRepository.findById(adminId)
                    .filter(admin -> admin.getRole() == UserRole.ADMIN);
            if (adminById.isPresent()) {
                return adminById.get();
            }
            log.warn("Admin sender with id {} not found or not ADMIN", adminId);
        }

        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        if (admins != null && !admins.isEmpty()) {
            return admins.get(0);
        }

        log.warn("No ADMIN user available to persist alert message thread");
        return null;
    }

    private Long persistAdminAlertMessage(User user, User adminUser, String messageBody) {
        Long userId1 = Math.min(adminUser.getId(), user.getId());
        Long userId2 = Math.max(adminUser.getId(), user.getId());

        Optional<Conversation> existing = conversationRepository.findByUsers(userId1, userId2);
        Conversation conversation = existing.orElseGet(() -> conversationRepository.save(new Conversation(adminUser, user)));

        Message message = new Message(conversation, adminUser, messageBody);
        message.setMessageType("ADMIN_ALERT");
        messageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        String preview = messageBody.length() > 100 ? messageBody.substring(0, 100) + "..." : messageBody;
        conversation.setLastMessagePreview(preview);
        conversationRepository.save(conversation);

        return conversation.getId();
    }

    private String mapAlertTypeToHeader(String alertType) {
        if (alertType == null) {
            return "Admin Alert";
        }

        return switch (alertType.trim().toLowerCase()) {
            case "warning" -> "Warning";
            case "safety" -> "Safety Notice";
            case "compliance" -> "Compliance Reminder";
            case "custom" -> "Admin Alert";
            default -> "Admin Alert";
        };
    }

    private String normalizeSupportedLanguage(String languagePreference) {
        if (languagePreference == null || languagePreference.isBlank()) {
            return "en";
        }

        String normalized = languagePreference.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("-")) {
            normalized = normalized.substring(0, normalized.indexOf('-'));
        }

        return switch (normalized) {
            case "en", "fr", "es", "zh", "ar", "pt" -> normalized;
            default -> "en";
        };
    }

    /**
     * Get user activity summary (donations and claims count)
     */
    @Transactional(readOnly = true)
    public AdminUserResponse getUserActivity(Long userId) {
        log.info("Fetching activity summary for user {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return convertToAdminUserResponse(user);
    }

    /**
     * Convert User entity to AdminUserResponse DTO
     */
    private AdminUserResponse convertToAdminUserResponse(User user) {
        AdminUserResponse response = new AdminUserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().toString());
        response.setAccountStatus(resolveDisplayAccountStatus(user));
        response.setCreatedAt(user.getCreatedAt());
        response.setDeactivatedAt(user.getDeactivatedAt());
        response.setAdminNotes(stripDeletedMarker(user.getAdminNotes()));
        response.setLanguagePreference(user.getLanguagePreference());

        // Organization details
        if (user.getOrganization() != null) {
            response.setOrganizationName(user.getOrganization().getName());
            response.setContactPerson(user.getOrganization().getContactPerson());
            response.setPhone(user.getOrganization().getPhone());
            response.setAddress(user.getOrganization().getAddress());
            response.setBusinessLicense(user.getOrganization().getBusinessLicense());
            response.setCharityRegistrationNumber(user.getOrganization().getCharityRegistrationNumber());
            response.setSupportingDocumentUrl(user.getOrganization().getSupportingDocumentUrl());
            response.setVerificationStatus(
                    user.getOrganization().getVerificationStatus() != null
                            ? user.getOrganization().getVerificationStatus().toString()
                            : null);
        }

        // Activity counts
        if (user.getRole() == UserRole.DONOR) {
            Long donationCount = surplusPostRepository.countByDonorId(user.getId());
            response.setDonationCount(donationCount);
            response.setClaimCount(0L);
        } else if (user.getRole() == UserRole.RECEIVER) {
            Long claimCount = claimRepository.countByReceiverId(user.getId());
            response.setClaimCount(claimCount);
            response.setDonationCount(0L);
        } else {
            response.setDonationCount(0L);
            response.setClaimCount(0L);
        }

        return response;
    }

    private String resolveDisplayAccountStatus(User user) {
        if (user.getAccountStatus() == AccountStatus.DEACTIVATED && isDeletedUser(user)) {
            return "DELETED";
        }
        return user.getAccountStatus() != null ? user.getAccountStatus().toString() : "ACTIVE";
    }

    private boolean isDeletedUser(User user) {
        return isDeletedAdminNotes(user.getAdminNotes());
    }

    private boolean isDeletedAdminNotes(String adminNotes) {
        return adminNotes != null && adminNotes.startsWith(DELETED_NOTE_PREFIX);
    }

    private String buildDeletedAdminNotes(String adminNotes) {
        String trimmedNotes = adminNotes != null ? adminNotes.trim() : "";
        return trimmedNotes.isEmpty()
                ? DELETED_NOTE_PREFIX
                : DELETED_NOTE_PREFIX + " " + trimmedNotes;
    }

    private String stripDeletedMarker(String adminNotes) {
        if (!isDeletedAdminNotes(adminNotes)) {
            return adminNotes;
        }

        String stripped = adminNotes.substring(DELETED_NOTE_PREFIX.length()).trim();
        return stripped.isEmpty() ? null : stripped;
    }

    /**
     * Update a user's supporting document URL
     */
    @Transactional
    public AdminUserResponse updateSupportingDocument(Long userId, String documentUrl) {
        log.info("Updating supporting document for user: {}, documentUrl: {}", userId, documentUrl);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        if (user.getOrganization() != null) {
            user.getOrganization().setSupportingDocumentUrl(documentUrl);
            log.info("Supporting document updated successfully for user: {}", userId);
        } else {
            throw new RuntimeException("Organization not found for user: " + userId);
        }
        
        return convertToAdminUserResponse(user);
    }

    /**
     * Get recent activity for a user
     * @param userId User ID
     * @param limit Maximum number of activities to return
     * @return List of recent activities
     */
    @Transactional(readOnly = true)
    public List<UserActivityDTO> getRecentActivity(Long userId, int limit) {
        log.info("Fetching recent activity for user {}, limit: {}", userId, limit);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        List<UserActivityDTO> activities = new ArrayList<>();
        
        if (user.getRole() == UserRole.DONOR) {
            // Get recent donations
            List<SurplusPost> recentPosts = surplusPostRepository.findByDonorOrderByCreatedAtDesc(user);
            
            for (SurplusPost post : recentPosts) {
                if (activities.size() >= limit) break;
                
                String postTitle = post.getTitle();
                String postQuantity = null;
                if (post.getQuantity() != null && post.getQuantity().getValue() != null) {
                    postQuantity = String.format("%.0f%s",
                        post.getQuantity().getValue(),
                        post.getQuantity().getUnit() != null ? post.getQuantity().getUnit().getLabel() : "");
                }
                
                activities.add(new UserActivityDTO(
                    "DONATION",
                    post.getCreatedAt(),
                    post.getId(),
                    "SurplusPost",
                    postTitle,
                    postQuantity
                ));
            }
            
        } else if (user.getRole() == UserRole.RECEIVER) {
            // Get recent claims with post details
            List<Claim> recentClaims = claimRepository.findReceiverClaimsWithDetails(
                userId, 
                List.of(com.example.foodflow.model.types.ClaimStatus.ACTIVE, 
                       com.example.foodflow.model.types.ClaimStatus.COMPLETED,
                       com.example.foodflow.model.types.ClaimStatus.CANCELLED)
            );
            
            for (Claim claim : recentClaims) {
                if (activities.size() >= limit) break;
                
                SurplusPost post = claim.getSurplusPost();
                String claimTitle = post.getTitle();
                String claimQuantity = null;
                if (post.getQuantity() != null && post.getQuantity().getValue() != null) {
                    claimQuantity = String.format("%.0f%s",
                        post.getQuantity().getValue(),
                        post.getQuantity().getUnit() != null ? post.getQuantity().getUnit().getLabel() : "");
                }
                
                activities.add(new UserActivityDTO(
                    "CLAIM",
                    claim.getClaimedAt(),
                    claim.getId(),
                    "Claim",
                    claimTitle,
                    claimQuantity
                ));
            }
        }
        
        // Add verification activity if available
        if (user.getOrganization() != null && user.getOrganization().getVerificationStatus() != null) {
            if (activities.size() < limit) {
                activities.add(new UserActivityDTO(
                    "VERIFICATION",
                    user.getCreatedAt(), // Use account creation as proxy for verification
                    user.getId(),
                    "User",
                    null,
                    null
                ));
            }
        }
        
        // Include account deactivation events from the audit log
        List<AuditLog> deactivations = auditLogRepository
                .findByEntityIdAndActionOrderByTimestampDesc(userId.toString(), "DEACTIVATE_USER");
        for (AuditLog auditEntry : deactivations) {
            if (activities.size() >= limit) break;
            activities.add(new UserActivityDTO(
                    "DEACTIVATE_USER",
                    auditEntry.getTimestamp(),
                    userId,
                    "User",
                    auditEntry.getNewValue(), // reason (adminNotes)
                    null));
        }

        // Sort by timestamp descending and limit
        return activities.stream()
                .sorted(Comparator.comparing(UserActivityDTO::getTimestamp).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

}
