package com.example.foodflow.repository;

import com.example.foodflow.model.entity.PaymentAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentAuditLogRepository extends JpaRepository<PaymentAuditLog, Long> {
    
    List<PaymentAuditLog> findByPaymentIdOrderByCreatedAtDesc(Long paymentId);
    
    @Query("SELECT pal FROM PaymentAuditLog pal WHERE pal.payment.organization.id = :organizationId ORDER BY pal.createdAt DESC")
    Page<PaymentAuditLog> findByOrganizationId(@Param("organizationId") Long organizationId, Pageable pageable);
    
    @Query("SELECT pal FROM PaymentAuditLog pal WHERE pal.actorUser.id = :userId ORDER BY pal.createdAt DESC")
    List<PaymentAuditLog> findByActorUserId(@Param("userId") Long userId);
    
    @Query("SELECT pal FROM PaymentAuditLog pal WHERE pal.createdAt >= :startDate ORDER BY pal.createdAt DESC")
    List<PaymentAuditLog> findRecentAuditLogs(@Param("startDate") LocalDateTime startDate);
}
