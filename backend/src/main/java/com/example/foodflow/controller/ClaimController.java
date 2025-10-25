package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ClaimRequest;
import com.example.foodflow.model.dto.ClaimResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "${spring.web.cors.allowed-origins}")
public class ClaimController {
    
    private final ClaimService claimService;
    
    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('RECEIVER')")
    public ResponseEntity<ClaimResponse> claimSurplusPost(
            @Valid @RequestBody ClaimRequest request,
            @AuthenticationPrincipal User receiver) {
        
        ClaimResponse response = claimService.claimSurplusPost(request, receiver);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/my-claims")
    @PreAuthorize("hasAuthority('RECEIVER')")
    public ResponseEntity<List<ClaimResponse>> getMyClaims(
            @AuthenticationPrincipal User receiver) {
        
        List<ClaimResponse> claims = claimService.getReceiverClaims(receiver);
        return ResponseEntity.ok(claims);
    }
    
    @DeleteMapping("/{claimId}")
    @PreAuthorize("hasAuthority('RECEIVER')")
    public ResponseEntity<Void> cancelClaim(
            @PathVariable Long claimId,
            @AuthenticationPrincipal User receiver) {
        
        claimService.cancelClaim(claimId, receiver);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/post/{surplusPostId}")
    @PreAuthorize("hasAnyAuthority('DONOR', 'RECEIVER')")
    public ResponseEntity<List<ClaimResponse>> getClaimsForPost(
            @PathVariable Long surplusPostId) {
        
        List<ClaimResponse> claims = claimService.getClaimsForSurplusPost(surplusPostId);
        return ResponseEntity.ok(claims);
    }
}
