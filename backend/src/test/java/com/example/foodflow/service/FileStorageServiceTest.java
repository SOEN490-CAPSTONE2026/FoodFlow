package com.example.foodflow.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileStorageServiceTest {

    private FileStorageService fileStorageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService();
        ReflectionTestUtils.setField(fileStorageService, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(fileStorageService, "baseUrl", "/api/files");
    }

    @Test
    void storeFile_withValidJpegFile_shouldSaveAndReturnUrl() throws IOException {
        // Given
        byte[] content = "fake image content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test-image.jpg",
            "image/jpeg",
            content
        );

        // When
        String url = fileStorageService.storeFile(file, "evidence/donation-1");

        // Then
        assertThat(url).startsWith("/api/files/evidence/donation-1/");
        assertThat(url).endsWith(".jpg");

        // Verify file was actually saved
        String filename = url.substring(url.lastIndexOf("/") + 1);
        Path savedFile = tempDir.resolve("evidence/donation-1").resolve(filename);
        assertThat(Files.exists(savedFile)).isTrue();
        assertThat(Files.readAllBytes(savedFile)).isEqualTo(content);
    }

    @Test
    void storeFile_withValidPngFile_shouldSaveAndReturnUrl() throws IOException {
        // Given
        byte[] content = "fake png content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test-image.png",
            "image/png",
            content
        );

        // When
        String url = fileStorageService.storeFile(file, "evidence/donation-2");

        // Then
        assertThat(url).startsWith("/api/files/evidence/donation-2/");
        assertThat(url).endsWith(".png");
    }

    @Test
    void storeFile_withEmptyFile_shouldThrowException() {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file",
            "empty.jpg",
            "image/jpeg",
            new byte[0]
        );

        // When/Then
        assertThatThrownBy(() -> fileStorageService.storeFile(emptyFile, "evidence"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("empty");
    }

    @Test
    void storeFile_withInvalidContentType_shouldThrowException() {
        // Given - use a truly unsupported mime type (pdf is now allowed)
        MockMultipartFile zipFile = new MockMultipartFile(
            "file",
            "archive.zip",
            "application/zip",
            "zipcontent".getBytes()
        );

        // When/Then
        assertThatThrownBy(() -> fileStorageService.storeFile(zipFile, "evidence"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid file type");
    }

    @Test
    void storeFile_withFileTooLarge_shouldThrowException() {
        // Given - create a file larger than the current 10MB limit
        byte[] largeContent = new byte[11 * 1024 * 1024]; // 11MB
        MockMultipartFile largeFile = new MockMultipartFile(
            "file",
            "large-image.jpg",
            "image/jpeg",
            largeContent
        );

        // When/Then
        assertThatThrownBy(() -> fileStorageService.storeFile(largeFile, "evidence"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("exceeds maximum allowed size");
    }

    @Test
    void storePickupEvidence_shouldUseCorrectSubfolder() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "evidence.jpg",
            "image/jpeg",
            "evidence content".getBytes()
        );
        Long donationId = 123L;

        // When
        String url = fileStorageService.storePickupEvidence(file, donationId);

        // Then
        assertThat(url).contains("evidence/donation-123");
    }

    @Test
    void storeFile_withNullFile_shouldThrowException() {
        // When/Then
        assertThatThrownBy(() -> fileStorageService.storeFile(null, "evidence"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("empty or missing");
    }

    @Test
    void storeFile_generatesUniqueFilenames() throws IOException {
        // Given
        MockMultipartFile file1 = new MockMultipartFile(
            "file", "image.jpg", "image/jpeg", "content1".getBytes()
        );
        MockMultipartFile file2 = new MockMultipartFile(
            "file", "image.jpg", "image/jpeg", "content2".getBytes()
        );

        // When
        String url1 = fileStorageService.storeFile(file1, "evidence");
        String url2 = fileStorageService.storeFile(file2, "evidence");

        // Then
        assertThat(url1).isNotEqualTo(url2);
    }

    @Test
    void deleteFile_withValidUrl_shouldDeleteFile() throws IOException {
        // Given - First store a file
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.jpg", "image/jpeg", "content".getBytes()
        );
        String url = fileStorageService.storeFile(file, "evidence");

        // When
        boolean deleted = fileStorageService.deleteFile(url);

        // Then
        assertThat(deleted).isTrue();
    }

    @Test
    void deleteFile_withInvalidUrl_shouldReturnFalse() {
        // When
        boolean deleted = fileStorageService.deleteFile("/invalid/path/file.jpg");

        // Then
        assertThat(deleted).isFalse();
    }

    @Test
    void deleteFile_withNullUrl_shouldReturnFalse() {
        // When
        boolean deleted = fileStorageService.deleteFile(null);

        // Then
        assertThat(deleted).isFalse();
    }
}

