package com.example.foodflow.controller;

import com.example.foodflow.service.UserService;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.dto.UserDTO;
import com.example.foodflow.model.dto.LanguagePreference;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/language")
    public ResponseEntity<Void> updateLanguagePreference(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody LanguagePreference request) {
            
        userService.updateLanguagePreference(currentUser, request.getLanguagePreference());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getProfile(
            @AuthenticationPrincipal User currentUser) {
        
        UserDTO dto = userService.getProfile(currentUser);
        return ResponseEntity.ok(dto);
    }
}