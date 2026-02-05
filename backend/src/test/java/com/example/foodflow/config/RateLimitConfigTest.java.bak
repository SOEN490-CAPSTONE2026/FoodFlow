package com.example.foodflow.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitConfigTest {

    @Test
    void rateLimitConfig_DefaultValues_ShouldBeSetCorrectly() {
        // Given
        RateLimitConfig config = new RateLimitConfig();

        // Then
        assertThat(config.isEnabled()).isTrue();
        assertThat(config.getBurstCapacity()).isEqualTo(5);
        assertThat(config.getUser()).isNotNull();
        assertThat(config.getIp()).isNotNull();
        assertThat(config.getOpenai()).isNotNull();
    }

    @Test
    void userConfig_DefaultValues_ShouldBeSetCorrectly() {
        // Given
        RateLimitConfig.User userConfig = new RateLimitConfig.User();

        // Then
        assertThat(userConfig.getRequestsPerMinute()).isEqualTo(10);
    }

    @Test
    void ipConfig_DefaultValues_ShouldBeSetCorrectly() {
        // Given
        RateLimitConfig.Ip ipConfig = new RateLimitConfig.Ip();

        // Then
        assertThat(ipConfig.getRequestsPerMinute()).isEqualTo(30);
    }

    @Test
    void openAIConfig_DefaultValues_ShouldBeSetCorrectly() {
        // Given
        RateLimitConfig.OpenAI openAIConfig = new RateLimitConfig.OpenAI();

        // Then
        assertThat(openAIConfig.getRequestsPerMinute()).isEqualTo(100);
    }

    @Test
    void rateLimitConfig_SettersAndGetters_ShouldWorkCorrectly() {
        // Given
        RateLimitConfig config = new RateLimitConfig();

        // When
        config.setEnabled(false);
        config.setBurstCapacity(10);

        RateLimitConfig.User user = new RateLimitConfig.User();
        user.setRequestsPerMinute(20);
        config.setUser(user);

        RateLimitConfig.Ip ip = new RateLimitConfig.Ip();
        ip.setRequestsPerMinute(50);
        config.setIp(ip);

        RateLimitConfig.OpenAI openAI = new RateLimitConfig.OpenAI();
        openAI.setRequestsPerMinute(200);
        config.setOpenai(openAI);

        // Then
        assertThat(config.isEnabled()).isFalse();
        assertThat(config.getBurstCapacity()).isEqualTo(10);
        assertThat(config.getUser().getRequestsPerMinute()).isEqualTo(20);
        assertThat(config.getIp().getRequestsPerMinute()).isEqualTo(50);
        assertThat(config.getOpenai().getRequestsPerMinute()).isEqualTo(200);
    }

    @Test
    void userConfig_SettersAndGetters_ShouldWorkCorrectly() {
        // Given
        RateLimitConfig.User userConfig = new RateLimitConfig.User();

        // When
        userConfig.setRequestsPerMinute(15);

        // Then
        assertThat(userConfig.getRequestsPerMinute()).isEqualTo(15);
    }

    @Test
    void ipConfig_SettersAndGetters_ShouldWorkCorrectly() {
        // Given
        RateLimitConfig.Ip ipConfig = new RateLimitConfig.Ip();

        // When
        ipConfig.setRequestsPerMinute(40);

        // Then
        assertThat(ipConfig.getRequestsPerMinute()).isEqualTo(40);
    }

    @Test
    void openAIConfig_SettersAndGetters_ShouldWorkCorrectly() {
        // Given
        RateLimitConfig.OpenAI openAIConfig = new RateLimitConfig.OpenAI();

        // When
        openAIConfig.setRequestsPerMinute(150);

        // Then
        assertThat(openAIConfig.getRequestsPerMinute()).isEqualTo(150);
    }

    @Test
    void rateLimitConfig_ZeroValues_ShouldBeAllowed() {
        // Given
        RateLimitConfig config = new RateLimitConfig();

        // When
        config.setBurstCapacity(0);
        config.getUser().setRequestsPerMinute(0);
        config.getIp().setRequestsPerMinute(0);
        config.getOpenai().setRequestsPerMinute(0);

        // Then
        assertThat(config.getBurstCapacity()).isEqualTo(0);
        assertThat(config.getUser().getRequestsPerMinute()).isEqualTo(0);
        assertThat(config.getIp().getRequestsPerMinute()).isEqualTo(0);
        assertThat(config.getOpenai().getRequestsPerMinute()).isEqualTo(0);
    }

    @Test
    void rateLimitConfig_NegativeValues_ShouldBeAllowed() {
        // Given
        RateLimitConfig config = new RateLimitConfig();

        // When
        config.setBurstCapacity(-1);
        config.getUser().setRequestsPerMinute(-1);
        config.getIp().setRequestsPerMinute(-1);
        config.getOpenai().setRequestsPerMinute(-1);

        // Then
        assertThat(config.getBurstCapacity()).isEqualTo(-1);
        assertThat(config.getUser().getRequestsPerMinute()).isEqualTo(-1);
        assertThat(config.getIp().getRequestsPerMinute()).isEqualTo(-1);
        assertThat(config.getOpenai().getRequestsPerMinute()).isEqualTo(-1);
    }

    @Test
    void rateLimitConfig_HighValues_ShouldBeAllowed() {
        // Given
        RateLimitConfig config = new RateLimitConfig();

        // When
        config.setBurstCapacity(1000);
        config.getUser().setRequestsPerMinute(1000);
        config.getIp().setRequestsPerMinute(2000);
        config.getOpenai().setRequestsPerMinute(5000);

        // Then
        assertThat(config.getBurstCapacity()).isEqualTo(1000);
        assertThat(config.getUser().getRequestsPerMinute()).isEqualTo(1000);
        assertThat(config.getIp().getRequestsPerMinute()).isEqualTo(2000);
        assertThat(config.getOpenai().getRequestsPerMinute()).isEqualTo(5000);
    }

    @Test
    void rateLimitConfig_ReplacingNestedObjects_ShouldWork() {
        // Given
        RateLimitConfig config = new RateLimitConfig();
        RateLimitConfig.User originalUser = config.getUser();

        // When
        RateLimitConfig.User newUser = new RateLimitConfig.User();
        newUser.setRequestsPerMinute(25);
        config.setUser(newUser);

        // Then
        assertThat(config.getUser()).isNotSameAs(originalUser);
        assertThat(config.getUser().getRequestsPerMinute()).isEqualTo(25);
    }
}