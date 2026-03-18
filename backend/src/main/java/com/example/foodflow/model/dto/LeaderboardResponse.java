package com.example.foodflow.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO representing the complete leaderboard response.
 * Includes top users and current user's position if outside top 10.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardResponse {
    
    /**
     * Top 10 users on the leaderboard
     */
    private List<LeaderboardEntryDTO> topUsers;
    
    /**
     * Current user's entry if they're outside the top 10.
     * Null if user is already in top 10.
     */
    private LeaderboardEntryDTO currentUserEntry;
    
    /**
     * Total number of users in this role
     */
    private Integer totalUsers;
    
    /**
     * Timestamp when leaderboard data was generated
     */
    private LocalDateTime lastUpdated;
}
