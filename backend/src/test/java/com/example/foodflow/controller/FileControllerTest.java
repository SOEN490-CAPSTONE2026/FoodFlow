package com.example.foodflow.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class FileControllerTest {

    private FileController fileController;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        fileController = new FileController();
        ReflectionTestUtils.setField(fileController, "uploadDir", tempDir.toString());
    }

    @Test
    void serveEvidenceFile_withExistingFile_shouldReturnFile() throws IOException {
        // Given - Create evidence file in proper directory structure
        Path evidenceDir = tempDir.resolve("evidence/donation-1");
        Files.createDirectories(evidenceDir);
        Path testFile = evidenceDir.resolve("test-uuid.jpg");
        Files.write(testFile, "image content".getBytes());

        // When - Call with donation ID and filename
        ResponseEntity<Resource> response = fileController.serveEvidenceFile("1", "test-uuid.jpg");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().exists()).isTrue();
    }

    @Test
    void serveEvidenceFile_withNonExistentFile_shouldReturnNotFound() {
        // When
        ResponseEntity<Resource> response = fileController.serveEvidenceFile("1", "non-existent.jpg");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void serveEvidenceFile_withDifferentDonationFolder_shouldReturnCorrectFile() throws IOException {
        // Given - Create files for different donations
        Path donation1Dir = tempDir.resolve("evidence/donation-1");
        Path donation2Dir = tempDir.resolve("evidence/donation-2");
        Files.createDirectories(donation1Dir);
        Files.createDirectories(donation2Dir);

        Files.write(donation1Dir.resolve("file.jpg"), "donation 1 content".getBytes());
        Files.write(donation2Dir.resolve("file.jpg"), "donation 2 content".getBytes());

        // When
        ResponseEntity<Resource> response1 = fileController.serveEvidenceFile("1", "file.jpg");
        ResponseEntity<Resource> response2 = fileController.serveEvidenceFile("2", "file.jpg");

        // Then
        assertThat(response1.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response2.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void serveEvidenceFile_shouldSetCacheHeaders() throws IOException {
        // Given
        Path evidenceDir = tempDir.resolve("evidence/donation-1");
        Files.createDirectories(evidenceDir);
        Files.write(evidenceDir.resolve("cached.jpg"), "content".getBytes());

        // When
        ResponseEntity<Resource> response = fileController.serveEvidenceFile("1", "cached.jpg");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getCacheControl()).isNotNull();
        assertThat(response.getHeaders().getCacheControl()).contains("max-age=86400");
    }

    @Test
    void serveEvidenceFile_withPngFile_shouldWork() throws IOException {
        // Given
        Path evidenceDir = tempDir.resolve("evidence/donation-1");
        Files.createDirectories(evidenceDir);
        Files.write(evidenceDir.resolve("image.png"), "png content".getBytes());

        // When
        ResponseEntity<Resource> response = fileController.serveEvidenceFile("1", "image.png");

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void serveEvidenceFile_withUuidFilename_shouldWork() throws IOException {
        // Given - Test with UUID-style filename
        Path evidenceDir = tempDir.resolve("evidence/donation-123");
        Files.createDirectories(evidenceDir);
        String uuidFilename = "550e8400-e29b-41d4-a716-446655440000.jpg";
        Files.write(evidenceDir.resolve(uuidFilename), "uuid file content".getBytes());

        // When
        ResponseEntity<Resource> response = fileController.serveEvidenceFile("123", uuidFilename);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}

