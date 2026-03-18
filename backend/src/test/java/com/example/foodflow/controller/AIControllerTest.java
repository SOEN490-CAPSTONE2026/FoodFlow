package com.example.foodflow.controller;

import com.example.foodflow.exception.AIServiceException;
import com.example.foodflow.exception.InvalidImageException;
import com.example.foodflow.model.dto.AIExtractionResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.AIExtractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIControllerTest {

    @Mock
    private AIExtractionService aiExtractionService;

    private AIController aiController;
    private User currentUser;
    private MockMultipartFile imageFile;

    @BeforeEach
    void setUp() {
        aiController = new AIController(aiExtractionService);

        currentUser = new User();
        currentUser.setId(1L);

        imageFile = new MockMultipartFile(
                "image",
                "label.jpg",
                "image/jpeg",
                "fake-image-content".getBytes()
        );
    }

    @Test
    void extractDonationData_returnsOkWhenExtractionSucceeds() {
        AIExtractionResponse response = new AIExtractionResponse();
        response.setSuccess(true);
        response.setFoodName("Yogurt");

        when(aiExtractionService.analyzeFoodLabel(imageFile)).thenReturn(response);

        ResponseEntity<AIExtractionResponse> result =
                aiController.extractDonationData(imageFile, currentUser);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isTrue();
        assertThat(result.getBody().getFoodName()).isEqualTo("Yogurt");
    }

    @Test
    void extractDonationData_returnsUnprocessableEntityWhenExtractionFails() {
        AIExtractionResponse response = new AIExtractionResponse();
        response.setSuccess(false);
        response.setErrorMessage("Unable to parse label");

        when(aiExtractionService.analyzeFoodLabel(imageFile)).thenReturn(response);

        ResponseEntity<AIExtractionResponse> result =
                aiController.extractDonationData(imageFile, currentUser);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isFalse();
        assertThat(result.getBody().getErrorMessage()).isEqualTo("Unable to parse label");
    }

    @Test
    void extractDonationData_returnsBadRequestForInvalidImage() {
        when(aiExtractionService.analyzeFoodLabel(imageFile))
                .thenThrow(new InvalidImageException("Invalid format"));

        ResponseEntity<AIExtractionResponse> result =
                aiController.extractDonationData(imageFile, currentUser);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isFalse();
        assertThat(result.getBody().getErrorMessage()).isEqualTo("Invalid format");
    }

    @Test
    void extractDonationData_returnsServiceUnavailableForAIServiceException() {
        when(aiExtractionService.analyzeFoodLabel(imageFile))
                .thenThrow(new AIServiceException("OpenAI unavailable"));

        ResponseEntity<AIExtractionResponse> result =
                aiController.extractDonationData(imageFile, currentUser);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isFalse();
        assertThat(result.getBody().getErrorMessage())
                .isEqualTo("AI service is currently unavailable. Please try again later.");
    }

    @Test
    void extractDonationData_returnsInternalServerErrorForUnexpectedException() {
        when(aiExtractionService.analyzeFoodLabel(imageFile))
                .thenThrow(new RuntimeException("Unexpected"));

        ResponseEntity<AIExtractionResponse> result =
                aiController.extractDonationData(imageFile, currentUser);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().isSuccess()).isFalse();
        assertThat(result.getBody().getErrorMessage())
                .isEqualTo("An unexpected error occurred. Please try again.");
    }

    @Test
    void healthCheck_returnsOnlineMessage() {
        ResponseEntity<String> result = aiController.healthCheck();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEqualTo("AI service is online");
    }
}
