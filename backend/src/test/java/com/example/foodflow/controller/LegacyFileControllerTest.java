package com.example.foodflow.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class LegacyFileControllerTest {

    private LegacyFileController legacyFileController;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        legacyFileController = new LegacyFileController();
        ReflectionTestUtils.setField(legacyFileController, "uploadDir", tempDir.toString());
    }

    @Test
    void serveLegacyFile_withExistingFile_shouldReturnFile() throws IOException {
        // Given - Create a test file
        Path evidenceDir = tempDir.resolve("evidence/donation-1");
        Files.createDirectories(evidenceDir);
        Path testFile = evidenceDir.resolve("test-image.jpg");
        Files.write(testFile, "fake image content".getBytes());

        // When
        ResponseEntity<Resource> response = legacyFileController.serveLegacyFile("test-image.jpg");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().exists()).isTrue();
    }

    @Test
    void serveLegacyFile_withNonExistentFile_shouldReturnNotFound() {
        // When
        ResponseEntity<Resource> response = legacyFileController.serveLegacyFile("non-existent.jpg");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void serveLegacyFile_shouldSearchInSubdirectories() throws IOException {
        // Given - Create file in nested subdirectory
        Path nestedDir = tempDir.resolve("evidence/donation-5/subfolder");
        Files.createDirectories(nestedDir);
        Path testFile = nestedDir.resolve("nested-image.png");
        Files.write(testFile, "nested content".getBytes());

        // When
        ResponseEntity<Resource> response = legacyFileController.serveLegacyFile("nested-image.png");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void serveLegacyFile_withPngFile_shouldReturnCorrectContentType() throws IOException {
        // Given
        Path testFile = tempDir.resolve("test.png");
        Files.write(testFile, "png content".getBytes());

        // When
        ResponseEntity<Resource> response = legacyFileController.serveLegacyFile("test.png");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Content-Type header should be set (may vary by system)
        assertThat(response.getHeaders().getContentType()).isNotNull();
    }

    @Test
    void serveLegacyFile_shouldSetCacheControlHeader() throws IOException {
        // Given
        Path testFile = tempDir.resolve("cached.jpg");
        Files.write(testFile, "content".getBytes());

        // When
        ResponseEntity<Resource> response = legacyFileController.serveLegacyFile("cached.jpg");

        // Then
        assertThat(response.getHeaders().getCacheControl()).contains("max-age=86400");
    }

    @Test
    void serveLegacyFile_shouldSetContentDispositionHeader() throws IOException {
        // Given
        Path testFile = tempDir.resolve("inline-file.jpg");
        Files.write(testFile, "content".getBytes());

        // When
        ResponseEntity<Resource> response = legacyFileController.serveLegacyFile("inline-file.jpg");

        // Then
        assertThat(response.getHeaders().getContentDisposition().toString())
            .contains("inline")
            .contains("inline-file.jpg");
    }
}

