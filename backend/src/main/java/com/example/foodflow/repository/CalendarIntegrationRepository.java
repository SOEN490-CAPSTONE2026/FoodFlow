package com.example.foodflow.repository;

import com.example.foodflow.model.entity.CalendarIntegration;
import com.example.foodflow.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CalendarIntegrationRepository extends JpaRepository<CalendarIntegration, Long> {
    Optional<CalendarIntegration> findByUser(User user);
    Optional<CalendarIntegration> findByUserIdAndCalendarProvider(Long userId, String calendarProvider);
    Optional<CalendarIntegration> findByUserId(Long userId);
}
