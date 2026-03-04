package com.example.foodflow.validation;

import com.example.foodflow.model.types.Location;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.regex.Pattern;

/**
 * Validates that a Location represents a full street address,
 * not just a city, province, postal code, or country.
 * 
 * This validator enforces address standardization by checking:
 * 1. Presence of coordinates (latitude/longitude)
 * 2. Address is not city-only (e.g., "Montreal, QC, Canada")
 * 3. Address is not postal code only (e.g., "H3B 1A1" or "12345")
 * 4. Address contains a street number
 */
public class AddressValidator implements ConstraintValidator<ValidAddress, Location> {
    
    private static final Logger log = LoggerFactory.getLogger(AddressValidator.class);
    
    // Pattern to detect city-only addresses like "Montreal, QC, Canada" or "Toronto, ON"
    // Matches: City name, optional province/state code, optional country
    private static final Pattern CITY_ONLY_PATTERN = Pattern.compile(
        "^[A-Za-z\\s'-]+,\\s*([A-Z]{2})?\\s*,?\\s*[A-Za-z\\s]*$",
        Pattern.CASE_INSENSITIVE
    );
    
    // Pattern to detect postal code only addresses
    // Canadian: "H3B 1A1" or "H3B1A1"
    // US: "12345" or "12345-6789"
    private static final Pattern POSTAL_CODE_ONLY_PATTERN = Pattern.compile(
        "^[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d$|^\\d{5}(-\\d{4})?$",
        Pattern.CASE_INSENSITIVE
    );
    
    // Pattern to detect province/state only addresses like "Quebec" or "Ontario, Canada"
    private static final Pattern PROVINCE_ONLY_PATTERN = Pattern.compile(
        "^[A-Za-z\\s]+,?\\s*(Canada|USA|United States)?$",
        Pattern.CASE_INSENSITIVE
    );
    
    // Must contain a street number at the beginning or after a space
    // Matches: "123 ", "123A ", "123-A ", etc.
    private static final Pattern STREET_NUMBER_PATTERN = Pattern.compile(
        "(^|\\s)\\d+[A-Za-z]?[-]?[A-Za-z]?\\s",
        Pattern.CASE_INSENSITIVE
    );
    
    @Override
    public boolean isValid(Location location, ConstraintValidatorContext context) {
        if (location == null || location.getAddress() == null) {
            return false; // Handled by @NotNull
        }
        
        String address = location.getAddress().trim();
        
        // Must have coordinates
        if (location.getLatitude() == null || location.getLongitude() == null) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Address must include coordinates"
            ).addConstraintViolation();
            log.warn("Rejected address without coordinates: {}", address);
            return false;
        }
        
        // Check if address is too short to be a street address
        if (address.length() < 10) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Address is too short. Please provide a complete street address."
            ).addConstraintViolation();
            log.warn("Rejected too-short address: {}", address);
            return false;
        }
        
        // Check if it's city-only (e.g., "Montreal, QC, Canada")
        if (CITY_ONLY_PATTERN.matcher(address).matches()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "City-only addresses are not permitted. Please provide a full street address with street number and name."
            ).addConstraintViolation();
            log.warn("Rejected city-only address: {}", address);
            return false;
        }
        
        // Check if it's postal code only
        if (POSTAL_CODE_ONLY_PATTERN.matcher(address).matches()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Postal code-only addresses are not permitted. Please provide a full street address."
            ).addConstraintViolation();
            log.warn("Rejected postal code-only address: {}", address);
            return false;
        }
        
        // Check if it's province/state only
        if (PROVINCE_ONLY_PATTERN.matcher(address).matches() && address.split(",").length <= 2) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Province-only addresses are not permitted. Please provide a full street address."
            ).addConstraintViolation();
            log.warn("Rejected province-only address: {}", address);
            return false;
        }
        
        // Must contain a street number
        if (!STREET_NUMBER_PATTERN.matcher(address).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Address must include a street number and name, not just a city or province."
            ).addConstraintViolation();
            log.warn("Rejected address without street number: {}", address);
            return false;
        }
        
        log.debug("Address validation passed: {}", address);
        return true;
    }
}
