package com.example.foodflow.controller;
import com.example.foodflow.model.dto.*;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.DonationImageStatus;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.service.DonationImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class AdminImageControllerTest {
    @Mock
    private DonationImageService donationImageService;
    @InjectMocks
    private AdminImageController adminImageController;
    private User admin;
    @BeforeEach
    void setUp() {
        admin = new User();
        admin.setId(1L);
        admin.setEmail("admin@example.com");
    }
    @Test
    void getImageLibrary_WithActiveOnly_ReturnsFilteredList() {
        // Given
        InternalLibraryImageResponse image1 = new InternalLibraryImageResponse();
        image1.setId(1L);
        InternalLibraryImageResponse image2 = new InternalLibraryImageResponse();
        image2.setId(2L);
        List<InternalLibraryImageResponse> images = Arrays.asList(image1, image2);
        when(donationImageService.listInternalLibrary(true)).thenReturn(images);
        // When
        ResponseEntity<List<InternalLibraryImageResponse>> response = adminImageController.getImageLibrary(true);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        verify(donationImageService).listInternalLibrary(true);
    }
    @Test
    void getImageLibrary_WithoutFilter_ReturnsAllImages() {
        // Given
        List<InternalLibraryImageResponse> images = Arrays.asList(new InternalLibraryImageResponse());
        when(donationImageService.listInternalLibrary(null)).thenReturn(images);
        // When
        ResponseEntity<List<InternalLibraryImageResponse>> response = adminImageController.getImageLibrary(null);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(donationImageService).listInternalLibrary(null);
    }
    @Test
    void addImageLibraryItem_WithFile_Success() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "test".getBytes());
        InternalLibraryImageResponse response = new InternalLibraryImageResponse();
        response.setId(1L);
        when(donationImageService.addInternalLibraryImage(eq(admin), any(), isNull(), eq(FoodType.BAKERY), eq(true)))
                .thenReturn(response);
        // When
        ResponseEntity<InternalLibraryImageResponse> result = adminImageController.addImageLibraryItem(
                admin, file, null, FoodType.BAKERY, true);
        // Then
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody().getId()).isEqualTo(1L);
        verify(donationImageService).addInternalLibraryImage(eq(admin), any(), isNull(), eq(FoodType.BAKERY), eq(true));
    }
    @Test
    void addImageLibraryItem_WithUrl_Success() throws IOException {
        // Given
        String imageUrl = "https://example.com/image.jpg";
        InternalLibraryImageResponse response = new InternalLibraryImageResponse();
        response.setId(2L);
        when(donationImageService.addInternalLibraryImage(admin, null, imageUrl, FoodType.DAIRY_EGGS, false))
                .thenReturn(response);
        // When
        ResponseEntity<InternalLibraryImageResponse> result = adminImageController.addImageLibraryItem(
                admin, null, imageUrl, FoodType.DAIRY_EGGS, false);
        // Then
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody().getId()).isEqualTo(2L);
        verify(donationImageService).addInternalLibraryImage(admin, null, imageUrl, FoodType.DAIRY_EGGS, false);
    }
    @Test
    void deleteImageLibraryItem_Success() {
        // Given
        Long imageId = 1L;
        doNothing().when(donationImageService).deleteInternalLibraryImage(imageId);
        // When
        ResponseEntity<Void> response = adminImageController.deleteImageLibraryItem(imageId);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(donationImageService).deleteInternalLibraryImage(imageId);
    }
    @Test
    void patchImageLibraryItem_Success() {
        // Given
        Long imageId = 1L;
        AdminInternalImagePatchRequest request = new AdminInternalImagePatchRequest();
        request.setActive(false);
        InternalLibraryImageResponse response = new InternalLibraryImageResponse();
        response.setId(imageId);
        when(donationImageService.patchInternalLibraryImage(imageId, request)).thenReturn(response);
        // When
        ResponseEntity<InternalLibraryImageResponse> result = adminImageController.patchImageLibraryItem(imageId, request);
        // Then
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody().getId()).isEqualTo(imageId);
        verify(donationImageService).patchInternalLibraryImage(imageId, request);
    }
    @Test
    void getUploadedImages_WithStatus_ReturnsFilteredList() {
        // Given
        DonationImageResponse image1 = new DonationImageResponse();
        image1.setId(1L);
        List<DonationImageResponse> images = Arrays.asList(image1);
        when(donationImageService.listUploads(DonationImageStatus.PENDING)).thenReturn(images);
        // When
        ResponseEntity<List<DonationImageResponse>> response = adminImageController.getUploadedImages(DonationImageStatus.PENDING);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(donationImageService).listUploads(DonationImageStatus.PENDING);
    }
    @Test
    void getUploadedImages_WithoutStatus_ReturnsAllImages() {
        // Given
        List<DonationImageResponse> images = Arrays.asList(new DonationImageResponse(), new DonationImageResponse());
        when(donationImageService.listUploads(null)).thenReturn(images);
        // When
        ResponseEntity<List<DonationImageResponse>> response = adminImageController.getUploadedImages(null);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        verify(donationImageService).listUploads(null);
    }
    @Test
    void moderateImage_Success() {
        // Given
        Long imageId = 1L;
        AdminImageModerationRequest request = new AdminImageModerationRequest();
        request.setStatus(DonationImageStatus.APPROVED);
        DonationImageResponse response = new DonationImageResponse();
        response.setId(imageId);
        when(donationImageService.moderateUpload(imageId, request, admin)).thenReturn(response);
        // When
        ResponseEntity<DonationImageResponse> result = adminImageController.moderateImage(imageId, request, admin);
        // Then
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody().getId()).isEqualTo(imageId);
        verify(donationImageService).moderateUpload(imageId, request, admin);
    }
    @Test
    void deleteImage_Success() {
        // Given
        Long imageId = 1L;
        doNothing().when(donationImageService).deleteUpload(imageId);
        // When
        ResponseEntity<Void> response = adminImageController.deleteImage(imageId);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(donationImageService).deleteUpload(imageId);
    }
}
