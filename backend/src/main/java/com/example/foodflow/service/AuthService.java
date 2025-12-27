package com.example.foodflow.service;

import com.example.foodflow.model.dto.AuthResponse;
import com.example.foodflow.model.dto.RegisterDonorRequest;
import com.example.foodflow.model.dto.RegisterReceiverRequest;
import com.example.foodflow.model.dto.LoginRequest;
import com.example.foodflow.model.dto.LogoutRequest;
import com.example.foodflow.model.dto.ForgotPasswordRequest;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.VerificationStatus;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.micrometer.core.annotation.Timed;
import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;


@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final MetricsService metricsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Autowired
    private EmailService emailService;
        
    // In-memory storage for reset codes (expiry handled by timestamp)
    private final Map<String, ResetCodeData> resetCodes = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    
    // Helper class to store code with timestamp
    private static class ResetCodeData {
        private final String code;
        private final long timestamp;
        
        ResetCodeData(String code, long timestamp) {
            this.code = code;
            this.timestamp = timestamp;
        }
        
        public String getCode() {
            return code;
        }
        
        public long getTimestamp() {
            return timestamp;
        }
    }

    // Update the constructor to include MetricsService:
    public AuthService(UserRepository userRepository, 
                    OrganizationRepository organizationRepository,
                    PasswordEncoder passwordEncoder, 
                    JwtTokenProvider jwtTokenProvider,
                    MetricsService metricsService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.metricsService = metricsService;
    }


    @Transactional
    @Timed(value = "auth.service.registerDonor", description = "Time taken to register a donor")
    public AuthResponse registerDonor(RegisterDonorRequest request) {
        log.info("Starting donor registration for email: {}", request.getEmail());
        // Validate password confirmation
        if (request.getConfirmPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            log.warn("Registration failed: Passwords do not match for email: {}", request.getEmail());
            throw new RuntimeException("Passwords do not match");
        }
        
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: Email already exists: {}", request.getEmail());
            throw new RuntimeException("Email already exists");
        }

        // Create user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.DONOR);

        User savedUser = userRepository.save(user);
        log.debug("User created with ID: {} for email: {}", savedUser.getId(), savedUser.getEmail());

        // Create organization
        Organization organization = new Organization();
        organization.setUser(savedUser);
        organization.setName(request.getOrganizationName());
        organization.setContactPerson(request.getContactPerson());
        organization.setPhone(request.getPhone());
        organization.setAddress(request.getAddress());
        organization.setOrganizationType(request.getOrganizationType());
        // Default verification status to PENDING on registration
        organization.setVerificationStatus(VerificationStatus.PENDING);
        organization.setBusinessLicense(request.getBusinessLicense());

        organizationRepository.save(organization);
        log.debug("Organization created for user: {} - Organization: {}", 
            savedUser.getEmail(), request.getOrganizationName());

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().toString());

        metricsService.incrementDonorRegistration();
        metricsService.incrementUserRegistration();

        log.info("Donor registration successful: email={}, organization={}, type={}",
            savedUser.getEmail(), request.getOrganizationName(), request.getOrganizationType());

        return new AuthResponse(token, savedUser.getEmail(), savedUser.getRole().toString(), "Donor registered successfully", savedUser.getId(), request.getOrganizationName(), organization.getVerificationStatus() != null ? organization.getVerificationStatus().toString() : null);
    }

    @Transactional
    @Timed(value = "auth.service.registerReceiver", description = "Time taken to register a receiver")
    public AuthResponse registerReceiver(RegisterReceiverRequest request) {
        // Validate password confirmation
        if (request.getConfirmPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Create user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.RECEIVER);

        User savedUser = userRepository.save(user);

        // Create organization
        Organization organization = new Organization();
        organization.setUser(savedUser);
        organization.setName(request.getOrganizationName());
        organization.setContactPerson(request.getContactPerson());
        organization.setPhone(request.getPhone());
        organization.setAddress(request.getAddress());
        // If frontend left organizationType empty/null for receivers, default to CHARITY
        organization.setOrganizationType(request.getOrganizationType() != null ? request.getOrganizationType() : com.example.foodflow.model.entity.OrganizationType.CHARITY);
                organization.setCapacity(request.getCapacity());
                // Default verification status to PENDING on registration
                organization.setVerificationStatus(VerificationStatus.PENDING);
        // Store charity registration number for verification (optional)
        if (request.getClass().getSimpleName().equals("RegisterReceiverRequest")) {
            // Safe cast because method signature accepts RegisterReceiverRequest
            try {
                String charityReg = (String) request.getClass().getMethod("getCharityRegistrationNumber").invoke(request);
                organization.setCharityRegistrationNumber(charityReg);
            } catch (Exception ignored) {
                // If the getter is not present or invocation fails, skip setting the field
            }
        }

        organizationRepository.save(organization);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().toString());

        metricsService.incrementReceiverRegistration();
        metricsService.incrementUserRegistration();

        return new AuthResponse(token, savedUser.getEmail(), savedUser.getRole().toString(), "Receiver registered successfully", savedUser.getId(), request.getOrganizationName(), organization.getVerificationStatus() != null ? organization.getVerificationStatus().toString() : null);
    }

    @Transactional(readOnly = true)
    @Timed(value = "auth.service.login", description = "Time taken to login")
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        metricsService.incrementLoginAttempt();       
        try {
            User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed: User not found: {}", request.getEmail());
                    metricsService.incrementAuthFailure("user_not_found");
                    return new RuntimeException("User not found");
            });

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                    log.warn("Login failed: Invalid credentials for user: {}", request.getEmail());
                    metricsService.incrementAuthFailure("invalid_credentials");
                    throw new RuntimeException("Invalid credentials");
            }

            // Check if account is deactivated
            if (user.getAccountStatus() == com.example.foodflow.model.entity.AccountStatus.DEACTIVATED) {
                    log.warn("Login failed: Account deactivated for user: {}", request.getEmail());
                    metricsService.incrementAuthFailure("account_deactivated");
                    throw new RuntimeException("Your account has been deactivated. Please contact support for assistance.");
            }

            String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().toString());

            metricsService.incrementLoginSuccess();

            String organizationName = user.getOrganization() != null ? user.getOrganization().getName() : null;
            String verificationStatus = user.getOrganization() != null && user.getOrganization().getVerificationStatus() != null ? user.getOrganization().getVerificationStatus().toString() : null;

            log.info("Login successful: email={}, role={}, organizationName={}, verificationStatus={}", user.getEmail(), user.getRole(), organizationName, verificationStatus);
            return new AuthResponse(token, user.getEmail(), user.getRole().toString(),
                       "Account logged in successfully.", user.getId(), organizationName, verificationStatus);
        } catch (RuntimeException e) {
            // Already logged failure metrics above
            throw e;
        }
    }

    @Timed(value = "auth.service.logout", description = "Time taken to logout")
    public AuthResponse logout(LogoutRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return new AuthResponse(null, user.getEmail(), user.getRole().toString(), "Account logged out successfully.");
    }
    
    /**
     * Initiate password reset flow by generating and sending a 6-digit code via email
     * Note: SMS verification is handled by Firebase on the frontend
     * @param request contains email and method type
     * @return success message
     */
    @Timed(value = "auth.service.forgotPassword", description = "Time taken to process forgot password")
    public Map<String, String> forgotPassword(ForgotPasswordRequest request) {
        // Only handle email - Firebase handles SMS on frontend
        if ("email".equals(request.getMethod())) {
            return handleEmailForgotPassword(request);
        } else {
            // SMS is handled by Firebase, return success
            return Map.of(
                "message", "SMS verification handled by Firebase",
                "method", "sms"
            );
        }
    }
    
    /**
     * Handle forgot password via email
     */
    private Map<String, String> handleEmailForgotPassword(ForgotPasswordRequest request) {
        log.info("Forgot password request via email for: {}", request.getEmail());
        
        // Verify user exists
        userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Forgot password failed: User not found: {}", request.getEmail());
                    return new RuntimeException("User not found");
                });
        
        // Generate 6-digit code
        String resetCode = generateSixDigitCode();
        
        // Store code with timestamp (60 second expiry for email)
        resetCodes.put(request.getEmail(), new ResetCodeData(resetCode, System.currentTimeMillis()));
        
        try {
            // Send email via Brevo
            emailService.sendPasswordResetEmail(request.getEmail(), resetCode);
            log.info("Password reset email sent successfully to: {}", request.getEmail());
            
            return Map.of(
                "message", "Reset code sent successfully",
                "email", request.getEmail()
            );
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", request.getEmail(), e);
            // Remove the stored code if email fails
            resetCodes.remove(request.getEmail());
            throw new RuntimeException("Failed to send reset email. Please try again.");
        }
    }

    /**
     * Verify the reset code for email
     * @param email user's email
     * @param code 6-digit code to verify
     * @return true if valid, throws exception if invalid/expired
     */
    public boolean verifyResetCode(String email, String code) {
        log.info("Verifying reset code for email: {}", email);
        
        ResetCodeData storedData = resetCodes.get(email);
        
        if (storedData == null) {
            log.warn("No reset code found for email: {}", email);
            throw new RuntimeException("No reset code found. Please request a new code.");
        }
        
        // Check if code has expired (60 seconds for email)
        long currentTime = System.currentTimeMillis();
        long elapsedSeconds = (currentTime - storedData.getTimestamp()) / 1000;
        
        if (elapsedSeconds > 60) {
            log.warn("Reset code expired for email: {}. Elapsed: {}s", email, elapsedSeconds);
            resetCodes.remove(email);
            throw new RuntimeException("Reset code has expired. Please request a new code.");
        }
        
        // Verify the code matches
        if (!storedData.getCode().equals(code)) {
            log.warn("Invalid reset code for email: {}", email);
            throw new RuntimeException("Invalid reset code. Please try again.");
        }
        
        log.info("Reset code verified successfully for email: {}", email);
        return true;
    }
    
    /**
     * Reset the user's password after verifying the code
     * @param email user's email
     * @param code 6-digit verification code
     * @param newPassword new password to set
     * @return success message
     */
    @Transactional
    @Timed(value = "auth.service.resetPassword", description = "Time taken to reset password")
    public Map<String, String> resetPassword(String email, String code, String newPassword) {
        log.info("Attempting password reset for email: {}", email);
        
        // First verify the code is still valid
        verifyResetCode(email, code);
        
        // Find the user by email
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> {
                log.error("User not found for email: {}", email);
                return new RuntimeException("User not found");
            });
        
        // Hash and update the password
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(hashedPassword);
        userRepository.save(user);
        
        // Remove the used code from storage
        resetCodes.remove(email);
        
        log.info("Password reset successful for user: {}", email);
        
        return Map.of(
            "message", "Password reset successful",
            "email", email
        );
    }
    
    /**
     * Generate a secure 6-digit code
     */
    private String generateSixDigitCode() {
        int code = secureRandom.nextInt(900000) + 100000; // 100000 to 999999
        return String.valueOf(code);
    }
}


