package com.example.foodflow.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Reports whether the Twilio SMS service is configured.
 * Visible at /actuator/health under the "smsService" component.
 *
 * Checks:
 *   - Account SID is present and non-blank
 *   - Auth token is present and non-blank
 *   - Outbound phone number is present and non-blank
 */
@Component("smsServiceHealth")
public class SmsServiceHealthIndicator implements HealthIndicator {

    @Value("${twilio.account.sid:}")
    private String accountSid;

    @Value("${twilio.auth.token:}")
    private String authToken;

    @Value("${twilio.phone.number:}")
    private String phoneNumber;

    @Override
    public Health health() {
        boolean sidPresent   = accountSid != null && !accountSid.isBlank();
        boolean tokenPresent = authToken != null && !authToken.isBlank();
        boolean phonePresent = phoneNumber != null && !phoneNumber.isBlank();

        if (!sidPresent) {
            return Health.down()
                    .withDetail("reason", "twilio.account.sid is not configured")
                    .build();
        }
        if (!tokenPresent) {
            return Health.down()
                    .withDetail("reason", "twilio.auth.token is not configured")
                    .build();
        }
        if (!phonePresent) {
            return Health.down()
                    .withDetail("reason", "twilio.phone.number is not configured")
                    .build();
        }

        return Health.up()
                .withDetail("provider", "Twilio")
                .withDetail("accountSidConfigured", true)
                .withDetail("authTokenConfigured", true)
                .withDetail("outboundNumber", phoneNumber)
                .build();
    }
}
