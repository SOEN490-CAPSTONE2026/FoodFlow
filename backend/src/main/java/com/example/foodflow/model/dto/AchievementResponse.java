package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.Achievement;
import com.example.foodflow.model.types.AchievementCategory;
import com.example.foodflow.model.types.CriteriaType;

import java.time.LocalDateTime;

/**
 * DTO for achievement information.
 * Includes earnedAt timestamp if the achievement has been unlocked by the user.
 */
public class AchievementResponse {
    private Long id;
    private String name;
    private String description;
    private String iconUrl;
    private Integer pointsValue;
    private AchievementCategory category;
    private CriteriaType criteriaType;
    private Integer criteriaThreshold;
    private String rarity;
    private Boolean isActive;
    private LocalDateTime earnedAt;  // null if not earned yet

    public AchievementResponse() {
    }

    /**
     * Convert Achievement entity to response DTO
     */
    public static AchievementResponse fromEntity(Achievement achievement) {
        AchievementResponse response = new AchievementResponse();
        response.setId(achievement.getId());
        response.setName(achievement.getName());
        response.setDescription(achievement.getDescription());
        response.setIconUrl(achievement.getIconName());  // Achievement entity uses 'iconName' field
        response.setPointsValue(achievement.getPointsValue());
        response.setCategory(achievement.getCategory());
        response.setCriteriaType(achievement.getCriteriaType());
        response.setCriteriaThreshold(achievement.getCriteriaValue());  // Achievement entity uses 'criteriaValue' field
        response.setRarity(achievement.getRarity());
        response.setIsActive(achievement.getIsActive());
        return response;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getIconUrl() {
        return iconUrl;
    }

    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
    }

    public Integer getPointsValue() {
        return pointsValue;
    }

    public void setPointsValue(Integer pointsValue) {
        this.pointsValue = pointsValue;
    }

    public AchievementCategory getCategory() {
        return category;
    }

    public void setCategory(AchievementCategory category) {
        this.category = category;
    }

    public CriteriaType getCriteriaType() {
        return criteriaType;
    }

    public void setCriteriaType(CriteriaType criteriaType) {
        this.criteriaType = criteriaType;
    }

    public Integer getCriteriaThreshold() {
        return criteriaThreshold;
    }

    public void setCriteriaThreshold(Integer criteriaThreshold) {
        this.criteriaThreshold = criteriaThreshold;
    }

    public String getRarity() {
        return rarity;
    }

    public void setRarity(String rarity) {
        this.rarity = rarity;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getEarnedAt() {
        return earnedAt;
    }

    public void setEarnedAt(LocalDateTime earnedAt) {
        this.earnedAt = earnedAt;
    }
}
