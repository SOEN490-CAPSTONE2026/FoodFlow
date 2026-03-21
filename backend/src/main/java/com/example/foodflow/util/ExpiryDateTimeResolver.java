package com.example.foodflow.util;

import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;

/**
 * Centralized resolver for expiry semantics:
 * expiryDate means end-of-day in donor timezone, converted to UTC for storage/comparison.
 */
public final class ExpiryDateTimeResolver {

    private static final String DEFAULT_TIMEZONE = "UTC";

    private ExpiryDateTimeResolver() {
    }

    public static LocalDateTime resolveEffectiveExpiryUtc(SurplusPost post) {
        if (post == null) {
            return null;
        }

        if (Boolean.TRUE.equals(post.getExpiryOverridden()) && post.getExpiryDateEffective() != null) {
            return post.getExpiryDateEffective();
        }

        if (post.getExpiryDate() != null) {
            return donorLocalEndOfDayUtc(post.getExpiryDate(), resolveDonorTimezone(post));
        }

        if (post.getExpiryDateEffective() != null) {
            return post.getExpiryDateEffective();
        }

        return post.getExpiryDatePredicted();
    }

    public static LocalDateTime resolveDateExpiryUtc(SurplusPost post) {
        if (post == null || post.getExpiryDate() == null) {
            return null;
        }
        return donorLocalEndOfDayUtc(post.getExpiryDate(), resolveDonorTimezone(post));
    }

    public static LocalDateTime donorLocalEndOfDayUtc(LocalDate date, String donorTimezone) {
        if (date == null) {
            return null;
        }
        ZoneId donorZone = safeZoneId(donorTimezone);
        LocalDateTime donorEndOfDay = LocalDateTime.of(date, LocalTime.of(23, 59, 59));
        ZonedDateTime donorZdt = donorEndOfDay.atZone(donorZone);
        return donorZdt.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    public static String resolveDonorTimezone(SurplusPost post) {
        if (post == null) {
            return DEFAULT_TIMEZONE;
        }
        return resolveDonorTimezone(post.getDonor());
    }

    public static String resolveDonorTimezone(User donor) {
        if (donor == null) {
            return DEFAULT_TIMEZONE;
        }

        if (isValidTimezone(donor.getTimezone())) {
            return donor.getTimezone();
        }

        Organization org = donor.getOrganization();
        if (org != null && isValidTimezone(org.getTimezone())) {
            return org.getTimezone();
        }

        return DEFAULT_TIMEZONE;
    }

    private static boolean isValidTimezone(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return false;
        }
        try {
            ZoneId.of(timezone.trim());
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private static ZoneId safeZoneId(String timezone) {
        if (!isValidTimezone(timezone)) {
            return ZoneOffset.UTC;
        }
        return ZoneId.of(timezone.trim());
    }
}
