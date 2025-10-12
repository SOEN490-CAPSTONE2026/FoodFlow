
package com.example.foodflow.audit;

import com.example.foodflow.model.entity.AuditLog;
import com.example.foodflow.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test") // Optional, if you want a separate application-test.properties
class AuditLoggerIntegrationTest {

    @Autowired
    private AuditLogger auditLogger;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void testAuditLogIsSavedToDatabase() {
        // Clear table first
        auditLogRepository.deleteAll();

        // Create a sample log
        AuditLog log = new AuditLog();
        log.setUsername("testuser");
        log.setAction("CREATE");
        log.setEntityType("User");
        log.setEntityId("123");
        log.setIpAddress("127.0.0.1");

        // Log it
        auditLogger.logAction(log);

        // Fetch all logs from H2
        List<AuditLog> logs = auditLogRepository.findAll();

        assertEquals(1, logs.size(), "There should be one audit log in the database");

        AuditLog savedLog = logs.get(0);
        assertEquals("testuser", savedLog.getUsername());
        assertEquals("CREATE", savedLog.getAction());
        assertEquals("User", savedLog.getEntityType());
        assertEquals("123", savedLog.getEntityId());
    }

}
