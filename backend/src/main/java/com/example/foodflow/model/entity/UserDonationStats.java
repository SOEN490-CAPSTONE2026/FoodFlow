package com.example.foodflow.model.entity;

import com.example.foodflow.model.types.DonorBadge;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_donation_stats")
public class UserDonationStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "total_donated", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalDonated = BigDecimal.ZERO;

    @Column(name = "last_donation_date")
    private LocalDateTime lastDonationDate;

    @Column(name = "donation_count", nullable = false)
    private Integer donationCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "donor_badge", nullable = false, length = 20)
    private DonorBadge donorBadge = DonorBadge.NONE;

    @Column(name = "show_badge_publicly", nullable = false)
    private Boolean showBadgePublicly = true;

    @Column(name = "show_donation_history", nullable = false)
    private Boolean showDonationHistory = false;

    @Column(name = "show_on_leaderboard", nullable = false)
    private Boolean showOnLeaderboard = true;

    @Column(name = "anonymous_by_default", nullable = false)
    private Boolean anonymousByDefault = false;

    // Constructors
    public UserDonationStats() {}

    public UserDonationStats(User user) {
        this.user = user;
        this.totalDonated = BigDecimal.ZERO;
        this.donationCount = 0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public BigDecimal getTotalDonated() { return totalDonated; }
    public void setTotalDonated(BigDecimal totalDonated) { this.totalDonated = totalDonated; }

    public LocalDateTime getLastDonationDate() { return lastDonationDate; }
    public void setLastDonationDate(LocalDateTime lastDonationDate) { this.lastDonationDate = lastDonationDate; }

    public Integer getDonationCount() { return donationCount; }
    public void setDonationCount(Integer donationCount) { this.donationCount = donationCount; }

    public DonorBadge getDonorBadge() { return donorBadge; }
    public void setDonorBadge(DonorBadge donorBadge) { this.donorBadge = donorBadge; }

    public Boolean getShowBadgePublicly() { return showBadgePublicly; }
    public void setShowBadgePublicly(Boolean showBadgePublicly) { this.showBadgePublicly = showBadgePublicly; }

    public Boolean getShowDonationHistory() { return showDonationHistory; }
    public void setShowDonationHistory(Boolean showDonationHistory) { this.showDonationHistory = showDonationHistory; }

    public Boolean getShowOnLeaderboard() { return showOnLeaderboard; }
    public void setShowOnLeaderboard(Boolean showOnLeaderboard) { this.showOnLeaderboard = showOnLeaderboard; }

    public Boolean getAnonymousByDefault() { return anonymousByDefault; }
    public void setAnonymousByDefault(Boolean anonymousByDefault) { this.anonymousByDefault = anonymousByDefault; }
}
