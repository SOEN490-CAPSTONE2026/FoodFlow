package com.example.foodflow.service;

import com.example.foodflow.model.entity.*;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.ReceiverPreferencesRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private ReceiverPreferencesRepository receiverPreferencesRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private NotificationPreferenceService notificationPreferenceService;

    @Mock
    private BusinessMetricsService businessMetricsService;

    @InjectMocks
    private NotificationService notificationService;

    private User receiver1;
    private User receiver2;
    private User donor;
    private SurplusPost surplusPost;
    private ReceiverPreferences preferences1;
    private ReceiverPreferences preferences2;

    @BeforeEach
    void setUp() {
        // Create test users
        receiver1 = new User();
        receiver1.setId(1L);
        receiver1.setEmail("receiver1@test.com");
        receiver1.setRole(UserRole.RECEIVER);

        receiver2 = new User();
        receiver2.setId(2L);
        receiver2.setEmail("receiver2@test.com");
        receiver2.setRole(UserRole.RECEIVER);

        donor = new User();
        donor.setId(3L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);

        // Create test surplus post
        surplusPost = new SurplusPost();
        surplusPost.setId(100L);
        surplusPost.setTitle("Test Bakery Items");
        surplusPost.setDonor(donor);
        surplusPost.setFoodCategories(Set.of(FoodCategory.BAKERY_PASTRY));
        surplusPost.setQuantity(new Quantity(10.0, Quantity.Unit.ITEM));

        // Create test preferences
        preferences1 = new ReceiverPreferences();
        preferences1.setUser(receiver1);
        preferences1.setPreferredFoodTypes(Arrays.asList("BAKERY_PASTRY", "DAIRY_COLD"));
        preferences1.setMaxCapacity(50);
        preferences1.setNotificationPreferencesEnabled(true);

        preferences2 = new ReceiverPreferences();
        preferences2.setUser(receiver2);
        preferences2.setPreferredFoodTypes(Arrays.asList("FROZEN"));
        preferences2.setMaxCapacity(30);
        preferences2.setNotificationPreferencesEnabled(true);
        
        // Mock notification preference service to allow all notifications by default
        lenient().when(notificationPreferenceService.shouldSendNotification(any(User.class), eq("newDonationAvailable"), eq("websocket")))
            .thenReturn(true);
    }

    @Test
    void testSendNewPostNotification_MatchingPreferences_SendsNotification() {
        // Arrange
        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver1));
        when(receiverPreferencesRepository.findByUserId(1L)).thenReturn(Optional.of(preferences1));
        when(claimRepository.findByReceiverIdAndStatus(1L, ClaimStatus.ACTIVE)).thenReturn(Collections.emptyList());

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert
        ArgumentCaptor<Map<String, Object>> notificationCaptor = ArgumentCaptor.forClass(Map.class);
        verify(messagingTemplate).convertAndSendToUser(
            eq("1"),
            eq("/queue/notifications"),
            notificationCaptor.capture()
        );

        Map<String, Object> notification = notificationCaptor.getValue();
        assertEquals("NEW_POST", notification.get("type"));
        assertEquals(100L, notification.get("postId"));
        assertEquals("Test Bakery Items", notification.get("title"));
        assertEquals(10, notification.get("quantity"));
        assertTrue(notification.get("matchReason").toString().contains("BAKERY_PASTRY"));
    }

    @Test
    void testSendNewPostNotification_NonMatchingFoodType_FiltersOut() {
        // Arrange - receiver2 prefers FROZEN, but post is BAKERY_PASTRY
        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver2));
        when(receiverPreferencesRepository.findByUserId(2L)).thenReturn(Optional.of(preferences2));

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - no notification should be sent
        verify(messagingTemplate, never()).convertAndSendToUser(
            anyString(),
            anyString(),
            any()
        );
    }

    @Test
    void testSendNewPostNotification_SmartNotificationsDisabled_SendsToAll() {
        // Arrange
        preferences1.setNotificationPreferencesEnabled(false);
        preferences1.setPreferredFoodTypes(Arrays.asList("FROZEN")); // Doesn't match, but should still notify

        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver1));
        when(receiverPreferencesRepository.findByUserId(1L)).thenReturn(Optional.of(preferences1));
        // Note: No need to stub claimRepository since smart notifications are disabled

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - notification should be sent despite non-matching food type
        verify(messagingTemplate).convertAndSendToUser(
            eq("1"),
            eq("/queue/notifications"),
            any()
        );
    }

    @Test
    void testSendNewPostNotification_NoPreferences_SendsNotification() {
        // Arrange
        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver1));
        when(receiverPreferencesRepository.findByUserId(1L)).thenReturn(Optional.empty());

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - should notify by default when no preferences exist
        verify(messagingTemplate).convertAndSendToUser(
            eq("1"),
            eq("/queue/notifications"),
            any()
        );
    }

    @Test
    void testSendNewPostNotification_AtCapacity_FiltersOut() {
        // Arrange
        preferences1.setMaxCapacity(10);
        
        // Mock active claims totaling 10 items
        Claim claim = new Claim();
        SurplusPost claimedPost = new SurplusPost();
        claimedPost.setQuantity(new Quantity(10.0, Quantity.Unit.ITEM));
        claim.setSurplusPost(claimedPost);

        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver1));
        when(receiverPreferencesRepository.findByUserId(1L)).thenReturn(Optional.of(preferences1));
        when(claimRepository.findByReceiverIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Arrays.asList(claim));

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - should not notify when at capacity
        verify(messagingTemplate, never()).convertAndSendToUser(
            anyString(),
            anyString(),
            any()
        );
    }

    @Test
    void testSendNewPostNotification_QuantityExceedsAvailableCapacity_FiltersOut() {
        // Arrange
        preferences1.setMaxCapacity(50);
        
        // Mock active claims totaling 45 items, so only 5 items of capacity left
        Claim claim = new Claim();
        SurplusPost claimedPost = new SurplusPost();
        claimedPost.setQuantity(new Quantity(45.0, Quantity.Unit.ITEM));
        claim.setSurplusPost(claimedPost);

        // But the new post has 10 items, which exceeds available capacity
        surplusPost.setQuantity(new Quantity(10.0, Quantity.Unit.ITEM));

        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver1));
        when(receiverPreferencesRepository.findByUserId(1L)).thenReturn(Optional.of(preferences1));
        when(claimRepository.findByReceiverIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Arrays.asList(claim));

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - should not notify when quantity exceeds available capacity
        verify(messagingTemplate, never()).convertAndSendToUser(
            anyString(),
            anyString(),
            any()
        );
    }

    @Test
    void testSendNewPostNotification_QuantityFitsInAvailableCapacity_SendsNotification() {
        // Arrange
        preferences1.setMaxCapacity(50);
        
        // Mock active claims totaling 45 items, so 5 items of capacity left
        Claim claim = new Claim();
        SurplusPost claimedPost = new SurplusPost();
        claimedPost.setQuantity(new Quantity(45.0, Quantity.Unit.ITEM));
        claim.setSurplusPost(claimedPost);

        // New post has 5 items, which exactly fits
        surplusPost.setQuantity(new Quantity(5.0, Quantity.Unit.ITEM));

        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver1));
        when(receiverPreferencesRepository.findByUserId(1L)).thenReturn(Optional.of(preferences1));
        when(claimRepository.findByReceiverIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Arrays.asList(claim));

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - should notify when quantity fits
        verify(messagingTemplate).convertAndSendToUser(
            eq("1"),
            eq("/queue/notifications"),
            any()
        );
    }

    @Test
    void testSendNewPostNotification_MultipleReceivers_FiltersCorrectly() {
        // Arrange
        when(userRepository.findByRole(UserRole.RECEIVER))
            .thenReturn(Arrays.asList(receiver1, receiver2));
        
        when(receiverPreferencesRepository.findByUserId(1L))
            .thenReturn(Optional.of(preferences1)); // Matches BAKERY_PASTRY
        
        when(receiverPreferencesRepository.findByUserId(2L))
            .thenReturn(Optional.of(preferences2)); // Prefers FROZEN, doesn't match

        when(claimRepository.findByReceiverIdAndStatus(anyLong(), eq(ClaimStatus.ACTIVE)))
            .thenReturn(Collections.emptyList());

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - only receiver1 should get notification
        verify(messagingTemplate, times(1)).convertAndSendToUser(
            eq("1"),
            eq("/queue/notifications"),
            any()
        );
        
        verify(messagingTemplate, never()).convertAndSendToUser(
            eq("2"),
            anyString(),
            any()
        );
    }

    @Test
    void testGetCurrentClaimedQuantity_NoActiveClaims_ReturnsZero() {
        // Arrange
        when(claimRepository.findByReceiverIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Collections.emptyList());

        // Act
        int quantity = notificationService.getCurrentClaimedQuantity(1L);

        // Assert
        assertEquals(0, quantity);
    }

    @Test
    void testGetCurrentClaimedQuantity_MultipleActiveClaims_SumsCorrectly() {
        // Arrange
        Claim claim1 = new Claim();
        SurplusPost post1 = new SurplusPost();
        post1.setQuantity(new Quantity(15.0, Quantity.Unit.ITEM));
        claim1.setSurplusPost(post1);

        Claim claim2 = new Claim();
        SurplusPost post2 = new SurplusPost();
        post2.setQuantity(new Quantity(20.0, Quantity.Unit.ITEM));
        claim2.setSurplusPost(post2);

        Claim claim3 = new Claim();
        SurplusPost post3 = new SurplusPost();
        post3.setQuantity(new Quantity(10.0, Quantity.Unit.ITEM));
        claim3.setSurplusPost(post3);

        when(claimRepository.findByReceiverIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Arrays.asList(claim1, claim2, claim3));

        // Act
        int quantity = notificationService.getCurrentClaimedQuantity(1L);

        // Assert
        assertEquals(45, quantity);
    }

    @Test
    void testGetCurrentClaimedQuantity_HandlesNullQuantities() {
        // Arrange
        Claim claim1 = new Claim();
        SurplusPost post1 = new SurplusPost();
        post1.setQuantity(new Quantity(15.0, Quantity.Unit.ITEM));
        claim1.setSurplusPost(post1);

        Claim claim2 = new Claim();
        SurplusPost post2 = new SurplusPost();
        post2.setQuantity(null); // Null quantity
        claim2.setSurplusPost(post2);

        when(claimRepository.findByReceiverIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Arrays.asList(claim1, claim2));

        // Act
        int quantity = notificationService.getCurrentClaimedQuantity(1L);

        // Assert - should only count the non-null quantity
        assertEquals(15, quantity);
    }

    @Test
    void testSendNewPostNotification_EmptyPreferredFoodTypes_MatchesAll() {
        // Arrange
        preferences1.setPreferredFoodTypes(Collections.emptyList());
        
        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver1));
        when(receiverPreferencesRepository.findByUserId(1L)).thenReturn(Optional.of(preferences1));
        when(claimRepository.findByReceiverIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Collections.emptyList());

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - should notify when preferred types is empty (matches all)
        verify(messagingTemplate).convertAndSendToUser(
            eq("1"),
            eq("/queue/notifications"),
            any()
        );
    }

    @Test
    void testSendNewPostNotification_PostWithNoFoodCategories_NoMatch() {
        // Arrange
        surplusPost.setFoodCategories(Collections.emptySet());
        
        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver1));
        when(receiverPreferencesRepository.findByUserId(1L)).thenReturn(Optional.of(preferences1));

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - should not notify when post has no categories
        verify(messagingTemplate, never()).convertAndSendToUser(
            anyString(),
            anyString(),
            any()
        );
    }

    @Test
    void testSendNewPostNotification_ExceptionInNotification_ContinuesProcessing() {
        // Arrange
        when(userRepository.findByRole(UserRole.RECEIVER))
            .thenReturn(Arrays.asList(receiver1, receiver2));
        
        when(receiverPreferencesRepository.findByUserId(1L))
            .thenReturn(Optional.of(preferences1));
        
        // Change receiver2 preferences to match
        preferences2.setPreferredFoodTypes(Arrays.asList("BAKERY_PASTRY"));
        when(receiverPreferencesRepository.findByUserId(2L))
            .thenReturn(Optional.of(preferences2));

        when(claimRepository.findByReceiverIdAndStatus(anyLong(), eq(ClaimStatus.ACTIVE)))
            .thenReturn(Collections.emptyList());

        // Throw exception for first receiver
        doThrow(new RuntimeException("WebSocket error"))
            .when(messagingTemplate).convertAndSendToUser(eq("1"), anyString(), any());

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert - should still try to notify receiver2 despite error with receiver1
        verify(messagingTemplate).convertAndSendToUser(eq("1"), anyString(), any());
        verify(messagingTemplate).convertAndSendToUser(eq("2"), anyString(), any());
    }

    @Test
    void testSendNewPostNotification_MatchReasonIncludesMultipleCategories() {
        // Arrange
        surplusPost.setFoodCategories(Set.of(FoodCategory.BAKERY_PASTRY, FoodCategory.DAIRY_COLD));
        preferences1.setPreferredFoodTypes(Arrays.asList("BAKERY_PASTRY", "DAIRY_COLD"));
        
        when(userRepository.findByRole(UserRole.RECEIVER)).thenReturn(Arrays.asList(receiver1));
        when(receiverPreferencesRepository.findByUserId(1L)).thenReturn(Optional.of(preferences1));
        when(claimRepository.findByReceiverIdAndStatus(1L, ClaimStatus.ACTIVE))
            .thenReturn(Collections.emptyList());

        // Act
        notificationService.sendNewPostNotification(surplusPost);

        // Assert
        ArgumentCaptor<Map<String, Object>> notificationCaptor = ArgumentCaptor.forClass(Map.class);
        verify(messagingTemplate).convertAndSendToUser(
            eq("1"),
            eq("/queue/notifications"),
            notificationCaptor.capture()
        );

        String matchReason = (String) notificationCaptor.getValue().get("matchReason");
        assertTrue(matchReason.contains("Matches preferred:"));
        // Should contain at least one of the matching categories
        assertTrue(matchReason.contains("BAKERY_PASTRY") || matchReason.contains("DAIRY_COLD"));
    }
}
