package com.example.foodflow.service;

import com.example.foodflow.model.dto.AdminDisputeResponse;
import com.example.foodflow.model.dto.CreateReportRequest;
import com.example.foodflow.model.dto.DisputeResponse;
import com.example.foodflow.model.entity.Dispute;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.DisputeStatus;
import com.example.foodflow.repository.DisputeRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DisputeService {
    
    private static final Logger log = LoggerFactory.getLogger(DisputeService.class);
    
    private final DisputeRepository disputeRepository;
    private final UserRepository userRepository;
    private final SurplusPostRepository surplusPostRepository;
    private final BusinessMetricsService businessMetricsService;
    
    public DisputeService(DisputeRepository disputeRepository,
                         UserRepository userRepository,
                         SurplusPostRepository surplusPostRepository,
                         BusinessMetricsService businessMetricsService) {
        this.disputeRepository = disputeRepository;
        this.userRepository = userRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.businessMetricsService = businessMetricsService;
    }
    
    /**
     * Create a new report/dispute
     */
    @Transactional
    public DisputeResponse createReport(CreateReportRequest request, Long reporterId) {
        log.info("Creating report from user {} against user {}", reporterId, request.getReportedId());
        
        // Get reporter
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new RuntimeException("Reporter not found"));
        
        // Get reported user
        User reported = userRepository.findById(request.getReportedId())
                .orElseThrow(() -> new RuntimeException("Reported user not found"));
        
        // Get donation if provided
        SurplusPost donation = null;
        if (request.getDonationId() != null) {
            donation = surplusPostRepository.findById(request.getDonationId())
                    .orElse(null);
        }
        
        // Create dispute
        Dispute dispute = new Dispute(reporter, reported, donation, request.getDescription());
        dispute.setImageUrl(request.getImageUrl());
        
        Dispute saved = disputeRepository.save(dispute);
        
        // Track metrics
        businessMetricsService.incrementDisputesCreated();
        
        log.info("Report created with ID: {}", saved.getId());
        
        return mapToDisputeResponse(saved);
    }
    
    /**
     * Get all disputes for admin with filtering
     */
    @Transactional(readOnly = true)
    public Page<AdminDisputeResponse> getAllDisputes(String status, int page, int size) {
        log.info("Fetching all disputes - status: {}, page: {}, size: {}", status, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<Dispute> disputes;
        if (status != null && !status.isEmpty()) {
            try {
                DisputeStatus disputeStatus = DisputeStatus.valueOf(status.toUpperCase());
                disputes = disputeRepository.findByStatus(disputeStatus, pageable);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status filter: {}", status);
                disputes = disputeRepository.findAll(pageable);
            }
        } else {
            disputes = disputeRepository.findAll(pageable);
        }
        
        return disputes.map(this::mapToAdminDisputeResponse);
    }
    
    /**
     * Get dispute by ID for admin
     */
    @Transactional(readOnly = true)
    public AdminDisputeResponse getDisputeById(Long id) {
        log.info("Fetching dispute details for ID: {}", id);
        
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispute not found with ID: " + id));
        
        return mapToAdminDisputeResponse(dispute);
    }
    
    /**
     * Update dispute status (admin only)
     */
    @Transactional
    public AdminDisputeResponse updateDisputeStatus(Long id, String newStatus, String adminNotes) {
        log.info("Updating dispute {} status to {}", id, newStatus);
        
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispute not found with ID: " + id));
        
        String oldStatus = dispute.getStatus().toString();
        
        try {
            DisputeStatus status = DisputeStatus.valueOf(newStatus.toUpperCase());
            dispute.setStatus(status);
            
            // Track metrics based on status change
            businessMetricsService.incrementDisputeStatusChange(oldStatus, newStatus);
            businessMetricsService.incrementAdminDisputeAction("status_change");
            
            if (status == DisputeStatus.RESOLVED) {
                businessMetricsService.incrementDisputesResolved();
            } else if (status == DisputeStatus.CLOSED) {
                businessMetricsService.incrementDisputesRejected();
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + newStatus);
        }
        
        if (adminNotes != null && !adminNotes.isEmpty()) {
            dispute.setAdminNotes(adminNotes);
        }
        
        Dispute updated = disputeRepository.save(dispute);
        
        log.info("Dispute {} updated successfully", id);
        
        return mapToAdminDisputeResponse(updated);
    }
    
    /**
     * Map Dispute entity to DisputeResponse (for regular users - no admin notes)
     */
    private DisputeResponse mapToDisputeResponse(Dispute dispute) {
        DisputeResponse response = new DisputeResponse();
        response.setId(dispute.getId());
        
        // Reporter info
        response.setReporterId(dispute.getReporter().getId());
        response.setReporterEmail(dispute.getReporter().getEmail());
        response.setReporterName(getDisplayName(dispute.getReporter()));
        
        // Reported user info
        response.setReportedId(dispute.getReported().getId());
        response.setReportedEmail(dispute.getReported().getEmail());
        response.setReportedName(getDisplayName(dispute.getReported()));
        
        // Donation info (if exists)
        if (dispute.getDonation() != null) {
            response.setDonationId(dispute.getDonation().getId());
            response.setDonationTitle(dispute.getDonation().getTitle());
        }
        
        response.setDescription(dispute.getDescription());
        response.setImageUrl(dispute.getImageUrl());
        response.setStatus(dispute.getStatus());
        response.setCreatedAt(dispute.getCreatedAt());
        response.setUpdatedAt(dispute.getUpdatedAt());
        
        return response;
    }
    
    /**
     * Map Dispute entity to AdminDisputeResponse (for admins - includes admin notes)
     */
    private AdminDisputeResponse mapToAdminDisputeResponse(Dispute dispute) {
        AdminDisputeResponse response = new AdminDisputeResponse();
        response.setId(dispute.getId());
        
        // Reporter info
        response.setReporterId(dispute.getReporter().getId());
        response.setReporterEmail(dispute.getReporter().getEmail());
        response.setReporterName(getDisplayName(dispute.getReporter()));
        
        // Reported user info
        response.setReportedId(dispute.getReported().getId());
        response.setReportedEmail(dispute.getReported().getEmail());
        response.setReportedName(getDisplayName(dispute.getReported()));
        
        // Donation info (if exists)
        if (dispute.getDonation() != null) {
            response.setDonationId(dispute.getDonation().getId());
            response.setDonationTitle(dispute.getDonation().getTitle());
        }
        
        response.setDescription(dispute.getDescription());
        response.setImageUrl(dispute.getImageUrl());
        response.setStatus(dispute.getStatus());
        response.setAdminNotes(dispute.getAdminNotes()); // Admin-only field
        response.setCreatedAt(dispute.getCreatedAt());
        response.setUpdatedAt(dispute.getUpdatedAt());
        
        return response;
    }
    
    /**
     * Get display name for user (organization name or email)
     */
    private String getDisplayName(User user) {
        if (user.getOrganization() != null) {
            return user.getOrganization().getName();
        }
        return user.getEmail();
    }
}
