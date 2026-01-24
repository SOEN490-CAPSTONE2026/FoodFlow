package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.AchievementCategory;
import com.example.foodflow.model.types.CriteriaType;

/**
 * DTO representing progress towards an achievement that hasn't been unlocked yet.
 * Shows how close the user is to earning a specific achievement.
 */
public class AchievementProgress {
    private Long achievementId;
    private String achievementName;
    private String achievementDescription;
    private AchievementCategory achievementCategory;
    private CriteriaType criteriaType;
    private Integer currentValue;
    private Integer targetValue;
    private Integer progressPercentage;

    public AchievementProgress() {
    }

    public AchievementProgress(Long achievementId, String achievementName, String achievementDescription,
                              AchievementCategory achievementCategory, CriteriaType criteriaType,
                              Integer currentValue, Integer targetValue) {
        this.achievementId = achievementId;
        this.achievementName = achievementName;
        this.achievementDescription = achievementDescription;
        this.achievementCategory = achievementCategory;
        this.criteriaType = criteriaType;
        this.currentValue = currentValue;
        this.targetValue = targetValue;
        this.progressPercentage = calculateProgressPercentage(currentValue, targetValue);
    }

    private Integer calculateProgressPercentage(Integer current, Integer target) {
        if (target == null || target == 0) {
            return 0;
        }
        if (current == null) {
            current = 0;
        }
        return Math.min(100, (current * 100) / target);
    }

    // Getters and Setters
    public Long getAchievementId() {
        return achievementId;
    }

    public void setAchievementId(Long achievementId) {
        this.achievementId = achievementId;
    }

    public String getAchievementName() {
        return achievementName;
    }

    public void setAchievementName(String achievementName) {
        this.achievementName = achievementName;
    }

    public String getAchievementDescription() {
        return achievementDescription;
    }

    public void setAchievementDescription(String achievementDescription) {
        this.achievementDescription = achievementDescription;
    }

    public AchievementCategory getAchievementCategory() {
        return achievementCategory;
    }

    public void setAchievementCategory(AchievementCategory achievementCategory) {
        this.achievementCategory = achievementCategory;
    }

    public CriteriaType getCriteriaType() {
        return criteriaType;
    }

    public void setCriteriaType(CriteriaType criteriaType) {
        this.criteriaType = criteriaType;
    }

    public Integer getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(Integer currentValue) {
        this.currentValue = currentValue;
        this.progressPercentage = calculateProgressPercentage(currentValue, this.targetValue);
    }

    public Integer getTargetValue() {
        return targetValue;
    }

    public void setTargetValue(Integer targetValue) {
        this.targetValue = targetValue;
        this.progressPercentage = calculateProgressPercentage(this.currentValue, targetValue);
    }

    public Integer getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(Integer progressPercentage) {
        this.progressPercentage = progressPercentage;
    }
}
