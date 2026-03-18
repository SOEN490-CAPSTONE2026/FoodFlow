package com.example.foodflow.service;

import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.ExpiryNotificationLogRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SurplusPostSchedulerExpiryNotificationTest {

    private SurplusPostRepository surplusPostRepository;
    private ExpiryNotificationLogRepository expiryNotificationLogRepository;
    private SurplusPostSchedulerService schedulerService;

    @BeforeEach
    void setUp() throws Exception {
        surplusPostRepository = Mockito.mock(SurplusPostRepository.class);
        expiryNotificationLogRepository = Mockito.mock(ExpiryNotificationLogRepository.class);

        schedulerService = new SurplusPostSchedulerService(
                surplusPostRepository,
                Mockito.mock(ClaimRepository.class),
                expiryNotificationLogRepository,
                Mockito.mock(TimelineService.class),
                new NotificationPreferenceService(new com.fasterxml.jackson.databind.ObjectMapper()),
                Mockito.mock(EmailService.class),
                Mockito.mock(SmsService.class),
                Mockito.mock(org.springframework.messaging.simp.SimpMessagingTemplate.class));

        setPrivateField(schedulerService, "expiryNotificationThresholdHours", "48,24");
    }

    @Test
    void shouldDeduplicateExpiringSoonNotifications() {
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setTitle("Expiring donation");
        post.setStatus(PostStatus.AVAILABLE);
        post.setExpiryDateEffective(LocalDateTime.now(ZoneOffset.UTC).plusHours(48));

        User donor = new User();
        donor.setId(7L);
        donor.setEmail("donor@test.com");
        donor.setEmailNotificationsEnabled(false);
        post.setDonor(donor);

        when(surplusPostRepository.findByStatus(PostStatus.AVAILABLE)).thenReturn(List.of(post));
        when(expiryNotificationLogRepository.existsByDedupeKey(anyString())).thenReturn(false, true);

        schedulerService.sendExpiringSoonNotifications();
        schedulerService.sendExpiringSoonNotifications();

        verify(expiryNotificationLogRepository, times(1)).save(any());
    }

    private void setPrivateField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
