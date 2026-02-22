package com.example.foodflow.service;

import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.ExpiryNotificationLogRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = SurplusPostSchedulerServiceContextTest.TestConfig.class)
class SurplusPostSchedulerServiceContextTest {

    @Autowired
    private SurplusPostSchedulerService schedulerService;

    @Test
    void contextCreatesSchedulerServiceBean() {
        assertThat(schedulerService).isNotNull();
    }

    @Import(SurplusPostSchedulerService.class)
    static class TestConfig {
        @Bean
        SurplusPostRepository surplusPostRepository() {
            return mock(SurplusPostRepository.class);
        }

        @Bean
        ClaimRepository claimRepository() {
            return mock(ClaimRepository.class);
        }

        @Bean
        ExpiryNotificationLogRepository expiryNotificationLogRepository() {
            return mock(ExpiryNotificationLogRepository.class);
        }

        @Bean
        TimelineService timelineService() {
            return mock(TimelineService.class);
        }

        @Bean
        NotificationPreferenceService notificationPreferenceService() {
            return mock(NotificationPreferenceService.class);
        }

        @Bean
        EmailService emailService() {
            return mock(EmailService.class);
        }

        @Bean
        SmsService smsService() {
            return mock(SmsService.class);
        }

        @Bean
        SimpMessagingTemplate simpMessagingTemplate() {
            return mock(SimpMessagingTemplate.class);
        }
    }
}
