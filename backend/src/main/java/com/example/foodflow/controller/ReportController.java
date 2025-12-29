package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CreateReportRequest;
import com.example.foodflow.model.dto.DisputeResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import com.example.foodflow.service.DisputeService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    
    private static final Logger log = LoggerFactory.getLogger(ReportController.class);
    
    private final DisputeService disputeService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    
    public ReportController(DisputeService disputeService,
                           JwtTokenProvider jwtTokenProvider,
                           UserRepository userRepository) {
        this.disputeService = disputeService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }
    
    /**
     * Create a new report
     * POST /api/reports
     */
    @PostMapping
    public ResponseEntity<?> createReport(
            @Valid @RequestBody CreateReportRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            // Extract user from token
            String jwt = token.replace("Bearer ", "");
            String email = jwtTokenProvider.getEmailFromToken(jwt);
            User reporter = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            log.info("User {} creating report", reporter.getId());
            
            DisputeResponse response = disputeService.createReport(request, reporter.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (RuntimeException e) {
            log.error("Error creating report: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
