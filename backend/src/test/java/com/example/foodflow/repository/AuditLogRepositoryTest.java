package com.example.foodflow.repository;

import com.example.foodflow.model.entity.AuditLog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class AuditLogRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private AuditLogRepository auditLogRepository;

    // -----------------------------------------------------------------------
    // findByEntityIdAndActionOrderByTimestampDesc
    // -----------------------------------------------------------------------

    @Test
    void findByEntityIdAndActionOrderByTimestampDesc_ReturnsMatchingLogsInDescOrder() {
        AuditLog older = new AuditLog("admin", "DEACTIVATE_USER", "User", "42", null, null, "reason 1");
        older.setTimestamp(LocalDateTime.now().minusDays(2));

        AuditLog newer = new AuditLog("admin", "DEACTIVATE_USER", "User", "42", null, null, "reason 2");
        newer.setTimestamp(LocalDateTime.now().minusDays(1));

        // Different action – should be excluded
        AuditLog differentAction = new AuditLog("admin", "LOGIN", "User", "42", null, null, null);
        // Different entity – should be excluded
        AuditLog differentEntity = new AuditLog("admin", "DEACTIVATE_USER", "User", "99", null, null, null);

        entityManager.persist(older);
        entityManager.persist(newer);
        entityManager.persist(differentAction);
        entityManager.persist(differentEntity);
        entityManager.flush();

        List<AuditLog> result = auditLogRepository
                .findByEntityIdAndActionOrderByTimestampDesc("42", "DEACTIVATE_USER");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getNewValue()).isEqualTo("reason 2"); // newer first
        assertThat(result.get(1).getNewValue()).isEqualTo("reason 1"); // older second
    }

    @Test
    void findByEntityIdAndActionOrderByTimestampDesc_ReturnsEmptyWhenNoMatch() {
        List<AuditLog> result = auditLogRepository
                .findByEntityIdAndActionOrderByTimestampDesc("nonexistent", "DEACTIVATE_USER");

        assertThat(result).isEmpty();
    }

    @Test
    void findByEntityIdAndActionOrderByTimestampDesc_ExcludesDifferentAction() {
        AuditLog loginLog = new AuditLog("admin", "LOGIN", "User", "5", null, null, null);
        entityManager.persist(loginLog);
        entityManager.flush();

        List<AuditLog> result = auditLogRepository
                .findByEntityIdAndActionOrderByTimestampDesc("5", "DEACTIVATE_USER");

        assertThat(result).isEmpty();
    }

    @Test
    void findByEntityIdAndActionOrderByTimestampDesc_ExcludesDifferentEntityId() {
        AuditLog log = new AuditLog("admin", "DEACTIVATE_USER", "User", "100", null, null, null);
        entityManager.persist(log);
        entityManager.flush();

        List<AuditLog> result = auditLogRepository
                .findByEntityIdAndActionOrderByTimestampDesc("200", "DEACTIVATE_USER");

        assertThat(result).isEmpty();
    }

    // -----------------------------------------------------------------------
    // findTop20ByOrderByTimestampDesc
    // -----------------------------------------------------------------------

    @Test
    void findTop20ByOrderByTimestampDesc_ReturnsAtMost20Records() {
        for (int i = 0; i < 25; i++) {
            AuditLog log = new AuditLog("admin", "LOGIN", "User", String.valueOf(i), null, null, null);
            log.setTimestamp(LocalDateTime.now().minusMinutes(i));
            entityManager.persist(log);
        }
        entityManager.flush();

        List<AuditLog> result = auditLogRepository.findTop20ByOrderByTimestampDesc();

        assertThat(result).hasSize(20);
    }

    @Test
    void findTop20ByOrderByTimestampDesc_ReturnsNewestFirst() {
        AuditLog older = new AuditLog("admin1", "ACTION", "User", "1", null, null, null);
        older.setTimestamp(LocalDateTime.now().minusDays(2));

        AuditLog newer = new AuditLog("admin2", "ACTION", "User", "2", null, null, null);
        newer.setTimestamp(LocalDateTime.now().minusDays(1));

        entityManager.persist(older);
        entityManager.persist(newer);
        entityManager.flush();

        List<AuditLog> result = auditLogRepository.findTop20ByOrderByTimestampDesc();

        assertThat(result.get(0).getUsername()).isEqualTo("admin2"); // newer first
        assertThat(result.get(1).getUsername()).isEqualTo("admin1"); // older second
    }

    @Test
    void findTop20ByOrderByTimestampDesc_ReturnsEmptyWhenNoLogs() {
        List<AuditLog> result = auditLogRepository.findTop20ByOrderByTimestampDesc();

        assertThat(result).isEmpty();
    }
}
