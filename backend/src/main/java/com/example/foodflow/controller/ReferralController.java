package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ReferralRequest;
import com.example.foodflow.model.dto.ReferralResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.ReferralService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class ReferralController {

    private static final Logger log = LoggerFactory.getLogger(ReferralController.class);

    private final ReferralService referralService;

    public ReferralController(ReferralService referralService) {
        this.referralService = referralService;
    }

    /**
     * Submit a referral (community invite or business suggestion).
     * Accessible by DONOR and RECEIVER roles.
     * POST /api/referrals
     */
    @PostMapping("/api/referrals")
    @PreAuthorize("hasAnyAuthority('DONOR', 'RECEIVER')")
    public ResponseEntity<?> submitReferral(
            @Valid @RequestBody ReferralRequest request,
            @AuthenticationPrincipal User submitter) {
        try {
            log.info("User {} submitting referral of type {}", submitter.getId(), request.getReferralType());
            ReferralResponse response = referralService.submitReferral(request, submitter.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Error submitting referral: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Get all referral submissions (admin view).
     * Accessible by ADMIN role only.
     * GET /api/admin/referrals
     */
    @GetMapping("/api/admin/referrals")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<ReferralResponse>> getAllReferrals() {
        log.info("Admin fetching all referral submissions");
        List<ReferralResponse> referrals = referralService.getAllReferrals();
        return ResponseEntity.ok(referrals);
    }
}
