package com.example.foodflow.service;

import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.SavedDonation;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.SavedDonationRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import jakarta.transaction.Transactional;
import com.example.foodflow.model.types.PostStatus;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SavedDonationService {

    private final SavedDonationRepository savedDonationRepository;
    private final SurplusPostRepository surplusPostRepository;
    private final SurplusService surplusService;

    public SavedDonationService(
            SavedDonationRepository savedDonationRepository,
            SurplusPostRepository surplusPostRepository,
            SurplusService surplusService
    ) {
        this.savedDonationRepository = savedDonationRepository;
        this.surplusPostRepository = surplusPostRepository;
        this.surplusService = surplusService;
    }

    /* 
       Helper: Get Authenticated Receiver
       */
    private User getAuthenticatedReceiver() {

        Object principal = SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        if (!(principal instanceof User user)) {
            throw new AccessDeniedException("Invalid authentication context");
        }

        if (user.getRole() != UserRole.RECEIVER) {
            throw new AccessDeniedException("Only receivers can save donations");
        }

        return user;
    }

    /* 
       Save Donation
        */
    @Transactional
    public void saveDonation(Long surplusPostId) {

        User receiver = getAuthenticatedReceiver();

        SurplusPost post = surplusPostRepository.findById(surplusPostId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Donation not found"
                        )
                );

        // Prevent saving expired donations
        if (post.getExpiryDate() != null &&
                post.getExpiryDate().isBefore(LocalDate.now())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot save expired donation"
            );
        }

        boolean alreadySaved =
                savedDonationRepository.existsByReceiverAndSurplusPost(receiver, post);

        if (alreadySaved) {
            return;
        }

        SavedDonation savedDonation = new SavedDonation(receiver, post);
        savedDonationRepository.save(savedDonation);
    }

    /* 
       Unsave Donation
       */
    @Transactional
    public void unsaveDonation(Long surplusPostId) {

        User receiver = getAuthenticatedReceiver();

        savedDonationRepository
                .deleteByReceiverIdAndSurplusPostId(receiver.getId(), surplusPostId);
    }

    /* 
       Get All Saved Donations
        */
    public List<SurplusResponse> getSavedDonations() {

        User receiver = getAuthenticatedReceiver();
        String receiverTimezone = receiver.getTimezone() != null
                ? receiver.getTimezone()
                : "UTC";

        return savedDonationRepository
                .findByReceiverIdOrderBySavedAtDesc(receiver.getId())
                .stream()
                .map(SavedDonation::getSurplusPost)
                .filter(post ->
    post != null &&
    post.getStatus() == PostStatus.AVAILABLE &&
    (post.getExpiryDate() == null ||
        !post.getExpiryDate().isBefore(LocalDate.now()))
)

                .map(post -> surplusService.convertToResponseForReceiver(post, receiverTimezone))
                .collect(Collectors.toList());
    }

    /* 
       Check If Saved
       */
    public boolean isDonationSaved(Long surplusPostId) {

        User receiver = getAuthenticatedReceiver();

        return savedDonationRepository
                .existsByReceiverIdAndSurplusPostId(
                        receiver.getId(),
                        surplusPostId
                );
    }

    /* =========================================
       Count Saved Donations (Badge)
       ========================================= */
    public long getSavedCount() {

        User receiver = getAuthenticatedReceiver();

        return savedDonationRepository.countByReceiverId(receiver.getId());
    }
}
