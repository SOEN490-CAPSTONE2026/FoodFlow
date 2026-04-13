package com.example.foodflow.util;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.assertThat;
class ExpiryDateTimeResolverTest {
    @Test
    void donorLocalEndOfDayUtc_ConvertsUsingDonorTimezone() {
        LocalDateTime result = ExpiryDateTimeResolver.donorLocalEndOfDayUtc(
                LocalDate.of(2026, 3, 10),
                "America/Toronto");
        assertThat(result).isEqualTo(LocalDateTime.of(2026, 3, 11, 3, 59, 59));
    }
    @Test
    void donorLocalEndOfDayUtc_HandlesDstBoundary() {
        LocalDateTime result = ExpiryDateTimeResolver.donorLocalEndOfDayUtc(
                LocalDate.of(2026, 11, 1),
                "America/New_York");
        assertThat(result).isEqualTo(LocalDateTime.of(2026, 11, 2, 4, 59, 59));
    }
    @Test
    void resolveDonorTimezone_FallsBackToOrganizationThenUtc() {
        User donor = new User();
        Organization org = new Organization();
        org.setTimezone("America/Los_Angeles");
        donor.setOrganization(org);
        assertThat(ExpiryDateTimeResolver.resolveDonorTimezone(donor)).isEqualTo("America/Los_Angeles");
        org.setTimezone(null);
        donor.setTimezone(null);
        assertThat(ExpiryDateTimeResolver.resolveDonorTimezone(donor)).isEqualTo("UTC");
    }
    @Test
    void resolveEffectiveExpiryUtc_UsesDonorAnchoredDateWhenNotOverridden() {
        User donor = new User();
        donor.setTimezone("America/Los_Angeles");
        SurplusPost post = new SurplusPost();
        post.setDonor(donor);
        post.setExpiryDate(LocalDate.of(2026, 3, 10));
        post.setExpiryDateEffective(LocalDateTime.of(2026, 3, 10, 23, 59, 59)); // legacy-stored value
        post.setExpiryOverridden(false);
        LocalDateTime result = ExpiryDateTimeResolver.resolveEffectiveExpiryUtc(post);
        assertThat(result).isEqualTo(LocalDateTime.of(2026, 3, 11, 6, 59, 59));
    }
}
