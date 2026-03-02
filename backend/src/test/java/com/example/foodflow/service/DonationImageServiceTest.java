package com.example.foodflow.service;

import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.DonationImageRepository;
import com.example.foodflow.repository.InternalImageLibraryRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class DonationImageServiceTest {

    @Mock
    private DonationImageRepository donationImageRepository;
    @Mock
    private InternalImageLibraryRepository internalImageLibraryRepository;
    @Mock
    private SurplusPostRepository surplusPostRepository;
    @Mock
    private FileStorageService fileStorageService;

    private DonationImageService donationImageService;

    @BeforeEach
    void setUp() {
        donationImageService = new DonationImageService(
                donationImageRepository,
                internalImageLibraryRepository,
                surplusPostRepository,
                fileStorageService
        );
    }

    @Test
    void uploadDonationImage_rejectsInvalidContentType() {
        User donor = new User();
        donor.setId(2L);

        MockMultipartFile invalid = new MockMultipartFile(
                "file",
                "sample.gif",
                "image/gif",
                "bad".getBytes()
        );

        assertThatThrownBy(() -> donationImageService.uploadDonationImage(donor, invalid, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Allowed formats");
    }

    @Test
    void uploadDonationImage_rejectsOverLimitFileSize() {
        User donor = new User();
        donor.setId(2L);

        MockMultipartFile large = new MockMultipartFile(
                "file",
                "large.jpg",
                "image/jpeg",
                new byte[6 * 1024 * 1024]
        );

        assertThatThrownBy(() -> donationImageService.uploadDonationImage(donor, large, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5MB");
    }
}
