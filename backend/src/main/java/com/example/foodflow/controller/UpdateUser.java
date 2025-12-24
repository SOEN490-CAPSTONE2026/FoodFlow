package com.example.foodflow.controller;

import com.example.foodflow.model.dto.UpdateUserRequest;
import com.example.foodflow.model.dto.UserDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UpdateUser {

    private static final Logger logger = LoggerFactory.getLogger(UpdateUser.class);

    @Autowired
    private UserService userService;

    @PostMapping("/profile/photo")
    public ResponseEntity<?> uploadProfilePhoto(@RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            Long userId = user.getId();
            
            logger.info("Profile photo upload request for user: {}", userId);
            
            UserDTO updatedUser = userService.uploadProfilePhoto(userId, file);
            return ResponseEntity.ok(updatedUser);
        } catch (ClassCastException e) {
            logger.error("Error extracting user from authentication: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Authentication error. Please log in again."));
        } catch (RuntimeException e) {
            logger.error("Error uploading profile photo: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            Long userId = user.getId();
            
            logger.info("Profile update request for user: {}", userId);
            
            UserDTO updatedUser = userService.updateUser(userId, request);
            return ResponseEntity.ok(updatedUser);
        } catch (ClassCastException e) {
            logger.error("Error extracting user from authentication: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Authentication error. Please log in again."));
        } catch (RuntimeException e) {
            logger.error("Error updating profile: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            Long userId = user.getId();
            
            UserDTO userDTO = userService.getUserById(userId);
            return ResponseEntity.ok(userDTO);
        } catch (ClassCastException e) {
            logger.error("Error extracting user from authentication: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Authentication error. Please log in again."));
        } catch (RuntimeException e) {
            logger.error("Error fetching profile: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
