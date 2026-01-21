package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CompleteSurplusRequest;
import com.example.foodflow.model.dto.ConfirmPickupRequest;
import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.DonationTimelineDTO;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.SurplusService;
import com.example.foodflow.model.dto.SurplusFilterRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/surplus")
@CrossOrigin(origins = "${spring.web.cors.allowed-origins}")
public class SurplusController {

    private final SurplusService surplusService;

    public SurplusController(SurplusService surplusService) {
        this.surplusService = surplusService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<SurplusResponse> createSurplusPost(
            @Valid @RequestBody CreateSurplusRequest request,
            @AuthenticationPrincipal User donor) {

        SurplusResponse response = surplusService.createSurplusPost(request, donor);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-posts")
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<List<SurplusResponse>> getMyPosts(
            @AuthenticationPrincipal User user) {

        List<SurplusResponse> myPosts = surplusService.getUserSurplusPosts(user);
        return ResponseEntity.ok(myPosts);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<SurplusResponse> getSurplusPostById(
            @PathVariable Long id,
            @AuthenticationPrincipal User donor) {

        SurplusResponse post = surplusService.getSurplusPostByIdForDonor(id, donor);
        return ResponseEntity.ok(post);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<SurplusResponse> updateSurplusPost(
            @PathVariable Long id,
            @Valid @RequestBody CreateSurplusRequest request,
            @AuthenticationPrincipal User donor) {

        SurplusResponse response = surplusService.updateSurplusPost(id, request, donor);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('RECEIVER')")
    public ResponseEntity<List<SurplusResponse>> getAllAvailableSurplus(
            @AuthenticationPrincipal User receiver) {
        // Use empty filter to get all available posts, but with timezone conversion
        SurplusFilterRequest filterRequest = new SurplusFilterRequest();
        filterRequest.setStatus("AVAILABLE");
        List<SurplusResponse> availablePosts = surplusService.searchSurplusPostsForReceiver(filterRequest, receiver);
        return ResponseEntity.ok(availablePosts);
    }

    /**
     * New endpoint for filtered surplus posts based on receiver criteria.
     * If no filters are provided, returns all available posts.
     * Times are converted to receiver's timezone.
     */
    @PostMapping("/search")
    @PreAuthorize("hasAuthority('RECEIVER')")
    public ResponseEntity<List<SurplusResponse>> searchSurplusPosts(
            @Valid @RequestBody SurplusFilterRequest filterRequest,
            @AuthenticationPrincipal User receiver) {
        List<SurplusResponse> filteredPosts = surplusService.searchSurplusPostsForReceiver(filterRequest, receiver);
        return ResponseEntity.ok(filteredPosts);

    }

    /**
     * Alternative GET endpoint for basic filtering via query parameters.
     * Useful for simple filters without complex objects like Location.
     * Times are converted to receiver's timezone.
     */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('RECEIVER')")
    public ResponseEntity<List<SurplusResponse>> searchSurplusPostsViaParams(
            @RequestParam(required = false) List<String> foodCategories,
            @RequestParam(required = false) String expiryBefore,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal User receiver) {


        // Create filter request from query parameters
        SurplusFilterRequest filterRequest = new SurplusFilterRequest();
        filterRequest.setFoodCategories(foodCategories);
        filterRequest.setStatus(status != null ? status : "AVAILABLE");

        if (expiryBefore != null && !expiryBefore.trim().isEmpty()) {

            try {

                filterRequest.setExpiryBefore(java.time.LocalDate.parse(expiryBefore));

            } catch (Exception e) {
                // Log the error and continue without expiry filter
                System.err.println("Invalid expiryBefore format: " + expiryBefore);
            }

        }
        List<SurplusResponse> filteredPosts = surplusService.searchSurplusPostsForReceiver(filterRequest, receiver);
        return ResponseEntity.ok(filteredPosts);

    }


    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<SurplusResponse> completeSurplusPost(
            @PathVariable Long id,
            @Valid @RequestBody CompleteSurplusRequest request,
            @AuthenticationPrincipal User donor) {

        SurplusResponse response = surplusService.completeSurplusPost(id, request.getOtpCode(), donor);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pickup/confirm")
    public ResponseEntity<SurplusResponse> confirmPickup(
            @RequestBody ConfirmPickupRequest request,
            @AuthenticationPrincipal User donor) {

        SurplusResponse response = surplusService.confirmPickup(
                request.getPostId(),
                request.getOtpCode(),
                donor
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<DonationTimelineDTO>> getTimeline(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        List<DonationTimelineDTO> timeline = surplusService.getTimelineForPost(id, user);
        return ResponseEntity.ok(timeline);
    }

    @DeleteMapping("/{id}/delete")
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<Void> deleteSurplusPost(
            @PathVariable Long id,
            @AuthenticationPrincipal User donor) {

        surplusService.deleteSurplusPost(id, donor);
        return ResponseEntity.noContent().build(); // 204
    }


}
