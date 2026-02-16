package com.example.foodflow.validation;

import com.example.foodflow.service.PasswordValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ValidPasswordValidatorTest {

    @Mock
    private PasswordValidator passwordValidator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder violationBuilder;

    @InjectMocks
    private ValidPasswordValidator validPasswordValidator;

    @BeforeEach
    void setUp() {
        when(context.buildConstraintViolationWithTemplate(any()))
            .thenReturn(violationBuilder);
        when(violationBuilder.addConstraintViolation()).thenReturn(context);
    }

    @Test
    void isValid_NullPassword_ReturnsFalse() {
        // When
        boolean result = validPasswordValidator.isValid(null, context);

        // Then
        assertFalse(result);
        verify(passwordValidator, never()).validatePassword(any());
    }

    @Test
    void isValid_ValidPassword_ReturnsTrue() {
        // Given
        String password = "SecurePass123!";
        when(passwordValidator.validatePassword(password))
            .thenReturn(Collections.emptyList());

        // When
        boolean result = validPasswordValidator.isValid(password, context);

        // Then
        assertTrue(result);
        verify(passwordValidator).validatePassword(password);
        verify(context, never()).disableDefaultConstraintViolation();
    }

    @Test
    void isValid_InvalidPassword_ReturnsFalse() {
        // Given
        String password = "weak";
        when(passwordValidator.validatePassword(password))
            .thenReturn(Arrays.asList(
                "Password must be at least 10 characters long",
                "Password must contain at least one uppercase letter"
            ));

        // When
        boolean result = validPasswordValidator.isValid(password, context);

        // Then
        assertFalse(result);
        verify(passwordValidator).validatePassword(password);
        verify(context).disableDefaultConstraintViolation();
        verify(context).buildConstraintViolationWithTemplate(
            "Password must be at least 10 characters long; Password must contain at least one uppercase letter"
        );
    }

    @Test
    void isValid_WeakPasswordLikeReceiver1234_ReturnsFalse() {
        // Given - The actual password the user tried
        String password = "receiver1234";
        when(passwordValidator.validatePassword(password))
            .thenReturn(Arrays.asList(
                "Password must contain at least one uppercase letter",
                "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
            ));

        // When
        boolean result = validPasswordValidator.isValid(password, context);

        // Then
        assertFalse(result);
        verify(passwordValidator).validatePassword(password);
        verify(context).disableDefaultConstraintViolation();
    }
}

