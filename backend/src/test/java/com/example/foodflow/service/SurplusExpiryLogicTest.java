package com.example.foodflow.service;

import com.example.foodflow.model.dto.SurplusFilterRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.DonationTimelineRepository;
import com.example.foodflow.repository.ExpiryAuditLogRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.lang.reflect.Field;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class SurplusExpiryLogicTest {

    private SurplusPostRepository surplusPostRepository;
    private ClaimRepository claimRepository;
    private SurplusService surplusService;

    @BeforeEach
    void setUp() throws Exception {
        surplusPostRepository = Mockito.mock(SurplusPostRepository.class);
        claimRepository = Mockito.mock(ClaimRepository.class);
        when(claimRepository.findBySurplusPostIdAndStatus(any(), any())).thenReturn(Optional.empty());

        ExpiryPredictionService expiryPredictionService = Mockito.mock(ExpiryPredictionService.class);
        when(expiryPredictionService.predict(any(SurplusPost.class))).thenReturn(
                new ExpiryPredictionService.PredictionResult(
                        Instant.now().plus(Duration.ofDays(3)),
                        0.75d,
                        "rules_v1",
                        Map.of("foodType", "PREPARED")));

        surplusService = new SurplusService(
                surplusPostRepository,
                claimRepository,
                Mockito.mock(PickupSlotValidationService.class),
                Mockito.mock(BusinessMetricsService.class),
                Mockito.mock(NotificationService.class),
                Mockito.mock(ExpiryCalculationService.class),
                expiryPredictionService,
                Mockito.mock(ExpirySuggestionService.class),
                Mockito.mock(ExpiryAuditLogRepository.class),
                new ObjectMapper(),
                Mockito.mock(TimelineService.class),
                Mockito.mock(DonationTimelineRepository.class),
                Mockito.mock(FileStorageService.class),
                Mockito.mock(GamificationService.class),
                Mockito.mock(ClaimService.class),
                Mockito.mock(org.springframework.messaging.simp.SimpMessagingTemplate.class),
                Mockito.mock(EmailService.class),
                Mockito.mock(NotificationPreferenceService.class),
                Mockito.mock(FoodTypeImpactService.class));

        setPrivateField(surplusService, "expiringSoonHours", 24);
    }

    @Test
    void shouldSetExpiringSoonFlagAtBoundary() {
        SurplusPost soon = basePost(1L);
        soon.setExpiryDateEffective(LocalDateTime.now(ZoneOffset.UTC).plusHours(24));

        SurplusPost later = basePost(2L);
        later.setExpiryDateEffective(LocalDateTime.now(ZoneOffset.UTC).plusHours(25));

        when(surplusPostRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                .thenReturn(List.of(soon, later));

        User receiver = new User();
        receiver.setTimezone("UTC");

        List<SurplusResponse> results = surplusService.searchSurplusPostsForReceiver(new SurplusFilterRequest(), receiver);

        SurplusResponse soonResponse = results.stream().filter(r -> r.getId().equals(1L)).findFirst().orElseThrow();
        SurplusResponse laterResponse = results.stream().filter(r -> r.getId().equals(2L)).findFirst().orElseThrow();
        assertThat(soonResponse.getExpiringSoon()).isTrue();
        assertThat(laterResponse.getExpiringSoon()).isFalse();
    }

    @Test
    void shouldExcludeExpiredAndPrioritizeExpiringSoon() {
        SurplusPost expired = basePost(1L);
        expired.setExpiryDateEffective(LocalDateTime.now(ZoneOffset.UTC).minusHours(1));

        SurplusPost soon = basePost(2L);
        soon.setExpiryDateEffective(LocalDateTime.now(ZoneOffset.UTC).plusHours(2));

        SurplusPost normal = basePost(3L);
        normal.setExpiryDateEffective(LocalDateTime.now(ZoneOffset.UTC).plusDays(3));

        when(surplusPostRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                .thenReturn(List.of(normal, expired, soon));

        User receiver = new User();
        receiver.setTimezone("UTC");

        List<SurplusResponse> results = surplusService.searchSurplusPostsForReceiver(new SurplusFilterRequest(), receiver);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getId()).isEqualTo(2L);
        assertThat(results.stream().noneMatch(r -> r.getId().equals(1L))).isTrue();
    }

    @Test
    void shouldRespectEffectiveExpiryPrecedenceOverrideOverActual() {
        SurplusPost post = basePost(11L);
        post.setExpiryDate(LocalDate.now().plusDays(10));
        post.setExpiryDatePredicted(LocalDateTime.now(ZoneOffset.UTC).plusDays(2));
        post.setExpiryOverridden(true);
        LocalDateTime overrideEffective = LocalDateTime.now(ZoneOffset.UTC).plusHours(12);
        post.setExpiryDateEffective(overrideEffective);

        when(surplusPostRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class)))
                .thenReturn(List.of(post));

        User receiver = new User();
        receiver.setTimezone("UTC");

        List<SurplusResponse> results = surplusService.searchSurplusPostsForReceiver(new SurplusFilterRequest(), receiver);
        assertThat(results.get(0).getExpiryDateEffective()).isEqualTo(overrideEffective);
        assertThat(results.get(0).getExpiryOverridden()).isTrue();
    }

    private SurplusPost basePost(Long id) {
        SurplusPost post = new SurplusPost();
        post.setId(id);
        post.setTitle("post-" + id);
        post.setFoodType(FoodType.PREPARED);
        post.setStatus(PostStatus.AVAILABLE);
        User donor = new User();
        donor.setId(100L + id);
        donor.setEmail("donor-" + id + "@test.com");
        post.setDonor(donor);
        return post;
    }

    private void setPrivateField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
