package com.example.foodflow.model.dto;

/**
 * DTO for user rating summary and aggregated scores
 */
public class UserRatingDTO {
    
    private Long userId;
    private String userName;
    private Double averageRating;
    private Integer totalReviews;
    private Integer fiveStarCount;
    private Integer fourStarCount;
    private Integer threeStarCount;
    private Integer twoStarCount;
    private Integer oneStarCount;
    
    // Constructors
    public UserRatingDTO() {}
    
    public UserRatingDTO(Long userId, String userName, Double averageRating, Integer totalReviews) {
        this.userId = userId;
        this.userName = userName;
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
    }
    
    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    
    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }
    
    public Integer getFiveStarCount() { return fiveStarCount; }
    public void setFiveStarCount(Integer fiveStarCount) { this.fiveStarCount = fiveStarCount; }
    
    public Integer getFourStarCount() { return fourStarCount; }
    public void setFourStarCount(Integer fourStarCount) { this.fourStarCount = fourStarCount; }
    
    public Integer getThreeStarCount() { return threeStarCount; }
    public void setThreeStarCount(Integer threeStarCount) { this.threeStarCount = threeStarCount; }
    
    public Integer getTwoStarCount() { return twoStarCount; }
    public void setTwoStarCount(Integer twoStarCount) { this.twoStarCount = twoStarCount; }
    
    public Integer getOneStarCount() { return oneStarCount; }
    public void setOneStarCount(Integer oneStarCount) { this.oneStarCount = oneStarCount; }
    
    // Helper methods
    public boolean hasRatings() {
        return totalReviews != null && totalReviews > 0;
    }
    
    public String getRatingDisplay() {
        if (!hasRatings()) {
            return "No ratings yet";
        }
        return String.format("%.1f/5 (%d reviews)", averageRating, totalReviews);
    }
}