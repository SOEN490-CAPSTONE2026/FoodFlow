package com.example.foodflow.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Reports whether the Stripe payment service is configured.
 * Visible at /actuator/health under the "stripe" component.
 *
 * Checks:
 *   - API key is present and non-blank
 *   - Webhook secret is present and non-blank
 */
@Component("stripe")
public class StripeHealthIndicator implements HealthIndicator {

    @Value("${stripe.api.key:}")
    private String apiKey;

    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;

    @Override
    public Health health() {
        boolean keyPresent     = apiKey != null && !apiKey.isBlank();
        boolean secretPresent  = webhookSecret != null && !webhookSecret.isBlank();

        if (!keyPresent) {
            return Health.down()
                    .withDetail("reason", "stripe.api.key is not configured")
                    .build();
        }
        if (!secretPresent) {
            return Health.down()
                    .withDetail("reason", "stripe.webhook.secret is not configured")
                    .build();
        }

        return Health.up()
                .withDetail("apiKeyConfigured", true)
                .withDetail("webhookSecretConfigured", true)
                .withDetail("apiKeyPrefix", apiKey.substring(0, Math.min(7, apiKey.length())) + "***")
                .build();
    }
}
