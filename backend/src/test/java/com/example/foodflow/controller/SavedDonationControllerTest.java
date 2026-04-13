package com.example.foodflow.controller;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.service.SavedDonationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.Arrays;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class SavedDonationControllerTest {
    @Mock
    private SavedDonationService savedDonationService;
    @InjectMocks
    private SavedDonationController savedDonationController;
    @Test
    void saveDonation_Success() {
        // Given
        Long donationId = 1L;
        doNothing().when(savedDonationService).saveDonation(donationId);
        // When
        ResponseEntity<Void> response = savedDonationController.saveDonation(donationId);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        verify(savedDonationService).saveDonation(donationId);
    }
    @Test
    void unsaveDonation_Success() {
        // Given
        Long donationId = 1L;
        doNothing().when(savedDonationService).unsaveDonation(donationId);
        // When
        ResponseEntity<Void> response = savedDonationController.unsaveDonation(donationId);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(savedDonationService).unsaveDonation(donationId);
    }
    @Test
    void getSavedDonations_ReturnsListOfDonations() {
        // Given
        SurplusResponse donation1 = new SurplusResponse();
        donation1.setId(1L);
        SurplusResponse donation2 = new SurplusResponse();
        donation2.setId(2L);
        List<SurplusResponse> savedDonations = Arrays.asList(donation1, donation2);
        when(savedDonationService.getSavedDonations()).thenReturn(savedDonations);
        // When
        ResponseEntity<List<SurplusResponse>> response = savedDonationController.getSavedDonations();
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getId()).isEqualTo(1L);
        verify(savedDonationService).getSavedDonations();
    }
    @Test
    void isSaved_ReturnsTrueWhenSaved() {
        // Given
        Long donationId = 1L;
        when(savedDonationService.isDonationSaved(donationId)).thenReturn(true);
        // When
        ResponseEntity<Boolean> response = savedDonationController.isSaved(donationId);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isTrue();
        verify(savedDonationService).isDonationSaved(donationId);
    }
    @Test
    void isSaved_ReturnsFalseWhenNotSaved() {
        // Given
        Long donationId = 1L;
        when(savedDonationService.isDonationSaved(donationId)).thenReturn(false);
        // When
        ResponseEntity<Boolean> response = savedDonationController.isSaved(donationId);
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isFalse();
        verify(savedDonationService).isDonationSaved(donationId);
    }
    @Test
    void getSavedCount_ReturnsCount() {
        // Given
        Long count = 5L;
        when(savedDonationService.getSavedCount()).thenReturn(count);
        // When
        ResponseEntity<Long> response = savedDonationController.getSavedCount();
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(5L);
        verify(savedDonationService).getSavedCount();
    }
}
