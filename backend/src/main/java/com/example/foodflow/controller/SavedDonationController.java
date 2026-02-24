package com.example.foodflow.controller;

import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.service.SavedDonationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/receiver/saved")
@PreAuthorize("hasAuthority('RECEIVER')")
public class SavedDonationController {

    private final SavedDonationService savedDonationService;

    public SavedDonationController(SavedDonationService savedDonationService) {
        this.savedDonationService = savedDonationService;
    }

    /* 
       Save Donation
        */
    @PostMapping("/{donationId}")
    public ResponseEntity<Void> saveDonation(@PathVariable Long donationId) {

        savedDonationService.saveDonation(donationId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /* 
       Unsave Donation
        */
    @DeleteMapping("/{donationId}")
    public ResponseEntity<Void> unsaveDonation(@PathVariable Long donationId) {

        savedDonationService.unsaveDonation(donationId);
        return ResponseEntity.noContent().build();
    }

    /* 
       Get All Saved Donations
       */
    @GetMapping
    public ResponseEntity<List<SurplusResponse>> getSavedDonations() {

        return ResponseEntity.ok(
                savedDonationService.getSavedDonations()
        );
    }

    /* 
       Check If Saved
        */
    @GetMapping("/check/{donationId}")
    public ResponseEntity<Boolean> isSaved(@PathVariable Long donationId) {

        return ResponseEntity.ok(
                savedDonationService.isDonationSaved(donationId)
        );
    }

    /* 
       Count Saved Donations (Badge)
        */
    @GetMapping("/count")
    public ResponseEntity<Long> getSavedCount() {

        return ResponseEntity.ok(
                savedDonationService.getSavedCount()
        );
    }
}
