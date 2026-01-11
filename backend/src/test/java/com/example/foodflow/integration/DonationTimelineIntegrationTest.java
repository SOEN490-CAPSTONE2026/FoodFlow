package com.example.foodflow.integration;

import com.example.foodflow.model.dto.ClaimRequest;
import com.example.foodflow.model.dto.ClaimResponse;
import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.DonationTimelineDTO;
import com.example.foodflow.model.dto.PickupSlotRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.service.ClaimService;
import com.example.foodflow.service.SurplusService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DonationTimelineIntegrationTest {

    @Autowired
    private SurplusService surplusService;

    @Autowired
    private ClaimService claimService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private User donor;
    private User receiver;

    @BeforeEach
    void setUp() {
        // Create test donor organization
        Organization donorOrg = new Organization();
        donorOrg.setName("Test Restaurant");
        donorOrg.setOrganizationType(OrganizationType.RESTAURANT);
        donorOrg.setAddress("123 Main St");
        donorOrg.setPhone("555-1234");
        donorOrg = organizationRepository.save(donorOrg);

        // Create test donor user
        donor = new User();
        donor.setEmail("donor@timeline-test.com");
        donor.setPassword("password123");
        donor.setRole(UserRole.DONOR);
        donor.setOrganization(donorOrg);
        donor = userRepository.save(donor);

        // Create test receiver organization
        Organization receiverOrg = new Organization();
        receiverOrg.setName("Test Charity");
        receiverOrg.setOrganizationType(OrganizationType.CHARITY);
        receiverOrg.setAddress("456 Elm St");
        receiverOrg.setPhone("555-5678");
        receiverOrg = organizationRepository.save(receiverOrg);

        // Create test receiver user
        receiver = new User();
        receiver.setEmail("receiver@timeline-test.com");
        receiver.setPassword("password123");
        receiver.setRole(UserRole.RECEIVER);
        receiver.setOrganization(receiverOrg);
        receiver = userRepository.save(receiver);
    }

    @Test
    void testCompleteDonationLifecycle_CreatesTimelineEvents() {
        // Given - Create a surplus post
        CreateSurplusRequest request = new CreateSurplusRequest();
        request.setTitle("Test Surplus Food");
        request.setDescription("Fresh prepared meals");
        request.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        request.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(2));
        request.setPickupDate(LocalDate.now().plusDays(1));
        request.setPickupFrom(LocalTime.of(9, 0));
        request.setPickupTo(LocalTime.of(17, 0));
        request.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(9, 0));
        slot.setEndTime(LocalTime.of(17, 0));
        slots.add(slot);
        request.setPickupSlots(slots);

        // Step 1: Create surplus post (AVAILABLE status)
        SurplusResponse createdPost = surplusService.createSurplusPost(request, donor);
        assertThat(createdPost).isNotNull();
        assertThat(createdPost.getStatus()).isEqualTo(PostStatus.AVAILABLE);
        assertThat(createdPost.getId()).isNotNull();

        // Verify timeline after creation - donor can view
        List<DonationTimelineDTO> donorTimelineAfterCreation =
                surplusService.getTimelineForPost(createdPost.getId(), donor);
        assertThat(donorTimelineAfterCreation).isNotEmpty();
        assertThat(donorTimelineAfterCreation).anyMatch(event ->
                event.getEventType().equals("DONATION_POSTED"));

        // Step 2: Receiver claims the post (CLAIMED status)
        ClaimRequest claimRequest = new ClaimRequest();
        claimRequest.setSurplusPostId(createdPost.getId());
        ClaimResponse claim = claimService.claimSurplusPost(claimRequest, receiver);
        assertThat(claim).isNotNull();
        assertThat(claim.getSurplusPost().getStatus()).isEqualTo(PostStatus.CLAIMED);

        // Verify timeline after claim - both donor and receiver can view
        List<DonationTimelineDTO> donorTimelineAfterClaim =
                surplusService.getTimelineForPost(createdPost.getId(), donor);
        assertThat(donorTimelineAfterClaim).hasSizeGreaterThan(donorTimelineAfterCreation.size());
        assertThat(donorTimelineAfterClaim).anyMatch(event ->
                event.getEventType().equals("DONATION_CLAIMED"));

        List<DonationTimelineDTO> receiverTimelineAfterClaim =
                surplusService.getTimelineForPost(createdPost.getId(), receiver);
        assertThat(receiverTimelineAfterClaim).isNotEmpty();
        assertThat(receiverTimelineAfterClaim).anyMatch(event ->
                event.getEventType().equals("DONATION_CLAIMED") &&
                event.getActor().equals("receiver"));

        // Verify event ordering (descending by timestamp)
        assertThat(donorTimelineAfterClaim).isSortedAccordingTo(
                (e1, e2) -> e2.getTimestamp().compareTo(e1.getTimestamp())
        );
    }

    @Test
    void testTimelineEvents_AreVisibleToBothParties() {
        // Given - Create and claim a post
        CreateSurplusRequest request = new CreateSurplusRequest();
        request.setTitle("Shared Timeline Test");
        request.setDescription("Testing timeline visibility");
        request.getFoodCategories().add(FoodCategory.BAKERY_PASTRY);
        request.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(1));
        request.setPickupDate(LocalDate.now());
        request.setPickupFrom(LocalTime.of(10, 0));
        request.setPickupTo(LocalTime.of(18, 0));
        request.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(18, 0));
        slots.add(slot);
        request.setPickupSlots(slots);

        SurplusResponse createdPost = surplusService.createSurplusPost(request, donor);
        ClaimRequest claimRequest2 = new ClaimRequest();
        claimRequest2.setSurplusPostId(createdPost.getId());
        claimService.claimSurplusPost(claimRequest2, receiver);

        // When - Fetch timeline as both donor and receiver
        List<DonationTimelineDTO> donorTimeline =
                surplusService.getTimelineForPost(createdPost.getId(), donor);
        List<DonationTimelineDTO> receiverTimeline =
                surplusService.getTimelineForPost(createdPost.getId(), receiver);

        // Then - Both should see the same events (donor and receiver see identical timelines)
        assertThat(donorTimeline).hasSameSizeAs(receiverTimeline);

        // Verify they have the same event types
        List<String> donorEventTypes = donorTimeline.stream()
                .map(DonationTimelineDTO::getEventType)
                .toList();
        List<String> receiverEventTypes = receiverTimeline.stream()
                .map(DonationTimelineDTO::getEventType)
                .toList();

        assertThat(donorEventTypes).containsExactlyElementsOf(receiverEventTypes);
    }

    @Test
    void testTimelineEvents_IncludeActorAttribution() {
        // Given - Create and claim a post
        CreateSurplusRequest request = new CreateSurplusRequest();
        request.setTitle("Actor Attribution Test");
        request.setDescription("Testing actor information");
        request.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        request.setQuantity(new Quantity(8.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(2));
        request.setPickupDate(LocalDate.now().plusDays(1));
        request.setPickupFrom(LocalTime.of(9, 0));
        request.setPickupTo(LocalTime.of(17, 0));
        request.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(9, 0));
        slot.setEndTime(LocalTime.of(17, 0));
        slots.add(slot);
        request.setPickupSlots(slots);

        SurplusResponse createdPost = surplusService.createSurplusPost(request, donor);
        ClaimRequest claimRequest3 = new ClaimRequest();
        claimRequest3.setSurplusPostId(createdPost.getId());
        claimService.claimSurplusPost(claimRequest3, receiver);

        // When - Fetch timeline
        List<DonationTimelineDTO> timeline =
                surplusService.getTimelineForPost(createdPost.getId(), donor);

        // Then - Verify actor attribution
        DonationTimelineDTO creationEvent = timeline.stream()
                .filter(event -> event.getEventType().equals("DONATION_POSTED"))
                .findFirst()
                .orElse(null);

        assertThat(creationEvent).isNotNull();
        assertThat(creationEvent.getActor()).isEqualTo("donor");
        assertThat(creationEvent.getActorUserId()).isEqualTo(donor.getId());

        DonationTimelineDTO claimEvent = timeline.stream()
                .filter(event -> event.getEventType().equals("DONATION_CLAIMED"))
                .findFirst()
                .orElse(null);

        assertThat(claimEvent).isNotNull();
        assertThat(claimEvent.getActor()).isEqualTo("receiver");
        assertThat(claimEvent.getActorUserId()).isEqualTo(receiver.getId());
    }

    @Test
    void testTimelineEvents_OnlyVisibleEventsReturned() {
        // Given - Create a surplus post
        CreateSurplusRequest request = new CreateSurplusRequest();
        request.setTitle("Visibility Test");
        request.setDescription("Testing event visibility");
        request.getFoodCategories().add(FoodCategory.DAIRY);
        request.setQuantity(new Quantity(3.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(7));
        request.setPickupDate(LocalDate.now().plusDays(2));
        request.setPickupFrom(LocalTime.of(8, 0));
        request.setPickupTo(LocalTime.of(16, 0));
        request.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(2));
        slot.setStartTime(LocalTime.of(8, 0));
        slot.setEndTime(LocalTime.of(16, 0));
        slots.add(slot);
        request.setPickupSlots(slots);

        SurplusResponse createdPost = surplusService.createSurplusPost(request, donor);

        // When - Fetch timeline
        List<DonationTimelineDTO> timeline =
                surplusService.getTimelineForPost(createdPost.getId(), donor);

        // Then - All returned events should have visibleToUsers=true
        assertThat(timeline).allMatch(event -> event.getVisibleToUsers());
    }

    @Test
    void testTimelineEvents_WithCancellation_RecordsEvent() {
        // Given - Create and claim a post
        CreateSurplusRequest request = new CreateSurplusRequest();
        request.setTitle("Cancellation Test");
        request.setDescription("Testing claim cancellation");
        request.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        request.setQuantity(new Quantity(6.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(3));
        request.setPickupDate(LocalDate.now().plusDays(1));
        request.setPickupFrom(LocalTime.of(11, 0));
        request.setPickupTo(LocalTime.of(19, 0));
        request.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(11, 0));
        slot.setEndTime(LocalTime.of(19, 0));
        slots.add(slot);
        request.setPickupSlots(slots);

        SurplusResponse createdPost = surplusService.createSurplusPost(request, donor);
        ClaimRequest claimRequest4 = new ClaimRequest();
        claimRequest4.setSurplusPostId(createdPost.getId());
        ClaimResponse claim = claimService.claimSurplusPost(claimRequest4, receiver);

        // When - Cancel the claim
        claimService.cancelClaim(claim.getId(), receiver);

        // Then - Verify cancellation event in timeline
        List<DonationTimelineDTO> timeline =
                surplusService.getTimelineForPost(createdPost.getId(), donor);

        assertThat(timeline).anyMatch(event ->
                event.getEventType().equals("CLAIM_CANCELLED"));

        // Verify timeline shows progression: Posted → Claimed → Cancelled
        assertThat(timeline).extracting(DonationTimelineDTO::getEventType)
                .contains("DONATION_POSTED", "DONATION_CLAIMED", "CLAIM_CANCELLED");
    }

    @Test
    void testTimelineEvents_OrderedByTimestampDescending() {
        // Given - Create and claim a post (generates multiple events)
        CreateSurplusRequest request = new CreateSurplusRequest();
        request.setTitle("Ordering Test");
        request.setDescription("Testing event ordering");
        request.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        request.setQuantity(new Quantity(4.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(1));
        request.setPickupDate(LocalDate.now());
        request.setPickupFrom(LocalTime.of(12, 0));
        request.setPickupTo(LocalTime.of(20, 0));
        request.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now());
        slot.setStartTime(LocalTime.of(12, 0));
        slot.setEndTime(LocalTime.of(20, 0));
        slots.add(slot);
        request.setPickupSlots(slots);

        SurplusResponse createdPost = surplusService.createSurplusPost(request, donor);
        ClaimRequest claimRequest5 = new ClaimRequest();
        claimRequest5.setSurplusPostId(createdPost.getId());
        claimService.claimSurplusPost(claimRequest5, receiver);

        // When - Fetch timeline
        List<DonationTimelineDTO> timeline =
                surplusService.getTimelineForPost(createdPost.getId(), donor);

        // Then - Verify events are ordered by timestamp descending (most recent first)
        assertThat(timeline).hasSizeGreaterThan(1);

        for (int i = 0; i < timeline.size() - 1; i++) {
            DonationTimelineDTO currentEvent = timeline.get(i);
            DonationTimelineDTO nextEvent = timeline.get(i + 1);

            assertThat(currentEvent.getTimestamp())
                    .isAfterOrEqualTo(nextEvent.getTimestamp());
        }

        // Most recent event should be the claim
        assertThat(timeline.get(0).getEventType()).isEqualTo("DONATION_CLAIMED");

        // Oldest event should be the creation
        assertThat(timeline.get(timeline.size() - 1).getEventType())
                .isEqualTo("DONATION_POSTED");
    }

    @Test
    void testTimelineEvents_StatusTransitions_RecordedCorrectly() {
        // Given - Create and claim a post
        CreateSurplusRequest request = new CreateSurplusRequest();
        request.setTitle("Status Transition Test");
        request.setDescription("Testing status change recording");
        request.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        request.setQuantity(new Quantity(7.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(2));
        request.setPickupDate(LocalDate.now().plusDays(1));
        request.setPickupFrom(LocalTime.of(10, 0));
        request.setPickupTo(LocalTime.of(18, 0));
        request.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));

        List<PickupSlotRequest> slots = new ArrayList<>();
        PickupSlotRequest slot = new PickupSlotRequest();
        slot.setPickupDate(LocalDate.now().plusDays(1));
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(18, 0));
        slots.add(slot);
        request.setPickupSlots(slots);

        SurplusResponse createdPost = surplusService.createSurplusPost(request, donor);
        ClaimRequest claimRequest6 = new ClaimRequest();
        claimRequest6.setSurplusPostId(createdPost.getId());
        claimService.claimSurplusPost(claimRequest6, receiver);

        // When - Fetch timeline
        List<DonationTimelineDTO> timeline =
                surplusService.getTimelineForPost(createdPost.getId(), donor);

        // Then - Verify status transitions are recorded
        DonationTimelineDTO claimEvent = timeline.stream()
                .filter(event -> event.getEventType().equals("DONATION_CLAIMED"))
                .findFirst()
                .orElse(null);

        assertThat(claimEvent).isNotNull();
        assertThat(claimEvent.getOldStatus()).isEqualTo("AVAILABLE");
        assertThat(claimEvent.getNewStatus()).isEqualTo("CLAIMED");
    }
}

