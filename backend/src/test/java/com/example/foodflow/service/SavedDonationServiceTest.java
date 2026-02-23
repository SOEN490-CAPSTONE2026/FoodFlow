package com.example.foodflow.service;

import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.SavedDonation;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.SavedDonationRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SavedDonationServiceTest {

    @Mock
    private SavedDonationRepository savedDonationRepository;

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock
    private SurplusService surplusService;

    @InjectMocks
    private SavedDonationService savedDonationService;

    private User receiverUser;
    private User donorUser;

    @BeforeEach
    void setUp() {
        receiverUser = new User();
        receiverUser.setId(10L);
        receiverUser.setRole(UserRole.RECEIVER);
        receiverUser.setTimezone("America/Montreal");

        donorUser = new User();
        donorUser.setId(20L);
        donorUser.setRole(UserRole.DONOR);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(Object principal) {
        var auth = new UsernamePasswordAuthenticationToken(principal, "n/a");
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void saveDonation_throwsWhenPrincipalIsNotUser() {
        authenticateAs("not-a-user");

        assertThatThrownBy(() -> savedDonationService.saveDonation(1L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Invalid authentication context");
    }

    @Test
    void saveDonation_throwsWhenRoleIsNotReceiver() {
        authenticateAs(donorUser);

        assertThatThrownBy(() -> savedDonationService.saveDonation(1L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only receivers can save donations");
    }

    @Test
    void saveDonation_throwsWhenDonationNotFound() {
        authenticateAs(receiverUser);
        when(surplusPostRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> savedDonationService.saveDonation(99L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException err = (ResponseStatusException) ex;
                    assertThat(err.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                });
    }

    @Test
    void saveDonation_throwsWhenDonationExpired() {
        authenticateAs(receiverUser);
        SurplusPost expired = new SurplusPost();
        expired.setId(1L);
        expired.setExpiryDate(LocalDate.now().minusDays(1));
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> savedDonationService.saveDonation(1L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException err = (ResponseStatusException) ex;
                    assertThat(err.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                });
    }

    @Test
    void saveDonation_returnsWhenAlreadySaved() {
        authenticateAs(receiverUser);
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setExpiryDate(LocalDate.now().plusDays(1));
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(savedDonationRepository.existsByReceiverAndSurplusPost(receiverUser, post)).thenReturn(true);

        savedDonationService.saveDonation(1L);

        verify(savedDonationRepository, never()).save(any(SavedDonation.class));
    }

    @Test
    void saveDonation_savesWhenValidAndNotAlreadySaved() {
        authenticateAs(receiverUser);
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setExpiryDate(LocalDate.now().plusDays(1));
        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(savedDonationRepository.existsByReceiverAndSurplusPost(receiverUser, post)).thenReturn(false);

        savedDonationService.saveDonation(1L);

        verify(savedDonationRepository).save(any(SavedDonation.class));
    }

    @Test
    void unsaveDonation_deletesForAuthenticatedReceiver() {
        authenticateAs(receiverUser);

        savedDonationService.unsaveDonation(77L);

        verify(savedDonationRepository).deleteByReceiverIdAndSurplusPostId(10L, 77L);
    }

    @Test
    void getSavedDonations_returnsOnlyAvailableAndNotExpired() {
        authenticateAs(receiverUser);

        SurplusPost available = new SurplusPost();
        available.setId(1L);
        available.setStatus(PostStatus.AVAILABLE);
        available.setExpiryDate(LocalDate.now().plusDays(2));

        SurplusPost expired = new SurplusPost();
        expired.setId(2L);
        expired.setStatus(PostStatus.AVAILABLE);
        expired.setExpiryDate(LocalDate.now().minusDays(1));

        SurplusPost claimed = new SurplusPost();
        claimed.setId(3L);
        claimed.setStatus(PostStatus.CLAIMED);
        claimed.setExpiryDate(LocalDate.now().plusDays(2));

        SavedDonation sd1 = new SavedDonation(receiverUser, available);
        SavedDonation sd2 = new SavedDonation(receiverUser, expired);
        SavedDonation sd3 = new SavedDonation(receiverUser, claimed);

        when(savedDonationRepository.findByReceiverIdOrderBySavedAtDesc(10L))
                .thenReturn(List.of(sd1, sd2, sd3));
        when(surplusService.convertToResponseForReceiver(available, "America/Montreal"))
                .thenReturn(new SurplusResponse());

        List<SurplusResponse> responses = savedDonationService.getSavedDonations();

        assertThat(responses).hasSize(1);
        verify(surplusService).convertToResponseForReceiver(available, "America/Montreal");
        verify(surplusService, never()).convertToResponseForReceiver(expired, "America/Montreal");
        verify(surplusService, never()).convertToResponseForReceiver(claimed, "America/Montreal");
    }

    @Test
    void getSavedDonations_usesUtcWhenTimezoneMissing() {
        receiverUser.setTimezone(null);
        authenticateAs(receiverUser);

        SurplusPost available = new SurplusPost();
        available.setId(1L);
        available.setStatus(PostStatus.AVAILABLE);

        SavedDonation savedDonation = new SavedDonation(receiverUser, available);
        when(savedDonationRepository.findByReceiverIdOrderBySavedAtDesc(10L))
                .thenReturn(List.of(savedDonation));
        when(surplusService.convertToResponseForReceiver(available, "UTC"))
                .thenReturn(new SurplusResponse());

        savedDonationService.getSavedDonations();

        verify(surplusService).convertToResponseForReceiver(available, "UTC");
    }

    @Test
    void isDonationSaved_checksRepositoryForAuthenticatedReceiver() {
        authenticateAs(receiverUser);
        when(savedDonationRepository.existsByReceiverIdAndSurplusPostId(10L, 5L))
                .thenReturn(true);

        boolean saved = savedDonationService.isDonationSaved(5L);

        assertThat(saved).isTrue();
    }

    @Test
    void getSavedCount_returnsRepositoryCountForAuthenticatedReceiver() {
        authenticateAs(receiverUser);
        when(savedDonationRepository.countByReceiverId(10L)).thenReturn(4L);

        long count = savedDonationService.getSavedCount();

        assertThat(count).isEqualTo(4L);
    }
}
