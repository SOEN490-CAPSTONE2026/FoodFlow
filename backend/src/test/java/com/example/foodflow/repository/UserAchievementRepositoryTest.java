package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Achievement;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserAchievement;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.AchievementCategory;
import com.example.foodflow.model.types.CriteriaType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserAchievementRepositoryTest {

    @Autowired
    private UserAchievementRepository userAchievementRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AchievementRepository achievementRepository;

    private User testUser;
    private Achievement testAchievement;
    private UserAchievement testUserAchievement;

    @BeforeEach
    void setUp() {
        userAchievementRepository.deleteAll();
        userRepository.deleteAll();
        achievementRepository.deleteAll();

        // Create test user
        testUser = new User("test@example.com", "password123", UserRole.DONOR);
        testUser = userRepository.save(testUser);

        // Create test achievement
        testAchievement = new Achievement(
            "Test Achievement",
            "Test Description",
            "test_icon",
            50,
            AchievementCategory.BEGINNER,
            CriteriaType.DONATION_COUNT,
            5
        );
        testAchievement = achievementRepository.save(testAchievement);

        // Create user achievement
        testUserAchievement = new UserAchievement(testUser, testAchievement);
        testUserAchievement = userAchievementRepository.save(testUserAchievement);
    }

    @Test
    void testFindByUserIdOrderByEarnedAtDesc() {
        List<UserAchievement> userAchievements = userAchievementRepository
            .findByUserIdOrderByEarnedAtDesc(testUser.getId());
        
        assertThat(userAchievements).hasSize(1);
        assertThat(userAchievements.get(0).getUser().getId()).isEqualTo(testUser.getId());
    }

    @Test
    void testExistsByUserIdAndAchievementId() {
        boolean exists = userAchievementRepository.existsByUserIdAndAchievementId(
            testUser.getId(), 
            testAchievement.getId()
        );
        
        assertThat(exists).isTrue();
    }

    @Test
    void testExistsByUserIdAndAchievementId_NotFound() {
        boolean exists = userAchievementRepository.existsByUserIdAndAchievementId(
            testUser.getId(), 
            999L
        );
        
        assertThat(exists).isFalse();
    }

    @Test
    void testFindByUserIdAndNotifiedFalse() {
        List<UserAchievement> unnotified = userAchievementRepository
            .findByUserIdAndNotifiedFalse(testUser.getId());
        
        assertThat(unnotified).hasSize(1);
        assertThat(unnotified.get(0).getNotified()).isFalse();
    }

    @Test
    void testCountByUserId() {
        Achievement secondAchievement = new Achievement(
            "Second Achievement",
            "Description",
            "second_icon",
            75,
            AchievementCategory.DONATION,
            CriteriaType.DONATION_COUNT,
            10
        );
        secondAchievement = achievementRepository.save(secondAchievement);
        
        UserAchievement secondUserAchievement = new UserAchievement(testUser, secondAchievement);
        userAchievementRepository.save(secondUserAchievement);

        long count = userAchievementRepository.countByUserId(testUser.getId());
        
        assertThat(count).isEqualTo(2);
    }

    @Test
    void testGetTotalPointsByUserId() {
        Integer totalPoints = userAchievementRepository.getTotalPointsByUserId(testUser.getId());
        
        assertThat(totalPoints).isEqualTo(50);
    }

    @Test
    void testGetTotalPointsByUserId_NoAchievements() {
        User newUser = new User("new@example.com", "password", UserRole.RECEIVER);
        newUser = userRepository.save(newUser);

        Integer totalPoints = userAchievementRepository.getTotalPointsByUserId(newUser.getId());
        
        assertThat(totalPoints).isEqualTo(0);
    }

    @Test
    void testUniqueConstraint() {
        UserAchievement duplicate = new UserAchievement(testUser, testAchievement);

        // This should throw DataIntegrityViolationException
        assertThat(org.junit.jupiter.api.Assertions.assertThrows(
            org.springframework.dao.DataIntegrityViolationException.class,
            () -> userAchievementRepository.saveAndFlush(duplicate)
        )).isNotNull();
    }

    @Test
    void testFindByUserIdAndEarnedAtBetween() {
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = LocalDateTime.now().plusDays(1);

        List<UserAchievement> achievements = userAchievementRepository
            .findByUserIdAndEarnedAtBetween(testUser.getId(), start, end);
        
        assertThat(achievements).hasSize(1);
    }

    @Test
    void testFindByAchievementIdOrderByEarnedAtAsc() {
        User secondUser = new User("user2@example.com", "password", UserRole.DONOR);
        secondUser = userRepository.save(secondUser);
        
        UserAchievement secondUserAchievement = new UserAchievement(secondUser, testAchievement);
        userAchievementRepository.save(secondUserAchievement);

        List<UserAchievement> usersWithAchievement = userAchievementRepository
            .findByAchievementIdOrderByEarnedAtAsc(testAchievement.getId());
        
        assertThat(usersWithAchievement).hasSize(2);
    }

    @Test
    void testFindByUserIdWithAchievementDetails() {
        List<UserAchievement> userAchievements = userAchievementRepository
            .findByUserIdWithAchievementDetails(testUser.getId());
        
        assertThat(userAchievements).hasSize(1);
        assertThat(userAchievements.get(0).getAchievement()).isNotNull();
        assertThat(userAchievements.get(0).getAchievement().getName()).isEqualTo("Test Achievement");
    }

    @Test
    void testGetAchievementCountByCategory() {
        // Add another achievement from different category
        Achievement socialAchievement = new Achievement(
            "Social Achievement",
            "Description",
            "social_icon",
            25,
            AchievementCategory.SOCIAL,
            CriteriaType.MESSAGE_COUNT,
            50
        );
        socialAchievement = achievementRepository.save(socialAchievement);
        
        UserAchievement socialUserAchievement = new UserAchievement(testUser, socialAchievement);
        userAchievementRepository.save(socialUserAchievement);

        List<Object[]> categoryCounts = userAchievementRepository
            .getAchievementCountByCategory(testUser.getId());
        
        assertThat(categoryCounts).hasSize(2);
    }
}
