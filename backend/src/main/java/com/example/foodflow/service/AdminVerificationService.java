package com.example.foodflow.service;

import brevo.ApiException;
import com.example.foodflow.model.dto.ApprovalResponse;
import com.example.foodflow.model.dto.RejectionResponse;
import com.example.foodflow.model.dto.UserVerificationDTO;
import com.example.foodflow.model.dto.UserVerificationPageResponse;
import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.entity.EmailVerificationToken;
import com.example.foodflow.repository.EmailVerificationTokenRepository;
import com.example.foodflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminVerificationService {

    private static final Logger log = LoggerFactory.getLogger(AdminVerificationService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailVerificationTokenRepository verificationTokenRepository;

    @Autowired
    private NotificationPreferenceService notificationPreferenceService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Get paginated list of users pending admin approval
     */
    public UserVerificationPageResponse getPendingUsers(
            int page,
            int size,
            String sortBy,
            String sortOrder,
            String role,
            String search
    ) {
        // Parse role filter
        UserRole userRole = null;
        if (role != null && !role.isEmpty()) {
            try {
                userRole = UserRole.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid role, ignore filter
            }
        }

        // Create sort object
        Sort sort = createSort(sortBy, sortOrder);
        Pageable pageable = PageRequest.of(page, size, sort);

        // Query database
        Page<User> userPage = userRepository.findByAccountStatusInAndSearchTerm(
                List.of(AccountStatus.PENDING_ADMIN_APPROVAL, AccountStatus.PENDING_VERIFICATION),
                userRole,
                search,
                pageable
        );

        // Convert to DTOs
        List<UserVerificationDTO> content = userPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new UserVerificationPageResponse(
                content,
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.getNumber()
        );
    }

    /**
     * Approve a pending user
     */
    @Transactional
    public ApprovalResponse approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getAccountStatus() != AccountStatus.PENDING_ADMIN_APPROVAL) {
            throw new IllegalStateException("User is not pending admin approval");
        }

        // Update user status
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        String userName = user.getOrganization() != null 
            ? user.getOrganization().getName() 
            : user.getEmail();

        // Send email notification if preference allows
        if (notificationPreferenceService.shouldSendNotification(user, "verificationStatusChanged", "email")) {
            try {
                log.info("Sending approval email to user: {} ({})", user.getEmail(), userName);
                emailService.sendAccountApprovalEmail(user.getEmail(), userName);
                log.info("Approval email sent successfully to: {}", user.getEmail());
            } catch (ApiException e) {
                log.error("Failed to send approval email to {}: {}", user.getEmail(), e.getMessage(), e);
                // Don't fail the approval if email fails
            } catch (Exception e) {
                log.error("Unexpected error sending approval email to {}: {}", user.getEmail(), e.getMessage(), e);
            }
        } else {
            log.info("Email notification skipped for user {} - preference disabled", user.getEmail());
        }

        // Send WebSocket notification if preference allows
        if (notificationPreferenceService.shouldSendNotification(user, "verificationStatusChanged", "websocket")) {
            try {
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "VERIFICATION_APPROVED");
                notification.put("message", "Your account has been approved! You now have full access to FoodFlow.");
                notification.put("organizationName", userName);
                notification.put("timestamp", ZonedDateTime.now(ZoneId.of("UTC")).toString());

                log.info("Sending WebSocket approval notification to user ID: {}", user.getId());
                messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    "/queue/verification/approved",
                    notification
                );
                log.info("WebSocket approval notification sent to user ID: {}", user.getId());
            } catch (Exception e) {
                log.error("Failed to send WebSocket approval notification to user {}: {}", user.getId(), e.getMessage(), e);
                // Don't fail the approval if WebSocket fails
            }
        } else {
            log.info("WebSocket notification skipped for user ID {} - preference disabled", user.getId());
        }

        return new ApprovalResponse(true, "User approved successfully");
    }

    /**
     * Manually verify a user's email when the verification link fails.
     * Moves user from PENDING_VERIFICATION to PENDING_ADMIN_APPROVAL.
     */
    @Transactional
    public ApprovalResponse verifyEmailManually(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getAccountStatus() != AccountStatus.PENDING_VERIFICATION) {
            throw new IllegalStateException("User is not pending email verification");
        }

        user.setAccountStatus(AccountStatus.PENDING_ADMIN_APPROVAL);
        
        // Automatically enable email notifications upon email verification
        user.setEmailNotificationsEnabled(true);
        log.info("Email notifications automatically enabled for user: {} during manual verification", user.getEmail());
        
        userRepository.save(user);

        verificationTokenRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .ifPresent(token -> {
                    token.setVerifiedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                    verificationTokenRepository.save(token);
                });

        return new ApprovalResponse(true, "Email verified manually");
    }

    /**
     * Reject a pending user
     */
    @Transactional
    public RejectionResponse rejectUser(Long userId, String reason, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getAccountStatus() != AccountStatus.PENDING_ADMIN_APPROVAL) {
            throw new IllegalStateException("User is not pending admin approval");
        }

        // Update user status to deactivated with admin notes
        user.setAccountStatus(AccountStatus.DEACTIVATED);
        user.setAdminNotes("Rejected: " + reason + (message != null ? " - " + message : ""));
        userRepository.save(user);

        // Send rejection email
        try {
            String userName = user.getOrganization() != null 
                ? user.getOrganization().getName() 
                : user.getEmail();
            log.info("Sending rejection email to user: {} ({})", user.getEmail(), userName);
            emailService.sendAccountRejectionEmail(user.getEmail(), userName, reason, message);
            log.info("Rejection email sent successfully to: {}", user.getEmail());
        } catch (ApiException e) {
            log.error("Failed to send rejection email to {}: {}", user.getEmail(), e.getMessage(), e);
            // Don't fail the rejection if email fails
        } catch (Exception e) {
            log.error("Unexpected error sending rejection email to {}: {}", user.getEmail(), e.getMessage(), e);
        }

        return new RejectionResponse(true, "User rejected successfully");
    }

    /**
     * Convert User entity to UserVerificationDTO
     */
    private UserVerificationDTO convertToDTO(User user) {
        UserVerificationDTO dto = new UserVerificationDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setAccountStatus(user.getAccountStatus());
        dto.setCreatedAt(user.getCreatedAt());

        Organization org = user.getOrganization();
        if (org != null) {
            dto.setOrganizationName(org.getName());
            dto.setContactName(org.getContactPerson());
            dto.setPhoneNumber(org.getPhone());
            dto.setOrganizationType(org.getOrganizationType());
            dto.setCharityRegistrationNumber(org.getCharityRegistrationNumber());
            dto.setBusinessLicense(org.getBusinessLicense());
            
            // Convert capacity to string
            if (org.getCapacity() != null) {
                dto.setCapacity(org.getCapacity() + " meals/day");
            }

            // Parse address string into AddressDTO
            // Since Organization stores address as a single string, we'll return it as street for now
            // In a real scenario, you'd need a proper address parser or structured address storage
            if (org.getAddress() != null) {
                UserVerificationDTO.AddressDTO addressDTO = new UserVerificationDTO.AddressDTO();
                addressDTO.setStreet(org.getAddress());
                // Set city and country from User entity if available
                addressDTO.setCity(user.getCity());
                addressDTO.setCountry(user.getCountry());
                dto.setAddress(addressDTO);
            }

            // TODO: Set supporting document URL when document storage is implemented
            dto.setSupportingDocument(null);
        }

        return dto;
    }

    /**
     * Create Sort object based on sortBy and sortOrder parameters
     */
    private Sort createSort(String sortBy, String sortOrder) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortOrder) 
                ? Sort.Direction.ASC 
                : Sort.Direction.DESC;

        return switch (sortBy != null ? sortBy.toLowerCase() : "date") {
            case "usertype" -> Sort.by(direction, "role");
            case "waitingtime", "date" -> Sort.by(direction, "createdAt");
            default -> Sort.by(direction, "createdAt");
        };
    }
}
