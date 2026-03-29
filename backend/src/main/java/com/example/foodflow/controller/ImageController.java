package com.example.foodflow.controller;

import com.example.foodflow.model.dto.DonorPhotoSettingsRequest;
import com.example.foodflow.model.dto.DonorPhotoSettingsResponse;
import com.example.foodflow.model.dto.ImageUploadResponse;
import com.example.foodflow.model.dto.InternalLibraryImageResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.service.DonationImageService;
import com.example.foodflow.service.DonorPhotoPreferenceService;
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
@RequestMapping("/api")
public class ImageController {

    private final DonationImageService donationImageService;
    private final DonorPhotoPreferenceService donorPhotoPreferenceService;

    public ImageController(DonationImageService donationImageService,
                           DonorPhotoPreferenceService donorPhotoPreferenceService) {
        this.donationImageService = donationImageService;
        this.donorPhotoPreferenceService = donorPhotoPreferenceService;
    }

    @PostMapping(value = "/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<ImageUploadResponse> uploadImage(
            @AuthenticationPrincipal User donor,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "foodType", required = false) FoodType foodType,
            @RequestParam(value = "donationId", required = false) Long donationId) throws IOException {
        ImageUploadResponse response = donationImageService.uploadDonationImage(donor, file, foodType, donationId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/donor/settings/photos")
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<DonorPhotoSettingsResponse> getDonorPhotoSettings(@AuthenticationPrincipal User donor) {
        return ResponseEntity.ok(donorPhotoPreferenceService.getSettings(donor));
    }

    @GetMapping("/images/library")
    @PreAuthorize("hasAnyAuthority('DONOR', 'RECEIVER', 'ADMIN')")
    public ResponseEntity<List<InternalLibraryImageResponse>> getInternalLibrary(
            @RequestParam(value = "activeOnly", required = false, defaultValue = "true") Boolean activeOnly) {
        return ResponseEntity.ok(donationImageService.listInternalLibrary(activeOnly));
    }

    @PutMapping("/donor/settings/photos")
    @PreAuthorize("hasAuthority('DONOR')")
    public ResponseEntity<DonorPhotoSettingsResponse> updateDonorPhotoSettings(
            @AuthenticationPrincipal User donor,
            @RequestBody DonorPhotoSettingsRequest request) {
        return ResponseEntity.ok(donorPhotoPreferenceService.updateSettings(donor, request));
    }
}
