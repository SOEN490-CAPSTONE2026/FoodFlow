package com.example.foodflow.audit;

import com.example.foodflow.model.entity.AuditLog;
import com.example.foodflow.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class AuditLoggerImpl implements AuditLogger {

    private static final Logger log = LoggerFactory.getLogger(AuditLoggerImpl.class);

    private final AuditLogRepository auditLogRepository;
    private final Environment env;

    private boolean auditEnabled = true; // default true

    public boolean IsAuditEnabled() {
        return auditEnabled;
    }

    @Autowired
    public AuditLoggerImpl(AuditLogRepository auditLogRepository, Environment env) {
        this.auditLogRepository = auditLogRepository;
        this.env = env;
    }

    @PostConstruct
    public void init() {
        String enabledProp = env.getProperty("AUDIT_LOG_ENABLED");
        if (enabledProp != null) {
            auditEnabled = Boolean.parseBoolean(enabledProp);
        }
        log.info("Audit logging initialized - AUDIT_LOG_ENABLED = {}", auditEnabled);
    }

    @Override
    public void logAction(AuditLog auditLog) {
        if (!auditEnabled) {
            log.debug("Audit logging disabled, skipping audit log entry");
            return;
        }
        
        try {
            auditLogRepository.save(auditLog);
            // Also log to file for dual logging approach
            log.info("AUDIT: user={}, action={}, entity={}, entityId={}", 
                auditLog.getUsername(), 
                auditLog.getAction(), 
                auditLog.getEntityType(), 
                auditLog.getEntityId());
        } catch (Exception e) {
            log.error("Failed to save audit log to database: {}", e.getMessage(), e);
        }
    }
}
