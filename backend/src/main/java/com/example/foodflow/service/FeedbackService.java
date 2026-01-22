package com.example.foodflow.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.foodflow.model.dto.AdminRatingDashboardDTO;
import com.example.foodflow.model.dto.AdminRatingDashboardDTO.RatingStatisticsDTO;
import com.example.foodflow.model.dto.FeedbackRequestDTO;
import com.example.foodflow.model.dto.FeedbackResponseDTO;
import com.example.foodflow.model.dto.UserRatingDTO;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.Feedback;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.FeedbackRepository;
import com.example.foodflow.service.AlertService;

/**
 * Service for managing feedback operations with admin functionality and
 * threshold alerts
 */
@Service
@Transactional
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired(required = false) // Optional dependency
    private AlertService alertService;

    @Value("${app.rating.low-threshold:2.0}")
    private Double lowRatingThreshold;

    @Value("${app.rating.min-reviews-for-alert:3}")
    private Integer minReviewsForAlert;

    /**
     * Submit feedback for a completed donation with threshold monitoring
     */
    public FeedbackResponseDTO submitFeedback(FeedbackRequestDTO requestDTO, User reviewer) {
        // Find the claim
        Claim claim = claimRepository.findById(requestDTO.getClaimId())
                .orElseThrow(() -> new IllegalArgumentException("Claim not found"));

        // Validate claim is COMPLETED (only allow feedback for completed claims)
        //if (claim.getStatus() != ClaimStatus.COMPLETED) {
        //    throw new IllegalStateException("Feedback can only be provided for completed claims");
        //}

        // Validate reviewer is part of this claim
        User donor = claim.getSurplusPost().getDonor();
        User receiver = claim.getReceiver();

        if (!reviewer.getId().equals(donor.getId()) && !reviewer.getId().equals(receiver.getId())) {
            throw new IllegalArgumentException("You can only provide feedback for your own donations");
        }

        // Check if feedback already exists
        if (feedbackRepository.existsByClaimAndReviewer(claim, reviewer)) {
            throw new IllegalStateException("You have already provided feedback for this donation");
        }

        // Determine reviewee (the other party)
        User reviewee = reviewer.getId().equals(donor.getId()) ? receiver : donor;

        // Create and save feedback
        Feedback feedback = new Feedback(claim, reviewer, reviewee, requestDTO.getRating(), requestDTO.getReviewText());
        feedback = feedbackRepository.save(feedback);

        // Check if this triggers a low rating alert for the reviewee
        checkAndTriggerLowRatingAlert(reviewee);

        return convertToResponseDTO(feedback);
    }

    /**
     * Get feedback for a specific claim
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponseDTO> getFeedbackForClaim(Long claimId, User user) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("Claim not found"));

        // Validate user is part of this claim OR is an admin
        boolean isAdmin = user.getRole() != null && user.getRole().name().equals("ADMIN");
        boolean isDonor = user.getId().equals(claim.getSurplusPost().getDonor().getId());
        boolean isReceiver = user.getId().equals(claim.getReceiver().getId());

        if (!isAdmin && !isDonor && !isReceiver) {
            throw new IllegalArgumentException("You can only view feedback for your own donations");
        }

        List<Feedback> feedbackList = feedbackRepository.findByClaim(claim);
        return feedbackList.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all feedback received by a user
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponseDTO> getFeedbackForUser(User user) {
        List<Feedback> feedbackList = feedbackRepository.findByRevieweeOrderByCreatedAtDesc(user);
        return feedbackList.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get user rating summary with aggregated data
     */
    @Transactional(readOnly = true)
    public UserRatingDTO getUserRating(User user) {
        UserRatingDTO userRating = new UserRatingDTO();
        userRating.setUserId(user.getId());
        userRating.setUserName(getUserDisplayName(user));

        // Get average rating and total reviews
        Double averageRating = feedbackRepository.getAverageRatingForUser(user);
        Long totalReviews = feedbackRepository.getTotalReviewsForUser(user);

        userRating.setAverageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0);
        userRating.setTotalReviews(totalReviews != null ? totalReviews.intValue() : 0);

        // Get rating distribution
        List<Object[]> distribution = feedbackRepository.getRatingDistributionForUser(user);
        Map<Integer, Integer> ratingCounts = new HashMap<>();

        for (Object[] row : distribution) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            ratingCounts.put(rating, count.intValue());
        }

        userRating.setFiveStarCount(ratingCounts.getOrDefault(5, 0));
        userRating.setFourStarCount(ratingCounts.getOrDefault(4, 0));
        userRating.setThreeStarCount(ratingCounts.getOrDefault(3, 0));
        userRating.setTwoStarCount(ratingCounts.getOrDefault(2, 0));
        userRating.setOneStarCount(ratingCounts.getOrDefault(1, 0));

        return userRating;
    }

    /**
     * Check if user can provide feedback for a claim
     */
    @Transactional(readOnly = true)
    public boolean canProvideFeedback(Long claimId, User user) {
        Optional<Claim> claimOpt = claimRepository.findById(claimId);
        if (claimOpt.isEmpty()) {
            return false;
        }

        Claim claim = claimOpt.get();

        // Check if claim is completed
        if (claim.getStatus() != ClaimStatus.COMPLETED) {
            return false;
        }

        // Check if user is part of this claim
        if (!user.getId().equals(claim.getSurplusPost().getDonor().getId()) &&
                !user.getId().equals(claim.getReceiver().getId())) {
            return false;
        }

        // Check if user hasn't already provided feedback
        return !feedbackRepository.existsByClaimAndReviewer(claim, user);
    }

    /**
     * Get claims that need feedback from the user
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsNeedingFeedback(User user) {
        // Find completed claims where user is either donor or receiver but hasn't given
        // feedback
        return claimRepository.findCompletedClaimsForUser(user).stream()
                .filter(claim -> !feedbackRepository.existsByClaimAndReviewer(claim, user))
                .collect(Collectors.toList());
    }

    /**
     * Get recent feedback for a user (for displaying on profile)
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponseDTO> getRecentFeedback(User user, int limit) {
        List<Feedback> recentFeedback = feedbackRepository.findRecentFeedbackForUser(
                user, PageRequest.of(0, limit));

        return recentFeedback.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Check if both parties have provided feedback for a claim
     */
    @Transactional(readOnly = true)
    public boolean isFeedbackComplete(Long claimId) {
        Optional<Claim> claimOpt = claimRepository.findById(claimId);
        if (claimOpt.isEmpty()) {
            return false;
        }

        Long feedbackCount = feedbackRepository.countFeedbackForClaim(claimOpt.get());
        return feedbackCount >= 2; // Both donor and receiver have provided feedback
    }

    // ====== NEW ADMIN METHODS FOR THE STORY ======

    /**
     * ADMIN: Get all feedback for a user (both given and received)
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponseDTO> getAllFeedbackForUser(User user) {
        List<Feedback> allFeedback = feedbackRepository.findAllFeedbackForUser(user);
        return allFeedback.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * ADMIN: Get users below rating threshold
     */
    @Transactional(readOnly = true)
    public List<UserRatingDTO> getUsersBelowThreshold(Double threshold, Integer minReviews) {
        List<Object[]> results = feedbackRepository.findUsersBelowRatingThreshold(threshold, minReviews);

        return results.stream()
                .map(row -> {
                    User user = (User) row[0];
                    Double avgRating = (Double) row[1];
                    Long reviewCount = (Long) row[2];

                    UserRatingDTO dto = new UserRatingDTO();
                    dto.setUserId(user.getId());
                    dto.setUserName(getUserDisplayName(user));
                    dto.setAverageRating(Math.round(avgRating * 10.0) / 10.0);
                    dto.setTotalReviews(reviewCount.intValue());

                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * ADMIN: Get rating dashboard with filtered data
     */
    @Transactional(readOnly = true)
    public AdminRatingDashboardDTO getAdminRatingDashboard(String filter, int limit) {
        AdminRatingDashboardDTO dashboard = new AdminRatingDashboardDTO();

        // Get overall statistics
        RatingStatisticsDTO stats = getPlatformRatingStatistics();
        dashboard.setOverallStats(stats);

        // Apply filter
        switch (filter != null ? filter.toLowerCase() : "all") {
            case "top-rated":
                dashboard.setTopRatedUsers(getTopRatedUsers(limit));
                break;
            case "low-rated":
                dashboard.setLowRatedUsers(getLowRatedUsers(limit));
                break;
            case "flagged":
                dashboard.setFlaggedUsers(getFlaggedUsers(limit));
                break;
            default:
                // Return all categories with smaller limits
                int smallLimit = Math.max(5, limit / 4);
                dashboard.setTopRatedUsers(getTopRatedUsers(smallLimit));
                dashboard.setLowRatedUsers(getLowRatedUsers(smallLimit));
                dashboard.setFlaggedUsers(getFlaggedUsers(smallLimit));
                dashboard.setRecentlyRatedUsers(getRecentlyRatedUsers(smallLimit));
                break;
        }

        return dashboard;
    }

    /**
     * ADMIN: Get flagged feedback (potentially problematic reviews)
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponseDTO> getFlaggedFeedback() {
        List<Feedback> flaggedFeedback = feedbackRepository.findPotentiallyFlaggedFeedback();
        return flaggedFeedback.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // ====== PRIVATE HELPER METHODS ======

    /**
     * Check if user's rating dropped below threshold and trigger alert
     */
    private void checkAndTriggerLowRatingAlert(User user) {
        UserRatingDTO rating = getUserRating(user);

        // Only trigger if user has minimum reviews and is below threshold
        if (rating.getTotalReviews() >= minReviewsForAlert &&
                rating.getAverageRating() < lowRatingThreshold) {

            triggerLowRatingAlert(user, rating);
        }
    }

    /**
     * Trigger admin alert for low rating
     */
    private void triggerLowRatingAlert(User user, UserRatingDTO rating) {
        if (alertService != null) {
            String message = String.format(
                    "User %s (ID: %d) has dropped below rating threshold. " +
                            "Current rating: %.1f/5 (%d reviews). Threshold: %.1f",
                    getUserDisplayName(user), user.getId(),
                    rating.getAverageRating(), rating.getTotalReviews(),
                    lowRatingThreshold);

            alertService.sendAdminAlert("LOW_RATING_ALERT", message, user.getId());
        }
    }

    /**
     * Get top-rated users
     */
    private List<UserRatingDTO> getTopRatedUsers(int limit) {
        List<Object[]> results = feedbackRepository.findTopRatedUsers(3, PageRequest.of(0, limit));
        return convertToUserRatingDTOs(results);
    }

    /**
     * Get low-rated users
     */
    private List<UserRatingDTO> getLowRatedUsers(int limit) {
        List<Object[]> results = feedbackRepository.findLowRatedUsers(3, PageRequest.of(0, limit));
        return convertToUserRatingDTOs(results);
    }

    /**
     * Get users with flagged reviews
     */
    private List<UserRatingDTO> getFlaggedUsers(int limit) {
        List<Feedback> flaggedFeedback = feedbackRepository.findPotentiallyFlaggedFeedback();

        // Group by reviewee and convert to UserRatingDTO
        Map<User, List<Feedback>> groupedByUser = flaggedFeedback.stream()
                .collect(Collectors.groupingBy(Feedback::getReviewee));

        return groupedByUser.entrySet().stream()
                .limit(limit)
                .map(entry -> {
                    User user = entry.getKey();
                    UserRatingDTO dto = getUserRating(user); // Get full rating info
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get recently rated users
     */
    private List<UserRatingDTO> getRecentlyRatedUsers(int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(7); // Last week
        List<Object[]> results = feedbackRepository.findRecentlyRatedUsers(since, PageRequest.of(0, limit));
        return convertToUserRatingDTOs(results);
    }

    /**
     * Get platform-wide rating statistics
     */
    private RatingStatisticsDTO getPlatformRatingStatistics() {
        List<Object[]> stats = feedbackRepository.getPlatformRatingStatistics();

        if (stats.isEmpty()) {
            return new RatingStatisticsDTO(0.0, 0, 0, 0, 0, lowRatingThreshold);
        }

        Object[] row = stats.get(0);
        Double avgRating = (Double) row[0];
        Long totalUsersWithRatings = (Long) row[1];
        Long totalFeedback = (Long) row[2];

        Long usersAbove = feedbackRepository.countUsersAboveThreshold(lowRatingThreshold, minReviewsForAlert);
        Long usersBelow = feedbackRepository.countUsersBelowThreshold(lowRatingThreshold, minReviewsForAlert);

        return new RatingStatisticsDTO(
                avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0,
                totalUsersWithRatings != null ? totalUsersWithRatings.intValue() : 0,
                totalFeedback != null ? totalFeedback.intValue() : 0,
                usersAbove != null ? usersAbove.intValue() : 0,
                usersBelow != null ? usersBelow.intValue() : 0,
                lowRatingThreshold);
    }

    /**
     * Convert query results to UserRatingDTO list
     */
    private List<UserRatingDTO> convertToUserRatingDTOs(List<Object[]> results) {
        return results.stream()
                .map(row -> {
                    User user = (User) row[0];
                    Double avgRating = (Double) row[1];
                    Long reviewCount = (Long) row[2];

                    UserRatingDTO dto = new UserRatingDTO();
                    dto.setUserId(user.getId());
                    dto.setUserName(getUserDisplayName(user));
                    dto.setAverageRating(Math.round(avgRating * 10.0) / 10.0);
                    dto.setTotalReviews(reviewCount.intValue());

                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Convert Feedback entity to response DTO
     */
    private FeedbackResponseDTO convertToResponseDTO(Feedback feedback) {
        return new FeedbackResponseDTO(
                feedback.getId(),
                feedback.getClaim().getId(),
                feedback.getReviewer().getId(),
                getUserDisplayName(feedback.getReviewer()),
                feedback.getReviewee().getId(),
                getUserDisplayName(feedback.getReviewee()),
                feedback.getRating(),
                feedback.getReviewText(),
                feedback.getCreatedAt());
    }

    /**
     * Get display name for user (organization name if available, otherwise email)
     */
    private String getUserDisplayName(User user) {
        if (user.getOrganization() != null && user.getOrganization().getName() != null) {
            return user.getOrganization().getName();
        }
        return user.getEmail();
    }
}