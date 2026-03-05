package com.example.foodflow.service;

import com.example.foodflow.model.dto.DonationImageResponse;
import com.example.foodflow.model.entity.DonationImage;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.DonationImageStatus;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.repository.DonationImageRepository;
import com.example.foodflow.repository.InternalImageLibraryRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

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

    @Test
    void toResponse_includesDonorIdentity() {
        User donor = new User();
        donor.setId(7L);
        donor.setEmail("donor@foodflow.org");

        Organization organization = new Organization();
        organization.setName("Community Kitchen");
        donor.setOrganization(organization);

        DonationImage image = new DonationImage();
        image.setId(22L);
        image.setDonor(donor);

        DonationImageResponse response = donationImageService.toResponse(image);

        assertThat(response.getDonorId()).isEqualTo(7L);
        assertThat(response.getDonorEmail()).isEqualTo("donor@foodflow.org");
        assertThat(response.getDonorName()).isEqualTo("Community Kitchen");
    }

    @Test
    void uploadDonationImage_withDonationId_setsApprovedStatus() throws Exception {
        User donor = new User();
        donor.setId(9L);

        SurplusPost post = new SurplusPost();
        post.setId(123L);
        post.setDonor(donor);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "donation.jpg",
                "image/jpeg",
                "ok".getBytes()
        );

        when(surplusPostRepository.findById(123L)).thenReturn(java.util.Optional.of(post));
        when(fileStorageService.storeFile(any(), any())).thenReturn("/api/files/donation-images/donor-9/donation.jpg");
        when(donationImageRepository.save(any(DonationImage.class))).thenAnswer(invocation -> {
            DonationImage img = invocation.getArgument(0);
            img.setId(555L);
            return img;
        });

        com.example.foodflow.model.dto.ImageUploadResponse response =
                donationImageService.uploadDonationImage(donor, file, FoodType.PRODUCE, 123L);

        assertThat(response.getImage()).isNotNull();
        assertThat(response.getImage().getStatus()).isEqualTo(DonationImageStatus.APPROVED);
        assertThat(response.getImage().getDonationId()).isEqualTo(123L);
    }
}
