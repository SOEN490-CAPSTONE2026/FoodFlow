package com.example.foodflow.service;
import com.example.foodflow.model.dto.DonorPhotoSettingsRequest;
import com.example.foodflow.model.dto.DonorPhotoSettingsResponse;
import com.example.foodflow.model.entity.DonationImage;
import com.example.foodflow.model.entity.DonorPhotoPreferences;
import com.example.foodflow.model.entity.InternalImageLibrary;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PhotoDisplayType;
import com.example.foodflow.repository.DonationImageRepository;
import com.example.foodflow.repository.DonorPhotoPreferencesRepository;
import com.example.foodflow.repository.InternalImageLibraryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
@Service
public class DonorPhotoPreferenceService {
    private final DonorPhotoPreferencesRepository donorPhotoPreferencesRepository;
    private final DonationImageRepository donationImageRepository;
    private final InternalImageLibraryRepository internalImageLibraryRepository;
    private final ObjectMapper objectMapper;
    public DonorPhotoPreferenceService(DonorPhotoPreferencesRepository donorPhotoPreferencesRepository,
                                       DonationImageRepository donationImageRepository,
                                       InternalImageLibraryRepository internalImageLibraryRepository,
                                       ObjectMapper objectMapper) {
        this.donorPhotoPreferencesRepository = donorPhotoPreferencesRepository;
        this.donationImageRepository = donationImageRepository;
        this.internalImageLibraryRepository = internalImageLibraryRepository;
        this.objectMapper = objectMapper;
    }
    @Transactional(readOnly = true)
    public DonorPhotoSettingsResponse getSettings(User donor) {
        DonorPhotoPreferences preferences = donorPhotoPreferencesRepository.findByDonorId(donor.getId())
                .orElseGet(() -> buildDefaultPreferences(donor));
        return toResponse(preferences);
    }
    @Transactional
    public DonorPhotoSettingsResponse updateSettings(User donor, DonorPhotoSettingsRequest request) {
        DonorPhotoPreferences preferences = getOrCreate(donor);
        preferences.setDisplayType(request.getDisplayType() == null ? PhotoDisplayType.SINGLE : request.getDisplayType());
        if (request.getSingleImageId() != null) {
            preferences.setSingleImage(validateDonorImageOwnership(request.getSingleImageId(), donor.getId()));
        } else {
            preferences.setSingleImage(null);
        }
        if (request.getSingleLibraryImageId() != null) {
            preferences.setSingleLibraryImage(validateLibraryImage(request.getSingleLibraryImageId()));
        } else {
            preferences.setSingleLibraryImage(null);
        }
        preferences.setPerFoodTypeMap(serializeMap(filterNullValues(request.getPerFoodTypeMap())));
        preferences.setPerFoodTypeLibraryMap(serializeMap(filterNullValues(request.getPerFoodTypeLibraryMap())));
        DonorPhotoPreferences saved = donorPhotoPreferencesRepository.save(preferences);
        return toResponse(saved);
    }
    public DonorPhotoPreferences getOrCreate(User donor) {
        return donorPhotoPreferencesRepository.findByDonorId(donor.getId())
                .orElseGet(() -> donorPhotoPreferencesRepository.save(buildDefaultPreferences(donor)));
    }
    private DonorPhotoSettingsResponse toResponse(DonorPhotoPreferences preferences) {
        Map<String, Long> perFoodTypeMap = parseMap(preferences.getPerFoodTypeMap());
        Map<String, Long> perFoodTypeLibraryMap = parseMap(preferences.getPerFoodTypeLibraryMap());
        DonorPhotoSettingsResponse response = new DonorPhotoSettingsResponse();
        response.setDisplayType(preferences.getDisplayType());
        response.setSingleImageId(preferences.getSingleImage() != null ? preferences.getSingleImage().getId() : null);
        response.setSingleImageUrl(preferences.getSingleImage() != null ? preferences.getSingleImage().getUrl() : null);
        response.setSingleLibraryImageId(preferences.getSingleLibraryImage() != null ? preferences.getSingleLibraryImage().getId() : null);
        response.setSingleLibraryImageUrl(preferences.getSingleLibraryImage() != null ? preferences.getSingleLibraryImage().getUrl() : null);
        response.setPerFoodTypeMap(perFoodTypeMap);
        response.setPerFoodTypeUrls(resolveDonationImageUrls(perFoodTypeMap));
        response.setPerFoodTypeLibraryMap(perFoodTypeLibraryMap);
        response.setPerFoodTypeLibraryUrls(resolveLibraryImageUrls(perFoodTypeLibraryMap));
        return response;
    }
    private DonationImage validateDonorImageOwnership(Long imageId, Long donorId) {
        return donationImageRepository.findByIdAndDonorId(imageId, donorId)
                .orElseThrow(() -> new IllegalArgumentException("Image " + imageId + " does not belong to this donor"));
    }
    private InternalImageLibrary validateLibraryImage(Long imageId) {
        return internalImageLibraryRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Internal library image " + imageId + " not found"));
    }
    private Map<String, String> resolveDonationImageUrls(Map<String, Long> map) {
        if (map.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, String> idToUrl = donationImageRepository.findAllById(map.values()).stream()
                .collect(Collectors.toMap(DonationImage::getId, DonationImage::getUrl, (left, right) -> left));
        Map<String, String> result = new HashMap<>();
        map.forEach((key, value) -> result.put(key, idToUrl.get(value)));
        return result;
    }
    private Map<String, String> resolveLibraryImageUrls(Map<String, Long> map) {
        if (map.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, String> idToUrl = internalImageLibraryRepository.findAllById(map.values()).stream()
                .collect(Collectors.toMap(InternalImageLibrary::getId, InternalImageLibrary::getUrl, (left, right) -> left));
        Map<String, String> result = new HashMap<>();
        map.forEach((key, value) -> result.put(key, idToUrl.get(value)));
        return result;
    }
    private String serializeMap(Map<String, Long> map) {
        try {
            return objectMapper.writeValueAsString(map == null ? Collections.emptyMap() : map);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to save photo settings map");
        }
    }
    private Map<String, Long> parseMap(String json) {
        if (json == null || json.isBlank()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
    private Map<String, Long> filterNullValues(Map<String, Long> source) {
        if (source == null) {
            return new HashMap<>();
        }
        return source.entrySet().stream()
                .filter(entry -> entry.getKey() != null && !entry.getKey().isBlank() && Objects.nonNull(entry.getValue()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }
    private DonorPhotoPreferences buildDefaultPreferences(User donor) {
        DonorPhotoPreferences preferences = new DonorPhotoPreferences();
        preferences.setDonor(donor);
        preferences.setDisplayType(PhotoDisplayType.SINGLE);
        preferences.setPerFoodTypeMap("{}");
        preferences.setPerFoodTypeLibraryMap("{}");
        return preferences;
    }
}
