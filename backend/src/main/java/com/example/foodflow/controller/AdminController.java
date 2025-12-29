package com.example.foodflow.controller;

import com.example.foodflow.model.dto.AdminDonationResponse;
import com.example.foodflow.model.dto.AdminUserResponse;
import com.example.foodflow.model.dto.DeactivateUserRequest;
import com.example.foodflow.model.dto.OverrideStatusRequest;
import com.example.foodflow.model.dto.SendAlertRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import com.example.foodflow.service.AdminDonationService;
import com.example.foodflow.service.AdminUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final AdminUserService adminUserService;
    private final AdminDonationService adminDonationService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public AdminController(AdminUserService adminUserService, AdminDonationService adminDonationService, 
                          JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.adminUserService = adminUserService;
        this.adminDonationService = adminDonationService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    /**
     * Get all users with optional filters and pagination
     * GET /api/admin/users?role=DONOR&accountStatus=ACTIVE&search=email&page=0&size=20
     */
    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponse>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String accountStatus,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Admin fetching users - role: {}, status: {}, search: {}, page: {}", 
                 role, accountStatus, search, page);
        
        try {
            Page<AdminUserResponse> users = adminUserService.getAllUsers(role, accountStatus, search, page, size);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching users", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get a specific user by ID
     * GET /api/admin/users/{userId}
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable Long userId) {
        log.info("Admin fetching user details for userId: {}", userId);
        
        try {
            AdminUserResponse user = adminUserService.getUserById(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("Error fetching user {}: {}", userId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Deactivate a user account
     * PUT /api/admin/users/{userId}/deactivate
     */
    @PutMapping("/users/{userId}/deactivate")
    public ResponseEntity<?> deactivateUser(
            @PathVariable Long userId,
            @RequestBody DeactivateUserRequest request,
            @RequestHeader("Authorization") String authHeader) {
        
        log.info("Admin deactivating user: {}", userId);
        
        try {
            // Extract admin user ID from JWT token
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String adminEmail = jwtTokenProvider.getEmailFromToken(token);
            User adminUser = userRepository.findByEmail(adminEmail)
                    .orElseThrow(() -> new RuntimeException("Admin user not found"));
            Long adminId = adminUser.getId();
            
            AdminUserResponse deactivatedUser = adminUserService.deactivateUser(
                userId, 
                request.getAdminNotes(), 
                adminId
            );
            
            return ResponseEntity.ok(deactivatedUser);
        } catch (RuntimeException e) {
            log.error("Error deactivating user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error deactivating user {}", userId, e);
            return ResponseEntity.internalServerError().body("Failed to deactivate user");
        }
    }

    /**
     * Reactivate a user account
     * PUT /api/admin/users/{userId}/reactivate
     */
    @PutMapping("/users/{userId}/reactivate")
    public ResponseEntity<?> reactivateUser(@PathVariable Long userId) {
        log.info("Admin reactivating user: {}", userId);
        
        try {
            AdminUserResponse reactivatedUser = adminUserService.reactivateUser(userId);
            return ResponseEntity.ok(reactivatedUser);
        } catch (RuntimeException e) {
            log.error("Error reactivating user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error reactivating user {}", userId, e);
            return ResponseEntity.internalServerError().body("Failed to reactivate user");
        }
    }

    /**
     * Send alert to a user
     * POST /api/admin/users/{userId}/send-alert
     */
    @PostMapping("/users/{userId}/send-alert")
    public ResponseEntity<?> sendAlert(
            @PathVariable Long userId,
            @RequestBody SendAlertRequest request) {
        
        log.info("Admin sending alert to user: {}", userId);
        
        try {
            adminUserService.sendAlertToUser(userId, request.getMessage());
            return ResponseEntity.ok().body("Alert sent successfully");
        } catch (RuntimeException e) {
            log.error("Error sending alert to user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error sending alert to user {}", userId, e);
            return ResponseEntity.internalServerError().body("Failed to send alert");
        }
    }

    /**
     * Get user activity summary
     * GET /api/admin/users/{userId}/activity
     */
    @GetMapping("/users/{userId}/activity")
    public ResponseEntity<AdminUserResponse> getUserActivity(@PathVariable Long userId) {
        log.info("Admin fetching activity for user: {}", userId);
        
        try {
            AdminUserResponse activity = adminUserService.getUserActivity(userId);
            return ResponseEntity.ok(activity);
        } catch (RuntimeException e) {
            log.error("Error fetching activity for user {}: {}", userId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching activity for user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ========== DONATION MANAGEMENT ENDPOINTS ==========

    /**
     * Get all donations with filtering and pagination
     * GET /api/admin/donations?status=CLAIMED&donorId=1&receiverId=2&flagged=true&fromDate=2024-01-01&toDate=2024-12-31&search=food&page=0&size=20
     */
    @GetMapping("/donations")
    public ResponseEntity<Page<AdminDonationResponse>> getAllDonations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long donorId,
            @RequestParam(required = false) Long receiverId,
            @RequestParam(required = false) Boolean flagged,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Admin fetching donations - status: {}, donor: {}, receiver: {}, flagged: {}, fromDate: {}, toDate: {}, search: {}", 
                 status, donorId, receiverId, flagged, fromDate, toDate, search);
        
        try {
            Page<AdminDonationResponse> donations = adminDonationService.getAllDonations(
                status, donorId, receiverId, flagged, fromDate, toDate, search, page, size
            );
            return ResponseEntity.ok(donations);
        } catch (Exception e) {
            log.error("Error fetching donations", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get a specific donation by ID with full details and timeline
     * GET /api/admin/donations/{donationId}
     */
    @GetMapping("/donations/{donationId}")
    public ResponseEntity<AdminDonationResponse> getDonationById(@PathVariable Long donationId) {
        log.info("Admin fetching donation details for donationId: {}", donationId);
        
        try {
            AdminDonationResponse donation = adminDonationService.getDonationById(donationId);
            return ResponseEntity.ok(donation);
        } catch (RuntimeException e) {
            log.error("Error fetching donation {}: {}", donationId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching donation {}", donationId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Override donation status manually (force-complete, force-cancel, force-expire, etc.)
     * POST /api/admin/donations/{donationId}/override-status
     */
    @PostMapping("/donations/{donationId}/override-status")
    public ResponseEntity<?> overrideDonationStatus(
            @PathVariable Long donationId,
            @RequestBody OverrideStatusRequest request,
            @RequestHeader("Authorization") String authHeader) {
        
        log.info("Admin overriding status for donation: {} to {}", donationId, request.getNewStatus());
        
        try {
            // Extract admin user ID from JWT token
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String adminEmail = jwtTokenProvider.getEmailFromToken(token);
            User adminUser = userRepository.findByEmail(adminEmail)
                    .orElseThrow(() -> new RuntimeException("Admin user not found"));
            Long adminId = adminUser.getId();
            
            AdminDonationResponse updatedDonation = adminDonationService.overrideStatus(
                donationId, 
                request.getNewStatus(), 
                request.getReason(), 
                adminId
            );
            
            return ResponseEntity.ok(updatedDonation);
        } catch (RuntimeException e) {
            log.error("Error overriding status for donation {}: {}", donationId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error overriding status for donation {}", donationId, e);
            return ResponseEntity.internalServerError().body("Failed to override donation status");
        }
    }
}
