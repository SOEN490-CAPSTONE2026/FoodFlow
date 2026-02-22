package com.example.foodflow.repository;

import com.example.foodflow.model.entity.ExpiryNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpiryNotificationLogRepository extends JpaRepository<ExpiryNotificationLog, Long> {

    boolean existsByDedupeKey(String dedupeKey);
}
