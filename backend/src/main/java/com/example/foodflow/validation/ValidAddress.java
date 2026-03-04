package com.example.foodflow.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Validation annotation to ensure a Location represents a full street address,
 * not just a city, province, country, or postal code.
 * 
 * This is part of the address standardization initiative to ensure
 * all pickup locations have precise, street-level addresses.
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AddressValidator.class)
@Documented
public @interface ValidAddress {
    String message() default "{validation.address.invalid}";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
