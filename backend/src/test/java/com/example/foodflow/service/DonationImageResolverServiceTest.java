package com.example.foodflow.service;

import com.example.foodflow.model.entity.*;
import com.example.foodflow.model.types.DonationImageStatus;
import com.example.foodflow.model.types.FoodType;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DonationImageResolverServiceTest {

    @Mock
    private DonorPhotoPreferencesRepository donorPhotoPreferencesRepository;
    @Mock
    private DonationImageRepository donationImageRepository;
    @Mock
    private InternalImageLibraryRepository internalImageLibraryRepository;

    private DonationImageResolverService service;

    @BeforeEach
    void setUp() {
        service = new DonationImageResolverService(
                donorPhotoPreferencesRepository,
                donationImageRepository,
                internalImageLibraryRepository,
                new ObjectMapper()
        );
    }

    @Test
    void resolveDonationImageUrl_singleApprovedImage_returnsDonorImage() {
        User donor = new User();
        donor.setId(10L);

        DonationImage image = new DonationImage();
        image.setId(101L);
        image.setUrl("/api/files/donation-images/approved.jpg");
        image.setStatus(DonationImageStatus.APPROVED);

        DonorPhotoPreferences preferences = new DonorPhotoPreferences();
        preferences.setDisplayType(PhotoDisplayType.SINGLE);
        preferences.setSingleImage(image);

        when(donorPhotoPreferencesRepository.findByDonorId(10L)).thenReturn(Optional.of(preferences));

        String resolved = service.resolveDonationImageUrl(donor, FoodType.PRODUCE);

        assertThat(resolved).isEqualTo("/api/files/donation-images/approved.jpg");
    }

    @Test
    void resolveDonationImageUrl_perFoodTypeWithoutApprovedImage_fallsBackToLibrary() {
        User donor = new User();
        donor.setId(11L);

        DonorPhotoPreferences preferences = new DonorPhotoPreferences();
        preferences.setDisplayType(PhotoDisplayType.PER_FOOD_TYPE);
        preferences.setPerFoodTypeMap("{\"PRODUCE\": 999}");
        preferences.setPerFoodTypeLibraryMap("{}");

        InternalImageLibrary library = new InternalImageLibrary();
        library.setUrl("https://example.com/library-produce.jpg");
        library.setActive(true);

        when(donorPhotoPreferencesRepository.findByDonorId(11L)).thenReturn(Optional.of(preferences));
        when(donationImageRepository.findById(999L)).thenReturn(Optional.empty());
        when(internalImageLibraryRepository.findFirstByFoodTypeAndActiveTrueOrderByCreatedAtDesc(FoodType.PRODUCE))
                .thenReturn(Optional.of(library));

        String resolved = service.resolveDonationImageUrl(donor, FoodType.PRODUCE);

        assertThat(resolved).isEqualTo("https://example.com/library-produce.jpg");
    }

    @Test
    void resolveDonationImageUrl_singlePendingImage_usesSingleFallbackLibraryImage() {
        User donor = new User();
        donor.setId(15L);

        DonationImage pendingImage = new DonationImage();
        pendingImage.setStatus(DonationImageStatus.PENDING);
        pendingImage.setUrl("/api/files/donation-images/pending.jpg");

        DonorPhotoPreferences preferences = new DonorPhotoPreferences();
        preferences.setDisplayType(PhotoDisplayType.SINGLE);
        preferences.setSingleImage(pendingImage);
        InternalImageLibrary singleLibraryImage = new InternalImageLibrary();
        singleLibraryImage.setActive(true);
        singleLibraryImage.setUrl("https://cdn.foodflow/internal/single-fallback.jpg");
        preferences.setSingleLibraryImage(singleLibraryImage);

        when(donorPhotoPreferencesRepository.findByDonorId(15L)).thenReturn(Optional.of(preferences));

        String resolved = service.resolveDonationImageUrl(donor, FoodType.BAKERY);

        assertThat(resolved).isEqualTo("https://cdn.foodflow/internal/single-fallback.jpg");
    }

    @Test
    void resolveDonationImageUrl_perFoodTypeMissing_usesSingleConfiguredImageAsFallback() {
        User donor = new User();
        donor.setId(21L);

        DonationImage singleImage = new DonationImage();
        singleImage.setStatus(DonationImageStatus.APPROVED);
        singleImage.setUrl("/api/files/donation-images/donor-21/single-approved.jpg");

        DonorPhotoPreferences preferences = new DonorPhotoPreferences();
        preferences.setDisplayType(PhotoDisplayType.PER_FOOD_TYPE);
        preferences.setSingleImage(singleImage);
        preferences.setPerFoodTypeMap("{\"PRODUCE\": 555}");
        preferences.setPerFoodTypeLibraryMap("{}");

        when(donorPhotoPreferencesRepository.findByDonorId(21L)).thenReturn(Optional.of(preferences));
        when(donationImageRepository.findById(555L)).thenReturn(Optional.empty());

        String resolved = service.resolveDonationImageUrl(donor, FoodType.PRODUCE);

        assertThat(resolved).isEqualTo("/api/files/donation-images/donor-21/single-approved.jpg");
    }

    @Test
    void resolveDonationImageUrl_perFoodTypeMissing_usesSingleLibraryFallbackWhenSingleUploadMissing() {
        User donor = new User();
        donor.setId(22L);

        InternalImageLibrary singleLibraryImage = new InternalImageLibrary();
        singleLibraryImage.setActive(true);
        singleLibraryImage.setUrl("https://cdn.foodflow/internal/single-fallback.jpg");

        DonorPhotoPreferences preferences = new DonorPhotoPreferences();
        preferences.setDisplayType(PhotoDisplayType.PER_FOOD_TYPE);
        preferences.setSingleLibraryImage(singleLibraryImage);
        preferences.setPerFoodTypeMap("{}");
        preferences.setPerFoodTypeLibraryMap("{}");

        when(donorPhotoPreferencesRepository.findByDonorId(22L)).thenReturn(Optional.of(preferences));

        String resolved = service.resolveDonationImageUrl(donor, FoodType.MEAT_POULTRY);

        assertThat(resolved).isEqualTo("https://cdn.foodflow/internal/single-fallback.jpg");
    }

    @Test
    void resolveDonationImageUrl_donationSpecificImage_takesPriority() {
        User donor = new User();
        donor.setId(44L);

        DonorPhotoPreferences preferences = new DonorPhotoPreferences();
        preferences.setDisplayType(PhotoDisplayType.SINGLE);

        DonationImage donationSpecific = new DonationImage();
        donationSpecific.setStatus(DonationImageStatus.APPROVED);
        donationSpecific.setUrl("/api/files/donation-images/donation-999.jpg");

        when(donationImageRepository.findFirstByDonationIdAndStatusOrderByCreatedAtDesc(999L, DonationImageStatus.APPROVED))
                .thenReturn(Optional.of(donationSpecific));

        String resolved = service.resolveDonationImageUrl(donor, FoodType.PRODUCE, 999L);

        assertThat(resolved).isEqualTo("/api/files/donation-images/donation-999.jpg");
    }
}
