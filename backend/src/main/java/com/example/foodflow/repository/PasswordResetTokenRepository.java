package com.example.foodflow.repository;

import com.example.foodflow.model.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteByExpiresAtBefore(Timestamp timestamp);

    void deleteByUserId(Long userId);
}

