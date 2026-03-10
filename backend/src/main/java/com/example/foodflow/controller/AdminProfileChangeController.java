package com.example.foodflow.controller;

import com.example.foodflow.model.dto.RejectionRequest;
import com.example.foodflow.model.dto.RejectionResponse;
import com.example.foodflow.service.ProfileChangeService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/profile-change")
public class AdminProfileChangeController {

    private final ProfileChangeService profileChangeService;

    public AdminProfileChangeController(ProfileChangeService profileChangeService) {
        this.profileChangeService = profileChangeService;
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> approve(@PathVariable Long id) {

        profileChangeService.approveProfileChange(id);

        return ResponseEntity.ok().build();
    }

 @PostMapping("/{id}/reject")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<RejectionResponse> reject(
        @PathVariable Long id,
        @RequestBody @Valid RejectionRequest request) {

    profileChangeService.rejectProfileChange(
            id,
            request.getReason(),
            request.getMessage()
    );

    return ResponseEntity.ok(
            new RejectionResponse(true, "Profile change rejected successfully")
    );
}


}
