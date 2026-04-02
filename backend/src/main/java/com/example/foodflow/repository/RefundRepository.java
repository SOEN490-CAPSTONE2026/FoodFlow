package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Refund;
import com.example.foodflow.model.types.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {
    
    Optional<Refund> findByStripeRefundId(String stripeRefundId);

    List<Refund> findByPaymentId(Long paymentId);

    List<Refund> findByPaymentIdOrderByCreatedAtDesc(Long paymentId);
    
    @Query("SELECT r FROM Refund r WHERE r.payment.organization.id = :organizationId ORDER BY r.createdAt DESC")
    List<Refund> findByOrganizationId(@Param("organizationId") Long organizationId);
    
    List<Refund> findByStatus(RefundStatus status);
    
    @Query("SELECT r FROM Refund r WHERE r.requestedBy.id = :userId ORDER BY r.createdAt DESC")
    List<Refund> findByRequestedByUserId(@Param("userId") Long userId);
}
