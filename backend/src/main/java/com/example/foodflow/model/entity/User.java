package com.example.foodflow.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Email
    @NotBlank
    @Column(unique = true)
    private String email;

    @NotBlank
    @Size(min = 8)
    private String password;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status")
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;

    @Column(name = "deactivated_by")
    private Long deactivatedBy;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Organization organization;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Constructors, getters, setters
    public User() {}

    public User(String email, String password, UserRole role) {
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public AccountStatus getAccountStatus() { return accountStatus; }
    public void setAccountStatus(AccountStatus accountStatus) { this.accountStatus = accountStatus; }
    
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    
    public LocalDateTime getDeactivatedAt() { return deactivatedAt; }
    public void setDeactivatedAt(LocalDateTime deactivatedAt) { this.deactivatedAt = deactivatedAt; }
    
    public Long getDeactivatedBy() { return deactivatedBy; }
    public void setDeactivatedBy(Long deactivatedBy) { this.deactivatedBy = deactivatedBy; }
}
