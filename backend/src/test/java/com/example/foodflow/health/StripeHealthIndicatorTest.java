package com.example.foodflow.health;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class StripeHealthIndicatorTest {

    private StripeHealthIndicator indicator;

    @BeforeEach
    void setUp() {
        indicator = new StripeHealthIndicator();
    }

    @Test
    void health_AllFieldsConfigured_ReturnsUp() {
        setFields("sk_test_abc123", "whsec_xyz789");

        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("apiKeyConfigured", true);
        assertThat(health.getDetails()).containsEntry("webhookSecretConfigured", true);
    }

    @Test
    void health_ApiKeyMissing_ReturnsDown() {
        setFields("", "whsec_xyz789");

        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("reason").toString()).contains("stripe.api.key");
    }

    @Test
    void health_ApiKeyBlank_ReturnsDown() {
        setFields("   ", "whsec_xyz789");

        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
    }

    @Test
    void health_WebhookSecretMissing_ReturnsDown() {
        setFields("sk_test_abc123", "");

        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("reason").toString()).contains("stripe.webhook.secret");
    }

    @Test
    void health_ApiKeyPrefixIsObfuscated() {
        setFields("sk_test_abc123xyz", "whsec_xyz789");

        Health health = indicator.health();

        String prefix = health.getDetails().get("apiKeyPrefix").toString();
        assertThat(prefix).endsWith("***");
        assertThat(prefix).doesNotContain("abc123xyz");
    }

    private void setFields(String apiKey, String webhookSecret) {
        ReflectionTestUtils.setField(indicator, "apiKey", apiKey);
        ReflectionTestUtils.setField(indicator, "webhookSecret", webhookSecret);
    }
}
