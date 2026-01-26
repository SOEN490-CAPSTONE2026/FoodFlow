package com.example.foodflow.controller;

import com.example.foodflow.model.dto.AchievementResponse;
import com.example.foodflow.model.dto.GamificationStatsResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.GamificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GamificationControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private GamificationService gamificationService;
    
    private User testUser;
    private User otherUser;
    private UsernamePasswordAuthenticationToken authentication;
    private UsernamePasswordAuthenticationToken otherAuthentication;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.DONOR);
        
        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");
        otherUser.setRole(UserRole.RECEIVER);
        
        authentication = new UsernamePasswordAuthenticationToken(
            testUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority(UserRole.DONOR.name()))
        );
        
        otherAuthentication = new UsernamePasswordAuthenticationToken(
            otherUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority(UserRole.RECEIVER.name()))
        );
    }
    
    @Test
    void getUserStats_ValidRequest_ShouldReturn200() throws Exception {
        // Given
        GamificationStatsResponse stats = new GamificationStatsResponse();
        stats.setUserId(1L);
        stats.setTotalPoints(500);
        stats.setAchievementCount(5);
        
        when(gamificationService.getUserGamificationStats(anyLong())).thenReturn(stats);
        
        // When & Then
        mockMvc.perform(get("/api/gamification/users/1/stats")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.totalPoints").value(500))
                .andExpect(jsonPath("$.achievementCount").value(5));
    }
    
    @Test
    void getUserStats_Unauthenticated_ShouldReturn403() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/gamification/users/1/stats"))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void getUserStats_DifferentUser_ShouldReturn403() throws Exception {
        // Given - User 2 trying to access User 1's stats
        
        // When & Then
        mockMvc.perform(get("/api/gamification/users/1/stats")
                .with(authentication(otherAuthentication)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void getUserStats_OwnStats_ShouldReturn200() throws Exception {
        // Given
        GamificationStatsResponse stats = new GamificationStatsResponse();
        stats.setUserId(2L);
        stats.setTotalPoints(300);
        stats.setAchievementCount(3);
        
        when(gamificationService.getUserGamificationStats(anyLong())).thenReturn(stats);
        
        // When & Then - User 2 accessing their own stats
        mockMvc.perform(get("/api/gamification/users/2/stats")
                .with(authentication(otherAuthentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(2))
                .andExpect(jsonPath("$.totalPoints").value(300))
                .andExpect(jsonPath("$.achievementCount").value(3));
    }
    
    @Test
    void getUserStats_WithAchievements_ShouldReturn200() throws Exception {
        // Given
        GamificationStatsResponse stats = new GamificationStatsResponse();
        stats.setUserId(1L);
        stats.setTotalPoints(1000);
        stats.setAchievementCount(10);
        
        List<AchievementResponse> achievements = new ArrayList<>();
        AchievementResponse achievement1 = new AchievementResponse();
        achievement1.setId(1L);
        achievement1.setName("First Donation");
        achievement1.setDescription("Complete your first donation");
        achievement1.setPointsValue(50);
        achievements.add(achievement1);
        
        stats.setUnlockedAchievements(achievements);
        
        when(gamificationService.getUserGamificationStats(anyLong())).thenReturn(stats);
        
        // When & Then
        mockMvc.perform(get("/api/gamification/users/1/stats")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.totalPoints").value(1000))
                .andExpect(jsonPath("$.unlockedAchievements").isArray())
                .andExpect(jsonPath("$.unlockedAchievements[0].name").value("First Donation"));
    }
    
    @Test
    void getAllAchievements_ShouldReturn200() throws Exception {
        // Given
        List<AchievementResponse> achievements = new ArrayList<>();
        
        AchievementResponse achievement1 = new AchievementResponse();
        achievement1.setId(1L);
        achievement1.setName("First Donation");
        achievement1.setDescription("Complete your first donation");
        achievement1.setPointsValue(50);
        achievements.add(achievement1);
        
        AchievementResponse achievement2 = new AchievementResponse();
        achievement2.setId(2L);
        achievement2.setName("10 Donations");
        achievement2.setDescription("Complete 10 donations");
        achievement2.setPointsValue(100);
        achievements.add(achievement2);
        
        AchievementResponse achievement3 = new AchievementResponse();
        achievement3.setId(3L);
        achievement3.setName("Community Helper");
        achievement3.setDescription("Help 50 people");
        achievement3.setPointsValue(200);
        achievements.add(achievement3);
        
        when(gamificationService.getAllAchievements()).thenReturn(achievements);
        
        // When & Then
        mockMvc.perform(get("/api/gamification/achievements")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].name").value("First Donation"))
                .andExpect(jsonPath("$[0].pointsValue").value(50))
                .andExpect(jsonPath("$[1].name").value("10 Donations"))
                .andExpect(jsonPath("$[1].pointsValue").value(100))
                .andExpect(jsonPath("$[2].name").value("Community Helper"))
                .andExpect(jsonPath("$[2].pointsValue").value(200));
    }
    
    @Test
    void getAllAchievements_EmptyList_ShouldReturn200() throws Exception {
        // Given
        when(gamificationService.getAllAchievements()).thenReturn(new ArrayList<>());
        
        // When & Then
        mockMvc.perform(get("/api/gamification/achievements")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }
    
    @Test
    void getUserStats_NewUser_ShouldReturnZeroPoints() throws Exception {
        // Given
        GamificationStatsResponse stats = new GamificationStatsResponse();
        stats.setUserId(1L);
        stats.setTotalPoints(0);
        stats.setAchievementCount(0);
        
        when(gamificationService.getUserGamificationStats(anyLong())).thenReturn(stats);
        
        // When & Then
        mockMvc.perform(get("/api/gamification/users/1/stats")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPoints").value(0))
                .andExpect(jsonPath("$.achievementCount").value(0));
    }
    
    @Test
    void getUserStats_HighLevelUser_ShouldReturnCorrectStats() throws Exception {
        // Given
        GamificationStatsResponse stats = new GamificationStatsResponse();
        stats.setUserId(1L);
        stats.setTotalPoints(10000);
        stats.setAchievementCount(50);
        
        when(gamificationService.getUserGamificationStats(anyLong())).thenReturn(stats);
        
        // When & Then
        mockMvc.perform(get("/api/gamification/users/1/stats")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPoints").value(10000))
                .andExpect(jsonPath("$.achievementCount").value(50));
    }
    
    @Test
    void getUserStats_InvalidUserId_ShouldReturn403() throws Exception {
        // Given - User 1 trying to access stats for non-existent user 999
        
        // When & Then
        mockMvc.perform(get("/api/gamification/users/999/stats")
                .with(authentication(authentication)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void getAllAchievements_AsAuthenticatedUser_ShouldReturn200() throws Exception {
        // Given
        List<AchievementResponse> achievements = new ArrayList<>();
        AchievementResponse achievement = new AchievementResponse();
        achievement.setId(1L);
        achievement.setName("First Step");
        achievement.setDescription("Create your first listing");
        achievement.setPointsValue(25);
        achievements.add(achievement);
        
        when(gamificationService.getAllAchievements()).thenReturn(achievements);
        
        // When & Then - Authenticated users can view all achievements
        mockMvc.perform(get("/api/gamification/achievements")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("First Step"));
    }
    
    @Test
    void getUserStats_WithProgressData_ShouldReturnCompleteStats() throws Exception {
        // Given
        GamificationStatsResponse stats = new GamificationStatsResponse();
        stats.setUserId(1L);
        stats.setTotalPoints(750);
        stats.setAchievementCount(7);
        
        when(gamificationService.getUserGamificationStats(anyLong())).thenReturn(stats);
        
        // When & Then
        mockMvc.perform(get("/api/gamification/users/1/stats")
                .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.totalPoints").value(750))
                .andExpect(jsonPath("$.achievementCount").value(7));
    }
}
