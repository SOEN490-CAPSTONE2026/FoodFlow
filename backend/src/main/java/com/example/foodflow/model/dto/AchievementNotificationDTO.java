package com.example.foodflow.model.dto;

import java.time.LocalDateTime;

/**
 * DTO for achievement unlock notifications sent via WebSocket.
 * Contains essential information to display the achievement notification.
 */
public class AchievementNotificationDTO {
    private Long achievementId;
    private String name;
    private String description;
    private String badgeIcon;
    private Integer pointsValue;
    private String category;
    private LocalDateTime earnedAt;

    // Constructors
    public AchievementNotificationDTO() {}

    public AchievementNotificationDTO(Long achievementId, String name, String description,
                                     String badgeIcon, Integer pointsValue, String category,
                                     LocalDateTime earnedAt) {
        this.achievementId = achievementId;
        this.name = name;
        this.description = description;
        this.badgeIcon = badgeIcon;
        this.pointsValue = pointsValue;
        this.category = category;
        this.earnedAt = earnedAt;
    }

    // Getters and Setters
    public Long getAchievementId() {
        return achievementId;
    }

    public void setAchievementId(Long achievementId) {
        this.achievementId = achievementId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBadgeIcon() {
        return badgeIcon;
    }

    public void setBadgeIcon(String badgeIcon) {
        this.badgeIcon = badgeIcon;
    }

    public Integer getPointsValue() {
        return pointsValue;
    }

    public void setPointsValue(Integer pointsValue) {
        this.pointsValue = pointsValue;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDateTime getEarnedAt() {
        return earnedAt;
    }

    public void setEarnedAt(LocalDateTime earnedAt) {
        this.earnedAt = earnedAt;
    }
}