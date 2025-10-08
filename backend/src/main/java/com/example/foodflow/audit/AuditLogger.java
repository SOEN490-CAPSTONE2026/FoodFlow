package com.example.foodflow.audit;

import com.example.foodflow.model.entity.AuditLog;

public interface AuditLogger {
    void logAction(AuditLog log);
}
