package com.example.foodflow.validation;

import com.example.foodflow.service.PasswordValidator;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ValidPasswordValidator implements ConstraintValidator<ValidPassword, String> {

    private static final Logger log = LoggerFactory.getLogger(ValidPasswordValidator.class);
    private final PasswordValidator passwordValidator;

    @Autowired
    public ValidPasswordValidator(PasswordValidator passwordValidator) {
        this.passwordValidator = passwordValidator;
        log.info("ValidPasswordValidator initialized with PasswordValidator bean");
    }

    @Override
    public void initialize(ValidPassword constraintAnnotation) {
        log.debug("ValidPasswordValidator.initialize() called");
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        log.debug("Validating password: {}", password != null ? "***" : "null");

        if (password == null) {
            log.debug("Password is null, returning false");
            return false;
        }

        List<String> errors = passwordValidator.validatePassword(password);
        log.debug("Password validation errors: {}", errors);

        if (!errors.isEmpty()) {
            // Disable default constraint violation
            context.disableDefaultConstraintViolation();

            // Add custom violation message with all errors
            String errorMessage = String.join("; ", errors);
            log.info("Password validation failed: {}", errorMessage);
            context.buildConstraintViolationWithTemplate(errorMessage)
                   .addConstraintViolation();

            return false;
        }

        log.debug("Password validation passed");
        return true;
    }
}

