package com.example.foodflow.service;

import com.example.foodflow.model.dto.DonorPhotoSettingsRequest;
import com.example.foodflow.model.dto.DonorPhotoSettingsResponse;
import com.example.foodflow.model.entity.DonorPhotoPreferences;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PhotoDisplayType;
import com.example.foodflow.repository.DonationImageRepository;
import com.example.foodflow.repository.DonorPhotoPreferencesRepository;
import com.example.foodflow.repository.InternalImageLibraryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DonorPhotoPreferenceServiceTest {

    @Mock
    private DonorPhotoPreferencesRepository donorPhotoPreferencesRepository;
    @Mock
    private DonationImageRepository donationImageRepository;
    @Mock
    private InternalImageLibraryRepository internalImageLibraryRepository;

    private DonorPhotoPreferenceService service;

    @BeforeEach
    void setUp() {
        service = new DonorPhotoPreferenceService(
                donorPhotoPreferencesRepository,
                donationImageRepository,
                internalImageLibraryRepository,
                new ObjectMapper()
        );
    }

    @Test
    void updateSettings_persistsDisplayTypeAndMappings() {
        User donor = new User();
        donor.setId(7L);

        DonorPhotoPreferences existing = new DonorPhotoPreferences();
        existing.setDonor(donor);
        existing.setDisplayType(PhotoDisplayType.SINGLE);
        existing.setPerFoodTypeMap("{}");
        existing.setPerFoodTypeLibraryMap("{}");

        when(donorPhotoPreferencesRepository.findByDonorId(7L)).thenReturn(Optional.of(existing));
        when(donorPhotoPreferencesRepository.save(any(DonorPhotoPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DonorPhotoSettingsRequest request = new DonorPhotoSettingsRequest();
        request.setDisplayType(PhotoDisplayType.PER_FOOD_TYPE);
        request.setPerFoodTypeMap(Map.of("PRODUCE", 100L));
        request.setPerFoodTypeLibraryMap(Map.of());

        DonorPhotoSettingsResponse response = service.updateSettings(donor, request);

        assertThat(response.getDisplayType()).isEqualTo(PhotoDisplayType.PER_FOOD_TYPE);
        assertThat(response.getPerFoodTypeMap()).containsEntry("PRODUCE", 100L);
    }

    @Test
    void getSettings_withoutStoredRecord_createsDefaultSingleMode() {
        User donor = new User();
        donor.setId(12L);

        when(donorPhotoPreferencesRepository.findByDonorId(12L)).thenReturn(Optional.empty());

        DonorPhotoSettingsResponse response = service.getSettings(donor);

        assertThat(response.getDisplayType()).isEqualTo(PhotoDisplayType.SINGLE);
    }
}
