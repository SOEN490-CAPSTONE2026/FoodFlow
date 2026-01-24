package com.example.foodflow.repository;

import com.example.foodflow.model.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    /**
     * Find all achievements earned by a user
     */
    List<UserAchievement> findByUserIdOrderByEarnedAtDesc(Long userId);

    /**
     * Find all achievements earned by a user (eager loading achievement details)
     */
    @Query("SELECT ua FROM UserAchievement ua JOIN FETCH ua.achievement WHERE ua.user.id = :userId ORDER BY ua.earnedAt DESC")
    List<UserAchievement> findByUserIdWithAchievementDetails(@Param("userId") Long userId);

    /**
     * Check if user has earned specific achievement
     */
    boolean existsByUserIdAndAchievementId(Long userId, Long achievementId);

    /**
     * Find specific user achievement
     */
    Optional<UserAchievement> findByUserIdAndAchievementId(Long userId, Long achievementId);

    /**
     * Find all unnotified achievements for a user
     */
    List<UserAchievement> findByUserIdAndNotifiedFalse(Long userId);

    /**
     * Count achievements earned by user
     */
    long countByUserId(Long userId);

    /**
     * Find users who earned a specific achievement
     */
    List<UserAchievement> findByAchievementIdOrderByEarnedAtAsc(Long achievementId);

    /**
     * Find achievements earned in a date range
     */
    List<UserAchievement> findByUserIdAndEarnedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    /**
     * Mark achievement as notified
     */
    @Modifying
    @Query("UPDATE UserAchievement ua SET ua.notified = true WHERE ua.id = :id")
    void markAsNotified(@Param("id") Long id);

    /**
     * Get total points earned by user from achievements
     */
    @Query("SELECT COALESCE(SUM(ua.achievement.pointsValue), 0) FROM UserAchievement ua WHERE ua.user.id = :userId")
    Integer getTotalPointsByUserId(@Param("userId") Long userId);

    /**
     * Get achievement count by category for user
     */
    @Query("SELECT ua.achievement.category, COUNT(ua) FROM UserAchievement ua WHERE ua.user.id = :userId GROUP BY ua.achievement.category")
    List<Object[]> getAchievementCountByCategory(@Param("userId") Long userId);
}
