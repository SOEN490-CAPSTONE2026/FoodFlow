package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Achievement;
import com.example.foodflow.model.types.AchievementCategory;
import com.example.foodflow.model.types.CriteriaType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    /**
     * Find achievement by name
     */
    Optional<Achievement> findByName(String name);

    /**
     * Find all active achievements
     */
    List<Achievement> findByIsActiveTrue();

    /**
     * Find achievements by category
     */
    List<Achievement> findByCategoryAndIsActiveTrue(AchievementCategory category);

    /**
     * Find achievements by criteria type
     */
    List<Achievement> findByCriteriaTypeAndIsActiveTrue(CriteriaType criteriaType);

    /**
     * Find achievements within a points range
     */
    @Query("SELECT a FROM Achievement a WHERE a.pointsValue BETWEEN :minPoints AND :maxPoints AND a.isActive = true")
    List<Achievement> findByPointsValueBetween(@Param("minPoints") Integer minPoints, 
                                                @Param("maxPoints") Integer maxPoints);

    /**
     * Find achievements by rarity
     */
    List<Achievement> findByRarityAndIsActiveTrue(String rarity);

    /**
     * Count total active achievements
     */
    long countByIsActiveTrue();
}
