package com.example.foodflow.audit;
//dummy comment to trigger CI pipeline
import com.example.foodflow.model.entity.AuditLog;
import com.example.foodflow.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.core.env.Environment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuditLoggerImplTest {

    private AuditLogRepository auditLogRepository;
    private Environment env;
    private AuditLoggerImpl auditLogger;

    @BeforeEach
    void setUp() {
        auditLogRepository = mock(AuditLogRepository.class);
        env = mock(Environment.class);
    }

    @Test
    void testLoggingEnabled_savesLog() {
        // Mock environment to return true
        when(env.getProperty("AUDIT_LOG_ENABLED")).thenReturn("true");

        auditLogger = new AuditLoggerImpl(auditLogRepository, env);
        auditLogger.init(); // simulate PostConstruct

        AuditLog log = new AuditLog();
        log.setAction("CREATE");

        auditLogger.logAction(log);

        // Verify repository.save() is called
        verify(auditLogRepository, times(1)).save(log);
    }

    @Test
    void testLoggingDisabled_doesNotSaveLog() {
        // Mock environment to return false
        when(env.getProperty("AUDIT_LOG_ENABLED")).thenReturn("false");

        auditLogger = new AuditLoggerImpl(auditLogRepository, env);
        auditLogger.init();

        AuditLog log = new AuditLog();
        log.setAction("UPDATE");

        auditLogger.logAction(log);

        // Verify repository.save() is NOT called
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    void testDefaultEnabled_ifPropertyMissing() {
        // Mock environment to return null (property missing)
        when(env.getProperty("AUDIT_LOG_ENABLED")).thenReturn(null);

        auditLogger = new AuditLoggerImpl(auditLogRepository, env);
        auditLogger.init();

        assertTrue(auditLogger.IsAuditEnabled(), "Logging should default to enabled");
    }
}
