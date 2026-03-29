package com.example.foodflow.repository;

import com.example.foodflow.model.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    
    List<PaymentMethod> findByOrganizationIdOrderByIsDefaultDescCreatedAtDesc(Long organizationId);
    
    Optional<PaymentMethod> findByStripePaymentMethodId(String stripePaymentMethodId);
    
    Optional<PaymentMethod> findByOrganizationIdAndIsDefaultTrue(Long organizationId);
    
    @Modifying
    @Query("UPDATE PaymentMethod pm SET pm.isDefault = false WHERE pm.organization.id = :organizationId")
    void clearDefaultForOrganization(@Param("organizationId") Long organizationId);
    
    boolean existsByOrganizationIdAndStripePaymentMethodId(Long organizationId, String stripePaymentMethodId);
}
