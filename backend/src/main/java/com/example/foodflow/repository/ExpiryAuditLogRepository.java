package com.example.foodflow.repository;

import com.example.foodflow.model.entity.ExpiryAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpiryAuditLogRepository extends JpaRepository<ExpiryAuditLog, Long> {
}
