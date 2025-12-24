package com.example.foodflow.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service
public class ImageService {

    private static final Logger logger = LoggerFactory.getLogger(ImageService.class);
    
    // Maximum file size: 5MB
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    
    // Allowed image types
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "image/png",
        "image/jpeg",
        "image/jpg"
    );
    
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    private static final byte[] PNG_MAGIC_BYTES = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    
    /**
     * Validates and converts an uploaded image file (JPEG or PNG) to base64 string
     * 
     * @param file 
     * @return 
     * @throws RuntimeException 
     */
    public String processImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Image file is required");
        }
        
        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("Image file size exceeds maximum limit of 5MB");
        }
        
        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Invalid image format. Only JPEG and PNG images are allowed");
        }
        
        try {
            byte[] fileBytes = file.getBytes();
            if (!isValidImageFile(fileBytes, contentType)) {
                throw new RuntimeException("File does not appear to be a valid JPEG or PNG image");
            }
            
            String base64Image = Base64.getEncoder().encodeToString(fileBytes);
            String dataUri = "data:" + contentType + ";base64," + base64Image;
            
            logger.info("Successfully processed image file: {} ({} bytes, type: {})", 
                file.getOriginalFilename(), file.getSize(), contentType);
            
            return dataUri;
        } catch (IOException e) {
            logger.error("Error processing image file: {}", e.getMessage());
            throw new RuntimeException("Failed to process image file: " + e.getMessage());
        }
    }
    
    private boolean isValidImageFile(byte[] fileBytes, String contentType) {
        if (fileBytes.length < 8) {
            return false;
        }
        
        if (contentType != null && contentType.toLowerCase().equals("image/png")) {
            return Arrays.equals(
                Arrays.copyOf(fileBytes, PNG_MAGIC_BYTES.length),
                PNG_MAGIC_BYTES
            );
        }
        
        if (contentType != null && (contentType.toLowerCase().equals("image/jpeg") || 
                                     contentType.toLowerCase().equals("image/jpg"))) {
            return fileBytes[0] == (byte) 0xFF && fileBytes[1] == (byte) 0xD8 && fileBytes[2] == (byte) 0xFF;
        }
        
        return false;
    }
}


