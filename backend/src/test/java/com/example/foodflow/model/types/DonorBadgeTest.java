package com.example.foodflow.model.types;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class DonorBadgeTest {

    // ==================== Tests for fromTotalDonated ====================

    @Test
    void testFromTotalDonated_Null_ReturnsNone() {
        assertThat(DonorBadge.fromTotalDonated(null)).isEqualTo(DonorBadge.NONE);
    }

    @Test
    void testFromTotalDonated_Zero_ReturnsNone() {
        assertThat(DonorBadge.fromTotalDonated(BigDecimal.ZERO)).isEqualTo(DonorBadge.NONE);
    }

    @Test
    void testFromTotalDonated_BelowBronze_ReturnsNone() {
        assertThat(DonorBadge.fromTotalDonated(new BigDecimal("9.99"))).isEqualTo(DonorBadge.NONE);
    }

    @Test
    void testFromTotalDonated_ExactlyBronze_ReturnsBronze() {
        assertThat(DonorBadge.fromTotalDonated(new BigDecimal("10"))).isEqualTo(DonorBadge.BRONZE);
    }

    @Test
    void testFromTotalDonated_BetweenBronzeAndSilver_ReturnsBronze() {
        assertThat(DonorBadge.fromTotalDonated(new BigDecimal("25.50"))).isEqualTo(DonorBadge.BRONZE);
    }

    @Test
    void testFromTotalDonated_ExactlySilver_ReturnsSilver() {
        assertThat(DonorBadge.fromTotalDonated(new BigDecimal("50"))).isEqualTo(DonorBadge.SILVER);
    }

    @Test
    void testFromTotalDonated_BetweenSilverAndGold_ReturnsSilver() {
        assertThat(DonorBadge.fromTotalDonated(new BigDecimal("75"))).isEqualTo(DonorBadge.SILVER);
    }

    @Test
    void testFromTotalDonated_ExactlyGold_ReturnsGold() {
        assertThat(DonorBadge.fromTotalDonated(new BigDecimal("100"))).isEqualTo(DonorBadge.GOLD);
    }

    @Test
    void testFromTotalDonated_BetweenGoldAndPlatinum_ReturnsGold() {
        assertThat(DonorBadge.fromTotalDonated(new BigDecimal("250"))).isEqualTo(DonorBadge.GOLD);
    }

    @Test
    void testFromTotalDonated_ExactlyPlatinum_ReturnsPlatinum() {
        assertThat(DonorBadge.fromTotalDonated(new BigDecimal("500"))).isEqualTo(DonorBadge.PLATINUM);
    }

    @Test
    void testFromTotalDonated_AbovePlatinum_ReturnsPlatinum() {
        assertThat(DonorBadge.fromTotalDonated(new BigDecimal("10000"))).isEqualTo(DonorBadge.PLATINUM);
    }

    // ==================== Tests for nextTier ====================

    @Test
    void testNextTier_None_ReturnsBronze() {
        assertThat(DonorBadge.NONE.nextTier()).isEqualTo(DonorBadge.BRONZE);
    }

    @Test
    void testNextTier_Bronze_ReturnsSilver() {
        assertThat(DonorBadge.BRONZE.nextTier()).isEqualTo(DonorBadge.SILVER);
    }

    @Test
    void testNextTier_Silver_ReturnsGold() {
        assertThat(DonorBadge.SILVER.nextTier()).isEqualTo(DonorBadge.GOLD);
    }

    @Test
    void testNextTier_Gold_ReturnsPlatinum() {
        assertThat(DonorBadge.GOLD.nextTier()).isEqualTo(DonorBadge.PLATINUM);
    }

    @Test
    void testNextTier_Platinum_ReturnsNull() {
        assertThat(DonorBadge.PLATINUM.nextTier()).isNull();
    }

    // ==================== Tests for amountToNextTier ====================

    @Test
    void testAmountToNextTier_NoneWithZero_Returns10() {
        BigDecimal result = DonorBadge.NONE.amountToNextTier(BigDecimal.ZERO);
        assertThat(result).isEqualByComparingTo(new BigDecimal("10"));
    }

    @Test
    void testAmountToNextTier_NoneWith5_Returns5() {
        BigDecimal result = DonorBadge.NONE.amountToNextTier(new BigDecimal("5"));
        assertThat(result).isEqualByComparingTo(new BigDecimal("5"));
    }

    @Test
    void testAmountToNextTier_BronzeWith15_Returns35() {
        BigDecimal result = DonorBadge.BRONZE.amountToNextTier(new BigDecimal("15"));
        assertThat(result).isEqualByComparingTo(new BigDecimal("35"));
    }

    @Test
    void testAmountToNextTier_SilverWith75_Returns25() {
        BigDecimal result = DonorBadge.SILVER.amountToNextTier(new BigDecimal("75"));
        assertThat(result).isEqualByComparingTo(new BigDecimal("25"));
    }

    @Test
    void testAmountToNextTier_GoldWith300_Returns200() {
        BigDecimal result = DonorBadge.GOLD.amountToNextTier(new BigDecimal("300"));
        assertThat(result).isEqualByComparingTo(new BigDecimal("200"));
    }

    @Test
    void testAmountToNextTier_Platinum_ReturnsZero() {
        BigDecimal result = DonorBadge.PLATINUM.amountToNextTier(new BigDecimal("1000"));
        assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void testAmountToNextTier_ExactlyAtThreshold_ReturnsZero() {
        BigDecimal result = DonorBadge.BRONZE.amountToNextTier(new BigDecimal("50"));
        assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ==================== Tests for getters ====================

    @Test
    void testGetThreshold_Values() {
        assertThat(DonorBadge.NONE.getThreshold()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(DonorBadge.BRONZE.getThreshold()).isEqualByComparingTo(new BigDecimal("10"));
        assertThat(DonorBadge.SILVER.getThreshold()).isEqualByComparingTo(new BigDecimal("50"));
        assertThat(DonorBadge.GOLD.getThreshold()).isEqualByComparingTo(new BigDecimal("100"));
        assertThat(DonorBadge.PLATINUM.getThreshold()).isEqualByComparingTo(new BigDecimal("500"));
    }

    @Test
    void testGetDescription_NotNull() {
        for (DonorBadge badge : DonorBadge.values()) {
            assertThat(badge.getDescription()).isNotNull().isNotBlank();
        }
    }
}
