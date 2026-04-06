package com.example.foodflow.repository;
import com.example.foodflow.model.entity.Payment;
import com.example.foodflow.model.types.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);
    Page<Payment> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId, Pageable pageable);
    List<Payment> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
    List<Payment> findByStatusAndCreatedAtBefore(PaymentStatus status, LocalDateTime before);
    @Query("SELECT p FROM Payment p WHERE p.organization.id = :organizationId AND p.status = :status")
    List<Payment> findByOrganizationIdAndStatus(@Param("organizationId") Long organizationId, 
                                                  @Param("status") PaymentStatus status);
    @Query("SELECT p FROM Payment p WHERE p.status IN :statuses AND p.createdAt >= :startDate")
    List<Payment> findByStatusInAndCreatedAtAfter(@Param("statuses") List<PaymentStatus> statuses,
                                                    @Param("startDate") LocalDateTime startDate);
}
