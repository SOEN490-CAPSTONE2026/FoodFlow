package com.example.foodflow.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Controller for serving uploaded files.
 */
@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "${spring.web.cors.allowed-origins}")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Serves uploaded files from the evidence subfolder.
     * URL pattern: /api/files/evidence/{folder}/{filename}
     */
    @GetMapping("/evidence/{folder}/{filename:.+}")
    public ResponseEntity<Resource> serveEvidenceFile(
            @PathVariable String folder,
            @PathVariable String filename) {
        logger.info("Serving evidence file: folder={}, filename={}", folder, filename);
        return serveFile("evidence/" + folder + "/" + filename);
    }

    /**
     * Fallback for legacy URLs that were stored directly as /uploads/{filename}
     * This handles old URLs that don't have the proper path structure
     * URL pattern: /api/files/uploads/{filename}
     */
    @GetMapping("/uploads/{filename:.+}")
    public ResponseEntity<Resource> serveLegacyUploadFile(
            @PathVariable String filename) {
        logger.info("Serving legacy upload file: filename={}", filename);
        // Try to find the file in the uploads directory (search subdirectories)
        return serveFileSearching(filename);
    }

    /**
     * Search for a file by filename in the uploads directory and subdirectories
     */
    private ResponseEntity<Resource> serveFileSearching(String filename) {
        try {
            Path uploadPath = resolveUploadPath();

            // Search for the file in the uploads directory tree
            java.util.Optional<Path> foundFile = Files.walk(uploadPath)
                .filter(Files::isRegularFile)
                .filter(p -> p.getFileName().toString().equals(filename))
                .findFirst();

            if (foundFile.isPresent()) {
                logger.info("Found file at: {}", foundFile.get());
                return serveFileFromPath(foundFile.get());
            }

            logger.warn("File not found anywhere in uploads: {}", filename);
            return ResponseEntity.notFound().build();

        } catch (IOException e) {
            logger.error("Error searching for file: {}", filename, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Resolves the upload directory path consistently
     */
    private Path resolveUploadPath() {
        Path uploadPath = Paths.get(uploadDir);
        if (!uploadPath.isAbsolute()) {
            String userDir = System.getProperty("user.dir");
            uploadPath = Paths.get(userDir, uploadDir);
        }
        return uploadPath.toAbsolutePath().normalize();
    }

    /**
     * Generic method to serve files from the upload directory.
     */
    private ResponseEntity<Resource> serveFile(String relativePath) {
        Path file = resolveUploadPath().resolve(relativePath).normalize();
        logger.info("Looking for file at: {}", file);
        return serveFileFromPath(file);
    }

    /**
     * Serve a file from an absolute path
     */
    private ResponseEntity<Resource> serveFileFromPath(Path file) {
        try {
            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                logger.warn("File not found or not readable: {}", file);
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String contentType;
            try {
                contentType = Files.probeContentType(file);
            } catch (Exception e) {
                contentType = "application/octet-stream";
            }

            logger.info("Serving file: {} with content type: {}", file, contentType);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400") // Cache for 1 day
                    .body(resource);

        } catch (MalformedURLException e) {
            logger.error("Malformed URL for file: {}", file, e);
            return ResponseEntity.badRequest().build();
        }
    }
}
