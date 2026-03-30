package com.example.foodflow.repository;

import com.example.foodflow.model.entity.MonetaryDonation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface MonetaryDonationRepository extends JpaRepository<MonetaryDonation, Long> {

    List<MonetaryDonation> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<MonetaryDonation> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    Optional<MonetaryDonation> findByTransactionId(String transactionId);

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, String status);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(m.amount), 0) FROM MonetaryDonation m WHERE m.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") String status);

    @Query("SELECT COALESCE(SUM(m.amount), 0) FROM MonetaryDonation m WHERE m.user.id = :userId AND m.status = :status")
    BigDecimal sumAmountByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
}
