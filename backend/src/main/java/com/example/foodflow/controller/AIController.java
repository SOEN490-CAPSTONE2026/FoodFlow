package com.example.foodflow.controller;

import com.example.foodflow.exception.AIServiceException;
import com.example.foodflow.exception.InvalidImageException;
import com.example.foodflow.model.dto.AIExtractionResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.AIExtractionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for AI-powered food donation features.
 * Handles image upload and AI extraction for donation creation.
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {
    
    private static final Logger log = LoggerFactory.getLogger(AIController.class);
    
    private final AIExtractionService aiExtractionService;
    
    public AIController(AIExtractionService aiExtractionService) {
        this.aiExtractionService = aiExtractionService;
    }
    
    /**
     * POST /api/ai/extract-donation
     * Upload food label image and get AI-extracted donation data
     * 
     * @param image The food label image file
     * @param currentUser The authenticated user (automatically injected by Spring Security)
     * @return AIExtractionResponse with extracted fields and confidence scores
     */
    @PostMapping("/extract-donation")
    public ResponseEntity<AIExtractionResponse> extractDonationData(
            @RequestParam("image") MultipartFile image,
            @AuthenticationPrincipal User currentUser) {
        
        log.info("AI extraction request from user: {} for file: {}", 
                currentUser.getId(), image.getOriginalFilename());
        
        try {
            AIExtractionResponse response = aiExtractionService.analyzeFoodLabel(image);
            
            if (response.isSuccess()) {
                log.info("AI extraction successful for user: {}", currentUser.getId());
                return ResponseEntity.ok(response);
            } else {
                log.warn("AI extraction failed: {}", response.getErrorMessage());
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
            }
            
        } catch (InvalidImageException e) {
            log.error("Invalid image from user {}: {}", currentUser.getId(), e.getMessage());
            
            AIExtractionResponse errorResponse = new AIExtractionResponse();
            errorResponse.setSuccess(false);
            errorResponse.setErrorMessage(e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (AIServiceException e) {
            log.error("AI service error for user {}: {}", currentUser.getId(), e.getMessage());
            
            AIExtractionResponse errorResponse = new AIExtractionResponse();
            errorResponse.setSuccess(false);
            errorResponse.setErrorMessage("AI service is currently unavailable. Please try again later.");
            
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
            
        } catch (Exception e) {
            log.error("Unexpected error during AI extraction for user " + currentUser.getId(), e);
            
            AIExtractionResponse errorResponse = new AIExtractionResponse();
            errorResponse.setSuccess(false);
            errorResponse.setErrorMessage("An unexpected error occurred. Please try again.");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * GET /api/ai/health
     * Health check endpoint to verify AI service availability
     * 
     * @return Simple status message
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("AI service is online");
    }
}
