package com.example.foodflow.service;

import com.example.foodflow.model.entity.PasswordHistory;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.PasswordHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordValidatorTest {

    @Mock
    private PasswordHistoryRepository passwordHistoryRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordValidator passwordValidator;

    @BeforeEach
    void setUp() {
        // Set default policy values
        ReflectionTestUtils.setField(passwordValidator, "minLength", 10);
        ReflectionTestUtils.setField(passwordValidator, "requireUppercase", true);
        ReflectionTestUtils.setField(passwordValidator, "requireLowercase", true);
        ReflectionTestUtils.setField(passwordValidator, "requireDigit", true);
        ReflectionTestUtils.setField(passwordValidator, "requireSpecialChar", true);
        ReflectionTestUtils.setField(passwordValidator, "historyDepth", 3);
    }

    @Test
    void validatePassword_ValidPassword_ReturnsEmptyList() {
        // Given
        String validPassword = "SecurePass123!";

        // When
        List<String> errors = passwordValidator.validatePassword(validPassword);

        // Then
        assertTrue(errors.isEmpty());
    }

    @Test
    void validatePassword_TooShort_ReturnsError() {
        // Given
        String shortPassword = "Short1!";

        // When
        List<String> errors = passwordValidator.validatePassword(shortPassword);

        // Then
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(e -> e.contains("at least 10 characters")));
    }

    @Test
    void validatePassword_NoUppercase_ReturnsError() {
        // Given
        String noUpperPassword = "securepass123!";

        // When
        List<String> errors = passwordValidator.validatePassword(noUpperPassword);

        // Then
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(e -> e.contains("uppercase letter")));
    }

    @Test
    void validatePassword_NoLowercase_ReturnsError() {
        // Given
        String noLowerPassword = "SECUREPASS123!";

        // When
        List<String> errors = passwordValidator.validatePassword(noLowerPassword);

        // Then
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(e -> e.contains("lowercase letter")));
    }

    @Test
    void validatePassword_NoDigit_ReturnsError() {
        // Given
        String noDigitPassword = "SecurePassword!";

        // When
        List<String> errors = passwordValidator.validatePassword(noDigitPassword);

        // Then
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(e -> e.contains("digit")));
    }

    @Test
    void validatePassword_NoSpecialChar_ReturnsError() {
        // Given
        String noSpecialPassword = "SecurePass123";

        // When
        List<String> errors = passwordValidator.validatePassword(noSpecialPassword);

        // Then
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(e -> e.contains("special character")));
    }

    @Test
    void validatePassword_CommonPassword_ReturnsError() {
        // Given
        String commonPassword = "Password123!";

        // When
        List<String> errors = passwordValidator.validatePassword(commonPassword);

        // Then
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(e -> e.contains("too common")));
    }

    @Test
    void validatePassword_NullPassword_ReturnsError() {
        // When
        List<String> errors = passwordValidator.validatePassword(null);

        // Then
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(e -> e.contains("required")));
    }

    @Test
    void validatePassword_MultipleErrors_ReturnsAllErrors() {
        // Given
        String badPassword = "short";

        // When
        List<String> errors = passwordValidator.validatePassword(badPassword);

        // Then
        assertTrue(errors.size() >= 4); // At least length, uppercase, digit, special char
    }

    @Test
    void isPasswordInHistory_NewUser_ReturnsFalse() {
        // Given
        User newUser = new User();
        newUser.setId(null);
        String password = "NewSecurePass123!";

        // When
        boolean inHistory = passwordValidator.isPasswordInHistory(newUser, password);

        // Then
        assertFalse(inHistory);
        verify(passwordHistoryRepository, never()).findTopNByUserIdOrderByCreatedAtDesc(any(), anyInt());
    }

    @Test
    void isPasswordInHistory_PasswordNotInHistory_ReturnsFalse() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        String newPassword = "NewSecurePass123!";

        List<PasswordHistory> history = new ArrayList<>();
        PasswordHistory entry1 = new PasswordHistory(user, "oldHash1");
        PasswordHistory entry2 = new PasswordHistory(user, "oldHash2");
        history.add(entry1);
        history.add(entry2);

        when(passwordHistoryRepository.findTopNByUserIdOrderByCreatedAtDesc(1L, 3))
            .thenReturn(history);
        when(passwordEncoder.matches(newPassword, "oldHash1")).thenReturn(false);
        when(passwordEncoder.matches(newPassword, "oldHash2")).thenReturn(false);

        // When
        boolean inHistory = passwordValidator.isPasswordInHistory(user, newPassword);

        // Then
        assertFalse(inHistory);
    }

    @Test
    void isPasswordInHistory_PasswordInHistory_ReturnsTrue() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        String reusedPassword = "OldSecurePass123!";

        List<PasswordHistory> history = new ArrayList<>();
        PasswordHistory entry1 = new PasswordHistory(user, "oldHash1");
        PasswordHistory entry2 = new PasswordHistory(user, "reusedHash");
        history.add(entry1);
        history.add(entry2);

        when(passwordHistoryRepository.findTopNByUserIdOrderByCreatedAtDesc(1L, 3))
            .thenReturn(history);
        when(passwordEncoder.matches(reusedPassword, "oldHash1")).thenReturn(false);
        when(passwordEncoder.matches(reusedPassword, "reusedHash")).thenReturn(true);

        // When
        boolean inHistory = passwordValidator.isPasswordInHistory(user, reusedPassword);

        // Then
        assertTrue(inHistory);
    }

    @Test
    void savePasswordToHistory_Success() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        String passwordHash = "hashedPassword123";

        when(passwordHistoryRepository.save(any(PasswordHistory.class)))
            .thenReturn(new PasswordHistory(user, passwordHash));
        when(passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(1L))
            .thenReturn(new ArrayList<>());

        // When
        passwordValidator.savePasswordToHistory(user, passwordHash);

        // Then
        verify(passwordHistoryRepository).save(any(PasswordHistory.class));
    }

    @Test
    void savePasswordToHistory_CleansUpOldEntries() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        String passwordHash = "hashedPassword123";

        List<PasswordHistory> allHistory = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            allHistory.add(new PasswordHistory(user, "oldHash" + i));
        }

        when(passwordHistoryRepository.save(any(PasswordHistory.class)))
            .thenReturn(new PasswordHistory(user, passwordHash));
        when(passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(1L))
            .thenReturn(allHistory);

        // When
        passwordValidator.savePasswordToHistory(user, passwordHash);

        // Then
        verify(passwordHistoryRepository).save(any(PasswordHistory.class));
        verify(passwordHistoryRepository).deleteAll(anyList());
    }

    @Test
    void getPasswordPolicyDescription_ReturnsCorrectDescription() {
        // When
        String description = passwordValidator.getPasswordPolicyDescription();

        // Then
        assertNotNull(description);
        assertTrue(description.contains("10 characters"));
        assertTrue(description.contains("uppercase"));
        assertTrue(description.contains("lowercase"));
        assertTrue(description.contains("digit"));
        assertTrue(description.contains("special character"));
        assertTrue(description.contains("3 passwords"));
    }
}

