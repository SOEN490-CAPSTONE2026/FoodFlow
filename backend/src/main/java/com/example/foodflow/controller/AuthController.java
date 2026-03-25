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
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.AuthService;
import com.example.foodflow.service.FileStorageService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final FileStorageService fileStorageService;

    public AuthController(AuthService authService, FileStorageService fileStorageService) {
        this.authService = authService;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Register donor — accepts JSON (no file) requests.
     */
    @PostMapping(value = "/register/donor", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> registerDonorJson(@Valid @RequestBody RegisterDonorRequest request) {
        log.info("Donor registration (JSON) for email: {}", request.getEmail());
        AuthResponse response = authService.registerDonor(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Register donor — accepts multipart/form-data (with optional file upload).
     */
    @PostMapping(value = "/register/donor", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthResponse> registerDonorMultipart(
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("confirmPassword") String confirmPassword,
            @RequestParam("organizationName") String organizationName,
            @RequestParam(value = "organizationType", required = false) String organizationType,
            @RequestParam(value = "businessLicense", required = false) String businessLicense,
            @RequestParam(value = "supportingDocument", required = false) MultipartFile supportingDocument,
            @RequestParam("address") String address,
            @RequestParam("contactPerson") String contactPerson,
            @RequestParam("phone") String phone,
            @RequestParam(value = "dataStorageConsent", required = false, defaultValue = "false") Boolean dataStorageConsent) throws IOException {

        log.info("Donor registration (multipart) for email: {}", email);

        // Store the uploaded file if present
        String documentUrl = null;
        if (supportingDocument != null && !supportingDocument.isEmpty()) {
            documentUrl = fileStorageService.storeFile(supportingDocument, "licenses");
            log.info("Supporting document stored for donor registration: {}", documentUrl);
        }

        // Build the DTO
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail(email);
        request.setPassword(password);
        request.setConfirmPassword(confirmPassword);
        request.setOrganizationName(organizationName);
        request.setContactPerson(contactPerson);
        request.setPhone(phone);
        request.setAddress(address);
        request.setBusinessLicense(businessLicense);
        request.setSupportingDocumentUrl(documentUrl);
        request.setDataStorageConsent(dataStorageConsent);

        if (organizationType != null && !organizationType.isBlank()) {
            request.setOrganizationType(OrganizationType.valueOf(organizationType));
        }

        AuthResponse response = authService.registerDonor(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Register receiver — accepts JSON (no file) requests.
     */
    @PostMapping(value = "/register/receiver", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> registerReceiverJson(@Valid @RequestBody RegisterReceiverRequest request) {
        log.info("Receiver registration (JSON) for email: {}", request.getEmail());
        AuthResponse response = authService.registerReceiver(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Register receiver — accepts multipart/form-data (with optional file upload).
     */
    @PostMapping(value = "/register/receiver", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthResponse> registerReceiverMultipart(
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("confirmPassword") String confirmPassword,
            @RequestParam("organizationName") String organizationName,
            @RequestParam(value = "organizationType", required = false) String organizationType,
            @RequestParam(value = "charityRegistrationNumber", required = false) String charityRegistrationNumber,
            @RequestParam(value = "supportingDocument", required = false) MultipartFile supportingDocument,
            @RequestParam("address") String address,
            @RequestParam("contactPerson") String contactPerson,
            @RequestParam("phone") String phone,
            @RequestParam(value = "capacity", required = false) Integer capacity,
            @RequestParam(value = "dataStorageConsent", required = false, defaultValue = "false") Boolean dataStorageConsent) throws IOException {

        log.info("Receiver registration (multipart) for email: {}", email);

        // Store the uploaded file if present
        String documentUrl = null;
        if (supportingDocument != null && !supportingDocument.isEmpty()) {
            documentUrl = fileStorageService.storeFile(supportingDocument, "licenses");
            log.info("Supporting document stored for receiver registration: {}", documentUrl);
        }

        // Build the DTO
        RegisterReceiverRequest request = new RegisterReceiverRequest();
        request.setEmail(email);
        request.setPassword(password);
        request.setConfirmPassword(confirmPassword);
        request.setOrganizationName(organizationName);
        request.setContactPerson(contactPerson);
        request.setPhone(phone);
        request.setAddress(address);
        request.setCharityRegistrationNumber(charityRegistrationNumber);
        request.setSupportingDocumentUrl(documentUrl);
        request.setCapacity(capacity);
        request.setDataStorageConsent(dataStorageConsent);

        if (organizationType != null && !organizationType.isBlank()) {
            request.setOrganizationType(OrganizationType.valueOf(organizationType));
        }

        AuthResponse response = authService.registerReceiver(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(@Valid @RequestBody LogoutRequest request) {
        AuthResponse response = authService.logout(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Map<String, String> response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<Map<String, String>> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        boolean isValid = authService.verifyResetCode(request.getEmail(), request.getCode());
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                    "message", "Code verified successfully",
                    "email", request.getEmail()));
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid code"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        Map<String, String> response = authService.resetPassword(
                request.getEmail(),
                request.getPhone(),
                request.getCode(),
                request.getNewPassword());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        Map<String, String> response = authService.changePassword(
                user,
                request.getCurrentPassword(),
                request.getNewPassword(),
                request.getConfirmPassword());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmailExists(@RequestParam String email) {
        boolean exists = authService.checkEmailExists(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @GetMapping("/check-phone")
    public ResponseEntity<Map<String, Boolean>> checkPhoneExists(@RequestParam String phone) {
        boolean exists = authService.checkPhoneExists(phone);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        Map<String, String> response = authService.verifyEmail(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification-email")
    public ResponseEntity<Map<String, String>> resendVerificationEmail(@AuthenticationPrincipal User user) {
        Map<String, String> response = authService.resendVerificationEmail(user.getEmail());
        return ResponseEntity.ok(response);
    }

}
