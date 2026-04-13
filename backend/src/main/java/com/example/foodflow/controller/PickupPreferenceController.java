package com.example.foodflow.controller;
import com.example.foodflow.model.dto.PickupPreferenceRequest;
import com.example.foodflow.model.dto.PickupPreferenceResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.PickupPreferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/donors/pickup-preferences")
@CrossOrigin(origins = "${spring.web.cors.allowed-origins}")
public class PickupPreferenceController {
    private final PickupPreferenceService pickupPreferenceService;
    public PickupPreferenceController(PickupPreferenceService pickupPreferenceService) {
        this.pickupPreferenceService = pickupPreferenceService;
    }
    @GetMapping
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<PickupPreferenceResponse> getPreferences(
            @AuthenticationPrincipal User donor) {
        return ResponseEntity.ok(pickupPreferenceService.getPreferences(donor));
    }
    @PutMapping
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<PickupPreferenceResponse> savePreferences(
            @RequestBody PickupPreferenceRequest request,
            @AuthenticationPrincipal User donor) {
        return ResponseEntity.ok(pickupPreferenceService.savePreferences(donor, request));
    }
}
