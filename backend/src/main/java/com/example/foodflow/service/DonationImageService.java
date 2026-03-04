package com.example.foodflow.service;

import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.DonationImage;
import com.example.foodflow.model.entity.InternalImageLibrary;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.DonationImageStatus;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.repository.DonationImageRepository;
import com.example.foodflow.repository.InternalImageLibraryRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class DonationImageService {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp");

    private final DonationImageRepository donationImageRepository;
    private final InternalImageLibraryRepository internalImageLibraryRepository;
    private final SurplusPostRepository surplusPostRepository;
    private final FileStorageService fileStorageService;

    public DonationImageService(DonationImageRepository donationImageRepository,
                                InternalImageLibraryRepository internalImageLibraryRepository,
                                SurplusPostRepository surplusPostRepository,
                                FileStorageService fileStorageService) {
        this.donationImageRepository = donationImageRepository;
        this.internalImageLibraryRepository = internalImageLibraryRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public ImageUploadResponse uploadDonationImage(User donor, MultipartFile file, FoodType foodType, Long donationId)
            throws IOException {
        validateImage(file);

        SurplusPost donation = null;
        if (donationId != null) {
            donation = surplusPostRepository.findById(donationId)
                    .orElseThrow(() -> new IllegalArgumentException("Donation not found"));
            if (!donation.getDonor().getId().equals(donor.getId())) {
                throw new IllegalArgumentException("You are not authorized to upload an image for this donation");
            }
        }

        String imageUrl = fileStorageService.storeFile(file, "donation-images/donor-" + donor.getId());

        DonationImage donationImage = new DonationImage();
        donationImage.setDonor(donor);
        donationImage.setDonation(donation);
        donationImage.setFoodType(foodType);
        donationImage.setUrl(imageUrl);
        donationImage.setStatus(DonationImageStatus.PENDING);
        donationImage.setOriginalFileName(file.getOriginalFilename());
        donationImage.setContentType(file.getContentType());
        donationImage.setFileSize(file.getSize());

        DonationImage saved = donationImageRepository.save(donationImage);
        return new ImageUploadResponse("Image uploaded and queued for moderation", toResponse(saved));
    }

    @Transactional(readOnly = true)
    public List<DonationImageResponse> listUploads(DonationImageStatus status) {
        List<DonationImage> images = status == null
                ? donationImageRepository.findAllByOrderByCreatedAtDesc()
                : donationImageRepository.findByStatusOrderByCreatedAtDesc(status);
        return images.stream().map(this::toResponse).toList();
    }

    @Transactional
    public DonationImageResponse moderateUpload(Long imageId, AdminImageModerationRequest request, User admin) {
        if (request.getStatus() == null) {
            throw new IllegalArgumentException("status is required");
        }
        if (request.getStatus() == DonationImageStatus.PENDING) {
            throw new IllegalArgumentException("PENDING is not a valid moderation target status");
        }

        DonationImage image = donationImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));

        image.setStatus(request.getStatus());
        image.setReason(request.getReason());
        image.setModeratedBy(admin);
        image.setModeratedAt(LocalDateTime.now());

        return toResponse(donationImageRepository.save(image));
    }

    @Transactional
    public void deleteUpload(Long imageId) {
        DonationImage image = donationImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));
        if (image.getUrl() != null && image.getUrl().startsWith("/api/files/")) {
            fileStorageService.deleteFile(image.getUrl());
        }
        donationImageRepository.delete(image);
    }

    @Transactional(readOnly = true)
    public List<InternalLibraryImageResponse> listInternalLibrary(Boolean activeOnly) {
        List<InternalImageLibrary> images = Boolean.TRUE.equals(activeOnly)
                ? internalImageLibraryRepository.findByActiveTrueOrderByCreatedAtDesc()
                : internalImageLibraryRepository.findAllByOrderByCreatedAtDesc();
        return images.stream().map(this::toResponse).toList();
    }

    @Transactional
    public InternalLibraryImageResponse addInternalLibraryImage(User admin,
                                                                MultipartFile file,
                                                                String imageUrl,
                                                                FoodType foodType,
                                                                Boolean active) throws IOException {
        String finalUrl = imageUrl;
        if (file != null && !file.isEmpty()) {
            validateImage(file);
            finalUrl = fileStorageService.storeFile(file, "internal-library");
        }

        if (finalUrl == null || finalUrl.isBlank()) {
            throw new IllegalArgumentException("Either file or imageUrl is required");
        }

        InternalImageLibrary libraryImage = new InternalImageLibrary();
        libraryImage.setFoodType(foodType);
        libraryImage.setUrl(finalUrl.trim());
        libraryImage.setActive(active == null ? true : active);
        libraryImage.setCreatedBy(admin);

        return toResponse(internalImageLibraryRepository.save(libraryImage));
    }

    @Transactional
    public InternalLibraryImageResponse patchInternalLibraryImage(Long id, AdminInternalImagePatchRequest request) {
        InternalImageLibrary image = internalImageLibraryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Internal library image not found"));
        if (request.getActive() != null) {
            image.setActive(request.getActive());
        }
        return toResponse(internalImageLibraryRepository.save(image));
    }

    @Transactional
    public void deleteInternalLibraryImage(Long id) {
        InternalImageLibrary image = internalImageLibraryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Internal library image not found"));
        if (image.getUrl() != null && image.getUrl().startsWith("/api/files/")) {
            fileStorageService.deleteFile(image.getUrl());
        }
        internalImageLibraryRepository.delete(image);
    }

    public DonationImageResponse toResponse(DonationImage image) {
        DonationImageResponse response = new DonationImageResponse();
        response.setId(image.getId());
        response.setDonorId(image.getDonor() != null ? image.getDonor().getId() : null);
        if (image.getDonor() != null) {
            String donorName = image.getDonor().getFullName();
            if ((donorName == null || donorName.isBlank()) && image.getDonor().getOrganization() != null) {
                donorName = image.getDonor().getOrganization().getName();
            }
            response.setDonorName(donorName);
            response.setDonorEmail(image.getDonor().getEmail());
        }
        response.setDonationId(image.getDonation() != null ? image.getDonation().getId() : null);
        response.setFoodType(image.getFoodType());
        response.setUrl(image.getUrl());
        response.setStatus(image.getStatus());
        response.setOriginalFileName(image.getOriginalFileName());
        response.setContentType(image.getContentType());
        response.setFileSize(image.getFileSize());
        response.setCreatedAt(image.getCreatedAt());
        response.setModeratedBy(image.getModeratedBy() != null ? image.getModeratedBy().getId() : null);
        response.setModeratedAt(image.getModeratedAt());
        response.setReason(image.getReason());
        return response;
    }

    private InternalLibraryImageResponse toResponse(InternalImageLibrary image) {
        InternalLibraryImageResponse response = new InternalLibraryImageResponse();
        response.setId(image.getId());
        response.setFoodType(image.getFoodType());
        response.setUrl(image.getUrl());
        response.setActive(image.getActive());
        response.setCreatedAt(image.getCreatedAt());
        response.setCreatedBy(image.getCreatedBy() != null ? image.getCreatedBy().getId() : null);
        return response;
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Image size exceeds maximum allowed size of 5MB");
        }
        String contentType = file.getContentType();
        String normalized = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (!ALLOWED_CONTENT_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid image format. Allowed formats: JPEG, PNG, WEBP");
        }
    }
}
