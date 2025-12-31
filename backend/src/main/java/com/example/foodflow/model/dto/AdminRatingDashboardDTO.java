package com.example.foodflow.model.dto;

import java.util.List;

/**
 * DTO for admin rating dashboard with aggregated statistics
 */
public class AdminRatingDashboardDTO {
    
    private List<UserRatingDTO> topRatedUsers;
    private List<UserRatingDTO> lowRatedUsers;
    private List<UserRatingDTO> flaggedUsers;
    private List<UserRatingDTO> recentlyRatedUsers;
    private RatingStatisticsDTO overallStats;
    
    // Constructors
    public AdminRatingDashboardDTO() {}
    
    // Getters and Setters
    public List<UserRatingDTO> getTopRatedUsers() { return topRatedUsers; }
    public void setTopRatedUsers(List<UserRatingDTO> topRatedUsers) { this.topRatedUsers = topRatedUsers; }
    
    public List<UserRatingDTO> getLowRatedUsers() { return lowRatedUsers; }
    public void setLowRatedUsers(List<UserRatingDTO> lowRatedUsers) { this.lowRatedUsers = lowRatedUsers; }
    
    public List<UserRatingDTO> getFlaggedUsers() { return flaggedUsers; }
    public void setFlaggedUsers(List<UserRatingDTO> flaggedUsers) { this.flaggedUsers = flaggedUsers; }
    
    public List<UserRatingDTO> getRecentlyRatedUsers() { return recentlyRatedUsers; }
    public void setRecentlyRatedUsers(List<UserRatingDTO> recentlyRatedUsers) { this.recentlyRatedUsers = recentlyRatedUsers; }
    
    public RatingStatisticsDTO getOverallStats() { return overallStats; }
    public void setOverallStats(RatingStatisticsDTO overallStats) { this.overallStats = overallStats; }
    
    /**
     * Inner class for overall rating statistics
     */
    public static class RatingStatisticsDTO {
        private Double averageRatingAcrossPlatform;
        private Integer totalUsersWithRatings;
        private Integer totalFeedbackSubmitted;
        private Integer usersAboveThreshold;
        private Integer usersBelowThreshold;
        private Double thresholdUsed;
        
        // Constructors
        public RatingStatisticsDTO() {}
        
        public RatingStatisticsDTO(Double averageRatingAcrossPlatform, Integer totalUsersWithRatings,
                                   Integer totalFeedbackSubmitted, Integer usersAboveThreshold,
                                   Integer usersBelowThreshold, Double thresholdUsed) {
            this.averageRatingAcrossPlatform = averageRatingAcrossPlatform;
            this.totalUsersWithRatings = totalUsersWithRatings;
            this.totalFeedbackSubmitted = totalFeedbackSubmitted;
            this.usersAboveThreshold = usersAboveThreshold;
            this.usersBelowThreshold = usersBelowThreshold;
            this.thresholdUsed = thresholdUsed;
        }
        
        // Getters and Setters
        public Double getAverageRatingAcrossPlatform() { return averageRatingAcrossPlatform; }
        public void setAverageRatingAcrossPlatform(Double averageRatingAcrossPlatform) { 
            this.averageRatingAcrossPlatform = averageRatingAcrossPlatform; 
        }
        
        public Integer getTotalUsersWithRatings() { return totalUsersWithRatings; }
        public void setTotalUsersWithRatings(Integer totalUsersWithRatings) { 
            this.totalUsersWithRatings = totalUsersWithRatings; 
        }
        
        public Integer getTotalFeedbackSubmitted() { return totalFeedbackSubmitted; }
        public void setTotalFeedbackSubmitted(Integer totalFeedbackSubmitted) { 
            this.totalFeedbackSubmitted = totalFeedbackSubmitted; 
        }
        
        public Integer getUsersAboveThreshold() { return usersAboveThreshold; }
        public void setUsersAboveThreshold(Integer usersAboveThreshold) { 
            this.usersAboveThreshold = usersAboveThreshold; 
        }
        
        public Integer getUsersBelowThreshold() { return usersBelowThreshold; }
        public void setUsersBelowThreshold(Integer usersBelowThreshold) { 
            this.usersBelowThreshold = usersBelowThreshold; 
        }
        
        public Double getThresholdUsed() { return thresholdUsed; }
        public void setThresholdUsed(Double thresholdUsed) { this.thresholdUsed = thresholdUsed; }
    }
}