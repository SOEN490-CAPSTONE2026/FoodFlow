package com.example.foodflow.audit;

import com.example.foodflow.model.entity.AuditLog;
import com.example.foodflow.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class AuditLoggerImpl implements AuditLogger {

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
        System.out.println("AUDIT_LOG_ENABLED = " + auditEnabled); // debug
    }

    @Override
    public void logAction(AuditLog log) {
        if (!auditEnabled) {
            return;
        }
        auditLogRepository.save(log);
    }
}
