package com.example.foodflow.health;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.assertThat;
class SmsServiceHealthIndicatorTest {
    private SmsServiceHealthIndicator indicator;
    @BeforeEach
    void setUp() {
        indicator = new SmsServiceHealthIndicator();
    }
    @Test
    void health_AllFieldsConfigured_ReturnsUp() {
        setFields("ACabc123", "authtoken456", "+15005550006");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("provider", "Twilio");
        assertThat(health.getDetails()).containsEntry("accountSidConfigured", true);
        assertThat(health.getDetails()).containsEntry("authTokenConfigured", true);
        assertThat(health.getDetails()).containsEntry("outboundNumber", "+15005550006");
    }
    @Test
    void health_AccountSidMissing_ReturnsDown() {
        setFields("", "authtoken456", "+15005550006");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("reason").toString()).contains("twilio.account.sid");
    }
    @Test
    void health_AccountSidBlank_ReturnsDown() {
        setFields("   ", "authtoken456", "+15005550006");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
    }
    @Test
    void health_AuthTokenMissing_ReturnsDown() {
        setFields("ACabc123", "", "+15005550006");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("reason").toString()).contains("twilio.auth.token");
    }
    @Test
    void health_PhoneNumberMissing_ReturnsDown() {
        setFields("ACabc123", "authtoken456", "");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("reason").toString()).contains("twilio.phone.number");
    }
    @Test
    void health_PhoneNumberBlank_ReturnsDown() {
        setFields("ACabc123", "authtoken456", "   ");
        Health health = indicator.health();
        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
    }
    private void setFields(String accountSid, String authToken, String phoneNumber) {
        ReflectionTestUtils.setField(indicator, "accountSid", accountSid);
        ReflectionTestUtils.setField(indicator, "authToken", authToken);
        ReflectionTestUtils.setField(indicator, "phoneNumber", phoneNumber);
    }
}
