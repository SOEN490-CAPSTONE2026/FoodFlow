package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CreateSurplusRequest;
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

    @GetMapping
    @PreAuthorize("hasAuthority('RECEIVER')")
    public ResponseEntity<List<SurplusResponse>> getAllAvailableSurplus() {
        List<SurplusResponse> availablePosts = surplusService.getAllAvailableSurplusPosts();
        return ResponseEntity.ok(availablePosts);
    }

     /**
     * New endpoint for filtered surplus posts based on receiver criteria.
     * If no filters are provided, returns all available posts.
     */
    @PostMapping("/search")
    @PreAuthorize("hasAuthority('RECEIVER')")
    public ResponseEntity<List<SurplusResponse>> searchSurplusPosts(
            @Valid @RequestBody SurplusFilterRequest filterRequest,
            @AuthenticationPrincipal User receiver) {
        List<SurplusResponse> filteredPosts = surplusService.searchSurplusPosts(filterRequest);
        return ResponseEntity.ok(filteredPosts);

    }
    /**
     * Alternative GET endpoint for basic filtering via query parameters.
     * Useful for simple filters without complex objects like Location.
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
        List<SurplusResponse> filteredPosts = surplusService.searchSurplusPosts(filterRequest);
        return ResponseEntity.ok(filteredPosts);
    }
}
