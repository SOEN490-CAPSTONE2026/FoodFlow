package com.example.foodflow.service;

import com.example.foodflow.model.entity.DonationImage;
import com.example.foodflow.model.entity.DonorPhotoPreferences;
import com.example.foodflow.model.entity.InternalImageLibrary;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.DonationImageStatus;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.PhotoDisplayType;
import com.example.foodflow.repository.DonationImageRepository;
import com.example.foodflow.repository.DonorPhotoPreferencesRepository;
import com.example.foodflow.repository.InternalImageLibraryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;

@Service
public class DonationImageResolverService {

    private final DonorPhotoPreferencesRepository donorPhotoPreferencesRepository;
    private final DonationImageRepository donationImageRepository;
    private final InternalImageLibraryRepository internalImageLibraryRepository;
    private final ObjectMapper objectMapper;

    public DonationImageResolverService(DonorPhotoPreferencesRepository donorPhotoPreferencesRepository,
                                        DonationImageRepository donationImageRepository,
                                        InternalImageLibraryRepository internalImageLibraryRepository,
                                        ObjectMapper objectMapper) {
        this.donorPhotoPreferencesRepository = donorPhotoPreferencesRepository;
        this.donationImageRepository = donationImageRepository;
        this.internalImageLibraryRepository = internalImageLibraryRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public String resolveDonationImageUrl(User donor, FoodType foodType) {
        if (donor == null) {
            return resolveFallback(foodType);
        }

        DonorPhotoPreferences preferences = donorPhotoPreferencesRepository.findByDonorId(donor.getId()).orElse(null);
        if (preferences == null) {
            return resolveFallback(foodType);
        }

        if (preferences.getDisplayType() == PhotoDisplayType.SINGLE) {
            String single = resolveDonationImage(preferences.getSingleImage());
            if (single != null) {
                return single;
            }
            String approvedDonorImage = resolveLatestApprovedDonorImage(donor.getId(), null);
            if (approvedDonorImage != null) {
                return approvedDonorImage;
            }
            if (preferences.getSingleLibraryImage() != null && Boolean.TRUE.equals(preferences.getSingleLibraryImage().getActive())) {
                return preferences.getSingleLibraryImage().getUrl();
            }
            return resolveFallback(foodType);
        }

        Map<String, Long> perFoodMap = parseMap(preferences.getPerFoodTypeMap());
        Long mappedImageId = foodType == null ? null : perFoodMap.get(foodType.name());
        if (mappedImageId != null) {
            String mappedUrl = donationImageRepository.findById(mappedImageId)
                    .map(this::resolveDonationImage)
                    .orElse(null);
            if (mappedUrl != null) {
                return mappedUrl;
            }
        }

        String approvedDonorTypeImage = resolveLatestApprovedDonorImage(donor.getId(), foodType);
        if (approvedDonorTypeImage != null) {
            return approvedDonorTypeImage;
        }

        Map<String, Long> perFoodLibraryMap = parseMap(preferences.getPerFoodTypeLibraryMap());
        Long mappedLibraryId = foodType == null ? null : perFoodLibraryMap.get(foodType.name());
        if (mappedLibraryId != null) {
            InternalImageLibrary libraryImage = internalImageLibraryRepository.findById(mappedLibraryId).orElse(null);
            if (libraryImage != null && Boolean.TRUE.equals(libraryImage.getActive())) {
                return libraryImage.getUrl();
            }
        }

        return resolveFallback(foodType);
    }

    private String resolveDonationImage(DonationImage image) {
        if (image == null) {
            return null;
        }
        return image.getStatus() == DonationImageStatus.APPROVED ? image.getUrl() : null;
    }

    private String resolveFallback(FoodType foodType) {
        if (foodType != null) {
            String byType = internalImageLibraryRepository
                    .findFirstByFoodTypeAndActiveTrueOrderByCreatedAtDesc(foodType)
                    .map(InternalImageLibrary::getUrl)
                    .orElse(null);
            if (byType != null) {
                return byType;
            }
        }
        return internalImageLibraryRepository
                .findFirstByFoodTypeIsNullAndActiveTrueOrderByCreatedAtDesc()
                .map(InternalImageLibrary::getUrl)
                .orElse(null);
    }

    private String resolveLatestApprovedDonorImage(Long donorId, FoodType foodType) {
        if (foodType != null) {
            String byType = donationImageRepository
                    .findFirstByDonorIdAndFoodTypeAndStatusOrderByCreatedAtDesc(
                            donorId,
                            foodType,
                            DonationImageStatus.APPROVED
                    )
                    .map(DonationImage::getUrl)
                    .orElse(null);
            if (byType != null) {
                return byType;
            }
        }

        return donationImageRepository
                .findFirstByDonorIdAndStatusOrderByCreatedAtDesc(
                        donorId,
                        DonationImageStatus.APPROVED
                )
                .map(DonationImage::getUrl)
                .orElse(null);
    }

    private Map<String, Long> parseMap(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
