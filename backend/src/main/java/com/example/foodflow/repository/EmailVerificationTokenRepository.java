package com.example.foodflow.repository;

import com.example.foodflow.model.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    
    Optional<EmailVerificationToken> findByToken(String token);
    
    void deleteByExpiresAtBefore(Timestamp timestamp);
    
    void deleteByUserId(Long userId);
}
