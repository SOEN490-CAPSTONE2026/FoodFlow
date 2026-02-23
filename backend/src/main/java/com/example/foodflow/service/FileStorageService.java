package com.example.foodflow.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling file uploads.
 * Currently stores files locally; can be extended for cloud storage (S3, etc.)
 */
@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Value("${file.upload.base-url:/api/files}")
    private String baseUrl;

    /**
     * Stores an uploaded file and returns the URL to access it.
     *
     * @param file The uploaded file
     * @param subfolder Optional subfolder within the upload directory (e.g., "evidence")
     * @return The URL to access the stored file
     * @throws IllegalArgumentException if file validation fails
     * @throws IOException if file storage fails
     */
    public String storeFile(MultipartFile file, String subfolder) throws IOException {
        validateFile(file);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        // Create target directory using absolute path
        // If uploadDir is relative, resolve it against user.dir (project root)
        Path uploadPath = Paths.get(uploadDir);
        if (!uploadPath.isAbsolute()) {
            String userDir = System.getProperty("user.dir");
            uploadPath = Paths.get(userDir, uploadDir);
        }

        Path targetDir = uploadPath.resolve(subfolder).toAbsolutePath().normalize();
        logger.info("Creating directory: {}", targetDir);
        Files.createDirectories(targetDir);

        // Save file
        Path targetPath = targetDir.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        logger.info("File saved to: {}", targetPath);

        // Return URL to access the file - MUST start with /api/files
        // baseUrl should be /api/files from config
        String effectiveBaseUrl = baseUrl != null && baseUrl.startsWith("/api/files") ? baseUrl : "/api/files";
        String fileUrl = effectiveBaseUrl + "/" + subfolder + "/" + uniqueFilename;
        logger.info("Generated file URL: {} (baseUrl from config: {})", fileUrl, baseUrl);

        return fileUrl;
    }

    /**
     * Stores pickup evidence photo for a donation.
     *
     * @param file The evidence photo
     * @param donationId The donation ID for organizing files
     * @return The URL to access the stored file
     * @throws IOException if file storage fails
     */
    public String storePickupEvidence(MultipartFile file, Long donationId) throws IOException {
        return storeFile(file, "evidence/donation-" + donationId);
    }

    /**
     * Validates the uploaded file.
     *
     * @param file The file to validate
     * @throws IllegalArgumentException if validation fails
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty or missing");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                "Invalid file type. Only JPEG, PNG images and PDF documents are allowed. Received: " + contentType);
        }
    }

    /**
     * Gets the file extension from a filename.
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg"; // Default extension
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Deletes a file by its URL.
     *
     * @param fileUrl The URL of the file to delete
     * @return true if file was deleted, false otherwise
     */
    public boolean deleteFile(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith(baseUrl)) {
            return false;
        }

        try {
            String relativePath = fileUrl.substring(baseUrl.length() + 1);
            Path filePath = Paths.get(uploadDir, relativePath);
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            logger.error("Failed to delete file: {}", fileUrl, e);
            return false;
        }
    }
}

