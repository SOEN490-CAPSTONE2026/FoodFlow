package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class ClaimResponseTest {

    private User donor;
    private User receiver;
    private SurplusPost surplusPost;
    private Claim claim;

    @BeforeEach
    void setUp() {
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);

        receiver = new User();
        receiver.setId(2L);
        receiver.setEmail("receiver@test.com");
        receiver.setRole(UserRole.RECEIVER);

        surplusPost = new SurplusPost();
        surplusPost.setId(100L);
        surplusPost.setTitle("Fresh Vegetables");
        surplusPost.setStatus(PostStatus.CLAIMED);
        surplusPost.setDonor(donor);
        surplusPost.setPickupDate(LocalDate.now().plusDays(1));
        surplusPost.setPickupFrom(LocalTime.of(9, 0));
        surplusPost.setPickupTo(LocalTime.of(17, 0));

        claim = new Claim(surplusPost, receiver);
        claim.setId(50L);
    }

    @Test
    void constructor_NoArgs_CreatesEmptyResponse() {
        // When
        ClaimResponse response = new ClaimResponse();

        // Then
        assertThat(response.getId()).isNull();
        assertThat(response.getSurplusPostId()).isNull();
        assertThat(response.getSurplusPostTitle()).isNull();
        assertThat(response.getReceiverId()).isNull();
        assertThat(response.getReceiverEmail()).isNull();
        assertThat(response.getClaimedAt()).isNull();
        assertThat(response.getStatus()).isNull();
        assertThat(response.getSurplusPost()).isNull();
        assertThat(response.getConfirmedPickupSlot()).isNull();
    }

    @Test
    void constructor_WithClaimEntity_MapsAllBasicFields() {
        // Given - simulate what happens when entity is loaded from database
        // The @PrePersist hook sets claimedAt, but we need to set it manually in tests
        java.lang.reflect.Field claimedAtField;
        try {
            claimedAtField = Claim.class.getDeclaredField("claimedAt");
            claimedAtField.setAccessible(true);
            claimedAtField.set(claim, LocalDateTime.now());
        } catch (Exception e) {
            // If reflection fails, the test will still pass but claimedAt will be returned as per the entity
        }
        
        // When
        ClaimResponse response = new ClaimResponse(claim);

        // Then
        assertThat(response.getId()).isEqualTo(50L);
        assertThat(response.getSurplusPostId()).isEqualTo(100L);
        assertThat(response.getSurplusPostTitle()).isEqualTo("Fresh Vegetables");
        assertThat(response.getReceiverId()).isEqualTo(2L);
        assertThat(response.getReceiverEmail()).isEqualTo("receiver@test.com");
        assertThat(response.getClaimedAt()).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ClaimStatus.ACTIVE.getDisplayName());
        assertThat(response.getSurplusPost()).isNotNull();
    }

    @Test
    void constructor_WithClaimWithoutPickupSlot_ConfirmedPickupSlotIsNull() {
        // Given - claim without confirmed pickup slot
        
        // When
        ClaimResponse response = new ClaimResponse(claim);

        // Then
        assertThat(response.getConfirmedPickupSlot()).isNull();
    }

    @Test
    void constructor_WithClaimWithConfirmedPickupSlot_IncludesPickupSlot() {
        // Given
        LocalDate pickupDate = LocalDate.of(2025, 12, 25);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(12, 0);
        
        claim.setConfirmedPickupDate(pickupDate);
        claim.setConfirmedPickupStartTime(startTime);
        claim.setConfirmedPickupEndTime(endTime);

        // When
        ClaimResponse response = new ClaimResponse(claim);

        // Then
        assertThat(response.getConfirmedPickupSlot()).isNotNull();
        assertThat(response.getConfirmedPickupSlot().getPickupDate()).isEqualTo(pickupDate);
        assertThat(response.getConfirmedPickupSlot().getStartTime()).isEqualTo(startTime);
        assertThat(response.getConfirmedPickupSlot().getEndTime()).isEqualTo(endTime);
    }

    @Test
    void constructor_WithPartialPickupSlot_OnlyDateSet_StillCreatesPickupSlot() {
        // Given - only date is set, times are null
        claim.setConfirmedPickupDate(LocalDate.of(2025, 12, 25));
        claim.setConfirmedPickupStartTime(null);
        claim.setConfirmedPickupEndTime(null);

        // When
        ClaimResponse response = new ClaimResponse(claim);

        // Then - should still create pickup slot response even with null times
        assertThat(response.getConfirmedPickupSlot()).isNotNull();
        assertThat(response.getConfirmedPickupSlot().getPickupDate()).isEqualTo(LocalDate.of(2025, 12, 25));
        assertThat(response.getConfirmedPickupSlot().getStartTime()).isNull();
        assertThat(response.getConfirmedPickupSlot().getEndTime()).isNull();
    }

    @Test
    void setters_SetAllFields_FieldsAreSet() {
        // Given
        ClaimResponse response = new ClaimResponse();
        SurplusResponse surplusResponse = new SurplusResponse();
        PickupSlotResponse pickupSlotResponse = new PickupSlotResponse();

        // When
        response.setId(99L);
        response.setSurplusPostId(200L);
        response.setSurplusPostTitle("Test Title");
        response.setReceiverId(300L);
        response.setReceiverEmail("test@example.com");
        response.setClaimedAt(LocalDateTime.of(2025, 11, 2, 10, 30));
        response.setStatus("Active");
        response.setSurplusPost(surplusResponse);
        response.setConfirmedPickupSlot(pickupSlotResponse);

        // Then
        assertThat(response.getId()).isEqualTo(99L);
        assertThat(response.getSurplusPostId()).isEqualTo(200L);
        assertThat(response.getSurplusPostTitle()).isEqualTo("Test Title");
        assertThat(response.getReceiverId()).isEqualTo(300L);
        assertThat(response.getReceiverEmail()).isEqualTo("test@example.com");
        assertThat(response.getClaimedAt()).isEqualTo(LocalDateTime.of(2025, 11, 2, 10, 30));
        assertThat(response.getStatus()).isEqualTo("Active");
        assertThat(response.getSurplusPost()).isEqualTo(surplusResponse);
        assertThat(response.getConfirmedPickupSlot()).isEqualTo(pickupSlotResponse);
    }

    @Test
    void setConfirmedPickupSlot_WithNull_SetsNull() {
        // Given
        ClaimResponse response = new ClaimResponse();
        PickupSlotResponse pickupSlotResponse = new PickupSlotResponse();
        response.setConfirmedPickupSlot(pickupSlotResponse);

        // When
        response.setConfirmedPickupSlot(null);

        // Then
        assertThat(response.getConfirmedPickupSlot()).isNull();
    }

    @Test
    void constructor_WithDifferentPickupTimes_CreatesCorrectSlot() {
        // Given
        LocalDate date1 = LocalDate.of(2025, 6, 15);
        LocalTime time1Start = LocalTime.of(8, 30);
        LocalTime time1End = LocalTime.of(10, 30);
        
        claim.setConfirmedPickupDate(date1);
        claim.setConfirmedPickupStartTime(time1Start);
        claim.setConfirmedPickupEndTime(time1End);

        // When
        ClaimResponse response = new ClaimResponse(claim);

        // Then
        assertThat(response.getConfirmedPickupSlot()).isNotNull();
        assertThat(response.getConfirmedPickupSlot().getPickupDate()).isEqualTo(date1);
        assertThat(response.getConfirmedPickupSlot().getStartTime()).isEqualTo(time1Start);
        assertThat(response.getConfirmedPickupSlot().getEndTime()).isEqualTo(time1End);
    }

    @Test
    void constructor_WithConfirmedPickupSlot_DoesNotAffectSurplusPost() {
        // Given
        claim.setConfirmedPickupDate(LocalDate.of(2025, 12, 25));
        claim.setConfirmedPickupStartTime(LocalTime.of(14, 0));
        claim.setConfirmedPickupEndTime(LocalTime.of(16, 0));

        // When
        ClaimResponse response = new ClaimResponse(claim);

        // Then - surplus post should still have its own pickup times
        assertThat(response.getSurplusPost()).isNotNull();
        assertThat(response.getSurplusPost().getPickupDate()).isEqualTo(surplusPost.getPickupDate());
        assertThat(response.getSurplusPost().getPickupFrom()).isEqualTo(surplusPost.getPickupFrom());
        assertThat(response.getSurplusPost().getPickupTo()).isEqualTo(surplusPost.getPickupTo());
        
        // And confirmed pickup slot should have different times
        assertThat(response.getConfirmedPickupSlot().getPickupDate()).isEqualTo(LocalDate.of(2025, 12, 25));
        assertThat(response.getConfirmedPickupSlot().getStartTime()).isEqualTo(LocalTime.of(14, 0));
        assertThat(response.getConfirmedPickupSlot().getEndTime()).isEqualTo(LocalTime.of(16, 0));
    }
}
