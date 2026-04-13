package com.example.foodflow.service;
import com.example.foodflow.model.dto.DonationNotificationDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserDonationStats;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.DonorBadge;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class DonationNotificationServiceTest {
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @InjectMocks
    private DonationNotificationService donationNotificationService;
    private User donor;
    private UserDonationStats stats;
    @BeforeEach
    void setUp() {
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setFullName("John Doe");
        donor.setRole(UserRole.DONOR);
        stats = new UserDonationStats(donor);
        stats.setTotalDonated(new BigDecimal("55"));
        stats.setDonationCount(3);
        stats.setDonorBadge(DonorBadge.SILVER);
    }
    // ==================== Tests for notifyDonationReceived ====================
    @Test
    void testNotifyDonationReceived_SendsToUserQueue() {
        donationNotificationService.notifyDonationReceived(donor, new BigDecimal("25"), stats);
        ArgumentCaptor<DonationNotificationDTO> captor = ArgumentCaptor.forClass(DonationNotificationDTO.class);
        verify(messagingTemplate).convertAndSendToUser(
                eq("1"), eq("/queue/donations"), captor.capture());
        DonationNotificationDTO dto = captor.getValue();
        assertThat(dto.getType()).isEqualTo("DONATION_RECEIVED");
        assertThat(dto.getUserId()).isEqualTo(1L);
        assertThat(dto.getAmount()).isEqualByComparingTo(new BigDecimal("25"));
        assertThat(dto.getCurrentBadge()).isEqualTo("SILVER");
        assertThat(dto.getTotalDonated()).isEqualByComparingTo(new BigDecimal("55"));
        assertThat(dto.getDonationCount()).isEqualTo(3);
        assertThat(dto.getCurrency()).isEqualTo("CAD");
    }
    @Test
    void testNotifyDonationReceived_DisplayName_FullName() {
        donationNotificationService.notifyDonationReceived(donor, new BigDecimal("10"), stats);
        ArgumentCaptor<DonationNotificationDTO> captor = ArgumentCaptor.forClass(DonationNotificationDTO.class);
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/donations"), captor.capture());
        assertThat(captor.getValue().getDisplayName()).isEqualTo("John D.");
    }
    @Test
    void testNotifyDonationReceived_DisplayName_SingleName() {
        donor.setFullName("Madonna");
        donationNotificationService.notifyDonationReceived(donor, new BigDecimal("10"), stats);
        ArgumentCaptor<DonationNotificationDTO> captor = ArgumentCaptor.forClass(DonationNotificationDTO.class);
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/donations"), captor.capture());
        assertThat(captor.getValue().getDisplayName()).isEqualTo("Madonna");
    }
    @Test
    void testNotifyDonationReceived_DisplayName_NullName() {
        donor.setFullName(null);
        donationNotificationService.notifyDonationReceived(donor, new BigDecimal("10"), stats);
        ArgumentCaptor<DonationNotificationDTO> captor = ArgumentCaptor.forClass(DonationNotificationDTO.class);
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/donations"), captor.capture());
        assertThat(captor.getValue().getDisplayName()).isEqualTo("A Supporter");
    }
    @Test
    void testNotifyDonationReceived_IncludesNextBadgeInfo() {
        stats.setDonorBadge(DonorBadge.BRONZE);
        stats.setTotalDonated(new BigDecimal("30"));
        donationNotificationService.notifyDonationReceived(donor, new BigDecimal("10"), stats);
        ArgumentCaptor<DonationNotificationDTO> captor = ArgumentCaptor.forClass(DonationNotificationDTO.class);
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/donations"), captor.capture());
        DonationNotificationDTO dto = captor.getValue();
        assertThat(dto.getNextBadge()).isEqualTo("SILVER");
        assertThat(dto.getProgressPercent()).isEqualTo(50.0);
    }
    @Test
    void testNotifyDonationReceived_Platinum_NoNextBadge() {
        stats.setDonorBadge(DonorBadge.PLATINUM);
        stats.setTotalDonated(new BigDecimal("1000"));
        donationNotificationService.notifyDonationReceived(donor, new BigDecimal("50"), stats);
        ArgumentCaptor<DonationNotificationDTO> captor = ArgumentCaptor.forClass(DonationNotificationDTO.class);
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/donations"), captor.capture());
        DonationNotificationDTO dto = captor.getValue();
        assertThat(dto.getNextBadge()).isNull();
        assertThat(dto.getProgressPercent()).isEqualTo(100.0);
    }
    @Test
    void testNotifyDonationReceived_HandlesWebSocketFailure() {
        doThrow(new RuntimeException("WebSocket error"))
                .when(messagingTemplate).convertAndSendToUser(any(), any(), any(Object.class));
        // Should not throw — error is caught and logged
        donationNotificationService.notifyDonationReceived(donor, new BigDecimal("10"), stats);
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/donations"), any());
    }
    // ==================== Tests for notifyBadgeUpgraded ====================
    @Test
    void testNotifyBadgeUpgraded_IncludesPreviousBadge() {
        donationNotificationService.notifyBadgeUpgraded(donor, new BigDecimal("10"), stats, DonorBadge.BRONZE);
        ArgumentCaptor<DonationNotificationDTO> captor = ArgumentCaptor.forClass(DonationNotificationDTO.class);
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq("/queue/donations"), captor.capture());
        DonationNotificationDTO dto = captor.getValue();
        assertThat(dto.getType()).isEqualTo("BADGE_UPGRADED");
        assertThat(dto.getPreviousBadge()).isEqualTo("BRONZE");
        assertThat(dto.getCurrentBadge()).isEqualTo("SILVER");
    }
    // ==================== Tests for broadcastPlatformDonation ====================
    @Test
    void testBroadcastPlatformDonation_Public() {
        donationNotificationService.broadcastPlatformDonation(donor, new BigDecimal("50"), false);
        ArgumentCaptor<DonationNotificationDTO> captor = ArgumentCaptor.forClass(DonationNotificationDTO.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/donations"), captor.capture());
        DonationNotificationDTO dto = captor.getValue();
        assertThat(dto.getType()).isEqualTo("PLATFORM_DONATION");
        assertThat(dto.getDisplayName()).isEqualTo("John D.");
        assertThat(dto.getUserId()).isEqualTo(1L);
        assertThat(dto.getAmount()).isEqualByComparingTo(new BigDecimal("50"));
    }
    @Test
    void testBroadcastPlatformDonation_Anonymous() {
        donationNotificationService.broadcastPlatformDonation(donor, new BigDecimal("50"), true);
        ArgumentCaptor<DonationNotificationDTO> captor = ArgumentCaptor.forClass(DonationNotificationDTO.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/donations"), captor.capture());
        DonationNotificationDTO dto = captor.getValue();
        assertThat(dto.getType()).isEqualTo("PLATFORM_DONATION");
        assertThat(dto.getDisplayName()).isEqualTo("Anonymous");
        assertThat(dto.getUserId()).isNull();
    }
    @Test
    void testBroadcastPlatformDonation_HandlesWebSocketFailure() {
        doThrow(new RuntimeException("WebSocket error"))
                .when(messagingTemplate).convertAndSend(anyString(), any(DonationNotificationDTO.class));
        // Should not throw — error is caught and logged
        donationNotificationService.broadcastPlatformDonation(donor, new BigDecimal("10"), false);
        verify(messagingTemplate).convertAndSend(eq("/topic/donations"), any(DonationNotificationDTO.class));
    }
}
