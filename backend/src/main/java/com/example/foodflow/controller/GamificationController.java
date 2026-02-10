package com.example.foodflow.controller;

import com.example.foodflow.model.dto.AchievementResponse;
import com.example.foodflow.model.dto.GamificationStatsResponse;
import com.example.foodflow.model.dto.LeaderboardResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.GamificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for gamification features including points and achievements.
 * Provides endpoints to view user stats and browse available achievements.
 */
@RestController
@RequestMapping("/api/gamification")
@CrossOrigin(origins = "*")
public class GamificationController {
    
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GamificationController.class);

    private final GamificationService gamificationService;
    
    public GamificationController(GamificationService gamificationService) {
        this.gamificationService = gamificationService;
    }
    
    /**
     * GET /api/gamification/users/{id}/stats
     * Retrieves comprehensive gamification statistics for a user.
     * Users can only view their own stats.
     * 
     * @param id User ID to get stats for
     * @param currentUser The authenticated user (injected by Spring Security)
     * @return GamificationStatsResponse with points, achievements, and progress
     */
    @GetMapping("/users/{id}/stats")
    public ResponseEntity<GamificationStatsResponse> getUserStats(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        // Security check: users can only view their own stats
        if (!currentUser.getId().equals(id)) {
            log.warn("User {} attempted to view stats for user {}", currentUser.getId(), id);
            return ResponseEntity.status(403).build();
        }
        
        GamificationStatsResponse stats = gamificationService.getUserGamificationStats(id);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * GET /api/gamification/achievements
     * Retrieves all available achievements in the system.
     * 
     * @return List of all active achievements
     */
    @GetMapping("/achievements")
    public ResponseEntity<List<AchievementResponse>> getAllAchievements() {
        List<AchievementResponse> achievements = gamificationService.getAllAchievements();
        return ResponseEntity.ok(achievements);
    }
    
    /**
     * GET /api/gamification/leaderboard/{role}
     * Retrieves the leaderboard for a specific role (DONOR or RECEIVER).
     * Returns top 10 users and current user's position if outside top 10.
     * Results are cached for 5 minutes.
     * 
     * @param role User role (DONOR or RECEIVER)
     * @param currentUser The authenticated user (injected by Spring Security)
     * @return LeaderboardResponse with top users and current user's entry
     */
    @GetMapping("/leaderboard/{role}")
    public ResponseEntity<LeaderboardResponse> getLeaderboard(
            @PathVariable String role,
            @AuthenticationPrincipal User currentUser) {
        
        try {
            // Parse and validate role
            UserRole userRole = UserRole.valueOf(role.toUpperCase());
            
            // Get leaderboard
            LeaderboardResponse leaderboard = gamificationService.getLeaderboard(userRole, currentUser.getId());
            return ResponseEntity.ok(leaderboard);
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid role parameter: {}", role);
            return ResponseEntity.badRequest().build();
        }
    }
}
