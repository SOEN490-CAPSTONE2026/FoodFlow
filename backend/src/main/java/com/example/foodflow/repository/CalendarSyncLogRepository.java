package com.example.foodflow.repository;

import com.example.foodflow.model.entity.CalendarSyncLog;
import com.example.foodflow.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarSyncLogRepository extends JpaRepository<CalendarSyncLog, Long> {
    List<CalendarSyncLog> findByUser(User user);
    List<CalendarSyncLog> findByUserId(Long userId);
    Page<CalendarSyncLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<CalendarSyncLog> findByUserIdAndAction(Long userId, String action);
    List<CalendarSyncLog> findByUserIdAndStatus(Long userId, String status);
    List<CalendarSyncLog> findByUserIdAndCreatedAtAfter(Long userId, LocalDateTime createdAfter);
    long countByUserIdAndStatus(Long userId, String status);
}
