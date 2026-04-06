package com.example.foodflow.health;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.assertThat;
class EmailServiceHealthIndicatorTest {
    private EmailServiceHealthIndicator indicator;
    @BeforeEach
    void setUp() {
        indicator = new EmailServiceHealthIndicator();
    }
    @Test
    void health_AllFieldsConfigured_ReturnsUp() {
        setFields("valid-api-key", "noreply@foodflow.com", "FoodFlow");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("provider", "Brevo");
        assertThat(health.getDetails()).containsEntry("apiKeyConfigured", true);
        assertThat(health.getDetails()).containsEntry("fromAddress", "noreply@foodflow.com");
    }
    @Test
    void health_ApiKeyMissing_ReturnsDown() {
        setFields("", "noreply@foodflow.com", "FoodFlow");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("reason").toString()).contains("brevo.api.key");
    }
    @Test
    void health_ApiKeyBlank_ReturnsDown() {
        setFields("   ", "noreply@foodflow.com", "FoodFlow");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
    }
    @Test
    void health_FromEmailMissing_ReturnsDown() {
        setFields("valid-api-key", "", "FoodFlow");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("reason").toString()).contains("brevo.from.email");
    }
    @Test
    void health_FromNameOptional_DoesNotAffectStatus() {
        setFields("valid-api-key", "noreply@foodflow.com", "");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.UP);
    }
    private void setFields(String apiKey, String fromEmail, String fromName) {
        ReflectionTestUtils.setField(indicator, "apiKey", apiKey);
        ReflectionTestUtils.setField(indicator, "fromEmail", fromEmail);
        ReflectionTestUtils.setField(indicator, "fromName", fromName);
    }
}
