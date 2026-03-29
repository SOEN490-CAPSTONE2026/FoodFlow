package com.example.foodflow.repository;

import com.example.foodflow.model.entity.PaymentRetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRetryRepository extends JpaRepository<PaymentRetry, Long> {
    
    List<PaymentRetry> findByPaymentIdOrderByAttemptNumberDesc(Long paymentId);
    
    @Query("SELECT pr FROM PaymentRetry pr WHERE pr.nextRetryAt <= :now AND pr.status = 'PENDING' ORDER BY pr.nextRetryAt")
    List<PaymentRetry> findRetriesDueForProcessing(@Param("now") LocalDateTime now);
    
    @Query("SELECT COUNT(pr) FROM PaymentRetry pr WHERE pr.payment.id = :paymentId")
    Integer countByPaymentId(@Param("paymentId") Long paymentId);
}
