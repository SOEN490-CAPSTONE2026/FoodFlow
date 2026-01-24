package com.example.foodflow.model.types;

public enum AchievementCategory {
    BEGINNER("Beginner achievements for new users"),
    DONATION("Achievements for food donors"),
    CLAIMING("Achievements for food receivers"),
    SOCIAL("Achievements for platform engagement"),
    MILESTONE("Major milestone achievements");

    private final String description;

    AchievementCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
