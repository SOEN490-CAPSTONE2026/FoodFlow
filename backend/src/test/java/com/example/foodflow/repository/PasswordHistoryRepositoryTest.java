package com.example.foodflow.repository;

import com.example.foodflow.model.entity.PasswordHistory;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class PasswordHistoryRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PasswordHistoryRepository passwordHistoryRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPassword("hashedPassword");
        testUser.setRole(UserRole.DONOR);
        testUser.setPhone("+11234567890");
        testUser = entityManager.persist(testUser);
        entityManager.flush();
    }

    @Test
    void findByUserOrderByCreatedAtDesc_ReturnsPasswordsInDescendingOrder() {
        // Create password history entries at different times
        PasswordHistory history1 = new PasswordHistory();
        history1.setUser(testUser);
        history1.setPasswordHash("hash1");
        history1.setCreatedAt(Timestamp.valueOf(LocalDateTime.now().minusDays(3)));
        entityManager.persist(history1);

        PasswordHistory history2 = new PasswordHistory();
        history2.setUser(testUser);
        history2.setPasswordHash("hash2");
        history2.setCreatedAt(Timestamp.valueOf(LocalDateTime.now().minusDays(2)));
        entityManager.persist(history2);

        PasswordHistory history3 = new PasswordHistory();
        history3.setUser(testUser);
        history3.setPasswordHash("hash3");
        history3.setCreatedAt(Timestamp.valueOf(LocalDateTime.now().minusDays(1)));
        entityManager.persist(history3);
        entityManager.flush();

        List<PasswordHistory> histories = passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());

        assertEquals(3, histories.size());
        assertEquals("hash3", histories.get(0).getPasswordHash(), "Most recent should be first");
        assertEquals("hash2", histories.get(1).getPasswordHash());
        assertEquals("hash1", histories.get(2).getPasswordHash(), "Oldest should be last");
    }

    @Test
    void findByUserOrderByCreatedAtDesc_NoHistory_ReturnsEmptyList() {
        List<PasswordHistory> histories = passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        assertTrue(histories.isEmpty());
    }

    @Test
    void save_NewPasswordHistory_PersistsSuccessfully() {
        PasswordHistory newHistory = new PasswordHistory();
        newHistory.setUser(testUser);
        newHistory.setPasswordHash("newHashedPassword");
        newHistory.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));

        PasswordHistory saved = passwordHistoryRepository.save(newHistory);

        assertNotNull(saved.getId());
        assertEquals("newHashedPassword", saved.getPasswordHash());
        assertEquals(testUser.getId(), saved.getUser().getId());
    }

    @Test
    void deleteByUser_RemovesAllHistoryForUser() {
        // Create multiple history entries
        PasswordHistory history1 = new PasswordHistory();
        history1.setUser(testUser);
        history1.setPasswordHash("hash1");
        history1.setCreatedAt(Timestamp.valueOf(LocalDateTime.now().minusDays(1)));
        entityManager.persist(history1);

        PasswordHistory history2 = new PasswordHistory();
        history2.setUser(testUser);
        history2.setPasswordHash("hash2");
        history2.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
        entityManager.persist(history2);
        entityManager.flush();

        passwordHistoryRepository.deleteByUserId(testUser.getId());
        entityManager.flush();

        List<PasswordHistory> histories = passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        assertTrue(histories.isEmpty());
    }

    @Test
    void findByUserOrderByCreatedAtDesc_MultipleUsers_ReturnsOnlyUserHistory() {
        // Create another user
        User anotherUser = new User();
        anotherUser.setEmail("another@example.com");
        anotherUser.setPassword("hashedPassword");
        anotherUser.setRole(UserRole.RECEIVER);
        anotherUser.setPhone("+10987654321");
        anotherUser = entityManager.persist(anotherUser);

        // Create history for test user
        PasswordHistory testUserHistory = new PasswordHistory();
        testUserHistory.setUser(testUser);
        testUserHistory.setPasswordHash("testUserHash");
        testUserHistory.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
        entityManager.persist(testUserHistory);

        // Create history for another user
        PasswordHistory anotherUserHistory = new PasswordHistory();
        anotherUserHistory.setUser(anotherUser);
        anotherUserHistory.setPasswordHash("anotherUserHash");
        anotherUserHistory.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
        entityManager.persist(anotherUserHistory);
        entityManager.flush();

        List<PasswordHistory> testUserHistories = passwordHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(testUser.getId());
        List<PasswordHistory> anotherUserHistories = passwordHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(anotherUser.getId());

        assertEquals(1, testUserHistories.size());
        assertEquals("testUserHash", testUserHistories.get(0).getPasswordHash());

        assertEquals(1, anotherUserHistories.size());
        assertEquals("anotherUserHash", anotherUserHistories.get(0).getPasswordHash());
    }

    @Test
    void save_UpdateExistingHistory_UpdatesSuccessfully() {
        PasswordHistory history = new PasswordHistory();
        history.setUser(testUser);
        history.setPasswordHash("originalHash");
        history.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
        history = entityManager.persist(history);
        entityManager.flush();

        Long historyId = history.getId();
        history.setPasswordHash("updatedHash");
        PasswordHistory updated = passwordHistoryRepository.save(history);
        entityManager.flush();

        assertEquals(historyId, updated.getId());
        assertEquals("updatedHash", updated.getPasswordHash());
    }

    @Test
    void findByUserOrderByCreatedAtDesc_LimitedResults_WorksCorrectly() {
        // Create 5 password history entries
        for (int i = 0; i < 5; i++) {
            PasswordHistory history = new PasswordHistory();
            history.setUser(testUser);
            history.setPasswordHash("hash" + i);
            history.setCreatedAt(Timestamp.valueOf(LocalDateTime.now().minusDays(5 - i)));
            entityManager.persist(history);
        }
        entityManager.flush();

        List<PasswordHistory> allHistories = passwordHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(testUser.getId());
        assertEquals(5, allHistories.size());

        // Verify they're in descending order
        for (int i = 0; i < allHistories.size() - 1; i++) {
            assertTrue(allHistories.get(i).getCreatedAt().after(allHistories.get(i + 1).getCreatedAt()) ||
                    allHistories.get(i).getCreatedAt().equals(allHistories.get(i + 1).getCreatedAt()));
        }
    }
}
