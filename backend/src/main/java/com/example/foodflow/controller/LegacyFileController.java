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
 * Controller for serving files from legacy /uploads/ URLs.
 * This handles old URLs stored in the database that don't have the /api/files prefix.
 */
@RestController
@RequestMapping("/uploads")
@CrossOrigin(origins = "${spring.web.cors.allowed-origins}")
public class LegacyFileController {

    private static final Logger logger = LoggerFactory.getLogger(LegacyFileController.class);

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Serves files from legacy /uploads/{filename} URLs.
     * Searches for the file in the uploads directory tree.
     */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveLegacyFile(@PathVariable String filename) {
        logger.info("Serving legacy file: {}", filename);
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!uploadPath.isAbsolute()) {
                uploadPath = Paths.get(System.getProperty("user.dir"), uploadDir);
            }
            uploadPath = uploadPath.toAbsolutePath().normalize();
            logger.info("Searching in upload path: {}", uploadPath);

            // Search for file in uploads directory tree
            java.util.Optional<Path> foundFile = Files.walk(uploadPath)
                .filter(Files::isRegularFile)
                .filter(p -> p.getFileName().toString().equals(filename))
                .findFirst();

            if (foundFile.isEmpty()) {
                logger.warn("File not found: {}", filename);
                return ResponseEntity.notFound().build();
            }

            Path file = foundFile.get();
            logger.info("Found file at: {}", file);

            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                logger.warn("File exists but not readable: {}", file);
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(file);

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(resource);

        } catch (IOException e) {
            logger.error("Error serving file: {}", filename, e);
            return ResponseEntity.notFound().build();
        }
    }
}

