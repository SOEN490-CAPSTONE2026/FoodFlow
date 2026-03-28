package com.example.foodflow.controller;

import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.DonationImageStatus;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.service.DonationImageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminImageController {

    private final DonationImageService donationImageService;

    public AdminImageController(DonationImageService donationImageService) {
        this.donationImageService = donationImageService;
    }

    @GetMapping("/image-library")
    public ResponseEntity<List<InternalLibraryImageResponse>> getImageLibrary(
            @RequestParam(value = "activeOnly", required = false) Boolean activeOnly) {
        return ResponseEntity.ok(donationImageService.listInternalLibrary(activeOnly));
    }

    @PostMapping(value = "/image-library", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InternalLibraryImageResponse> addImageLibraryItem(
            @AuthenticationPrincipal User admin,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "imageUrl", required = false) String imageUrl,
            @RequestParam(value = "foodType", required = false) FoodType foodType,
            @RequestParam(value = "active", required = false) Boolean active) throws IOException {
        InternalLibraryImageResponse response = donationImageService.addInternalLibraryImage(admin, file, imageUrl, foodType, active);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/image-library/{id}")
    public ResponseEntity<Void> deleteImageLibraryItem(@PathVariable Long id) {
        donationImageService.deleteInternalLibraryImage(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/image-library/{id}")
    public ResponseEntity<InternalLibraryImageResponse> patchImageLibraryItem(
            @PathVariable Long id,
            @RequestBody AdminInternalImagePatchRequest request) {
        return ResponseEntity.ok(donationImageService.patchInternalLibraryImage(id, request));
    }

    @GetMapping("/uploads/images")
    public ResponseEntity<List<DonationImageResponse>> getUploadedImages(
            @RequestParam(value = "status", required = false) DonationImageStatus status) {
        return ResponseEntity.ok(donationImageService.listUploads(status));
    }

    @PatchMapping("/uploads/images/{id}")
    public ResponseEntity<DonationImageResponse> moderateImage(
            @PathVariable Long id,
            @RequestBody AdminImageModerationRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(donationImageService.moderateUpload(id, request, admin));
    }

    @DeleteMapping("/uploads/images/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id) {
        donationImageService.deleteUpload(id);
        return ResponseEntity.noContent().build();
    }
}
