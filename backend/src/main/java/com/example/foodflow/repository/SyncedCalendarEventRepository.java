package com.example.foodflow.repository;

import com.example.foodflow.model.entity.SyncedCalendarEvent;
import com.example.foodflow.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SyncedCalendarEventRepository extends JpaRepository<SyncedCalendarEvent, Long> {
    List<SyncedCalendarEvent> findByUser(User user);
    List<SyncedCalendarEvent> findByUserId(Long userId);
    Optional<SyncedCalendarEvent> findByExternalEventId(String externalEventId);
    List<SyncedCalendarEvent> findByUserIdAndExternalEventIdNotNull(Long userId);
    List<SyncedCalendarEvent> findByUserIdAndSyncStatus(Long userId, String syncStatus);
    List<SyncedCalendarEvent> findByUserIdAndEventType(Long userId, String eventType);
    List<SyncedCalendarEvent> findByDonationId(Long donationId);
    List<SyncedCalendarEvent> findByClaimId(Long claimId);
    List<SyncedCalendarEvent> findByUserIdAndIsDeletedFalse(Long userId);
    
    @Query("SELECT e FROM SyncedCalendarEvent e WHERE e.user.id = :userId AND e.startTime BETWEEN :startTime AND :endTime")
    List<SyncedCalendarEvent> findByUserIdAndStartTimeBetween(
        @Param("userId") Long userId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
}
