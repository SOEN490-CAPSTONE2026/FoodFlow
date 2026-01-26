package com.example.foodflow.controller;

import com.example.foodflow.model.dto.UploadEvidenceResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.SurplusService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SurplusControllerEvidenceUploadTest {

    @Mock
    private SurplusService surplusService;

    @InjectMocks
    private SurplusController surplusController;

    private User mockDonor;
    private MockMultipartFile mockFile;

    @BeforeEach
    void setUp() {
        mockDonor = new User();
        mockDonor.setId(1L);
        mockDonor.setEmail("donor@test.com");

        mockFile = new MockMultipartFile(
            "file",
            "evidence.jpg",
            "image/jpeg",
            "test image content".getBytes()
        );
    }

    @Test
    void uploadPickupEvidence_withValidFile_shouldReturnCreated() throws IOException {
        // Given
        Long postId = 1L;
        String expectedUrl = "/api/files/evidence/donation-1/uuid.jpg";
        UploadEvidenceResponse expectedResponse = new UploadEvidenceResponse(
            expectedUrl, "Evidence uploaded successfully", true
        );

        when(surplusService.uploadPickupEvidence(eq(postId), any(), eq(mockDonor)))
            .thenReturn(expectedResponse);

        // When
        ResponseEntity<UploadEvidenceResponse> response = surplusController.uploadPickupEvidence(
            postId, mockFile, mockDonor
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getUrl()).isEqualTo(expectedUrl);
    }

    @Test
    void uploadPickupEvidence_withInvalidFile_shouldReturnBadRequest() throws IOException {
        // Given
        Long postId = 1L;
        when(surplusService.uploadPickupEvidence(eq(postId), any(), eq(mockDonor)))
            .thenThrow(new IllegalArgumentException("Invalid file type"));

        // When
        ResponseEntity<UploadEvidenceResponse> response = surplusController.uploadPickupEvidence(
            postId, mockFile, mockDonor
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Invalid file type");
    }

    @Test
    void uploadPickupEvidence_withIOException_shouldReturnInternalServerError() throws IOException {
        // Given
        Long postId = 1L;
        when(surplusService.uploadPickupEvidence(eq(postId), any(), eq(mockDonor)))
            .thenThrow(new IOException("Disk full"));

        // When
        ResponseEntity<UploadEvidenceResponse> response = surplusController.uploadPickupEvidence(
            postId, mockFile, mockDonor
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Failed to upload");
    }

    @Test
    void uploadPickupEvidence_withUnauthorizedDonor_shouldReturnBadRequest() throws IOException {
        // Given
        Long postId = 1L;
        when(surplusService.uploadPickupEvidence(eq(postId), any(), eq(mockDonor)))
            .thenThrow(new IllegalArgumentException("You are not authorized"));

        // When
        ResponseEntity<UploadEvidenceResponse> response = surplusController.uploadPickupEvidence(
            postId, mockFile, mockDonor
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).contains("not authorized");
    }
}

