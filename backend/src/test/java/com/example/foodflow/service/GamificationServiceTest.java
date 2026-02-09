package com.example.foodflow.service;

import com.example.foodflow.model.dto.AchievementProgress;
import com.example.foodflow.model.dto.AchievementResponse;
import com.example.foodflow.model.dto.GamificationStatsResponse;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.model.types.AchievementCategory;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.CriteriaType;
import com.example.foodflow.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GamificationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AchievementRepository achievementRepository;

    @Mock
    private UserAchievementRepository userAchievementRepository;

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @InjectMocks
    private GamificationService gamificationService;

    private User donor;
    private User receiver;
    private Achievement donationAchievement;
    private Achievement claimAchievement;
    private Achievement socialAchievement;

    @BeforeEach
    void setUp() {
        // Create donor user
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);
        donor.setTotalPoints(100);

        // Create receiver user
        receiver = new User();
        receiver.setId(2L);
        receiver.setEmail("receiver@test.com");
        receiver.setRole(UserRole.RECEIVER);
        receiver.setTotalPoints(50);

        // Create donation achievement
        donationAchievement = new Achievement();
        donationAchievement.setId(1L);
        donationAchievement.setName("First Donation");
        donationAchievement.setDescription("Complete your first donation");
        donationAchievement.setCategory(AchievementCategory.DONATION);
        donationAchievement.setCriteriaType(CriteriaType.DONATION_COUNT);
        donationAchievement.setCriteriaValue(1);
        donationAchievement.setPointsValue(10);
        donationAchievement.setIsActive(true);

        // Create claim achievement
        claimAchievement = new Achievement();
        claimAchievement.setId(2L);
        claimAchievement.setName("First Claim");
        claimAchievement.setDescription("Claim your first donation");
        claimAchievement.setCategory(AchievementCategory.CLAIMING);
        claimAchievement.setCriteriaType(CriteriaType.CLAIM_COUNT);
        claimAchievement.setCriteriaValue(1);
        claimAchievement.setPointsValue(15);
        claimAchievement.setIsActive(true);

        // Create social achievement
        socialAchievement = new Achievement();
        socialAchievement.setId(3L);
        socialAchievement.setName("Conversationalist");
        socialAchievement.setDescription("Send 10 messages");
        socialAchievement.setCategory(AchievementCategory.SOCIAL);
        socialAchievement.setCriteriaType(CriteriaType.MESSAGE_COUNT);
        socialAchievement.setCriteriaValue(10);
        socialAchievement.setPointsValue(20);
        socialAchievement.setIsActive(true);
    }

    // ==================== Tests for awardPoints ====================

    @Test
    void testAwardPoints_Success() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        gamificationService.awardPoints(1L, 50, "Test reward");

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getTotalPoints()).isEqualTo(150); // 100 + 50
    }

    @Test
    void testAwardPoints_UserNotFound_ThrowsException() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> gamificationService.awardPoints(999L, 50, "Test"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testAwardPoints_NullCurrentPoints_StartsFromZero() {
        // Given
        donor.setTotalPoints(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        gamificationService.awardPoints(1L, 25, "First points");

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getTotalPoints()).isEqualTo(25);
    }

    @Test
    void testAwardPoints_NegativePoints_DecreasesTotal() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        gamificationService.awardPoints(1L, -30, "Penalty");

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getTotalPoints()).isEqualTo(70); // 100 - 30
    }

    @Test
    void testAwardPoints_ZeroPoints_NoChange() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        gamificationService.awardPoints(1L, 0, "No change");

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getTotalPoints()).isEqualTo(100);
    }

    // ==================== Tests for checkAndUnlockAchievements ====================

    @Test
    void testCheckAndUnlockAchievements_UnlocksDonationAchievement() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);

        UserAchievement newAchievement = new UserAchievement(donor, donationAchievement);
        when(userAchievementRepository.save(any(UserAchievement.class)))
                .thenReturn(newAchievement);
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(1L);

        // Then
        assertThat(result).hasSize(1);
        verify(userAchievementRepository, times(2)).save(any(UserAchievement.class));
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testCheckAndUnlockAchievements_DoesNotUnlockIfCriteriaNotMet() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L); // No donations yet

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(1L);

        // Then
        assertThat(result).isEmpty();
        verify(userAchievementRepository, never()).save(any(UserAchievement.class));
    }

    @Test
    void testCheckAndUnlockAchievements_SkipsAlreadyEarned() {
        // Given
        UserAchievement existingAchievement = new UserAchievement(donor, donationAchievement);
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(1L))
                .thenReturn(Arrays.asList(existingAchievement));
        // Don't stub countByDonorId since it won't be called if achievement is already earned

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(1L);

        // Then
        assertThat(result).isEmpty();
        verify(userAchievementRepository, never()).save(any(UserAchievement.class));
    }

    @Test
    void testCheckAndUnlockAchievements_UnlocksMultiple() {
        // Given
        Achievement achievement2 = new Achievement();
        achievement2.setId(4L);
        achievement2.setName("Generous Donor");
        achievement2.setDescription("Make 5 donations");
        achievement2.setCriteriaType(CriteriaType.DONATION_COUNT);
        achievement2.setCriteriaValue(5);
        achievement2.setPointsValue(25);
        achievement2.setIsActive(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement, achievement2));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(10L);
        when(userAchievementRepository.save(any(UserAchievement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(1L);

        // Then
        assertThat(result).hasSize(2);
        verify(userAchievementRepository, times(4)).save(any(UserAchievement.class));
    }

    @Test
    void testCheckAndUnlockAchievements_UserNotFound_ThrowsException() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> gamificationService.checkAndUnlockAchievements(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void testCheckAndUnlockAchievements_AwardsAchievementPoints() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(1L);
        when(userAchievementRepository.save(any(UserAchievement.class)))
                .thenReturn(new UserAchievement(donor, donationAchievement));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        gamificationService.checkAndUnlockAchievements(1L);

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getTotalPoints()).isEqualTo(110); // 100 + 10 (achievement points)
    }

    @Test
    void testCheckAndUnlockAchievements_OnlyRelevantForUserRole() {
        // Given - Donor trying to unlock receiver-only achievement
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(claimAchievement)); // Receiver achievement
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        // Don't stub claimRepository since it won't be called for mismatched role

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(1L);

        // Then - Should not unlock receiver achievement for donor
        assertThat(result).isEmpty();
        verify(userAchievementRepository, never()).save(any(UserAchievement.class));
    }

    @Test
    void testCheckAndUnlockAchievements_SocialAchievementForBothRoles() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(socialAchievement));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(1L))
                .thenReturn(Collections.emptyList());

        Message message1 = new Message();
        message1.setSender(donor);
        Message message2 = new Message();
        message2.setSender(donor);
        when(messageRepository.findAll()).thenReturn(Arrays.asList(message1, message2));

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(1L);

        // Then - Should check social achievements for any role
        assertThat(result).isEmpty(); // Not enough messages (need 10)
    }

    // ==================== Tests for getUserGamificationStats ====================

    @Test
    void testGetUserGamificationStats_Success() {
        // Given
        UserAchievement userAchievement = new UserAchievement(donor, donationAchievement);
        userAchievement.setEarnedAt(LocalDateTime.now());

        // Add another achievement that's not yet unlocked
        Achievement nextAchievement = new Achievement();
        nextAchievement.setId(10L);
        nextAchievement.setName("Generous Donor");
        nextAchievement.setDescription("Make 10 donations");
        nextAchievement.setCategory(AchievementCategory.DONATION);
        nextAchievement.setCriteriaType(CriteriaType.DONATION_COUNT);
        nextAchievement.setCriteriaValue(10);
        nextAchievement.setPointsValue(25);
        nextAchievement.setIsActive(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userAchievementRepository.countByUserId(1L)).thenReturn(1L);
        when(userAchievementRepository.findByUserIdWithAchievementDetails(1L))
                .thenReturn(Arrays.asList(userAchievement));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement, nextAchievement));
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(5L);

        // When
        GamificationStatsResponse result = gamificationService.getUserGamificationStats(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getTotalPoints()).isEqualTo(100);
        assertThat(result.getAchievementCount()).isEqualTo(1);
        assertThat(result.getUnlockedAchievements()).hasSize(1);
        assertThat(result.getProgressToNext()).isNotEmpty(); // Should have progress towards the next achievement
    }

    @Test
    void testGetUserGamificationStats_UserNotFound_ThrowsException() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> gamificationService.getUserGamificationStats(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void testGetUserGamificationStats_NullPoints_ReturnsZero() {
        // Given
        donor.setTotalPoints(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userAchievementRepository.countByUserId(1L)).thenReturn(0L);
        when(userAchievementRepository.findByUserIdWithAchievementDetails(1L))
                .thenReturn(Collections.emptyList());
        when(achievementRepository.findByIsActiveTrue()).thenReturn(Collections.emptyList());

        // When
        GamificationStatsResponse result = gamificationService.getUserGamificationStats(1L);

        // Then
        assertThat(result.getTotalPoints()).isEqualTo(0);
    }

    @Test
    void testGetUserGamificationStats_NoAchievements_ReturnsEmpty() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userAchievementRepository.countByUserId(1L)).thenReturn(0L);
        when(userAchievementRepository.findByUserIdWithAchievementDetails(1L))
                .thenReturn(Collections.emptyList());
        when(achievementRepository.findByIsActiveTrue()).thenReturn(Collections.emptyList());

        // When
        GamificationStatsResponse result = gamificationService.getUserGamificationStats(1L);

        // Then
        assertThat(result.getUnlockedAchievements()).isEmpty();
        assertThat(result.getProgressToNext()).isEmpty();
    }

    @Test
    void testGetUserGamificationStats_CalculatesProgress() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userAchievementRepository.countByUserId(1L)).thenReturn(0L);
        when(userAchievementRepository.findByUserIdWithAchievementDetails(1L))
                .thenReturn(Collections.emptyList());
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement));
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);

        // When
        GamificationStatsResponse result = gamificationService.getUserGamificationStats(1L);

        // Then
        assertThat(result.getProgressToNext()).hasSize(1);
        AchievementProgress progress = result.getProgressToNext().get(0);
        assertThat(progress.getCurrentValue()).isEqualTo(0);
        assertThat(progress.getTargetValue()).isEqualTo(1);
    }

    @Test
    void testGetUserGamificationStats_FiltersByUserRole() {
        // Given - Donor should not see receiver achievements
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userAchievementRepository.countByUserId(1L)).thenReturn(0L);
        when(userAchievementRepository.findByUserIdWithAchievementDetails(1L))
                .thenReturn(Collections.emptyList());
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement, claimAchievement));
        when(surplusPostRepository.countByDonorId(1L)).thenReturn(0L);

        // When
        GamificationStatsResponse result = gamificationService.getUserGamificationStats(1L);

        // Then - Should only show donor achievements
        assertThat(result.getProgressToNext()).hasSize(1);
        assertThat(result.getProgressToNext().get(0).getAchievementName()).isEqualTo("First Donation");
    }

    @Test
    void testGetUserGamificationStats_IncludesSocialAchievements() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userAchievementRepository.countByUserId(1L)).thenReturn(0L);
        when(userAchievementRepository.findByUserIdWithAchievementDetails(1L))
                .thenReturn(Collections.emptyList());
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(socialAchievement));

        Message message = new Message();
        message.setSender(donor);
        when(messageRepository.findAll()).thenReturn(Arrays.asList(message));

        // When
        GamificationStatsResponse result = gamificationService.getUserGamificationStats(1L);

        // Then - Social achievements should be included
        assertThat(result.getProgressToNext()).hasSize(1);
        assertThat(result.getProgressToNext().get(0).getAchievementName()).isEqualTo("Conversationalist");
    }

    // ==================== Tests for getAllAchievements ====================

    @Test
    void testGetAllAchievements_Success() {
        // Given
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement, claimAchievement, socialAchievement));

        // When
        List<AchievementResponse> result = gamificationService.getAllAchievements();

        // Then
        assertThat(result).hasSize(3);
        assertThat(result).extracting("name")
                .containsExactlyInAnyOrder("First Donation", "First Claim", "Conversationalist");
    }

    @Test
    void testGetAllAchievements_EmptyList() {
        // Given
        when(achievementRepository.findByIsActiveTrue()).thenReturn(Collections.emptyList());

        // When
        List<AchievementResponse> result = gamificationService.getAllAchievements();

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void testGetAllAchievements_OnlyActive() {
        // Given - Should only return active achievements
        Achievement inactiveAchievement = new Achievement();
        inactiveAchievement.setIsActive(false);

        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(donationAchievement));

        // When
        List<AchievementResponse> result = gamificationService.getAllAchievements();

        // Then
        assertThat(result).hasSize(1);
        verify(achievementRepository).findByIsActiveTrue();
    }

    // ==================== Tests for Criteria Type Logic ====================

    @Test
    void testGetCurrentValueForCriteria_ClaimCount() {
        // Given
        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(claimAchievement));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(2L))
                .thenReturn(Collections.emptyList());
        when(claimRepository.countByReceiverId(2L)).thenReturn(5L);
        when(userAchievementRepository.save(any(UserAchievement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(receiver);

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(2L);

        // Then
        assertThat(result).hasSize(1); // Achievement unlocked because 5 >= 1
        verify(claimRepository).countByReceiverId(2L);
        verify(userAchievementRepository, times(2)).save(any(UserAchievement.class));
    }

    @Test
    void testGetCurrentValueForCriteria_PickupCount() {
        // Given
        Achievement pickupAchievement = new Achievement();
        pickupAchievement.setId(5L);
        pickupAchievement.setName("First Pickup");
        pickupAchievement.setCriteriaType(CriteriaType.PICKUP_COUNT);
        pickupAchievement.setCriteriaValue(1);
        pickupAchievement.setPointsValue(10);
        pickupAchievement.setIsActive(true);

        Claim completedClaim = new Claim();
        completedClaim.setReceiver(receiver);
        completedClaim.setStatus(ClaimStatus.COMPLETED);

        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(pickupAchievement));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(2L))
                .thenReturn(Collections.emptyList());
        when(claimRepository.findReceiverClaimsWithDetails(
                eq(2L),
                eq(List.of(ClaimStatus.COMPLETED))
        )).thenReturn(Arrays.asList(completedClaim));
        when(userAchievementRepository.save(any(UserAchievement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenReturn(receiver);

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(2L);

        // Then
        assertThat(result).hasSize(1);
        verify(userAchievementRepository, times(2)).save(any(UserAchievement.class));
    }

    @Test
    void testGetCurrentValueForCriteria_MessageCount() {
        // Given
        Message msg1 = new Message();
        msg1.setSender(donor);
        Message msg2 = new Message();
        msg2.setSender(donor);
        Message msg3 = new Message();
        msg3.setSender(receiver);

        socialAchievement.setCriteriaValue(2);

        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(socialAchievement));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        when(messageRepository.findAll()).thenReturn(Arrays.asList(msg1, msg2, msg3));
        when(userAchievementRepository.save(any(UserAchievement.class)))
                .thenReturn(new UserAchievement(donor, socialAchievement));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(1L);

        // Then
        assertThat(result).hasSize(1); // Donor sent 2 messages
    }

    @Test
    void testAwardPoints_LargeAmount() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(donor));
        when(userRepository.save(any(User.class))).thenReturn(donor);

        // When
        gamificationService.awardPoints(1L, 10000, "Large reward");

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getTotalPoints()).isEqualTo(10100);
    }

    @Test
    void testCheckAndUnlockAchievements_ReceiverGetsClaimAchievement() {
        // Given
        when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
        when(achievementRepository.findByIsActiveTrue())
                .thenReturn(Arrays.asList(claimAchievement));
        when(userAchievementRepository.findByUserIdOrderByEarnedAtDesc(2L))
                .thenReturn(Collections.emptyList());
        when(claimRepository.countByReceiverId(2L)).thenReturn(1L);
        when(userAchievementRepository.save(any(UserAchievement.class)))
                .thenReturn(new UserAchievement(receiver, claimAchievement));
        when(userRepository.save(any(User.class))).thenReturn(receiver);

        // When
        List<UserAchievement> result = gamificationService.checkAndUnlockAchievements(2L);

        // Then
        assertThat(result).hasSize(1);
        verify(userAchievementRepository, times(2)).save(any(UserAchievement.class));
    }

    // ==================== Tests for getLeaderboard ====================

    @Test
    void testGetLeaderboard_DonorRole_ReturnsTop10() {
        // Given
        List<User> topDonors = createMockUsers(UserRole.DONOR, 10);
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(topDonors);
        
        when(userRepository.findByRole(eq(UserRole.DONOR), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.DONOR)).thenReturn(10L);
        // Don't stub findById - user is in top 10 so it won't be called

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.DONOR, 1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTopUsers()).hasSize(10);
        assertThat(result.getTotalUsers()).isEqualTo(10);
        assertThat(result.getTopUsers().get(0).getRank()).isEqualTo(1);
        assertThat(result.getTopUsers().get(0).getIsCurrentUser()).isTrue();
        assertThat(result.getCurrentUserEntry()).isNull(); // User is in top 10
    }

    @Test
    void testGetLeaderboard_ReceiverRole_ReturnsTop10() {
        // Given
        List<User> topReceivers = createMockUsers(UserRole.RECEIVER, 10);
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(topReceivers);
        
        when(userRepository.findByRole(eq(UserRole.RECEIVER), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.RECEIVER)).thenReturn(10L);
        // Don't stub findById - user is in top 10 so it won't be called

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.RECEIVER, 1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTopUsers()).hasSize(10);
        assertThat(result.getTotalUsers()).isEqualTo(10);
        assertThat(result.getTopUsers().get(0).getRank()).isEqualTo(1);
    }

    @Test
    void testGetLeaderboard_CurrentUserOutsideTop10_IncludesUserEntry() {
        // Given
        List<User> topDonors = createMockUsers(UserRole.DONOR, 10);
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(topDonors);
        
        User currentUser = new User();
        currentUser.setId(99L);
        currentUser.setEmail("outside@test.com");
        currentUser.setRole(UserRole.DONOR);
        currentUser.setTotalPoints(50);
        
        when(userRepository.findByRole(eq(UserRole.DONOR), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.DONOR)).thenReturn(20L);
        when(userRepository.findById(99L)).thenReturn(Optional.of(currentUser));
        when(userRepository.countByRoleAndTotalPointsGreaterThan(UserRole.DONOR, 50))
                .thenReturn(10L); // 10 users have more points, so user is rank 11

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.DONOR, 99L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTopUsers()).hasSize(10);
        assertThat(result.getCurrentUserEntry()).isNotNull();
        assertThat(result.getCurrentUserEntry().getRank()).isEqualTo(11);
        assertThat(result.getCurrentUserEntry().getUserId()).isEqualTo(99L);
        assertThat(result.getCurrentUserEntry().getIsCurrentUser()).isTrue();
        assertThat(result.getCurrentUserEntry().getTotalPoints()).isEqualTo(50);
    }

    @Test
    void testGetLeaderboard_EmptyLeaderboard_ReturnsEmptyList() {
        // Given
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(Collections.emptyList());
        
        when(userRepository.findByRole(eq(UserRole.DONOR), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.DONOR)).thenReturn(0L);
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.DONOR, 1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTopUsers()).isEmpty();
        assertThat(result.getTotalUsers()).isEqualTo(0);
        assertThat(result.getCurrentUserEntry()).isNull();
    }

    @Test
    void testGetLeaderboard_DisplayNameLogic_UsesOrganizationName() {
        // Given - User with organization
        User userWithOrg = new User();
        userWithOrg.setId(1L);
        userWithOrg.setEmail("user@test.com");
        userWithOrg.setFullName("John Doe");
        userWithOrg.setRole(UserRole.DONOR);
        userWithOrg.setTotalPoints(1000);
        
        Organization org = new Organization();
        org.setName("Test Organization");
        userWithOrg.setOrganization(org);
        
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(Arrays.asList(userWithOrg));
        
        when(userRepository.findByRole(eq(UserRole.DONOR), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.DONOR)).thenReturn(1L);
        // Don't stub findById - user is in top list

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.DONOR, 1L);

        // Then
        assertThat(result.getTopUsers().get(0).getDisplayName())
                .isEqualTo("Test Organization");
    }

    @Test
    void testGetLeaderboard_DisplayNameLogic_UsesFullNameIfNoOrg() {
        // Given - User with full name but no organization
        User userWithName = new User();
        userWithName.setId(1L);
        userWithName.setEmail("user@test.com");
        userWithName.setFullName("Jane Smith");
        userWithName.setRole(UserRole.RECEIVER);
        userWithName.setTotalPoints(500);
        
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(Arrays.asList(userWithName));
        
        when(userRepository.findByRole(eq(UserRole.RECEIVER), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.RECEIVER)).thenReturn(1L);
        // Don't stub findById - user is in top list

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.RECEIVER, 1L);

        // Then
        assertThat(result.getTopUsers().get(0).getDisplayName())
                .isEqualTo("Jane Smith");
    }

    @Test
    void testGetLeaderboard_DisplayNameLogic_UsesEmailAsFallback() {
        // Given - User with only email
        User userWithEmail = new User();
        userWithEmail.setId(1L);
        userWithEmail.setEmail("fallback@test.com");
        userWithEmail.setRole(UserRole.DONOR);
        userWithEmail.setTotalPoints(250);
        
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(Arrays.asList(userWithEmail));
        
        when(userRepository.findByRole(eq(UserRole.DONOR), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.DONOR)).thenReturn(1L);
        // Don't stub findById - user is in top list

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.DONOR, 1L);

        // Then
        assertThat(result.getTopUsers().get(0).getDisplayName())
                .isEqualTo("fallback@test.com");
    }

    @Test
    void testGetLeaderboard_NullPoints_TreatsAsZero() {
        // Given
        User userWithNullPoints = new User();
        userWithNullPoints.setId(1L);
        userWithNullPoints.setEmail("nopoints@test.com");
        userWithNullPoints.setRole(UserRole.DONOR);
        userWithNullPoints.setTotalPoints(null);
        
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(Arrays.asList(userWithNullPoints));
        
        when(userRepository.findByRole(eq(UserRole.DONOR), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.DONOR)).thenReturn(1L);
        // Don't stub findById - user is in top list

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.DONOR, 1L);

        // Then
        assertThat(result.getTopUsers().get(0).getTotalPoints()).isEqualTo(0);
    }

    @Test
    void testGetLeaderboard_RankingIsCorrect() {
        // Given
        List<User> topDonors = createMockUsers(UserRole.DONOR, 5);
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(topDonors);
        
        when(userRepository.findByRole(eq(UserRole.DONOR), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.DONOR)).thenReturn(5L);
        // Don't stub findById - user is in top list

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.DONOR, 1L);

        // Then
        assertThat(result.getTopUsers()).hasSize(5);
        for (int i = 0; i < 5; i++) {
            assertThat(result.getTopUsers().get(i).getRank()).isEqualTo(i + 1);
        }
    }

    @Test
    void testGetLeaderboard_CurrentUserDifferentRole_NoCurrentEntry() {
        // Given
        List<User> topDonors = createMockUsers(UserRole.DONOR, 10);
        org.springframework.data.domain.Page<User> page = 
            new org.springframework.data.domain.PageImpl<>(topDonors);
        
        User receiverUser = new User();
        receiverUser.setId(99L);
        receiverUser.setEmail("receiver@test.com");
        receiverUser.setRole(UserRole.RECEIVER); // Different role
        receiverUser.setTotalPoints(500);
        
        when(userRepository.findByRole(eq(UserRole.DONOR), any()))
                .thenReturn(page);
        when(userRepository.countByRole(UserRole.DONOR)).thenReturn(10L);
        when(userRepository.findById(99L)).thenReturn(Optional.of(receiverUser));

        // When
        com.example.foodflow.model.dto.LeaderboardResponse result = 
            gamificationService.getLeaderboard(UserRole.DONOR, 99L);

        // Then - Current user entry should be null since they're a different role
        assertThat(result.getTopUsers()).hasSize(10);
        assertThat(result.getCurrentUserEntry()).isNull();
    }

    // Helper method to create mock users
    private List<User> createMockUsers(UserRole role, int count) {
        List<User> users = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            User user = new User();
            user.setId((long) (i + 1));
            user.setEmail("user" + (i + 1) + "@test.com");
            user.setFullName("User " + (i + 1));
            user.setRole(role);
            user.setTotalPoints(1000 - (i * 10)); // Descending points
            users.add(user);
        }
        return users;
    }
}
