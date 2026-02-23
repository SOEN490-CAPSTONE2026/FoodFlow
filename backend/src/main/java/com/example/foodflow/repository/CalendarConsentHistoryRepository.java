package com.example.foodflow.repository;

import com.example.foodflow.model.entity.CalendarConsentHistory;
import com.example.foodflow.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalendarConsentHistoryRepository extends JpaRepository<CalendarConsentHistory, Long> {
    List<CalendarConsentHistory> findByUser(User user);
    List<CalendarConsentHistory> findByUserId(Long userId);
    List<CalendarConsentHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<CalendarConsentHistory> findByUserIdAndAction(Long userId, String action);
}
