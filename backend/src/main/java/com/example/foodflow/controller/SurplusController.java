package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.SurplusService;
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
    public ResponseEntity<List<SurplusResponse>> getAvailableSurplusPosts() {
        List<SurplusResponse> posts = surplusService.getAvailableSurplusPosts();
        return ResponseEntity.ok(posts);
    }

    @GetMapping
    public ResponseEntity<List<SurplusResponse>> getAllAvailableSurplus() {
        List<SurplusResponse> availablePosts = surplusService.getAvailableSurplusPosts();
        return ResponseEntity.ok(availablePosts);
    }

    @GetMapping("/my-posts")
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<List<SurplusResponse>> getMyPosts(@AuthenticationPrincipal User user) {
        List<SurplusResponse> userPosts = surplusService.getUserSurplusPosts(user);
        return ResponseEntity.ok(userPosts);
    }
}
