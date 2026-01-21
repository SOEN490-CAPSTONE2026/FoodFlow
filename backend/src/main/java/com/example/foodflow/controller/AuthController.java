package com.example.foodflow.controller;

import com.example.foodflow.model.dto.AuthResponse;
import com.example.foodflow.model.dto.RegisterDonorRequest;
import com.example.foodflow.model.dto.RegisterReceiverRequest;
import com.example.foodflow.model.dto.LoginRequest;
import com.example.foodflow.model.dto.LogoutRequest;
import com.example.foodflow.model.dto.ForgotPasswordRequest;
import com.example.foodflow.model.dto.VerifyResetCodeRequest;
import com.example.foodflow.model.dto.ResetPasswordRequest;
import com.example.foodflow.model.dto.ChangePasswordRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register/donor")
    public ResponseEntity<AuthResponse> registerDonor(@Valid @RequestBody RegisterDonorRequest request) {
        AuthResponse response = authService.registerDonor(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register/receiver")
    public ResponseEntity<AuthResponse> registerReceiver(@Valid @RequestBody RegisterReceiverRequest request) {
        AuthResponse response = authService.registerReceiver(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(new AuthResponse(null, null, null, e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(@Valid @RequestBody LogoutRequest request) {
        AuthResponse response = authService.logout(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            Map<String, String> response = authService.forgotPassword(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<Map<String, String>> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        try {
            boolean isValid = authService.verifyResetCode(request.getEmail(), request.getCode());
            if (isValid) {
                return ResponseEntity.ok(Map.of(
                    "message", "Code verified successfully",
                    "email", request.getEmail()
                ));
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid code"));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            Map<String, String> response = authService.resetPassword(
                request.getEmail(),
                request.getPhone(),
                request.getCode(), 
                request.getNewPassword()
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            Map<String, String> response = authService.changePassword(
                user,
                request.getCurrentPassword(),
                request.getNewPassword(),
                request.getConfirmPassword()
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmailExists(@RequestParam String email) {
        try {
            boolean exists = authService.checkEmailExists(email);
            return ResponseEntity.ok(Map.of("exists", exists));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("exists", false));
        }
    }

    @GetMapping("/check-phone")
    public ResponseEntity<Map<String, Boolean>> checkPhoneExists(@RequestParam String phone) {
        try {
            boolean exists = authService.checkPhoneExists(phone);
            return ResponseEntity.ok(Map.of("exists", exists));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("exists", false));
        }
    }

}
