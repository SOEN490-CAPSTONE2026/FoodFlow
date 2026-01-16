package com.example.foodflow.service;

import com.example.foodflow.model.entity.DonationTimeline;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.DonationTimelineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimelineServiceTest {

    @Mock
    private DonationTimelineRepository timelineRepository;

    @InjectMocks
    private TimelineService timelineService;

    private SurplusPost testPost;

    @BeforeEach
    void setUp() {
        testPost = new SurplusPost();
        testPost.setId(1L);
        testPost.setTitle("Test Surplus Post");
    }

    @Test
    void createTimelineEvent_WithAllParameters_SavesCorrectly() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        savedTimeline.setId(1L);
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        DonationTimeline result = timelineService.createTimelineEvent(
                testPost,
                "DONATION_CLAIMED",
                "receiver",
                123L,
                PostStatus.AVAILABLE,
                PostStatus.CLAIMED,
                "Claimed by Test Organization",
                true
        );

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);

        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository, times(1)).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getSurplusPost()).isEqualTo(testPost);
        assertThat(captured.getEventType()).isEqualTo("DONATION_CLAIMED");
        assertThat(captured.getActor()).isEqualTo("receiver");
        assertThat(captured.getActorUserId()).isEqualTo(123L);
        assertThat(captured.getOldStatus()).isEqualTo("AVAILABLE");
        assertThat(captured.getNewStatus()).isEqualTo("CLAIMED");
        assertThat(captured.getDetails()).isEqualTo("Claimed by Test Organization");
        assertThat(captured.getVisibleToUsers()).isTrue();
        assertThat(captured.getTimestamp()).isNotNull();
        assertThat(captured.getTimestamp()).isBefore(LocalDateTime.now().plusSeconds(1));
        assertThat(captured.getTimestamp()).isAfter(LocalDateTime.now().minusSeconds(5));
    }

    @Test
    void createTimelineEvent_WithNullOldStatus_SavesWithNullOldStatus() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        savedTimeline.setId(2L);
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        DonationTimeline result = timelineService.createTimelineEvent(
                testPost,
                "DONATION_POSTED",
                "donor",
                456L,
                null,
                PostStatus.AVAILABLE,
                "Donation created",
                true
        );

        // Assert
        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getOldStatus()).isNull();
        assertThat(captured.getNewStatus()).isEqualTo("AVAILABLE");
        assertThat(captured.getEventType()).isEqualTo("DONATION_POSTED");
    }

    @Test
    void createTimelineEvent_WithNullNewStatus_SavesWithNullNewStatus() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        timelineService.createTimelineEvent(
                testPost,
                "ADMIN_NOTE_ADDED",
                "admin",
                999L,
                PostStatus.AVAILABLE,
                null,
                "Admin added a note",
                false
        );

        // Assert
        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getOldStatus()).isEqualTo("AVAILABLE");
        assertThat(captured.getNewStatus()).isNull();
        assertThat(captured.getVisibleToUsers()).isFalse();
    }

    @Test
    void createTimelineEvent_WithAdminEvent_SetsVisibleToUsersFalse() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        timelineService.createTimelineEvent(
                testPost,
                "ADMIN_STATUS_OVERRIDE",
                "admin",
                999L,
                PostStatus.CLAIMED,
                PostStatus.COMPLETED,
                "Admin forced completion",
                false
        );

        // Assert
        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getVisibleToUsers()).isFalse();
        assertThat(captured.getActor()).isEqualTo("admin");
        assertThat(captured.getEventType()).isEqualTo("ADMIN_STATUS_OVERRIDE");
    }

    @Test
    void createTimelineEvent_WithSystemEvent_SavesWithSystemActor() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        timelineService.createTimelineEvent(
                testPost,
                "AUTO_EXPIRED",
                "system",
                null,
                PostStatus.AVAILABLE,
                PostStatus.EXPIRED,
                "Post automatically expired",
                true
        );

        // Assert
        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getActor()).isEqualTo("system");
        assertThat(captured.getActorUserId()).isNull();
        assertThat(captured.getEventType()).isEqualTo("AUTO_EXPIRED");
    }

    @Test
    void createTimelineEvent_WithNullVisibleToUsers_DefaultsToTrue() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        timelineService.createTimelineEvent(
                testPost,
                "DONATION_READY",
                "donor",
                123L,
                PostStatus.CLAIMED,
                PostStatus.READY_FOR_PICKUP,
                "Ready for pickup",
                null
        );

        // Assert
        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getVisibleToUsers()).isTrue();
    }

    @Test
    void createTimelineEvent_GeneratesUTCTimestamp() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        LocalDateTime beforeCreation = LocalDateTime.now();

        // Act
        timelineService.createTimelineEvent(
                testPost,
                "TEST_EVENT",
                "donor",
                123L,
                null,
                null,
                "Test event",
                true
        );

        LocalDateTime afterCreation = LocalDateTime.now();

        // Assert
        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getTimestamp()).isNotNull();
        assertThat(captured.getTimestamp()).isAfterOrEqualTo(beforeCreation);
        assertThat(captured.getTimestamp()).isBeforeOrEqualTo(afterCreation);
    }

    @Test
    void createSimpleTimelineEvent_WithoutStatusChange_SavesCorrectly() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        savedTimeline.setId(3L);
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        DonationTimeline result = timelineService.createSimpleTimelineEvent(
                testPost,
                "RECEIVER_VIEWED",
                "receiver",
                789L,
                "Receiver viewed the donation",
                true
        );

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(3L);

        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getSurplusPost()).isEqualTo(testPost);
        assertThat(captured.getEventType()).isEqualTo("RECEIVER_VIEWED");
        assertThat(captured.getActor()).isEqualTo("receiver");
        assertThat(captured.getActorUserId()).isEqualTo(789L);
        assertThat(captured.getOldStatus()).isNull();
        assertThat(captured.getNewStatus()).isNull();
        assertThat(captured.getDetails()).isEqualTo("Receiver viewed the donation");
        assertThat(captured.getVisibleToUsers()).isTrue();
    }

    @Test
    void createSimpleTimelineEvent_WithNullDetails_SavesWithNullDetails() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        timelineService.createSimpleTimelineEvent(
                testPost,
                "NOTIFICATION_SENT",
                "system",
                null,
                null,
                true
        );

        // Assert
        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getDetails()).isNull();
        assertThat(captured.getEventType()).isEqualTo("NOTIFICATION_SENT");
    }

    @Test
    void createSimpleTimelineEvent_WithAdminOnlyEvent_SetsVisibleToUsersFalse() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        timelineService.createSimpleTimelineEvent(
                testPost,
                "ADMIN_REVIEW",
                "admin",
                999L,
                "Admin reviewed the donation",
                false
        );

        // Assert
        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getVisibleToUsers()).isFalse();
        assertThat(captured.getActor()).isEqualTo("admin");
    }

    @Test
    void createTimelineEvent_WithMultipleEvents_SavesEachIndependently() {
        // Arrange
        DonationTimeline savedTimeline1 = new DonationTimeline();
        savedTimeline1.setId(1L);
        DonationTimeline savedTimeline2 = new DonationTimeline();
        savedTimeline2.setId(2L);

        when(timelineRepository.save(any(DonationTimeline.class)))
                .thenReturn(savedTimeline1)
                .thenReturn(savedTimeline2);

        // Act
        DonationTimeline result1 = timelineService.createTimelineEvent(
                testPost, "EVENT_1", "donor", 1L, null, PostStatus.AVAILABLE, "Details 1", true
        );
        DonationTimeline result2 = timelineService.createTimelineEvent(
                testPost, "EVENT_2", "receiver", 2L, PostStatus.AVAILABLE, PostStatus.CLAIMED, "Details 2", true
        );

        // Assert
        assertThat(result1.getId()).isEqualTo(1L);
        assertThat(result2.getId()).isEqualTo(2L);
        verify(timelineRepository, times(2)).save(any(DonationTimeline.class));
    }

    @Test
    void createTimelineEvent_WithEmptyDetails_SavesEmptyString() {
        // Arrange
        DonationTimeline savedTimeline = new DonationTimeline();
        when(timelineRepository.save(any(DonationTimeline.class))).thenReturn(savedTimeline);

        // Act
        timelineService.createTimelineEvent(
                testPost,
                "EVENT_WITH_EMPTY_DETAILS",
                "donor",
                1L,
                null,
                PostStatus.AVAILABLE,
                "",
                true
        );

        // Assert
        ArgumentCaptor<DonationTimeline> captor = ArgumentCaptor.forClass(DonationTimeline.class);
        verify(timelineRepository).save(captor.capture());

        DonationTimeline captured = captor.getValue();
        assertThat(captured.getDetails()).isEqualTo("");
    }
}

