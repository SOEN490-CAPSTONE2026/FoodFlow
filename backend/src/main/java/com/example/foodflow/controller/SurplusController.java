package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CompleteSurplusRequest;
import com.example.foodflow.model.dto.ConfirmPickupRequest;
import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.DonationTimelineDTO;
import com.example.foodflow.model.dto.ExpiryOverrideRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.dto.SurplusFilterRequest;
import com.example.foodflow.model.dto.UploadEvidenceResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.DietaryMatchMode;
import com.example.foodflow.model.types.DietaryTag;
import com.example.foodflow.model.types.FoodTaxonomyContract;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.service.SurplusService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
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
            @RequestParam(required = false) String foodType,
            @RequestParam(required = false) String dietaryTags,
            @RequestParam(defaultValue = "ANY") String dietaryMatch,
            @RequestParam(required = false) String sort,
            @AuthenticationPrincipal User receiver) {
        // Use filters if provided, default to available posts.
        SurplusFilterRequest filterRequest = new SurplusFilterRequest();
        filterRequest.setStatus("AVAILABLE");
        filterRequest.setFoodTypes(parseFoodTypes(foodType));
        filterRequest.setDietaryTags(parseDietaryTags(dietaryTags));
        filterRequest.setDietaryMatch(parseDietaryMatch(dietaryMatch));
        filterRequest.setSort(sort);
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
            @RequestParam(required = false) String foodType,
            @RequestParam(required = false) String dietaryTags,
            @RequestParam(defaultValue = "ANY") String dietaryMatch,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String expiryBefore,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal User receiver) {


        // Create filter request from query parameters
        SurplusFilterRequest filterRequest = new SurplusFilterRequest();
        filterRequest.setFoodCategories(foodCategories);
        filterRequest.setFoodTypes(parseFoodTypes(foodType));
        filterRequest.setDietaryTags(parseDietaryTags(dietaryTags));
        filterRequest.setDietaryMatch(parseDietaryMatch(dietaryMatch));
        filterRequest.setSort(sort);
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

    private List<FoodType> parseFoodTypes(String rawFoodType) {
        if (rawFoodType == null || rawFoodType.isBlank()) {
            return null;
        }

        String[] parts = rawFoodType.split(",");
        List<FoodType> values = new ArrayList<>();
        for (String part : parts) {
            String normalized = part == null ? "" : part.trim();
            if (normalized.isEmpty()) {
                continue;
            }
            try {
                values.add(FoodType.valueOf(normalized));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException(
                        "Invalid foodType '" + normalized + "'. Allowed values: [" + FoodTaxonomyContract.allowedFoodTypes()
                                + "]");
            }
        }
        return values;
    }

    private List<DietaryTag> parseDietaryTags(String rawDietaryTags) {
        if (rawDietaryTags == null || rawDietaryTags.isBlank()) {
            return null;
        }

        String[] parts = rawDietaryTags.split(",");
        List<DietaryTag> values = new ArrayList<>();
        for (String part : parts) {
            String normalized = part == null ? "" : part.trim();
            if (normalized.isEmpty()) {
                continue;
            }
            try {
                values.add(DietaryTag.valueOf(normalized));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException(
                        "Invalid dietaryTags value '" + normalized + "'. Allowed values: ["
                                + FoodTaxonomyContract.allowedDietaryTags()
                                + "]");
            }
        }
        return values;
    }

    private DietaryMatchMode parseDietaryMatch(String rawDietaryMatch) {
        if (rawDietaryMatch == null || rawDietaryMatch.isBlank()) {
            return DietaryMatchMode.ANY;
        }

        try {
            return DietaryMatchMode.valueOf(rawDietaryMatch.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid dietaryMatch '" + rawDietaryMatch + "'. Allowed values: [ANY, ALL]");
        }
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

    @PostMapping("/{id}/expiry/override")
    @PreAuthorize("hasAnyAuthority('DONOR','ADMIN')")
    public ResponseEntity<SurplusResponse> overrideExpiry(
            @PathVariable Long id,
            @Valid @RequestBody ExpiryOverrideRequest request,
            @AuthenticationPrincipal User actor) {
        SurplusResponse response = surplusService.overrideExpiry(id, request.getExpiryDate(), request.getReason(), actor);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/expiry/override")
    @PreAuthorize("hasAnyAuthority('DONOR','ADMIN')")
    public ResponseEntity<SurplusResponse> clearExpiryOverride(
            @PathVariable Long id,
            @AuthenticationPrincipal User actor) {
        SurplusResponse response = surplusService.clearExpiryOverride(id, actor);
        return ResponseEntity.ok(response);
    }

    /**
     * Upload pickup evidence photo for a donation.
     * Only the donor of this donation can upload evidence.
     */
    @PostMapping(value = "/{id}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<UploadEvidenceResponse> uploadPickupEvidence(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User donor) {

        try {
            UploadEvidenceResponse response = surplusService.uploadPickupEvidence(id, file, donor);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                new UploadEvidenceResponse(null, e.getMessage(), false)
            );
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new UploadEvidenceResponse(null, "Failed to upload file", false)
            );
        }
    }

}
