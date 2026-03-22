package com.example.foodflow.service;

import com.example.foodflow.model.dto.DonorPrivacySettingsDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserDonationStats;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.DonorBadge;
import com.example.foodflow.repository.MonetaryDonationRepository;
import com.example.foodflow.repository.UserDonationStatsRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DonationStatsServiceTest {

    @Mock
    private UserDonationStatsRepository userDonationStatsRepository;

    @Mock
    private MonetaryDonationRepository monetaryDonationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DonationNotificationService donationNotificationService;

    @InjectMocks
    private DonationStatsService donationStatsService;

    private User donor;
    private UserDonationStats existingStats;

    @BeforeEach
    void setUp() {
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setFullName("John Doe");
        donor.setRole(UserRole.DONOR);
        donor.setDonationCount(0);

        existingStats = new UserDonationStats(donor);
        existingStats.setId(1L);
        existingStats.setDonorBadge(DonorBadge.NONE);
    }

    // ==================== Tests for updateUserStats ====================

    @Test
    void testUpdateUserStats_FirstDonation_CreateStats() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userDonationStatsRepository.save(any(UserDonationStats.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        UserDonationStats result = donationStatsService.updateUserStats(1L, new BigDecimal("25"));

        assertThat(result.getTotalDonated()).isEqualByComparingTo(new BigDecimal("25"));
        assertThat(result.getDonationCount()).isEqualTo(1);
        assertThat(result.getDonorBadge()).isEqualTo(DonorBadge.BRONZE);
        assertThat(result.getLastDonationDate()).isNotNull();

        verify(donationNotificationService).notifyDonationReceived(eq(donor), eq(new BigDecimal("25")), any());
        verify(donationNotificationService).broadcastPlatformDonation(eq(donor), eq(new BigDecimal("25")), eq(false));
    }

    @Test
    void testUpdateUserStats_ExistingStats_Accumulates() {
        existingStats.setTotalDonated(new BigDecimal("40"));
        existingStats.setDonationCount(3);
        existingStats.setDonorBadge(DonorBadge.BRONZE);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));
        when(userDonationStatsRepository.save(any(UserDonationStats.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        UserDonationStats result = donationStatsService.updateUserStats(1L, new BigDecimal("15"));

        assertThat(result.getTotalDonated()).isEqualByComparingTo(new BigDecimal("55"));
        assertThat(result.getDonationCount()).isEqualTo(4);
        assertThat(result.getDonorBadge()).isEqualTo(DonorBadge.SILVER);
    }

    @Test
    void testUpdateUserStats_BadgeUpgrade_SendsBadgeNotification() {
        existingStats.setTotalDonated(new BigDecimal("45"));
        existingStats.setDonationCount(2);
        existingStats.setDonorBadge(DonorBadge.BRONZE);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));
        when(userDonationStatsRepository.save(any(UserDonationStats.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        donationStatsService.updateUserStats(1L, new BigDecimal("10"));

        verify(donationNotificationService).notifyBadgeUpgraded(
                eq(donor), eq(new BigDecimal("10")), any(), eq(DonorBadge.BRONZE));
    }

    @Test
    void testUpdateUserStats_NoBadgeUpgrade_NoBadgeNotification() {
        existingStats.setTotalDonated(new BigDecimal("15"));
        existingStats.setDonationCount(1);
        existingStats.setDonorBadge(DonorBadge.BRONZE);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));
        when(userDonationStatsRepository.save(any(UserDonationStats.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        donationStatsService.updateUserStats(1L, new BigDecimal("5"));

        verify(donationNotificationService, never()).notifyBadgeUpgraded(any(), any(), any(), any());
    }

    @Test
    void testUpdateUserStats_AnonymousByDefault_BroadcastsAnonymously() {
        existingStats.setAnonymousByDefault(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));
        when(userDonationStatsRepository.save(any(UserDonationStats.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        donationStatsService.updateUserStats(1L, new BigDecimal("10"));

        verify(donationNotificationService).broadcastPlatformDonation(eq(donor), eq(new BigDecimal("10")), eq(true));
    }

    @Test
    void testUpdateUserStats_UserNotFound_ThrowsException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> donationStatsService.updateUserStats(999L, new BigDecimal("10")))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void testUpdateUserStats_UpdatesDenormalizedCount() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userDonationStatsRepository.save(any(UserDonationStats.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        donationStatsService.updateUserStats(1L, new BigDecimal("10"));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getDonationCount()).isEqualTo(1);
    }

    // ==================== Tests for getUserBadgeInfo ====================

    @Test
    void testGetUserBadgeInfo_NoneWithProgress() {
        existingStats.setTotalDonated(new BigDecimal("5"));
        existingStats.setDonorBadge(DonorBadge.NONE);

        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));

        Map<String, Object> info = donationStatsService.getUserBadgeInfo(1L);

        assertThat(info.get("currentBadge")).isEqualTo("NONE");
        assertThat(info.get("nextBadge")).isEqualTo("BRONZE");
        assertThat((Double) info.get("progressPercent")).isEqualTo(50.0);
        assertThat(info.get("currency")).isEqualTo("CAD");
    }

    @Test
    void testGetUserBadgeInfo_PlatinumMaxedOut() {
        existingStats.setTotalDonated(new BigDecimal("1000"));
        existingStats.setDonorBadge(DonorBadge.PLATINUM);

        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));

        Map<String, Object> info = donationStatsService.getUserBadgeInfo(1L);

        assertThat(info.get("currentBadge")).isEqualTo("PLATINUM");
        assertThat(info.get("nextBadge")).isNull();
        assertThat((Double) info.get("progressPercent")).isEqualTo(100.0);
    }

    @Test
    void testGetUserBadgeInfo_UserNotFound_ThrowsException() {
        when(userDonationStatsRepository.findByUserId(999L)).thenReturn(Optional.empty());
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> donationStatsService.getUserBadgeInfo(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    // ==================== Tests for getPrivacySettings ====================

    @Test
    void testGetPrivacySettings_ReturnsDefaults() {
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));

        DonorPrivacySettingsDTO settings = donationStatsService.getPrivacySettings(1L);

        assertThat(settings.getShowBadgePublicly()).isTrue();
        assertThat(settings.getShowDonationHistory()).isFalse();
        assertThat(settings.getShowOnLeaderboard()).isTrue();
        assertThat(settings.getAnonymousByDefault()).isFalse();
    }

    // ==================== Tests for updatePrivacySettings ====================

    @Test
    void testUpdatePrivacySettings_PartialUpdate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));
        when(userDonationStatsRepository.save(any(UserDonationStats.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DonorPrivacySettingsDTO input = new DonorPrivacySettingsDTO();
        input.setAnonymousByDefault(true);
        // Other fields are null — should not be changed

        DonorPrivacySettingsDTO result = donationStatsService.updatePrivacySettings(1L, input);

        assertThat(result.getAnonymousByDefault()).isTrue();
        assertThat(result.getShowBadgePublicly()).isTrue(); // Unchanged
        assertThat(result.getShowDonationHistory()).isFalse(); // Unchanged
        assertThat(result.getShowOnLeaderboard()).isTrue(); // Unchanged
    }

    @Test
    void testUpdatePrivacySettings_FullUpdate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));
        when(userDonationStatsRepository.save(any(UserDonationStats.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DonorPrivacySettingsDTO input = new DonorPrivacySettingsDTO(false, true, false, true);

        DonorPrivacySettingsDTO result = donationStatsService.updatePrivacySettings(1L, input);

        assertThat(result.getShowBadgePublicly()).isFalse();
        assertThat(result.getShowDonationHistory()).isTrue();
        assertThat(result.getShowOnLeaderboard()).isFalse();
        assertThat(result.getAnonymousByDefault()).isTrue();
    }

    @Test
    void testUpdatePrivacySettings_UserNotFound_ThrowsException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> donationStatsService.updatePrivacySettings(999L, new DonorPrivacySettingsDTO()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    // ==================== Tests for getPublicDonorProfile ====================

    @Test
    void testGetPublicDonorProfile_AllPublic() {
        existingStats.setTotalDonated(new BigDecimal("100"));
        existingStats.setDonationCount(5);
        existingStats.setDonorBadge(DonorBadge.GOLD);
        existingStats.setShowBadgePublicly(true);
        existingStats.setShowDonationHistory(true);

        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));

        Map<String, Object> profile = donationStatsService.getPublicDonorProfile(1L);

        assertThat(profile.get("badge")).isEqualTo("GOLD");
        assertThat(profile.get("totalDonated")).isEqualTo(new BigDecimal("100"));
        assertThat(profile.get("donationCount")).isEqualTo(5);
    }

    @Test
    void testGetPublicDonorProfile_BadgeHidden() {
        existingStats.setDonorBadge(DonorBadge.GOLD);
        existingStats.setShowBadgePublicly(false);
        existingStats.setShowDonationHistory(true);
        existingStats.setTotalDonated(new BigDecimal("100"));
        existingStats.setDonationCount(5);

        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));

        Map<String, Object> profile = donationStatsService.getPublicDonorProfile(1L);

        assertThat(profile.get("badge")).isNull();
        assertThat(profile.get("badgeDescription")).isNull();
        assertThat(profile.get("totalDonated")).isEqualTo(new BigDecimal("100"));
    }

    @Test
    void testGetPublicDonorProfile_HistoryHidden() {
        existingStats.setDonorBadge(DonorBadge.GOLD);
        existingStats.setShowBadgePublicly(true);
        existingStats.setShowDonationHistory(false);

        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));

        Map<String, Object> profile = donationStatsService.getPublicDonorProfile(1L);

        assertThat(profile.get("badge")).isEqualTo("GOLD");
        assertThat(profile.get("totalDonated")).isNull();
        assertThat(profile.get("donationCount")).isNull();
        assertThat(profile.get("lastDonationDate")).isNull();
    }

    @Test
    void testGetPublicDonorProfile_EverythingHidden() {
        existingStats.setShowBadgePublicly(false);
        existingStats.setShowDonationHistory(false);

        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));

        Map<String, Object> profile = donationStatsService.getPublicDonorProfile(1L);

        assertThat(profile.get("badge")).isNull();
        assertThat(profile.get("totalDonated")).isNull();
        assertThat(profile.get("donationCount")).isNull();
    }

    // ==================== Tests for hasDonated ====================

    @Test
    void testHasDonated_True() {
        existingStats.setDonationCount(3);
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));

        assertThat(donationStatsService.hasDonated(1L)).isTrue();
    }

    @Test
    void testHasDonated_False_ZeroCount() {
        existingStats.setDonationCount(0);
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.of(existingStats));

        assertThat(donationStatsService.hasDonated(1L)).isFalse();
    }

    @Test
    void testHasDonated_False_NoRecord() {
        when(userDonationStatsRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThat(donationStatsService.hasDonated(1L)).isFalse();
    }

    // ==================== Tests for getPlatformTotals ====================

    @Test
    void testGetPlatformTotals_WithData() {
        when(userDonationStatsRepository.sumAllTotalDonated()).thenReturn(new BigDecimal("5000"));
        when(userDonationStatsRepository.sumAllDonationCounts()).thenReturn(42L);
        when(userDonationStatsRepository.countUsersWhoDonated()).thenReturn(15L);

        Map<String, Object> totals = donationStatsService.getPlatformTotals();

        assertThat(totals.get("totalAmountDonated")).isEqualTo(new BigDecimal("5000"));
        assertThat(totals.get("totalDonationCount")).isEqualTo(42L);
        assertThat(totals.get("totalDonorCount")).isEqualTo(15L);
        assertThat(totals.get("currency")).isEqualTo("CAD");
    }

    @Test
    void testGetPlatformTotals_NullValues_DefaultsToZero() {
        when(userDonationStatsRepository.sumAllTotalDonated()).thenReturn(null);
        when(userDonationStatsRepository.sumAllDonationCounts()).thenReturn(null);
        when(userDonationStatsRepository.countUsersWhoDonated()).thenReturn(null);

        Map<String, Object> totals = donationStatsService.getPlatformTotals();

        assertThat(totals.get("totalAmountDonated")).isEqualTo(BigDecimal.ZERO);
        assertThat(totals.get("totalDonationCount")).isEqualTo(0L);
        assertThat(totals.get("totalDonorCount")).isEqualTo(0L);
    }
}
