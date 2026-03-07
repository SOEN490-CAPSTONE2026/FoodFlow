package com.example.foodflow.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for representing a user's recent activity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityDTO {
    private String action;           // e.g., "DONATION", "CLAIM", "VERIFICATION"
    private String description;      // Human-readable description
    private LocalDateTime timestamp; // When the activity occurred
    private Long entityId;           // ID of related entity (post ID, claim ID, etc.)
    private String entityType;       // Type of entity (e.g., "SurplusPost", "Claim")
}
