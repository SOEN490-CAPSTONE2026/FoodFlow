package com.example.foodflow.exception;

import com.example.foodflow.model.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Global exception handler for REST API endpoints.
 * Provides localized error messages based on Accept-Language header.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @Autowired
        private MessageSource messageSource;

        @Autowired
        private org.springframework.web.servlet.LocaleResolver localeResolver;

        /**
         * Resolve locale from the request using the configured LocaleResolver.
         */
        private Locale resolveLocale(HttpServletRequest request) {
                return localeResolver.resolveLocale(request);
        }

        /**
         * Handle HttpMediaTypeNotSupportedException (missing or invalid Content-Type).
         */
        @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
        public ResponseEntity<ErrorResponse> handleHttpMediaTypeNotSupportedException(
                        org.springframework.web.HttpMediaTypeNotSupportedException ex,
                        HttpServletRequest request) {

                Locale locale = resolveLocale(request);
                String localizedMessage = messageSource.getMessage(
                                "error.unsupported_media_type",
                                null,
                                "Unsupported Media Type",
                                locale);

                ErrorResponse errorResponse = new ErrorResponse(
                                HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(),
                                "Unsupported Media Type",
                                localizedMessage,
                                request.getRequestURI());

                log.warn("Unsupported media type on {}: {}", request.getRequestURI(), ex.getMessage());

                return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(errorResponse);
        }

        /**
         * Handle validation errors from @Valid annotations.
         */
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidationException(
                        MethodArgumentNotValidException ex,
                        HttpServletRequest request) {

                Locale locale = resolveLocale(request);
                BindingResult bindingResult = ex.getBindingResult();

                List<ErrorResponse.FieldError> fieldErrors = new ArrayList<>();
                for (FieldError fieldError : bindingResult.getFieldErrors()) {
                        String localizedMessage = messageSource.getMessage(
                                        fieldError.getDefaultMessage(),
                                        null,
                                        fieldError.getDefaultMessage(),
                                        locale);
                        fieldErrors.add(new ErrorResponse.FieldError(
                                        fieldError.getField(),
                                        localizedMessage,
                                        fieldError.getRejectedValue()));
                }

                String errorMessage = messageSource.getMessage(
                                "error.validation.failed",
                                null,
                                "Validation failed",
                                locale);

                ErrorResponse errorResponse = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                errorMessage,
                                request.getRequestURI(),
                                fieldErrors);

                log.warn("Validation error on {}: {} field errors", request.getRequestURI(), fieldErrors.size());

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        /**
         * Handle custom BusinessException with i18n support.
         */
        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<ErrorResponse> handleBusinessException(
                        BusinessException ex,
                        HttpServletRequest request) {

                Locale locale = resolveLocale(request);
                String localizedMessage = messageSource.getMessage(
                                ex.getMessageKey(),
                                ex.getArgs(),
                                ex.getMessage(),
                                locale);

                ErrorResponse errorResponse = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Business Rule Violation",
                                localizedMessage,
                                request.getRequestURI());

                log.warn("Business exception on {}: {}", request.getRequestURI(), ex.getMessageKey());

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        /**
         * Handle ResourceNotFoundException with i18n support.
         */
        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
                        ResourceNotFoundException ex,
                        HttpServletRequest request) {

                Locale locale = resolveLocale(request);
                String localizedMessage = messageSource.getMessage(
                                ex.getMessageKey(),
                                ex.getArgs(),
                                ex.getMessage(),
                                locale);

                ErrorResponse errorResponse = new ErrorResponse(
                                HttpStatus.NOT_FOUND.value(),
                                "Not Found",
                                localizedMessage,
                                request.getRequestURI());

                log.warn("Resource not found on {}: {}", request.getRequestURI(), ex.getMessageKey());

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }

        /**
         * Handle IllegalArgumentException with i18n support.
         */
        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
                        IllegalArgumentException ex,
                        HttpServletRequest request) {

                Locale locale = resolveLocale(request);

                // Try to resolve as a message key first, fallback to the raw message
                String localizedMessage = messageSource.getMessage(
                                ex.getMessage(),
                                null,
                                ex.getMessage(),
                                locale);

                ErrorResponse errorResponse = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                localizedMessage,
                                request.getRequestURI());

                log.warn("Illegal argument on {}: {}", request.getRequestURI(), ex.getMessage());

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        /**
         * Handle generic RuntimeException (fallback for uncaught exceptions).
         */
        @ExceptionHandler(RuntimeException.class)
        public ResponseEntity<ErrorResponse> handleRuntimeException(
                        RuntimeException ex,
                        HttpServletRequest request) {

                Locale locale = resolveLocale(request);

                // Try to resolve as a message key, fallback to the original message or generic
                // error
                String localizedMessage = messageSource.getMessage(
                                ex.getMessage(),
                                null,
                                null, // no default, will return null if not found
                                locale);

                // If message key was not resolved, use the exception message or fallback to
                // generic error
                if (localizedMessage == null) {
                        // If the message looks like a message key (contains dots), use generic error
                        if (ex.getMessage() != null && ex.getMessage().startsWith("error.")) {
                                localizedMessage = messageSource.getMessage(
                                                "error.internal",
                                                null,
                                                "An unexpected error occurred",
                                                locale);
                        } else {
                                // For non-key messages, use the message as-is (it may be a user-readable
                                // message)
                                localizedMessage = ex.getMessage() != null ? ex.getMessage()
                                                : messageSource.getMessage("error.internal", null,
                                                                "An unexpected error occurred", locale);
                        }
                }

                ErrorResponse errorResponse = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                localizedMessage,
                                request.getRequestURI());

                log.warn("Runtime exception on {}: {}", request.getRequestURI(), ex.getMessage());

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        /**
         * Handle any other uncaught exceptions.
         */
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGenericException(
                        Exception ex,
                        HttpServletRequest request) {

                Locale locale = resolveLocale(request);
                String localizedMessage = messageSource.getMessage(
                                "error.internal",
                                null,
                                "An unexpected error occurred",
                                locale);

                ErrorResponse errorResponse = new ErrorResponse(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Internal Server Error",
                                localizedMessage,
                                request.getRequestURI());

                log.error("Unexpected exception on {}: {}", request.getRequestURI(), ex.getMessage(), ex);

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
}
