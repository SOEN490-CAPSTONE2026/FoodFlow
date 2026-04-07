package com.example.foodflow.health;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
/**
 * Reports whether the Brevo transactional email service is configured.
 * Visible at /actuator/health under the "emailService" component.
 *
 * Checks:
 *   - API key is present and non-blank
 *   - Sender address is present and non-blank
 */
@Component("emailServiceHealth")
public class EmailServiceHealthIndicator implements HealthIndicator {
    @Value("${brevo.api.key:}")
    private String apiKey;
    @Value("${brevo.from.email:}")
    private String fromEmail;
    @Value("${brevo.from.name:}")
    private String fromName;
    @Override
    public Health health() {
        boolean keyPresent   = apiKey != null && !apiKey.isBlank();
        boolean emailPresent = fromEmail != null && !fromEmail.isBlank();
        if (!keyPresent) {
            return Health.down()
                    .withDetail("reason", "brevo.api.key is not configured")
                    .build();
        }
        if (!emailPresent) {
            return Health.down()
                    .withDetail("reason", "brevo.from.email is not configured")
                    .build();
        }
        return Health.up()
                .withDetail("provider", "Brevo")
                .withDetail("apiKeyConfigured", true)
                .withDetail("fromAddress", fromEmail)
                .withDetail("fromName", fromName)
                .build();
    }
}
