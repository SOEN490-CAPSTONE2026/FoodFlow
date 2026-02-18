package com.example.foodflow.service;

import com.example.foodflow.model.entity.PasswordHistory;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.PasswordHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class PasswordValidator {

    private static final Logger log = LoggerFactory.getLogger(PasswordValidator.class);

    @Value("${password.policy.min-length:10}")
    private int minLength;

    @Value("${password.policy.require-uppercase:true}")
    private boolean requireUppercase;

    @Value("${password.policy.require-lowercase:true}")
    private boolean requireLowercase;

    @Value("${password.policy.require-digit:true}")
    private boolean requireDigit;

    @Value("${password.policy.require-special-char:true}")
    private boolean requireSpecialChar;

    @Value("${password.policy.history-depth:3}")
    private int historyDepth;

    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    // Common weak passwords list (top 100 most common)
    // Note: All passwords are stored in lowercase for case-insensitive comparison
    private static final Set<String> COMMON_PASSWORDS = new HashSet<>(Arrays.asList(
        "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567", "letmein",
        "trustno1", "dragon", "baseball", "111111", "iloveyou", "master", "sunshine", "ashley",
        "bailey", "passw0rd", "shadow", "123123", "654321", "superman", "qazwsx", "michael",
        "football", "password1", "welcome", "jesus", "ninja", "mustang", "password123", "admin",
        "starwars", "princess", "solo", "whatever", "charlie", "freedom", "pass", "secret",
        "summer", "test", "123456789", "abcdef", "soccer", "thomas", "michelle", "jennifer",
        "jordan", "hunter", "000000", "test123", "andrew", "buster", "tigger", "cookie",
        "jessica", "purple", "matthew", "passpass", "112233", "1q2w3e4r", "login", "welcome1",
        "admin123", "qwertyuiop", "1234567890", "abcdefgh", "password12", "computer", "maverick",
        "phoenix", "12345", "cheese", "ranger", "flower", "password!", "p@ssw0rd", "changeme",
        "hello", "access", "hello123", "password1!", "123qwe", "abc12345", "temp123", "default",
        "letmein123", "admin1", "welcome123", "test1234", "guest", "demo", "user", "root",
        "password123!", "password@123", "pass123", "pass@123"
    ));

    public PasswordValidator(PasswordHistoryRepository passwordHistoryRepository,
                           PasswordEncoder passwordEncoder) {
        this.passwordHistoryRepository = passwordHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Validate password against all policy requirements
     * @param password the password to validate
     * @return list of validation error messages (empty if valid)
     */
    public List<String> validatePassword(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null || password.isEmpty()) {
            errors.add("Password is required");
            return errors;
        }

        // Check minimum length
        if (password.length() < minLength) {
            errors.add(String.format("Password must be at least %d characters long", minLength));
        }

        // Check uppercase requirement
        if (requireUppercase && !Pattern.compile("[A-Z]").matcher(password).find()) {
            errors.add("Password must contain at least one uppercase letter");
        }

        // Check lowercase requirement
        if (requireLowercase && !Pattern.compile("[a-z]").matcher(password).find()) {
            errors.add("Password must contain at least one lowercase letter");
        }

        // Check digit requirement
        if (requireDigit && !Pattern.compile("[0-9]").matcher(password).find()) {
            errors.add("Password must contain at least one digit");
        }

        // Check special character requirement
        if (requireSpecialChar && !Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]").matcher(password).find()) {
            errors.add("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)");
        }

        // Check against common passwords (case-insensitive)
        if (COMMON_PASSWORDS.contains(password.toLowerCase())) {
            errors.add("This password is too common. Please choose a more secure password");
        }

        return errors;
    }

    /**
     * Check if password was used recently by the user
     * @param user the user
     * @param newPassword the new password to check
     * @return true if password is in history, false otherwise
     */
    public boolean isPasswordInHistory(User user, String newPassword) {
        if (user.getId() == null) {
            return false; // New user, no history
        }

        List<PasswordHistory> history = passwordHistoryRepository
            .findTopNByUserIdOrderByCreatedAtDesc(user.getId(), historyDepth);

        for (PasswordHistory entry : history) {
            if (passwordEncoder.matches(newPassword, entry.getPasswordHash())) {
                log.warn("Password reuse detected for user: {}", user.getEmail());
                return true;
            }
        }

        return false;
    }

    /**
     * Check if current password matches the stored password
     * @param user the user
     * @param currentPassword the current password to check
     * @return true if password matches, false otherwise
     */
    public boolean isCurrentPasswordValid(User user, String currentPassword) {
        return passwordEncoder.matches(currentPassword, user.getPassword());
    }

    /**
     * Save password to history
     * @param user the user
     * @param passwordHash the hashed password to save
     */
    public void savePasswordToHistory(User user, String passwordHash) {
        PasswordHistory entry = new PasswordHistory(user, passwordHash);
        passwordHistoryRepository.save(entry);
        log.debug("Password saved to history for user: {}", user.getEmail());

        // Clean up old history entries beyond the configured depth
        List<PasswordHistory> allHistory = passwordHistoryRepository
            .findByUserIdOrderByCreatedAtDesc(user.getId());

        if (allHistory.size() > historyDepth) {
            List<PasswordHistory> toDelete = allHistory.subList(historyDepth, allHistory.size());
            passwordHistoryRepository.deleteAll(toDelete);
            log.debug("Cleaned up {} old password history entries for user: {}",
                toDelete.size(), user.getEmail());
        }
    }

    /**
     * Get password policy requirements as a readable message
     * @return policy requirements description
     */
    public String getPasswordPolicyDescription() {
        StringBuilder sb = new StringBuilder("Password must ");
        sb.append("be at least ").append(minLength).append(" characters");

        if (requireUppercase) sb.append(", contain at least one uppercase letter");
        if (requireLowercase) sb.append(", contain at least one lowercase letter");
        if (requireDigit) sb.append(", contain at least one digit");
        if (requireSpecialChar) sb.append(", contain at least one special character");

        sb.append(". You cannot reuse your last ").append(historyDepth).append(" passwords.");

        return sb.toString();
    }
}

