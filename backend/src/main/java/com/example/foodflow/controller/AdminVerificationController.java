package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ApprovalResponse;
import com.example.foodflow.model.dto.RejectionRequest;
import com.example.foodflow.model.dto.RejectionResponse;
import com.example.foodflow.model.dto.UserVerificationPageResponse;
import com.example.foodflow.service.AdminVerificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminVerificationController {

    @Autowired
    private AdminVerificationService adminVerificationService;

    /**
     * GET /api/admin/pending-users
     * Fetch paginated list of users pending admin approval
     */
    @GetMapping("/pending-users")
    public ResponseEntity<UserVerificationPageResponse> getPendingUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search
    ) {
        UserVerificationPageResponse response = adminVerificationService.getPendingUsers(
                page, size, sortBy, sortOrder, role, search
        );
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/admin/approve/{userId}
     * Approve a pending user registration
     */
    @PostMapping("/approve/{userId}")
    public ResponseEntity<ApprovalResponse> approveUser(@PathVariable Long userId) {
        try {
            ApprovalResponse response = adminVerificationService.approveUser(userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApprovalResponse(false, e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(new ApprovalResponse(false, e.getMessage()));
        }
    }

    /**
     * POST /api/admin/reject/{userId}
     * Reject a pending user registration
     */
    @PostMapping("/reject/{userId}")
    public ResponseEntity<RejectionResponse> rejectUser(
            @PathVariable Long userId,
            @Valid @RequestBody RejectionRequest request
    ) {
        try {
            RejectionResponse response = adminVerificationService.rejectUser(
                    userId,
                    request.getReason(),
                    request.getMessage()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new RejectionResponse(false, e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(new RejectionResponse(false, e.getMessage()));
        }
    }
}
