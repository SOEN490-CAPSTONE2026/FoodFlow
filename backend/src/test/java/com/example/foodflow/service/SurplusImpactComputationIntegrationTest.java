package com.example.foodflow.service;

import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

class SurplusImpactComputationIntegrationTest {

    private SurplusService surplusService;
    private SurplusPostRepository surplusPostRepository;
    private ClaimRepository claimRepository;
    private ClaimService claimService;

    @BeforeEach
    void setUp() {
        surplusPostRepository = Mockito.mock(SurplusPostRepository.class);
        claimRepository = Mockito.mock(ClaimRepository.class);
        claimService = Mockito.mock(ClaimService.class);

        surplusService = new SurplusService(
                surplusPostRepository,
                claimRepository,
                Mockito.mock(PickupSlotValidationService.class),
                Mockito.mock(BusinessMetricsService.class),
                Mockito.mock(NotificationService.class),
                Mockito.mock(ExpiryCalculationService.class),
                Mockito.mock(ExpiryPredictionService.class),
                Mockito.mock(ExpirySuggestionService.class),
                Mockito.mock(com.example.foodflow.repository.ExpiryAuditLogRepository.class),
                new ObjectMapper(),
                Mockito.mock(TimelineService.class),
                Mockito.mock(com.example.foodflow.repository.DonationTimelineRepository.class),
                Mockito.mock(FileStorageService.class),
                Mockito.mock(GamificationService.class),
                claimService,
                Mockito.mock(org.springframework.messaging.simp.SimpMessagingTemplate.class),
                Mockito.mock(EmailService.class),
                Mockito.mock(NotificationPreferenceService.class),
                new FoodTypeImpactService(new ObjectMapper()),
                Mockito.mock(com.example.foodflow.service.calendar.CalendarEventService.class),
                Mockito.mock(com.example.foodflow.service.calendar.CalendarIntegrationService.class),
                Mockito.mock(com.example.foodflow.service.calendar.CalendarSyncService.class),
                Mockito.mock(com.example.foodflow.repository.CalendarSyncPreferenceRepository.class),
                Mockito.mock(com.example.foodflow.repository.SyncedCalendarEventRepository.class));
    }

    @Test
    void confirmPickupShouldComputeAndPersistImpactSnapshot() {
        User donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");

        SurplusPost post = new SurplusPost();
        post.setId(10L);
        post.setDonor(donor);
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");
        post.setFoodType(FoodType.MEAT_POULTRY);
        post.setQuantity(new Quantity(2.0, Quantity.Unit.KILOGRAM));

        User receiver = new User();
        receiver.setId(2L);
        Claim claim = new Claim();
        claim.setId(20L);
        claim.setReceiver(receiver);
        claim.setSurplusPost(post);
        claim.setStatus(ClaimStatus.ACTIVE);

        when(surplusPostRepository.findById(10L)).thenReturn(Optional.of(post));
        when(claimRepository.findBySurplusPost(post)).thenReturn(Optional.of(claim));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(claimService).completeClaim(anyLong());

        SurplusResponse response = surplusService.confirmPickup(10L, "123456", donor);

        assertThat(response.getStatus()).isEqualTo(PostStatus.COMPLETED);
        assertThat(response.getImpactCo2eKg()).isNotNull().isGreaterThan(0.0);
        assertThat(response.getImpactWaterL()).isNotNull().isGreaterThan(0.0);
        assertThat(response.getImpactFactorVersion()).isEqualTo("impact_v1");
        assertThat(response.getImpactComputedAt()).isNotNull();
        assertThat(post.getImpactInputs()).contains("\"foodType\":\"MEAT_POULTRY\"");
    }
}
