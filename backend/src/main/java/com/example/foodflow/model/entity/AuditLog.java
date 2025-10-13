
package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "audit_log")
@Data //for getters and setters
@NoArgsConstructor 
@AllArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String action;
    private String entityType;
    private String entityId;
    private String ipAddress;
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String oldValue;

    @Column(columnDefinition = "TEXT")
    private String newValue;

    public AuditLog(String username, String action, String entityType,
                    String entityId, String ipAddress,
                    String oldValue, String newValue) {
        this.username = username;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.ipAddress = ipAddress;
        this.timestamp = LocalDateTime.now();
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
}