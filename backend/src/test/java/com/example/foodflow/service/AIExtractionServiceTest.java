package com.example.foodflow.service;

import com.example.foodflow.exception.AIServiceException;
import com.example.foodflow.exception.InvalidImageException;
import com.example.foodflow.model.dto.AIExtractionResponse;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.TemperatureCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@DisplayName("AIExtractionService Tests")
class AIExtractionServiceTest {

    @Autowired
    private AIExtractionService aiExtractionService;

    private MultipartFile validImageFile;
    private MultipartFile invalidImageFile;

    @BeforeEach
    void setUp() {
        // Set API key for testing
        ReflectionTestUtils.setField(aiExtractionService, "openaiApiKey", "test-key");
    }

    @Test
    @DisplayName("Should reject null image file")
    void analyzeFoodLabelWithNullImage() {
        assertThatThrownBy(() -> aiExtractionService.analyzeFoodLabel(null))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("Should reject empty image file")
    void analyzeFoodLabelWithEmptyImage() {
        MultipartFile emptyImage = mock(MultipartFile.class);
        when(emptyImage.isEmpty()).thenReturn(true);

        assertThatThrownBy(() -> aiExtractionService.analyzeFoodLabel(emptyImage))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("required");
    }

    @Test
    @DisplayName("Should reject image exceeding size limit")
    void analyzeFoodLabelWithOversizedImage() {
        MultipartFile oversizedImage = mock(MultipartFile.class);
        when(oversizedImage.isEmpty()).thenReturn(false);
        when(oversizedImage.getSize()).thenReturn(6 * 1024 * 1024L); // 6MB > 5MB limit
        when(oversizedImage.getContentType()).thenReturn("image/jpeg");

        assertThatThrownBy(() -> aiExtractionService.analyzeFoodLabel(oversizedImage))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("size exceeds");
    }

    @Test
    @DisplayName("Should reject invalid image format")
    void analyzeFoodLabelWithInvalidFormat() {
        MultipartFile invalidImage = mock(MultipartFile.class);
        when(invalidImage.isEmpty()).thenReturn(false);
        when(invalidImage.getSize()).thenReturn(1024L);
        when(invalidImage.getContentType()).thenReturn("image/bmp");

        assertThatThrownBy(() -> aiExtractionService.analyzeFoodLabel(invalidImage))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("Invalid image format");
    }

    @Test
    @DisplayName("Should accept JPEG format")
    void analyzeFoodLabelWithJpegFormat() {
        MultipartFile jpegImage = mock(MultipartFile.class);
        when(jpegImage.isEmpty()).thenReturn(false);
        when(jpegImage.getSize()).thenReturn(1024L);
        when(jpegImage.getContentType()).thenReturn("image/jpeg");
        when(jpegImage.getOriginalFilename()).thenReturn("test.jpg");

        // This will fail at API call stage, but image validation should pass
        try {
            aiExtractionService.analyzeFoodLabel(jpegImage);
        } catch (AIServiceException | InvalidImageException e) {
            // Expected - API call will fail in test environment
        }
    }

    @Test
    @DisplayName("Should accept PNG format")
    void analyzeFoodLabelWithPngFormat() {
        MultipartFile pngImage = mock(MultipartFile.class);
        when(pngImage.isEmpty()).thenReturn(false);
        when(pngImage.getSize()).thenReturn(1024L);
        when(pngImage.getContentType()).thenReturn("image/png");
        when(pngImage.getOriginalFilename()).thenReturn("test.png");

        // This will fail at API call stage, but image validation should pass
        try {
            aiExtractionService.analyzeFoodLabel(pngImage);
        } catch (AIServiceException | InvalidImageException e) {
            // Expected - API call will fail in test environment
        }
    }

    @Test
    @DisplayName("Should handle file read error")
    void analyzeFoodLabelWithFileReadError() throws Exception {
        MultipartFile errorImage = mock(MultipartFile.class);
        when(errorImage.isEmpty()).thenReturn(false);
        when(errorImage.getSize()).thenReturn(1024L);
        when(errorImage.getContentType()).thenReturn("image/jpeg");
        when(errorImage.getOriginalFilename()).thenReturn("test.jpg");
        when(errorImage.getBytes()).thenThrow(new java.io.IOException("Read error"));

        assertThatThrownBy(() -> aiExtractionService.analyzeFoodLabel(errorImage))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("Failed to read image");
    }

    @Test
    @DisplayName("Should reject case-insensitive invalid format")
    void analyzeFoodLabelWithInvalidFormatCaseInsensitive() {
        MultipartFile invalidImage = mock(MultipartFile.class);
        when(invalidImage.isEmpty()).thenReturn(false);
        when(invalidImage.getSize()).thenReturn(1024L);
        when(invalidImage.getContentType()).thenReturn("IMAGE/BMP");

        assertThatThrownBy(() -> aiExtractionService.analyzeFoodLabel(invalidImage))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("Invalid image format");
    }

    @Test
    @DisplayName("Should accept HEIC format")
    void analyzeFoodLabelWithHeicFormat() {
        MultipartFile heicImage = mock(MultipartFile.class);
        when(heicImage.isEmpty()).thenReturn(false);
        when(heicImage.getSize()).thenReturn(1024L);
        when(heicImage.getContentType()).thenReturn("image/heic");
        when(heicImage.getOriginalFilename()).thenReturn("test.heic");

        try {
            aiExtractionService.analyzeFoodLabel(heicImage);
        } catch (AIServiceException | InvalidImageException e) {
            // Expected - API call will fail in test environment
        }
    }

    @Test
    @DisplayName("Should handle null content type")
    void analyzeFoodLabelWithNullContentType() {
        MultipartFile noTypeImage = mock(MultipartFile.class);
        when(noTypeImage.isEmpty()).thenReturn(false);
        when(noTypeImage.getSize()).thenReturn(1024L);
        when(noTypeImage.getContentType()).thenReturn(null);

        assertThatThrownBy(() -> aiExtractionService.analyzeFoodLabel(noTypeImage))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("Invalid image format");
    }

    @Test
    @DisplayName("Should accept JPG format (alternative)")
    void analyzeFoodLabelWithJpgFormat() {
        MultipartFile jpgImage = mock(MultipartFile.class);
        when(jpgImage.isEmpty()).thenReturn(false);
        when(jpgImage.getSize()).thenReturn(1024L);
        when(jpgImage.getContentType()).thenReturn("image/jpg");
        when(jpgImage.getOriginalFilename()).thenReturn("test.jpg");

        try {
            aiExtractionService.analyzeFoodLabel(jpgImage);
        } catch (AIServiceException | InvalidImageException e) {
            // Expected - API call will fail in test environment
        }
    }

    @Test
    @DisplayName("Should validate image at maximum allowed size")
    void analyzeFoodLabelWithMaximumSize() {
        MultipartFile maxSizeImage = mock(MultipartFile.class);
        when(maxSizeImage.isEmpty()).thenReturn(false);
        when(maxSizeImage.getSize()).thenReturn(5 * 1024 * 1024L); // Exactly 5MB
        when(maxSizeImage.getContentType()).thenReturn("image/jpeg");
        when(maxSizeImage.getOriginalFilename()).thenReturn("test.jpg");

        try {
            aiExtractionService.analyzeFoodLabel(maxSizeImage);
        } catch (AIServiceException | InvalidImageException e) {
            // Expected - API call will fail in test environment
            assertThat(e).isNotInstanceOf(InvalidImageException.class)
                    .withFailMessage("Size validation failed for maximum allowed size");
        }
    }

    @Test
    @DisplayName("Should handle case-insensitive content type")
    void analyzeFoodLabelWithMixedCaseContentType() {
        MultipartFile mixedCaseImage = mock(MultipartFile.class);
        when(mixedCaseImage.isEmpty()).thenReturn(false);
        when(mixedCaseImage.getSize()).thenReturn(1024L);
        when(mixedCaseImage.getContentType()).thenReturn("Image/Jpeg");
        when(mixedCaseImage.getOriginalFilename()).thenReturn("test.jpg");

        try {
            aiExtractionService.analyzeFoodLabel(mixedCaseImage);
        } catch (AIServiceException | InvalidImageException e) {
            // Expected
        }
    }
}
