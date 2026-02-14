package com.example.foodflow.service;

import com.example.foodflow.model.dto.AdminDonationResponse;
import com.example.foodflow.model.dto.DonationTimelineDTO;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.DonationTimelineRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AdminDonationService {
    
    private static final Logger log = LoggerFactory.getLogger(AdminDonationService.class);
    
    private final SurplusPostRepository surplusPostRepository;
    private final ClaimRepository claimRepository;
    private final DonationTimelineRepository timelineRepository;
    private final UserRepository userRepository;
    private final TimelineService timelineService;
    private final NotificationPreferenceService notificationPreferenceService;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;
    
    public AdminDonationService(
            SurplusPostRepository surplusPostRepository,
            ClaimRepository claimRepository,
            DonationTimelineRepository timelineRepository,
            UserRepository userRepository,
            TimelineService timelineService,
            NotificationPreferenceService notificationPreferenceService,
            EmailService emailService,
            SimpMessagingTemplate messagingTemplate) {
        this.surplusPostRepository = surplusPostRepository;
        this.claimRepository = claimRepository;
        this.timelineRepository = timelineRepository;
        this.userRepository = userRepository;
        this.timelineService = timelineService;
        this.notificationPreferenceService = notificationPreferenceService;
        this.emailService = emailService;
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Get all donations with filtering and pagination
     */
    @Transactional(readOnly = true)
    public Page<AdminDonationResponse> getAllDonations(
            String status,
            Long donorId,
            Long receiverId,
            Boolean flagged,
            LocalDate fromDate,
            LocalDate toDate,
            String search,
            int page,
            int size) {
        
        log.info("Fetching donations - status: {}, donor: {}, receiver: {}, flagged: {}, search: {}",
                status, donorId, receiverId, flagged, search);
        
        Specification<SurplusPost> spec = buildSpecification(status, donorId, receiverId, flagged, fromDate, toDate, search);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<SurplusPost> posts = surplusPostRepository.findAll(spec, pageable);
        return posts.map(this::mapToAdminResponse);
    }
    
    /**
     * Get a specific donation by ID with full details
     */
    @Transactional(readOnly = true)
    public AdminDonationResponse getDonationById(Long donationId) {
        log.info("Fetching donation details for ID: {}", donationId);
        
        SurplusPost post = surplusPostRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found with ID: " + donationId));
        
        return mapToAdminResponse(post);
    }
    
    /**
     * Override donation status manually
     */
    @Transactional
    public AdminDonationResponse overrideStatus(Long donationId, String newStatusStr, String reason, Long adminUserId) {
        log.info("Admin {} overriding status for donation {} to {}", adminUserId, donationId, newStatusStr);
        
        SurplusPost post = surplusPostRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found with ID: " + donationId));
        
        PostStatus oldStatus = post.getStatus();
        PostStatus newStatus;
        
        try {
            newStatus = PostStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + newStatusStr);
        }
        
        // Update status
        post.setStatus(newStatus);
        surplusPostRepository.save(post);
        
        // Create timeline event for admin override
        DonationTimeline timelineEvent = new DonationTimeline();
        timelineEvent.setSurplusPost(post);
        timelineEvent.setEventType("ADMIN_STATUS_OVERRIDE");
        timelineEvent.setTimestamp(LocalDateTime.now());
        timelineEvent.setActor("admin");
        timelineEvent.setActorUserId(adminUserId);
        timelineEvent.setOldStatus(oldStatus.name());
        timelineEvent.setNewStatus(newStatus.name());
        timelineEvent.setDetails(reason != null ? reason : "Admin manual override");
        timelineEvent.setVisibleToUsers(false); // Admin overrides are not visible to donors/receivers
        
        timelineRepository.save(timelineEvent);
        
        log.info("Status override completed: {} -> {}", oldStatus, newStatus);
        
        // Send notifications to donor
        User donor = post.getDonor();
        sendStatusUpdateNotificationToDonor(post, donor, oldStatus, newStatus, reason);
        
        // Send notifications to receiver (if donation is claimed)
        Optional<Claim> claimOpt = claimRepository.findBySurplusPostIdAndStatus(donationId, ClaimStatus.ACTIVE);
        if (claimOpt.isPresent()) {
            User receiver = claimOpt.get().getReceiver();
            sendStatusUpdateNotificationToReceiver(post, receiver, oldStatus, newStatus, reason);
        }
        
        return mapToAdminResponse(post);
    }
    
    /**
     * Build specification for filtering donations
     */
    private Specification<SurplusPost> buildSpecification(
            String status,
            Long donorId,
            Long receiverId,
            Boolean flagged,
            LocalDate fromDate,
            LocalDate toDate,
            String search) {
        
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by status
            if (status != null && !status.isEmpty()) {
                try {
                    PostStatus postStatus = PostStatus.valueOf(status.toUpperCase());
                    predicates.add(cb.equal(root.get("status"), postStatus));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status filter: {}", status);
                }
            }
            
            // Filter by donor
            if (donorId != null) {
                predicates.add(cb.equal(root.get("donor").get("id"), donorId));
            }
            
            // Filter by receiver (needs to join with claims)
            if (receiverId != null) {
                var claimJoin = root.join("pickupSlots").join("claim");
                predicates.add(cb.equal(claimJoin.get("receiver").get("id"), receiverId));
            }
            
            // Filter by flagged status
            if (flagged != null) {
                predicates.add(cb.equal(root.get("flagged"), flagged));
            }
            
            // Filter by date range
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate.atTime(23, 59, 59)));
            }
            
            // Search by ID (if numeric), title, donor/receiver email, or organization name
            if (search != null && !search.isEmpty()) {
                List<Predicate> searchPredicates = new ArrayList<>();
                String searchPattern = "%" + search.toLowerCase() + "%";
                
                // Check if search is numeric for ID search
                try {
                    Long searchId = Long.parseLong(search);
                    searchPredicates.add(cb.equal(root.get("id"), searchId));
                } catch (NumberFormatException e) {
                    // Not a number, skip ID search
                }
                
                // Title search
                searchPredicates.add(cb.like(cb.lower(root.get("title")), searchPattern));
                
                // Donor email search
                searchPredicates.add(cb.like(cb.lower(root.get("donor").get("email")), searchPattern));
                
                // Donor organization search - handle null organizations
                searchPredicates.add(cb.and(
                    cb.isNotNull(root.get("donor").get("organization")),
                    cb.like(cb.lower(root.get("donor").get("organization").get("name")), searchPattern)
                ));
                
                // Receiver search through Claim subquery
                Subquery<Long> claimSubquery = query.subquery(Long.class);
                var claimRoot = claimSubquery.from(Claim.class);
                claimSubquery.select(claimRoot.get("surplusPost").get("id"));
                
                // Receiver email or organization match
                Predicate receiverEmailMatch = cb.like(cb.lower(claimRoot.get("receiver").get("email")), searchPattern);
                Predicate receiverOrgMatch = cb.and(
                    cb.isNotNull(claimRoot.get("receiver").get("organization")),
                    cb.like(cb.lower(claimRoot.get("receiver").get("organization").get("name")), searchPattern)
                );
                
                claimSubquery.where(
                    cb.and(
                        cb.equal(claimRoot.get("surplusPost").get("id"), root.get("id")),
                        cb.or(receiverEmailMatch, receiverOrgMatch)
                    )
                );
                
                searchPredicates.add(cb.exists(claimSubquery));
                
                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Map SurplusPost to AdminDonationResponse with full details
     */
    private AdminDonationResponse mapToAdminResponse(SurplusPost post) {
        AdminDonationResponse response = new AdminDonationResponse();
        
        // Basic donation info
        response.setId(post.getId());
        response.setTitle(post.getTitle());
        response.setFoodCategories(post.getFoodCategories());
        response.setQuantity(post.getQuantity());
        response.setPickupLocation(post.getPickupLocation());
        response.setExpiryDate(post.getExpiryDate());
        response.setDescription(post.getDescription());
        response.setPickupDate(post.getPickupDate());
        response.setPickupFrom(post.getPickupFrom());
        response.setPickupTo(post.getPickupTo());
        response.setStatus(post.getStatus());
        response.setFlagged(post.getFlagged());
        response.setFlagReason(post.getFlagReason());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        
        // Donor information
        User donor = post.getDonor();
        response.setDonorId(donor.getId());
        String donorName = donor.getOrganization() != null 
            ? donor.getOrganization().getContactPerson() 
            : donor.getEmail();
        response.setDonorName(donorName);
        response.setDonorEmail(donor.getEmail());
        if (donor.getOrganization() != null) {
            response.setDonorOrganization(donor.getOrganization().getName());
        }
        
        // Get claim information if exists (get ACTIVE claim)
        Optional<Claim> claimOpt = claimRepository.findBySurplusPostIdAndStatus(post.getId(), ClaimStatus.ACTIVE);
        if (claimOpt.isPresent()) {
            Claim claim = claimOpt.get();
            User receiver = claim.getReceiver();
            
            response.setClaimId(claim.getId());
            response.setClaimedAt(claim.getClaimedAt());
            response.setConfirmedPickupDate(claim.getConfirmedPickupDate());
            response.setConfirmedPickupStartTime(claim.getConfirmedPickupStartTime());
            response.setConfirmedPickupEndTime(claim.getConfirmedPickupEndTime());
            
            response.setReceiverId(receiver.getId());
            String receiverName = receiver.getOrganization() != null 
                ? receiver.getOrganization().getContactPerson() 
                : receiver.getEmail();
            response.setReceiverName(receiverName);
            response.setReceiverEmail(receiver.getEmail());
            if (receiver.getOrganization() != null) {
                response.setReceiverOrganization(receiver.getOrganization().getName());
            }
        }
        
        // Get full timeline (including admin-only events)
        List<DonationTimeline> timeline = timelineRepository.findBySurplusPostIdOrderByTimestampDesc(post.getId());
        List<DonationTimelineDTO> timelineDTOs = timeline.stream()
                .map(this::mapToTimelineDTO)
                .collect(Collectors.toList());
        response.setTimeline(timelineDTOs);
        
        return response;
    }
    
    /**
     * Map DonationTimeline entity to DTO
     */
    private DonationTimelineDTO mapToTimelineDTO(DonationTimeline timeline) {
        DonationTimelineDTO dto = new DonationTimelineDTO();
        dto.setId(timeline.getId());
        dto.setEventType(timeline.getEventType());
        dto.setTimestamp(timeline.getTimestamp());
        dto.setActor(timeline.getActor());
        dto.setActorUserId(timeline.getActorUserId());
        dto.setOldStatus(timeline.getOldStatus());
        dto.setNewStatus(timeline.getNewStatus());
        dto.setDetails(timeline.getDetails());
        dto.setVisibleToUsers(timeline.getVisibleToUsers());
        dto.setTemperature(timeline.getTemperature());
        dto.setPackagingCondition(timeline.getPackagingCondition());
        dto.setPickupEvidenceUrl(timeline.getPickupEvidenceUrl());
        return dto;
    }

    private void sendStatusUpdateNotificationToDonor(SurplusPost post, User donor, PostStatus oldStatus, PostStatus newStatus, String reason) {
        try {
            log.info("Checking email preference for donor userId={} for donationStatusUpdated notification", donor.getId());
            
            if (notificationPreferenceService.shouldSendNotification(donor, "donationStatusUpdated", "email")) {
                log.info("Donor {} has email notifications enabled for donationStatusUpdated, sending email", donor.getId());
                
                Map<String, Object> statusData = new HashMap<>();
                statusData.put("donationTitle", post.getTitle());
                statusData.put("oldStatus", oldStatus.name());
                statusData.put("newStatus", newStatus.name());
                statusData.put("reason", reason != null ? reason : "Admin manual override");
                statusData.put("userType", "donor");
                
                String donorName = donor.getOrganization() != null ? 
                    donor.getOrganization().getName() : donor.getFullName();
                
                emailService.sendDonationStatusUpdateNotification(donor.getEmail(), donorName, statusData);
                log.info("Successfully sent donation status update email to donor userId={} for postId={}", donor.getId(), post.getId());
            } else {
                log.info("Donor {} has email notifications disabled for donationStatusUpdated", donor.getId());
            }
        } catch (Exception e) {
            log.error("Failed to send donation status update email to donor: {}", e.getMessage(), e);
        }
        
        // Send WebSocket notification
        try {
            log.info("Checking websocket preference for donor userId={} for donationStatusUpdated notification", donor.getId());
            
            if (notificationPreferenceService.shouldSendNotification(donor, "donationStatusUpdated", "websocket")) {
                log.info("Donor {} has websocket notifications enabled for donationStatusUpdated, sending notification", donor.getId());
                
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "STATUS_UPDATED");
                notification.put("donationId", post.getId());
                notification.put("title", post.getTitle());
                notification.put("message", "Admin updated your donation status from " + oldStatus + " to " + newStatus);
                notification.put("oldStatus", oldStatus.name());
                notification.put("newStatus", newStatus.name());
                notification.put("reason", reason != null ? reason : "Admin manual override");
                notification.put("timestamp", ZonedDateTime.now(ZoneId.of("UTC")).toString());
                
                messagingTemplate.convertAndSendToUser(
                    donor.getId().toString(),
                    "/queue/donations/status-updated",
                    notification
                );
                log.info("Successfully sent donation status update websocket notification to donor userId={} for postId={}", donor.getId(), post.getId());
            } else {
                log.info("Donor {} has websocket notifications disabled for donationStatusUpdated", donor.getId());
            }
        } catch (Exception e) {
            log.error("Failed to send donation status update websocket notification to donor: {}", e.getMessage(), e);
        }
    }

    private void sendStatusUpdateNotificationToReceiver(SurplusPost post, User receiver, PostStatus oldStatus, PostStatus newStatus, String reason) {
        try {
            log.info("Checking email preference for receiver userId={} for donationStatusChanged notification", receiver.getId());
            
            if (notificationPreferenceService.shouldSendNotification(receiver, "donationStatusChanged", "email")) {
                log.info("Receiver {} has email notifications enabled for donationStatusChanged, sending email", receiver.getId());
                
                Map<String, Object> statusData = new HashMap<>();
                statusData.put("donationTitle", post.getTitle());
                statusData.put("oldStatus", oldStatus.name());
                statusData.put("newStatus", newStatus.name());
                statusData.put("reason", reason != null ? reason : "Admin manual override");
                statusData.put("userType", "receiver");
                
                String receiverName = receiver.getOrganization() != null ? 
                    receiver.getOrganization().getName() : receiver.getFullName();
                
                emailService.sendDonationStatusUpdateNotification(receiver.getEmail(), receiverName, statusData);
                log.info("Successfully sent donation status update email to receiver userId={} for postId={}", receiver.getId(), post.getId());
            } else {
                log.info("Receiver {} has email notifications disabled for donationStatusChanged", receiver.getId());
            }
        } catch (Exception e) {
            log.error("Failed to send donation status update email to receiver: {}", e.getMessage(), e);
        }
        
        // Send WebSocket notification
        try {
            log.info("Checking websocket preference for receiver userId={} for donationStatusChanged notification", receiver.getId());
            
            if (notificationPreferenceService.shouldSendNotification(receiver, "donationStatusChanged", "websocket")) {
                log.info("Receiver {} has websocket notifications enabled for donationStatusChanged, sending notification", receiver.getId());
                
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "STATUS_CHANGED");
                notification.put("donationId", post.getId());
                notification.put("title", post.getTitle());
                notification.put("message", "Admin updated the donation status from " + oldStatus + " to " + newStatus);
                notification.put("oldStatus", oldStatus.name());
                notification.put("newStatus", newStatus.name());
                notification.put("reason", reason != null ? reason : "Admin manual override");
                notification.put("timestamp", ZonedDateTime.now(ZoneId.of("UTC")).toString());
                
                messagingTemplate.convertAndSendToUser(
                    receiver.getId().toString(),
                    "/queue/donations/status-changed",
                    notification
                );
                log.info("Successfully sent donation status update websocket notification to receiver userId={} for postId={}", receiver.getId(), post.getId());
            } else {
                log.info("Receiver {} has websocket notifications disabled for donationStatusChanged", receiver.getId());
            }
        } catch (Exception e) {
            log.error("Failed to send donation status update websocket notification to receiver: {}", e.getMessage(), e);
        }
    }
}
