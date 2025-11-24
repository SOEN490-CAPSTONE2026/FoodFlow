package com.example.foodflow.exception;

import com.example.foodflow.model.dto.AuthResponse;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.VerificationStatus;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.JsonMappingException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.stream.Collectors;

@ControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<AuthResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Throwable cause = ex.getCause();
        if (cause instanceof InvalidFormatException) {
            InvalidFormatException ife = (InvalidFormatException) cause;
            String targetType = ife.getTargetType() != null ? ife.getTargetType().getSimpleName() : "";
            String fieldName = "";
            for (JsonMappingException.Reference ref : ife.getPath()) {
                if (ref.getFieldName() != null) {
                    fieldName = ref.getFieldName();
                    break;
                }
            }

            String invalidValue = ife.getValue() != null ? ife.getValue().toString() : "";
            String message = "Invalid value '" + invalidValue + "'";
            if (!fieldName.isEmpty()) message += " for field '" + fieldName + "'";

            // If the target type is one of our enums, append allowed values
            if ("OrganizationType".equals(targetType)) {
                String allowed = String.join(", ",
                        java.util.Arrays.stream(OrganizationType.values()).map(Enum::name).collect(Collectors.toList())
                );
                message += ". Allowed values: [" + allowed + "]";
            } else if ("VerificationStatus".equals(targetType)) {
                String allowed = String.join(", ",
                        java.util.Arrays.stream(VerificationStatus.values()).map(Enum::name).collect(Collectors.toList())
                );
                message += ". Allowed values: [" + allowed + "]";
            }

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, null, null, message));
        }

        // Fallback generic message
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, null, null, "Malformed request body"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<AuthResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String rootMsg = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        if (rootMsg != null && rootMsg.toLowerCase().contains("invalid input value for enum")) {
            // Give a friendly message mentioning allowed values for both enums
            String allowedOrg = String.join(", ", java.util.Arrays.stream(OrganizationType.values()).map(Enum::name).collect(Collectors.toList()));
            String allowedVer = String.join(", ", java.util.Arrays.stream(VerificationStatus.values()).map(Enum::name).collect(Collectors.toList()));
            String message = "Invalid enum value provided. Allowed organization_type values: [" + allowedOrg + "] and verification_status values: [" + allowedVer + "]";
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, null, null, message));
        }

        // Default fallback
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, null, null, "Data integrity violation"));
    }
}
