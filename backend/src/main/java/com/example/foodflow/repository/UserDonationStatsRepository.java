package com.example.foodflow.repository;

import com.example.foodflow.model.entity.UserDonationStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Optional;

public interface UserDonationStatsRepository extends JpaRepository<UserDonationStats, Long> {

    Optional<UserDonationStats> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(s.totalDonated), 0) FROM UserDonationStats s")
    BigDecimal sumAllTotalDonated();

    @Query("SELECT COALESCE(SUM(s.donationCount), 0) FROM UserDonationStats s")
    Long sumAllDonationCounts();

    @Query("SELECT COUNT(s) FROM UserDonationStats s WHERE s.donationCount > 0")
    Long countUsersWhoDonated();
}
