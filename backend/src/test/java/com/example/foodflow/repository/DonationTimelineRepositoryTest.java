package com.example.foodflow.repository;

import com.example.foodflow.model.entity.DonationTimeline;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PostStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class DonationTimelineRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private DonationTimelineRepository donationTimelineRepository;

    private SurplusPost testPost;
    private User testDonor;

    @BeforeEach
    void setUp() {
        // Create test donor
        testDonor = new User();
        testDonor.setEmail("donor@test.com");
        testDonor.setPassword("hashedpassword");
        entityManager.persist(testDonor);

        // Create test surplus post with all required fields
        testPost = new SurplusPost();
        testPost.setTitle("Test Donation");
        testPost.setDescription("Test donation description");
        testPost.setDonor(testDonor);
        testPost.setStatus(PostStatus.AVAILABLE);
        testPost.setExpiryDate(LocalDate.now().plusDays(7));
        testPost.setPickupDate(LocalDate.now().plusDays(1));
        testPost.setPickupFrom(LocalTime.of(9, 0));
        testPost.setPickupTo(LocalTime.of(17, 0));
        entityManager.persist(testPost);
        entityManager.flush();
    }

    @Test
    void findBySurplusPostIdOrderByTimestampDesc_WithMultipleEvents_ReturnsOrderedList() {
        // Arrange
        DonationTimeline event1 = new DonationTimeline();
        event1.setSurplusPost(testPost);
        event1.setEventType("DONATION_CREATED");
        event1.setTimestamp(LocalDateTime.now().minusHours(3));
        event1.setActor("donor");
        event1.setVisibleToUsers(true);
        entityManager.persist(event1);

        DonationTimeline event2 = new DonationTimeline();
        event2.setSurplusPost(testPost);
        event2.setEventType("DONATION_CLAIMED");
        event2.setTimestamp(LocalDateTime.now().minusHours(2));
        event2.setActor("receiver");
        event2.setVisibleToUsers(true);
        entityManager.persist(event2);

        DonationTimeline event3 = new DonationTimeline();
        event3.setSurplusPost(testPost);
        event3.setEventType("ADMIN_STATUS_OVERRIDE");
        event3.setTimestamp(LocalDateTime.now().minusHours(1));
        event3.setActor("admin");
        event3.setVisibleToUsers(false);
        entityManager.persist(event3);

        entityManager.flush();

        // Act
        List<DonationTimeline> results = donationTimelineRepository
                .findBySurplusPostIdOrderByTimestampDesc(testPost.getId());

        // Assert
        assertNotNull(results);
        assertEquals(3, results.size());
        
        // Verify descending order (most recent first)
        assertEquals("ADMIN_STATUS_OVERRIDE", results.get(0).getEventType());
        assertEquals("DONATION_CLAIMED", results.get(1).getEventType());
        assertEquals("DONATION_CREATED", results.get(2).getEventType());
    }

    @Test
    void findBySurplusPostIdOrderByTimestampDesc_WithNoEvents_ReturnsEmptyList() {
        // Act
        List<DonationTimeline> results = donationTimelineRepository
                .findBySurplusPostIdOrderByTimestampDesc(testPost.getId());

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void findBySurplusPostIdOrderByTimestampDesc_WithNonExistentPostId_ReturnsEmptyList() {
        // Act
        List<DonationTimeline> results = donationTimelineRepository
                .findBySurplusPostIdOrderByTimestampDesc(999L);

        // Assert
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void save_WithValidTimeline_PersistsSuccessfully() {
        // Arrange
        DonationTimeline timeline = new DonationTimeline();
        timeline.setSurplusPost(testPost);
        timeline.setEventType("TEST_EVENT");
        timeline.setTimestamp(LocalDateTime.now());
        timeline.setActor("test_actor");
        timeline.setActorUserId(1L);
        timeline.setOldStatus("AVAILABLE");
        timeline.setNewStatus("CLAIMED");
        timeline.setDetails("Test details");
        timeline.setVisibleToUsers(true);

        // Act
        DonationTimeline saved = donationTimelineRepository.save(timeline);
        entityManager.flush();
        entityManager.clear();

        // Assert
        assertNotNull(saved.getId());
        DonationTimeline found = entityManager.find(DonationTimeline.class, saved.getId());
        assertNotNull(found);
        assertEquals("TEST_EVENT", found.getEventType());
        assertEquals("test_actor", found.getActor());
        assertEquals(1L, found.getActorUserId());
        assertEquals("AVAILABLE", found.getOldStatus());
        assertEquals("CLAIMED", found.getNewStatus());
        assertEquals("Test details", found.getDetails());
        assertTrue(found.getVisibleToUsers());
    }

    @Test
    void save_WithAdminOverrideEvent_SavesWithVisibleToUsersFalse() {
        // Arrange
        DonationTimeline adminEvent = new DonationTimeline();
        adminEvent.setSurplusPost(testPost);
        adminEvent.setEventType("ADMIN_STATUS_OVERRIDE");
        adminEvent.setTimestamp(LocalDateTime.now());
        adminEvent.setActor("admin");
        adminEvent.setActorUserId(999L);
        adminEvent.setOldStatus("CLAIMED");
        adminEvent.setNewStatus("COMPLETED");
        adminEvent.setDetails("Admin forced completion");
        adminEvent.setVisibleToUsers(false);

        // Act
        DonationTimeline saved = donationTimelineRepository.save(adminEvent);
        entityManager.flush();

        // Assert
        assertNotNull(saved.getId());
        assertFalse(saved.getVisibleToUsers());
        assertEquals("admin", saved.getActor());
        assertEquals("ADMIN_STATUS_OVERRIDE", saved.getEventType());
    }

    @Test
    void findBySurplusPostIdOrderByTimestampDesc_IncludesAdminOnlyEvents() {
        // Arrange
        DonationTimeline userVisibleEvent = new DonationTimeline();
        userVisibleEvent.setSurplusPost(testPost);
        userVisibleEvent.setEventType("DONATION_CREATED");
        userVisibleEvent.setTimestamp(LocalDateTime.now().minusHours(2));
        userVisibleEvent.setActor("donor");
        userVisibleEvent.setVisibleToUsers(true);
        entityManager.persist(userVisibleEvent);

        DonationTimeline adminOnlyEvent = new DonationTimeline();
        adminOnlyEvent.setSurplusPost(testPost);
        adminOnlyEvent.setEventType("ADMIN_STATUS_OVERRIDE");
        adminOnlyEvent.setTimestamp(LocalDateTime.now().minusHours(1));
        adminOnlyEvent.setActor("admin");
        adminOnlyEvent.setVisibleToUsers(false);
        entityManager.persist(adminOnlyEvent);

        entityManager.flush();

        // Act
        List<DonationTimeline> results = donationTimelineRepository
                .findBySurplusPostIdOrderByTimestampDesc(testPost.getId());

        // Assert
        assertEquals(2, results.size());
        
        // Verify both visible and admin-only events are returned
        assertTrue(results.stream().anyMatch(e -> e.getVisibleToUsers()));
        assertTrue(results.stream().anyMatch(e -> !e.getVisibleToUsers()));
    }

    @Test
    void save_WithOptionalFields_SavesSuccessfully() {
        // Arrange
        DonationTimeline timeline = new DonationTimeline();
        timeline.setSurplusPost(testPost);
        timeline.setEventType("PICKUP_CONFIRMED");
        timeline.setTimestamp(LocalDateTime.now());
        timeline.setActor("receiver");
        timeline.setTemperature(4.5);
        timeline.setPackagingCondition("GOOD");
        timeline.setPickupEvidenceUrl("https://example.com/evidence.jpg");
        timeline.setVisibleToUsers(true);

        // Act
        DonationTimeline saved = donationTimelineRepository.save(timeline);
        entityManager.flush();
        entityManager.clear();

        // Assert
        DonationTimeline found = entityManager.find(DonationTimeline.class, saved.getId());
        assertNotNull(found);
        assertEquals(4.5, found.getTemperature());
        assertEquals("GOOD", found.getPackagingCondition());
        assertEquals("https://example.com/evidence.jpg", found.getPickupEvidenceUrl());
    }

    @Test
    void findBySurplusPostIdOrderByTimestampDesc_WithSameTimestamp_ReturnsAllEvents() {
        // Arrange
        LocalDateTime sameTime = LocalDateTime.now();
        
        DonationTimeline event1 = new DonationTimeline();
        event1.setSurplusPost(testPost);
        event1.setEventType("EVENT_1");
        event1.setTimestamp(sameTime);
        event1.setActor("actor1");
        event1.setVisibleToUsers(true);
        entityManager.persist(event1);

        DonationTimeline event2 = new DonationTimeline();
        event2.setSurplusPost(testPost);
        event2.setEventType("EVENT_2");
        event2.setTimestamp(sameTime);
        event2.setActor("actor2");
        event2.setVisibleToUsers(true);
        entityManager.persist(event2);

        entityManager.flush();

        // Act
        List<DonationTimeline> results = donationTimelineRepository
                .findBySurplusPostIdOrderByTimestampDesc(testPost.getId());

        // Assert
        assertEquals(2, results.size());
    }

    @Test
    void findBySurplusPostIdOrderByTimestampDesc_OnlyReturnsSameSurplusPost() {
        // Arrange
        // Create another surplus post with all required fields
        SurplusPost anotherPost = new SurplusPost();
        anotherPost.setTitle("Another Donation");
        anotherPost.setDescription("Another description");
        anotherPost.setDonor(testDonor);
        anotherPost.setStatus(PostStatus.AVAILABLE);
        anotherPost.setExpiryDate(LocalDate.now().plusDays(7));
        anotherPost.setPickupDate(LocalDate.now().plusDays(1));
        anotherPost.setPickupFrom(LocalTime.of(10, 0));
        anotherPost.setPickupTo(LocalTime.of(18, 0));
        entityManager.persist(anotherPost);
        entityManager.flush();

        // Create timeline for first post
        DonationTimeline timeline1 = new DonationTimeline();
        timeline1.setSurplusPost(testPost);
        timeline1.setEventType("EVENT_POST_1");
        timeline1.setTimestamp(LocalDateTime.now());
        timeline1.setActor("actor");
        timeline1.setVisibleToUsers(true);
        entityManager.persist(timeline1);

        // Create timeline for second post
        DonationTimeline timeline2 = new DonationTimeline();
        timeline2.setSurplusPost(anotherPost);
        timeline2.setEventType("EVENT_POST_2");
        timeline2.setTimestamp(LocalDateTime.now());
        timeline2.setActor("actor");
        timeline2.setVisibleToUsers(true);
        entityManager.persist(timeline2);

        entityManager.flush();

        // Act
        List<DonationTimeline> results = donationTimelineRepository
                .findBySurplusPostIdOrderByTimestampDesc(testPost.getId());

        // Assert
        assertEquals(1, results.size());
        assertEquals("EVENT_POST_1", results.get(0).getEventType());
        assertEquals(testPost.getId(), results.get(0).getSurplusPost().getId());
    }
}
