package com.example.foodflow.model.dto;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
class AuthResponseTest {
    @Test
    void constructorsAndAccessors_coverAllFields() {
        AuthResponse basic = new AuthResponse("t1", "a@b.com", "RECEIVER", "ok");
        assertThat(basic.getToken()).isEqualTo("t1");
        assertThat(basic.getEmail()).isEqualTo("a@b.com");
        assertThat(basic.getRole()).isEqualTo("RECEIVER");
        assertThat(basic.getMessage()).isEqualTo("ok");
        AuthResponse withUserId = new AuthResponse("t2", "b@c.com", "DONOR", "msg", 7L);
        assertThat(withUserId.getUserId()).isEqualTo(7L);
        AuthResponse withOrg = new AuthResponse("t3", "c@d.com", "DONOR", "msg", 8L, "Org");
        assertThat(withOrg.getOrganizationName()).isEqualTo("Org");
        AuthResponse withVerification = new AuthResponse(
                "t4", "d@e.com", "DONOR", "msg", 9L, "Org2", "PENDING");
        assertThat(withVerification.getVerificationStatus()).isEqualTo("PENDING");
        AuthResponse withAccountStatus = new AuthResponse(
                "t5", "e@f.com", "DONOR", "msg", 10L, "Org3", "VERIFIED", "ACTIVE");
        assertThat(withAccountStatus.getAccountStatus()).isEqualTo("ACTIVE");
        AuthResponse full = new AuthResponse(
                "t6", "f@g.com", "RECEIVER", "msg", 11L, "Org4", "VERIFIED", true, false);
        assertThat(full.getEmailNotificationsEnabled()).isTrue();
        assertThat(full.getSmsNotificationsEnabled()).isFalse();
        full.setToken("nt");
        full.setEmail("new@example.com");
        full.setRole("ADMIN");
        full.setMessage("updated");
        full.setUserId(99L);
        full.setOrganizationName("Updated Org");
        full.setVerificationStatus("REJECTED");
        full.setAccountStatus("DEACTIVATED");
        full.setEmailNotificationsEnabled(false);
        full.setSmsNotificationsEnabled(true);
        full.setLanguagePreference("fr");
        assertThat(full.getToken()).isEqualTo("nt");
        assertThat(full.getEmail()).isEqualTo("new@example.com");
        assertThat(full.getRole()).isEqualTo("ADMIN");
        assertThat(full.getMessage()).isEqualTo("updated");
        assertThat(full.getUserId()).isEqualTo(99L);
        assertThat(full.getOrganizationName()).isEqualTo("Updated Org");
        assertThat(full.getVerificationStatus()).isEqualTo("REJECTED");
        assertThat(full.getAccountStatus()).isEqualTo("DEACTIVATED");
        assertThat(full.getEmailNotificationsEnabled()).isFalse();
        assertThat(full.getSmsNotificationsEnabled()).isTrue();
        assertThat(full.getLanguagePreference()).isEqualTo("fr");
    }
}
