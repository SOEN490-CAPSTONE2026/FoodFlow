package com.example.foodflow.health;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.assertThat;
class OpenAiHealthIndicatorTest {
    private OpenAiHealthIndicator indicator;
    @BeforeEach
    void setUp() {
        indicator = new OpenAiHealthIndicator();
    }
    @Test
    void health_AllFieldsConfigured_ReturnsUp() {
        setFields("sk-openai-abc123", "gpt-4o", 1000);
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("apiKeyConfigured", true);
        assertThat(health.getDetails()).containsEntry("model", "gpt-4o");
        assertThat(health.getDetails()).containsEntry("maxTokens", 1000);
    }
    @Test
    void health_ApiKeyMissing_ReturnsDown() {
        setFields("", "gpt-4o", 1000);
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("reason").toString()).contains("app.openai.api-key");
    }
    @Test
    void health_ApiKeyBlank_ReturnsDown() {
        setFields("   ", "gpt-4o", 1000);
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
    }
    @Test
    void health_ModelMissing_ReturnsDown() {
        setFields("sk-openai-abc123", "", 1000);
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("reason").toString()).contains("app.openai.model");
    }
    @Test
    void health_ModelBlank_ReturnsDown() {
        setFields("sk-openai-abc123", "   ", 1000);
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
    }
    private void setFields(String apiKey, String model, int maxTokens) {
        ReflectionTestUtils.setField(indicator, "apiKey", apiKey);
        ReflectionTestUtils.setField(indicator, "model", model);
        ReflectionTestUtils.setField(indicator, "maxTokens", maxTokens);
    }
}
