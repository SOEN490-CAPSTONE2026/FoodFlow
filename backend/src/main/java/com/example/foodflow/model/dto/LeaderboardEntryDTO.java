package com.example.foodflow.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single entry in the leaderboard.
 * Contains user rank, basic info, and points.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDTO {
    
    /**
     * User's rank position (1-based)
     */
    private Integer rank;
    
    /**
     * User's unique identifier
     */
    private Long userId;
    
    /**
     * Display name (organization name or first name)
     */
    private String displayName;
    
    /**
     * Total points earned by the user
     */
    private Integer totalPoints;
    
    /**
     * Flag indicating if this entry represents the currently authenticated user
     */
    private Boolean isCurrentUser;
}
