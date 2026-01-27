package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Achievement;
import com.example.foodflow.model.types.AchievementCategory;
import com.example.foodflow.model.types.CriteriaType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class AchievementRepositoryTest {

    @Autowired
    private AchievementRepository achievementRepository;

    private Achievement testAchievement;

    @BeforeEach
    void setUp() {
        achievementRepository.deleteAll();
        
        testAchievement = new Achievement(
            "Test Achievement",
            "Test Description",
            "test_icon",
            50,
            AchievementCategory.BEGINNER,
            CriteriaType.DONATION_COUNT,
            5
        );
        testAchievement.setRarity("RARE");
        testAchievement = achievementRepository.save(testAchievement);
    }

    @Test
    void testFindByName_Success() {
        Optional<Achievement> found = achievementRepository.findByName("Test Achievement");
        
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test Achievement");
    }

    @Test
    void testFindByName_NotFound() {
        Optional<Achievement> found = achievementRepository.findByName("Nonexistent");
        
        assertThat(found).isEmpty();
    }

    @Test
    void testFindByIsActiveTrue() {
        Achievement inactiveAchievement = new Achievement(
            "Inactive Achievement",
            "Description",
            "inactive_icon",
            25,
            AchievementCategory.SOCIAL,
            CriteriaType.MESSAGE_COUNT,
            10
        );
        inactiveAchievement.setIsActive(false);
        achievementRepository.save(inactiveAchievement);

        List<Achievement> activeAchievements = achievementRepository.findByIsActiveTrue();
        
        assertThat(activeAchievements).hasSize(1);
        assertThat(activeAchievements.get(0).getName()).isEqualTo("Test Achievement");
    }

    @Test
    void testFindByCategoryAndIsActiveTrue() {
        Achievement donorAchievement = new Achievement(
            "Donor Achievement",
            "Description",
            "donor_icon",
            100,
            AchievementCategory.DONATION,
            CriteriaType.DONATION_COUNT,
            10
        );
        achievementRepository.save(donorAchievement);

        List<Achievement> beginnerAchievements = achievementRepository
            .findByCategoryAndIsActiveTrue(AchievementCategory.BEGINNER);
        
        assertThat(beginnerAchievements).hasSize(1);
        assertThat(beginnerAchievements.get(0).getCategory()).isEqualTo(AchievementCategory.BEGINNER);
    }

    @Test
    void testFindByCriteriaTypeAndIsActiveTrue() {
        List<Achievement> achievements = achievementRepository
            .findByCriteriaTypeAndIsActiveTrue(CriteriaType.DONATION_COUNT);
        
        assertThat(achievements).hasSize(1);
        assertThat(achievements.get(0).getCriteriaType()).isEqualTo(CriteriaType.DONATION_COUNT);
    }

    @Test
    void testFindByPointsValueBetween() {
        Achievement lowPointsAchievement = new Achievement(
            "Low Points",
            "Description",
            "low_icon",
            10,
            AchievementCategory.BEGINNER,
            CriteriaType.CLAIM_COUNT,
            1
        );
        achievementRepository.save(lowPointsAchievement);

        List<Achievement> achievements = achievementRepository.findByPointsValueBetween(40, 60);
        
        assertThat(achievements).hasSize(1);
        assertThat(achievements.get(0).getPointsValue()).isEqualTo(50);
    }

    @Test
    void testFindByRarityAndIsActiveTrue() {
        List<Achievement> rareAchievements = achievementRepository.findByRarityAndIsActiveTrue("RARE");
        
        assertThat(rareAchievements).hasSize(1);
        assertThat(rareAchievements.get(0).getRarity()).isEqualTo("RARE");
    }

    @Test
    void testCountByIsActiveTrue() {
        Achievement anotherAchievement = new Achievement(
            "Another Achievement",
            "Description",
            "another_icon",
            75,
            AchievementCategory.CLAIMING,
            CriteriaType.PICKUP_COUNT,
            5
        );
        achievementRepository.save(anotherAchievement);

        long count = achievementRepository.countByIsActiveTrue();
        
        assertThat(count).isEqualTo(2);
    }

    @Test
    void testUniqueNameConstraint() {
        Achievement duplicate = new Achievement(
            "Test Achievement",  // Same name
            "Different Description",
            "different_icon",
            30,
            AchievementCategory.SOCIAL,
            CriteriaType.MESSAGE_COUNT,
            20
        );

        // This should throw DataIntegrityViolationException
        assertThat(org.junit.jupiter.api.Assertions.assertThrows(
            org.springframework.dao.DataIntegrityViolationException.class,
            () -> achievementRepository.saveAndFlush(duplicate)
        )).isNotNull();
    }
}
