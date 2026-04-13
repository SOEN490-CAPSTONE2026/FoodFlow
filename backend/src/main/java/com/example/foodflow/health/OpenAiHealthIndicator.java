package com.example.foodflow.health;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
/**
 * Reports whether the OpenAI support assistant service is configured.
 * Visible at /actuator/health under the "openAi" component.
 *
 * Checks:
 *   - API key is present and non-blank
 *   - Model name is set
 */
@Component("openAi")
public class OpenAiHealthIndicator implements HealthIndicator {
    @Value("${app.openai.api-key:}")
    private String apiKey;
    @Value("${app.openai.model:}")
    private String model;
    @Value("${app.openai.max-tokens:0}")
    private int maxTokens;
    @Override
    public Health health() {
        boolean keyPresent   = apiKey != null && !apiKey.isBlank();
        boolean modelPresent = model != null && !model.isBlank();
        if (!keyPresent) {
            return Health.down()
                    .withDetail("reason", "app.openai.api-key is not configured")
                    .build();
        }
        if (!modelPresent) {
            return Health.down()
                    .withDetail("reason", "app.openai.model is not configured")
                    .build();
        }
        return Health.up()
                .withDetail("apiKeyConfigured", true)
                .withDetail("model", model)
                .withDetail("maxTokens", maxTokens)
                .build();
    }
}
