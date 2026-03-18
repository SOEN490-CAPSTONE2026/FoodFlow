package com.example.foodflow.repository;

import com.example.foodflow.model.entity.CalendarSyncPreference;
import com.example.foodflow.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CalendarSyncPreferenceRepository extends JpaRepository<CalendarSyncPreference, Long> {
    Optional<CalendarSyncPreference> findByUser(User user);
    Optional<CalendarSyncPreference> findByUserId(Long userId);
}
