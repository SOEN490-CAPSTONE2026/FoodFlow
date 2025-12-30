package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CreateReportRequest;
import com.example.foodflow.model.dto.DisputeResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.DisputeService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:3000")
public class ReportController {
    
    private static final Logger log = LoggerFactory.getLogger(ReportController.class);
    
    private final DisputeService disputeService;
    
    public ReportController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }
    
    /**
     * Create a new report
     * POST /api/reports
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('DONOR', 'RECEIVER')")
    public ResponseEntity<?> createReport(
            @Valid @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal User reporter) {
        try {
            log.info("User {} creating report", reporter.getId());
            
            DisputeResponse response = disputeService.createReport(request, reporter.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (RuntimeException e) {
            log.error("Error creating report: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
