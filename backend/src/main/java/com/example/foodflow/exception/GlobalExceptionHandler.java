package com.example.foodflow.exception;
import com.example.foodflow.model.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
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
    /**
     * Handle DonationNotFoundException (404)
     */
    @ExceptionHandler(com.example.foodflow.exception.domain.DonationNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleDonationNotFoundException(
            com.example.foodflow.exception.domain.DonationNotFoundException ex,
            HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getRequestURI());
        log.warn("Donation not found on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }
    /**
     * Handle UnauthorizedAccessException (403)
     */
    @ExceptionHandler(com.example.foodflow.exception.domain.UnauthorizedAccessException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedAccessException(
            com.example.foodflow.exception.domain.UnauthorizedAccessException ex,
            HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Forbidden",
                ex.getMessage(),
                request.getRequestURI());
        log.warn("Unauthorized access on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }
    /**
     * Handle InvalidClaimException (400)
     */
    @ExceptionHandler(com.example.foodflow.exception.domain.InvalidClaimException.class)
    public ResponseEntity<ErrorResponse> handleInvalidClaimException(
            com.example.foodflow.exception.domain.InvalidClaimException ex,
            HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Invalid Claim",
                ex.getMessage(),
                request.getRequestURI());
        log.warn("Invalid claim on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
    /**
     * Handle ClaimNotFoundException (404)
     */
    @ExceptionHandler(com.example.foodflow.exception.domain.ClaimNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleClaimNotFoundException(
            com.example.foodflow.exception.domain.ClaimNotFoundException ex,
            HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Claim Not Found",
                ex.getMessage(),
                request.getRequestURI());
        log.warn("Claim not found on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }
    /**
     * Handle InvalidClaimStateException (409)
     */
    @ExceptionHandler(com.example.foodflow.exception.domain.InvalidClaimStateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidClaimStateException(
            com.example.foodflow.exception.domain.InvalidClaimStateException ex,
            HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "Invalid Claim State",
                ex.getMessage(),
                request.getRequestURI());
        log.warn("Invalid claim state on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }
    /**
     * Handle PaymentFailedException (402)
     */
    @ExceptionHandler(com.example.foodflow.exception.domain.PaymentFailedException.class)
    public ResponseEntity<ErrorResponse> handlePaymentFailedException(
            com.example.foodflow.exception.domain.PaymentFailedException ex,
            HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.PAYMENT_REQUIRED.value(),
                "Payment Failed",
                ex.getMessage(),
                request.getRequestURI());
        log.warn("Payment failed on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(errorResponse);
    }
        private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
        private final MessageSource messageSource;
        private final org.springframework.web.servlet.LocaleResolver localeResolver;
        public GlobalExceptionHandler(MessageSource messageSource, org.springframework.web.servlet.LocaleResolver localeResolver) {
                this.messageSource = messageSource;
                this.localeResolver = localeResolver;
        }
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
                errorResponse.setCode(ex.getMessageKey());
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
         * Handle IOException (e.g., file upload failures).
         */
        @ExceptionHandler(java.io.IOException.class)
        public ResponseEntity<ErrorResponse> handleIOException(
                        java.io.IOException ex,
                        HttpServletRequest request) {
                Locale locale = resolveLocale(request);
                String localizedMessage = messageSource.getMessage(
                                "error.file.upload",
                                null,
                                "File operation failed",
                                locale);
                ErrorResponse errorResponse = new ErrorResponse(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Internal Server Error",
                                localizedMessage,
                                request.getRequestURI());
                log.error("IOException on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
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
                        /**
                 * Handle MessageNotFoundException (404)
                 */
                @ExceptionHandler(com.example.foodflow.exception.domain.MessageNotFoundException.class)
                public ResponseEntity<ErrorResponse> handleMessageNotFoundException(
                                com.example.foodflow.exception.domain.MessageNotFoundException ex,
                                HttpServletRequest request) {
                        ErrorResponse errorResponse = new ErrorResponse(
                                        HttpStatus.NOT_FOUND.value(),
                                        "Message Not Found",
                                        ex.getMessage(),
                                        request.getRequestURI());
                        log.warn("Message not found on {}: {}", request.getRequestURI(), ex.getMessage());
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                }
        /**
         * Handle ConversationNotFoundException (404)
         */
        @ExceptionHandler(com.example.foodflow.exception.domain.ConversationNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleConversationNotFoundException(
                        com.example.foodflow.exception.domain.ConversationNotFoundException ex,
                        HttpServletRequest request) {
                ErrorResponse errorResponse = new ErrorResponse(
                                HttpStatus.NOT_FOUND.value(),
                                "Conversation Not Found",
                                ex.getMessage(),
                                request.getRequestURI());
                log.warn("Conversation not found on {}: {}", request.getRequestURI(), ex.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
}
