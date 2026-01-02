package com.example.foodflow.service;

import com.example.foodflow.model.entity.DonationTimeline;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.DonationTimelineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service for managing donation timeline events.
 * Centralizes timeline event creation to ensure consistency across the application.
 */
@Service
public class TimelineService {
    
    private final DonationTimelineRepository timelineRepository;
    
    public TimelineService(DonationTimelineRepository timelineRepository) {
        this.timelineRepository = timelineRepository;
    }
    
    /**
     * Creates a timeline event for a donation status change.
     * All timestamps are automatically set to UTC.
     * 
     * @param post The surplus post this event belongs to
     * @param eventType The type of event (e.g., "DONATION_POSTED", "DONATION_CLAIMED")
     * @param actor Who triggered the event ("donor", "receiver", "admin", "system")
     * @param actorUserId The user ID of the actor (null for system events)
     * @param oldStatus The previous status (null for initial creation)
     * @param newStatus The new status
     * @param details Additional details about the event
     * @param visibleToUsers Whether this event should be visible to donors/receivers (false = admin-only)
     * @return The created timeline event
     */
    @Transactional
    public DonationTimeline createTimelineEvent(
            SurplusPost post,
            String eventType,
            String actor,
            Long actorUserId,
            PostStatus oldStatus,
            PostStatus newStatus,
            String details,
            Boolean visibleToUsers) {
        
        DonationTimeline event = new DonationTimeline();
        event.setSurplusPost(post);
        event.setEventType(eventType);
        event.setActor(actor);
        event.setActorUserId(actorUserId);
        event.setOldStatus(oldStatus != null ? oldStatus.toString() : null);
        event.setNewStatus(newStatus != null ? newStatus.toString() : null);
        event.setDetails(details);
        event.setVisibleToUsers(visibleToUsers != null ? visibleToUsers : true);
        event.setTimestamp(LocalDateTime.now()); // UTC timestamp
        
        return timelineRepository.save(event);
    }
    
    /**
     * Convenience method for creating timeline events without old/new status tracking.
     * Useful for non-status-change events.
     */
    @Transactional
    public DonationTimeline createSimpleTimelineEvent(
            SurplusPost post,
            String eventType,
            String actor,
            Long actorUserId,
            String details,
            Boolean visibleToUsers) {
        
        return createTimelineEvent(post, eventType, actor, actorUserId, null, null, details, visibleToUsers);
    }
}
