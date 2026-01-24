package com.example.foodflow.model.entity;

import com.example.foodflow.model.types.AchievementCategory;
import com.example.foodflow.model.types.CriteriaType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "achievements")
@EntityListeners(AuditingEntityListener.class)
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(unique = true, nullable = false)
    private String name;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @NotBlank
    @Size(max = 50)
    @Column(name = "icon_name", nullable = false)
    private String iconName;

    @NotNull
    @Min(0)
    @Column(name = "points_value", nullable = false)
    private Integer pointsValue;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private AchievementCategory category;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "criteria_type", length = 50, nullable = false)
    private CriteriaType criteriaType;

    @NotNull
    @Min(1)
    @Column(name = "criteria_value", nullable = false)
    private Integer criteriaValue;

    @Column(length = 20)
    private String rarity = "COMMON";

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public Achievement() {}

    public Achievement(String name, String description, String iconName, 
                      Integer pointsValue, AchievementCategory category, 
                      CriteriaType criteriaType, Integer criteriaValue) {
        this.name = name;
        this.description = description;
        this.iconName = iconName;
        this.pointsValue = pointsValue;
        this.category = category;
        this.criteriaType = criteriaType;
        this.criteriaValue = criteriaValue;
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

    public String getIconName() {
        return iconName;
    }

    public void setIconName(String iconName) {
        this.iconName = iconName;
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

    public Integer getCriteriaValue() {
        return criteriaValue;
    }

    public void setCriteriaValue(Integer criteriaValue) {
        this.criteriaValue = criteriaValue;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Achievement{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", category=" + category +
                ", pointsValue=" + pointsValue +
                ", criteriaType=" + criteriaType +
                ", criteriaValue=" + criteriaValue +
                '}';
    }
}
