package com.example.foodflow.model.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO containing comprehensive gamification statistics for a user.
 * Includes total points, unlocked achievements, and progress towards next achievements.
 */
public class GamificationStatsResponse {
    private Long userId;
    private Integer totalPoints;
    private Integer achievementCount;
    private List<AchievementResponse> unlockedAchievements;
    private List<AchievementProgress> progressToNext;

    public GamificationStatsResponse() {
        this.unlockedAchievements = new ArrayList<>();
        this.progressToNext = new ArrayList<>();
    }

    public GamificationStatsResponse(Long userId, Integer totalPoints, Integer achievementCount) {
        this.userId = userId;
        this.totalPoints = totalPoints;
        this.achievementCount = achievementCount;
        this.unlockedAchievements = new ArrayList<>();
        this.progressToNext = new ArrayList<>();
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }

    public Integer getAchievementCount() {
        return achievementCount;
    }

    public void setAchievementCount(Integer achievementCount) {
        this.achievementCount = achievementCount;
    }

    public List<AchievementResponse> getUnlockedAchievements() {
        return unlockedAchievements;
    }

    public void setUnlockedAchievements(List<AchievementResponse> unlockedAchievements) {
        this.unlockedAchievements = unlockedAchievements;
    }

    public List<AchievementProgress> getProgressToNext() {
        return progressToNext;
    }

    public void setProgressToNext(List<AchievementProgress> progressToNext) {
        this.progressToNext = progressToNext;
    }
}
