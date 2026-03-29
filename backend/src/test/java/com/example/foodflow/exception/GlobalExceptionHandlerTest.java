package com.example.foodflow.exception;

import com.example.foodflow.model.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.context.MessageSource;
import org.springframework.web.servlet.LocaleResolver;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.foodflow.exception.domain.DonationNotFoundException;
import com.example.foodflow.exception.domain.UnauthorizedAccessException;
import com.example.foodflow.exception.domain.InvalidClaimException;
import com.example.foodflow.exception.domain.ClaimNotFoundException;
import com.example.foodflow.exception.domain.InvalidClaimStateException;
import com.example.foodflow.exception.domain.PaymentFailedException;

public class GlobalExceptionHandlerTest {
    private GlobalExceptionHandler handler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        MessageSource messageSource = Mockito.mock(MessageSource.class);
        LocaleResolver localeResolver = Mockito.mock(LocaleResolver.class);
        handler = new GlobalExceptionHandler(messageSource, localeResolver);
        request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/test");
        Mockito.when(messageSource.getMessage(Mockito.anyString(), Mockito.any(), Mockito.anyString(), Mockito.any()))
               .thenAnswer(invocation -> invocation.getArgument(2)); // default to provided message
    }

    @Test
    void handleDonationNotFoundException_returns404() {
        DonationNotFoundException ex = new DonationNotFoundException(123L);
        ResponseEntity<ErrorResponse> response = handler.handleDonationNotFoundException(ex, request);
        assertThat(response.getStatusCodeValue()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Not Found");
        assertThat(response.getBody().getMessage()).contains("not found");
        assertThat(response.getBody().getPath()).isEqualTo("/api/test");
    }

    @Test
    void handleUnauthorizedAccessException_returns403() {
        UnauthorizedAccessException ex = new UnauthorizedAccessException("Forbidden");
        ResponseEntity<ErrorResponse> response = handler.handleUnauthorizedAccessException(ex, request);
        assertThat(response.getStatusCodeValue()).isEqualTo(403);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Forbidden");
        assertThat(response.getBody().getMessage()).contains("Forbidden");
    }

    @Test
    void handleInvalidClaimException_returns400() {
        InvalidClaimException ex = new InvalidClaimException("Invalid claim");
        ResponseEntity<ErrorResponse> response = handler.handleInvalidClaimException(ex, request);
        assertThat(response.getStatusCodeValue()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Invalid Claim");
        assertThat(response.getBody().getMessage()).contains("Invalid claim");
    }

    @Test
    void handleClaimNotFoundException_returns404() {
        ClaimNotFoundException ex = new ClaimNotFoundException(456L);
        ResponseEntity<ErrorResponse> response = handler.handleClaimNotFoundException(ex, request);
        assertThat(response.getStatusCodeValue()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Claim Not Found");
        assertThat(response.getBody().getMessage()).contains("not found");
    }

    @Test
    void handleInvalidClaimStateException_returns409() {
        InvalidClaimStateException ex = new InvalidClaimStateException("Invalid state");
        ResponseEntity<ErrorResponse> response = handler.handleInvalidClaimStateException(ex, request);
        assertThat(response.getStatusCodeValue()).isEqualTo(409);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Invalid Claim State");
        assertThat(response.getBody().getMessage()).contains("Invalid state");
    }

    @Test
    void handlePaymentFailedException_returns402() {
        PaymentFailedException ex = new PaymentFailedException("Payment failed");
        ResponseEntity<ErrorResponse> response = handler.handlePaymentFailedException(ex, request);
        assertThat(response.getStatusCodeValue()).isEqualTo(402);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Payment Failed");
        assertThat(response.getBody().getMessage()).contains("Payment failed");
    }
}
