package com.example.foodflow.service;

import com.example.foodflow.config.PickupToleranceConfig;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PickupTimeValidationServiceTest {

    @Mock
    private PickupToleranceConfig toleranceConfig;

    private PickupTimeValidationService validationService;

    @BeforeEach
    void setUp() {
        // Default tolerance: 30 minutes early, 30 minutes late
        lenient().when(toleranceConfig.getEarlyMinutes()).thenReturn(30);
        lenient().when(toleranceConfig.getLateMinutes()).thenReturn(30);
        validationService = new PickupTimeValidationService(toleranceConfig);
    }

    // Helper to create a SurplusPost with pickup schedule
    private SurplusPost createPostWithPickupTime(LocalDate date, LocalTime startTime, LocalTime endTime) {
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setPickupDate(date);
        post.setPickupFrom(startTime);
        post.setPickupTo(endTime);
        return post;
    }

    // Helper to create a Claim with confirmed pickup slot
    private Claim createClaimWithPickupTime(LocalDate date, LocalTime startTime, LocalTime endTime) {
        Claim claim = new Claim();
        claim.setConfirmedPickupDate(date);
        claim.setConfirmedPickupStartTime(startTime);
        claim.setConfirmedPickupEndTime(endTime);
        return claim;
    }

    @Test
    void testPickupWithinScheduledWindow_Allowed() {
        // Pickup scheduled for today, 10:00-12:00, current time is 11:00
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime startTime = now.minusMinutes(30);
        LocalTime endTime = now.plusMinutes(30);
        
        SurplusPost post = createPostWithPickupTime(today, startTime, endTime);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getReason()).isEqualTo("WITHIN_WINDOW");
    }

    @Test
    void testPickupWithinEarlyTolerance_Allowed() {
        // Pickup scheduled to start in 15 minutes (within 30 min early tolerance)
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime startTime = now.plusMinutes(15);
        LocalTime endTime = now.plusMinutes(75);
        
        SurplusPost post = createPostWithPickupTime(today, startTime, endTime);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getReason()).isEqualTo("EARLY_TOLERANCE");
    }

    @Test
    void testPickupWithinLateTolerance_Allowed() {
        // Pickup ended 15 minutes ago (within 30 min late tolerance)
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime startTime = now.minusMinutes(75);
        LocalTime endTime = now.minusMinutes(15);
        
        SurplusPost post = createPostWithPickupTime(today, startTime, endTime);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getReason()).isEqualTo("LATE_TOLERANCE");
    }

    @Test
    void testPickupTooEarly_Denied() {
        // Pickup scheduled to start in 60 minutes (beyond 30 min early tolerance)
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime startTime = now.plusMinutes(60);
        LocalTime endTime = now.plusMinutes(120);
        
        SurplusPost post = createPostWithPickupTime(today, startTime, endTime);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isFalse();
        assertThat(result.getReason()).isEqualTo("TOO_EARLY");
        assertThat(result.getMessage()).contains("not yet allowed");
    }

    @Test
    void testPickupTooLate_Denied() {
        // Pickup ended 60 minutes ago (beyond 30 min late tolerance)
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime startTime = now.minusMinutes(120);
        LocalTime endTime = now.minusMinutes(60);
        
        SurplusPost post = createPostWithPickupTime(today, startTime, endTime);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isFalse();
        assertThat(result.getReason()).isEqualTo("TOO_LATE");
        assertThat(result.getMessage()).contains("expired");
    }

    @Test
    void testPickupUsesClaimConfirmedSlotOverPostDefault() {
        // Post has pickup at 10:00-12:00, but claim has confirmed 14:00-16:00
        // Current time is 14:30 (within claim's window, but outside post's)
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        // Post's default time (would be too late)
        SurplusPost post = createPostWithPickupTime(today, now.minusMinutes(180), now.minusMinutes(120));
        
        // Claim's confirmed time (current time is within window)
        Claim claim = createClaimWithPickupTime(today, now.minusMinutes(30), now.plusMinutes(30));
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, claim);
        
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getReason()).isEqualTo("WITHIN_WINDOW");
    }

    @Test
    void testPickupOnDifferentDate_TooEarly() {
        // Pickup scheduled for tomorrow
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(12, 0);
        
        SurplusPost post = createPostWithPickupTime(tomorrow, startTime, endTime);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isFalse();
        assertThat(result.getReason()).isEqualTo("TOO_EARLY");
    }

    @Test
    void testPickupOnPastDate_TooLate() {
        // Pickup was scheduled for yesterday
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(12, 0);
        
        SurplusPost post = createPostWithPickupTime(yesterday, startTime, endTime);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isFalse();
        assertThat(result.getReason()).isEqualTo("TOO_LATE");
    }

    @Test
    void testNoScheduledTime_Allowed() {
        // Post has no pickup schedule set
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getReason()).isEqualTo("NO_SCHEDULE");
    }

    @Test
    void testExactStartTime_WithinWindow() {
        // Current time is exactly at the start of the pickup window
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        SurplusPost post = createPostWithPickupTime(today, now, now.plusMinutes(60));
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getReason()).isEqualTo("WITHIN_WINDOW");
    }

    @Test
    void testExactEndTime_WithinWindow() {
        // Current time is exactly at the end of the pickup window
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        SurplusPost post = createPostWithPickupTime(today, now.minusMinutes(60), now);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getReason()).isEqualTo("WITHIN_WINDOW");
    }

    @Test
    void testBoundaryEarlyTolerance_ExactlyAtBoundary() {
        // Current time is exactly at the early tolerance boundary (30 min before start)
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime startTime = now.plusMinutes(30); // exactly 30 min from now
        LocalTime endTime = now.plusMinutes(90);
        
        SurplusPost post = createPostWithPickupTime(today, startTime, endTime);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        // At exactly the boundary, should be allowed (inclusive)
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getReason()).isEqualTo("EARLY_TOLERANCE");
    }

    @Test
    void testBoundaryLateTolerance_ExactlyAtBoundary() {
        // Test that pickup is allowed within late tolerance window (using safe margin)
        // End time is 25 minutes ago, and tolerance is 30 minutes, so we should be well within window
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime startTime = now.minusMinutes(85);
        LocalTime endTime = now.minusMinutes(25); // 25 min ago, so with 30 min tolerance, we're safely inside window

        SurplusPost post = createPostWithPickupTime(today, startTime, endTime);
        
        PickupTimeValidationService.ValidationResult result = validationService.validatePickupTime(post, null);
        
        // Should be within late tolerance window
        assertThat(result.isAllowed()).isTrue();
        assertThat(result.getReason()).isEqualTo("LATE_TOLERANCE");
    }

    @Test
    void testGetToleranceValues() {
        assertThat(validationService.getEarlyToleranceMinutes()).isEqualTo(30);
        assertThat(validationService.getLateToleranceMinutes()).isEqualTo(30);
    }
}
